import { TopicCluster, PaperRecord } from '../types';

/**
 * Utilities for topic visualization and network layout
 */

export interface TopicNode {
  id: string;
  label: string;
  size: number;
  coverage: number;
  color: string;
  x?: number;
  y?: number;
}

export interface TopicEdge {
  source: string;
  target: string;
  strength: number;
  width: number;
}

export interface TopicNetworkData {
  nodes: TopicNode[];
  edges: TopicEdge[];
}

// Color scheme for different topics
const TOPIC_COLORS: { [key: string]: string } = {
  security: '#ef4444', // Red
  economics: '#10b981', // Green
  risk: '#f59e0b', // Amber
  aiml: '#3b82f6', // Blue
  gameTheory: '#8b5cf6', // Purple
  network: '#06b6d4', // Cyan
  privacy: '#ec4899' // Pink
};

/**
 * Convert topic clusters to network visualization data
 */
export function prepareTopicNetworkData(clusters: TopicCluster[]): TopicNetworkData {
  const nodes: TopicNode[] = clusters.map(cluster => ({
    id: cluster.id,
    label: cluster.label,
    size: cluster.size,
    coverage: cluster.coverage,
    color: TOPIC_COLORS[cluster.id] || '#6b7280'
  }));
  
  const edges: TopicEdge[] = [];
  const processedPairs = new Set<string>();
  
  clusters.forEach(cluster => {
    cluster.connections.forEach(connectedId => {
      const pairKey = [cluster.id, connectedId].sort().join('-');
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        
        const targetCluster = clusters.find(c => c.id === connectedId);
        if (targetCluster) {
          const sharedPapers = cluster.papers.filter(p => 
            targetCluster.papers.some(tp => tp.key === p.key)
          );
          const strength = sharedPapers.length / Math.min(cluster.size, targetCluster.size);
          
          if (strength > 0.05) { // Minimum threshold for edge display
            edges.push({
              source: cluster.id,
              target: connectedId,
              strength,
              width: Math.max(1, strength * 10)
            });
          }
        }
      }
    });
  });
  
  return { nodes, edges };
}

/**
 * Calculate force-directed layout positions for topic nodes
 */
export function calculateTopicLayout(
  networkData: TopicNetworkData,
  width: number = 800,
  height: number = 600
): TopicNetworkData {
  const { nodes, edges } = networkData;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Initialize positions randomly
  nodes.forEach(node => {
    node.x = Math.random() * width;
    node.y = Math.random() * height;
  });
  
  // Simple force-directed layout simulation
  const iterations = 100;
  const repulsionStrength = 1000;
  const attractionStrength = 0.1;
  const damping = 0.9;
  
  for (let i = 0; i < iterations; i++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    
    // Initialize forces
    nodes.forEach(node => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });
    
    // Repulsion forces between all nodes
    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const nodeA = nodes[j];
        const nodeB = nodes[k];
        
        const dx = nodeB.x! - nodeA.x!;
        const dy = nodeB.y! - nodeA.y!;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = repulsionStrength / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        const forceA = forces.get(nodeA.id)!;
        const forceB = forces.get(nodeB.id)!;
        
        forceA.fx -= fx;
        forceA.fy -= fy;
        forceB.fx += fx;
        forceB.fy += fy;
      }
    }
    
    // Attraction forces along edges
    edges.forEach(edge => {
      const nodeA = nodeMap.get(edge.source);
      const nodeB = nodeMap.get(edge.target);
      
      if (nodeA && nodeB) {
        const dx = nodeB.x! - nodeA.x!;
        const dy = nodeB.y! - nodeA.y!;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = attractionStrength * edge.strength * distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        const forceA = forces.get(nodeA.id)!;
        const forceB = forces.get(nodeB.id)!;
        
        forceA.fx += fx;
        forceA.fy += fy;
        forceB.fx -= fx;
        forceB.fy -= fy;
      }
    });
    
    // Apply forces and update positions
    nodes.forEach(node => {
      const force = forces.get(node.id)!;
      node.x = Math.max(50, Math.min(width - 50, node.x! + force.fx * damping));
      node.y = Math.max(50, Math.min(height - 50, node.y! + force.fy * damping));
    });
  }
  
  return { nodes, edges };
}

/**
 * Generate topic hierarchy for tree visualization
 */
export function generateTopicHierarchy(clusters: TopicCluster[]): {
  name: string;
  children: {
    name: string;
    size: number;
    coverage: number;
    children?: { name: string; size: number }[];
  }[];
} {
  const majorTopics = clusters.filter(c => c.coverage > 10);
  const minorTopics = clusters.filter(c => c.coverage <= 10);
  
  return {
    name: 'Literature Topics',
    children: [
      ...majorTopics.map(cluster => ({
        name: cluster.label,
        size: cluster.size,
        coverage: cluster.coverage,
        children: cluster.papers.slice(0, 5).map(paper => ({
          name: paper.title.substring(0, 50) + '...',
          size: 1
        }))
      })),
      ...(minorTopics.length > 0 ? [{
        name: 'Other Topics',
        size: minorTopics.reduce((sum, c) => sum + c.size, 0),
        coverage: minorTopics.reduce((sum, c) => sum + c.coverage, 0),
        children: minorTopics.map(cluster => ({
          name: cluster.label,
          size: cluster.size
        }))
      }] : [])
    ]
  };
}

/**
 * Generate topic evolution data for timeline visualization
 */
export function generateTopicEvolution(papers: PaperRecord[]): {
  year: number;
  topics: { [topic: string]: number };
}[] {
  const yearlyData = new Map<number, { [topic: string]: number }>();
  
  // Get all years with papers
  const years = [...new Set(papers
    .map(p => p.publicationYear)
    .filter((year): year is number => year !== null)
  )].sort();
  
  // Initialize yearly data
  years.forEach(year => {
    yearlyData.set(year, {
      security: 0,
      economics: 0,
      risk: 0,
      aiml: 0,
      gameTheory: 0,
      network: 0,
      privacy: 0
    });
  });
  
  // Count papers by topic and year
  papers.forEach(paper => {
    if (!paper.publicationYear) return;
    
    const yearData = yearlyData.get(paper.publicationYear);
    if (!yearData) return;
    
    const fullText = `${paper.title} ${paper.abstract} ${paper.tags.join(' ')}`.toLowerCase();
    
    // Simple keyword-based classification
    if (fullText.includes('security') || fullText.includes('cyber')) yearData.security++;
    if (fullText.includes('economic') || fullText.includes('cost')) yearData.economics++;
    if (fullText.includes('risk') || fullText.includes('uncertainty')) yearData.risk++;
    if (fullText.includes('ai') || fullText.includes('machine') || fullText.includes('learning')) yearData.aiml++;
    if (fullText.includes('game') || fullText.includes('strategy')) yearData.gameTheory++;
    if (fullText.includes('network') || fullText.includes('distributed')) yearData.network++;
    if (fullText.includes('privacy') || fullText.includes('anonymous')) yearData.privacy++;
  });
  
  return Array.from(yearlyData.entries()).map(([year, topics]) => ({
    year,
    topics
  }));
}

/**
 * Calculate topic similarity matrix
 */
export function calculateTopicSimilarity(clusters: TopicCluster[]): {
  topics: string[];
  matrix: number[][];
} {
  const topics = clusters.map(c => c.id);
  const matrix: number[][] = [];
  
  for (let i = 0; i < topics.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < topics.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const clusterA = clusters[i];
        const clusterB = clusters[j];
        
        const sharedPapers = clusterA.papers.filter(p => 
          clusterB.papers.some(bp => bp.key === p.key)
        );
        
        const similarity = sharedPapers.length / 
          Math.sqrt(clusterA.size * clusterB.size);
        
        matrix[i][j] = similarity;
      }
    }
  }
  
  return { topics, matrix };
}

/**
 * Generate topic summary statistics
 */
export function generateTopicSummary(clusters: TopicCluster[]): {
  totalTopics: number;
  averagePapersPerTopic: number;
  topicDistribution: { topic: string; percentage: number }[];
  dominantTopics: string[];
  emergingTopics: string[];
} {
  const totalPapers = clusters.reduce((sum, c) => sum + c.size, 0);
  const averagePapersPerTopic = totalPapers / clusters.length;
  
  const topicDistribution = clusters.map(cluster => ({
    topic: cluster.label,
    percentage: Math.round((cluster.size / totalPapers) * 100 * 10) / 10
  }));
  
  const dominantTopics = clusters
    .filter(c => c.coverage > 30)
    .map(c => c.label);
  
  const emergingTopics = clusters
    .filter(c => c.coverage < 15 && c.size > 5)
    .map(c => c.label);
  
  return {
    totalTopics: clusters.length,
    averagePapersPerTopic: Math.round(averagePapersPerTopic * 10) / 10,
    topicDistribution,
    dominantTopics,
    emergingTopics
  };
}