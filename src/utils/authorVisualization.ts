import { AuthorProfile, CollaborationEdge, AuthorCommunity } from './authorAnalysis';

/**
 * Utilities for author network visualization
 */

export interface AuthorNetworkNode {
  id: string;
  name: string;
  paperCount: number;
  influence: number;
  size: number;
  color: string;
  community?: string;
  x?: number;
  y?: number;
}

export interface AuthorNetworkEdge {
  source: string;
  target: string;
  weight: number;
  width: number;
}

export interface AuthorNetworkVisualizationData {
  nodes: AuthorNetworkNode[];
  edges: AuthorNetworkEdge[];
  communities: {
    id: string;
    name: string;
    color: string;
    members: string[];
  }[];
}

// Color palette for communities
const COMMUNITY_COLORS = [
  '#ef4444', // Red
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1'  // Indigo
];

/**
 * Prepare author network data for visualization
 */
export function prepareAuthorNetworkVisualization(
  authors: AuthorProfile[],
  collaborations: CollaborationEdge[],
  communities: AuthorCommunity[],
  maxNodes: number = 100
): AuthorNetworkVisualizationData {
  // Select top authors by influence for visualization
  const topAuthors = authors
    .sort((a, b) => b.influence - a.influence)
    .slice(0, maxNodes);
  
  const authorIds = new Set(topAuthors.map(a => a.cleanName));
  
  // Create community mapping
  const authorCommunityMap = new Map<string, string>();
  const communityData = communities.slice(0, COMMUNITY_COLORS.length).map((community, index) => {
    community.members.forEach(member => {
      if (authorIds.has(member)) {
        authorCommunityMap.set(member, community.id);
      }
    });
    
    return {
      id: community.id,
      name: community.name,
      color: COMMUNITY_COLORS[index],
      members: community.members.filter(member => authorIds.has(member))
    };
  });
  
  // Create nodes
  const nodes: AuthorNetworkNode[] = topAuthors.map(author => {
    const community = authorCommunityMap.get(author.cleanName);
    const communityColor = community 
      ? communityData.find(c => c.id === community)?.color || '#6b7280'
      : '#6b7280';
    
    return {
      id: author.cleanName,
      name: author.name,
      paperCount: author.paperCount,
      influence: author.influence,
      size: Math.max(5, Math.min(30, author.paperCount * 2)),
      color: communityColor,
      community
    };
  });
  
  // Filter edges to only include connections between visible nodes
  const edges: AuthorNetworkEdge[] = collaborations
    .filter(edge => authorIds.has(edge.source) && authorIds.has(edge.target))
    .map(edge => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      width: Math.max(1, Math.min(8, edge.weight))
    }))
    .slice(0, 200); // Limit edges for performance
  
  return {
    nodes,
    edges,
    communities: communityData
  };
}

/**
 * Calculate layout positions for author network using force-directed algorithm
 */
export function calculateAuthorNetworkLayout(
  data: AuthorNetworkVisualizationData,
  width: number = 1000,
  height: number = 800
): AuthorNetworkVisualizationData {
  const { nodes, edges } = data;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Initialize positions
  nodes.forEach(node => {
    node.x = Math.random() * width;
    node.y = Math.random() * height;
  });
  
  // Force-directed layout simulation
  const iterations = 150;
  const repulsionStrength = 2000;
  const attractionStrength = 0.05;
  const damping = 0.85;
  const centeringForce = 0.01;
  
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
        
        const force = attractionStrength * edge.weight * distance;
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
    
    // Centering force to keep nodes in view
    const centerX = width / 2;
    const centerY = height / 2;
    
    nodes.forEach(node => {
      const force = forces.get(node.id)!;
      force.fx += (centerX - node.x!) * centeringForce;
      force.fy += (centerY - node.y!) * centeringForce;
    });
    
    // Apply forces and update positions
    nodes.forEach(node => {
      const force = forces.get(node.id)!;
      const newX = node.x! + force.fx * damping;
      const newY = node.y! + force.fy * damping;
      
      // Keep nodes within bounds
      node.x = Math.max(node.size, Math.min(width - node.size, newX));
      node.y = Math.max(node.size, Math.min(height - node.size, newY));
    });
  }
  
  return data;
}

/**
 * Generate author ranking visualization data
 */
export function generateAuthorRankingData(authors: AuthorProfile[]): {
  byPaperCount: { name: string; value: number; rank: number }[];
  byInfluence: { name: string; value: number; rank: number }[];
  byProductivity: { name: string; value: number; rank: number }[];
} {
  const byPaperCount = authors
    .sort((a, b) => b.paperCount - a.paperCount)
    .slice(0, 20)
    .map((author, index) => ({
      name: author.name,
      value: author.paperCount,
      rank: index + 1
    }));
  
  const byInfluence = authors
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 20)
    .map((author, index) => ({
      name: author.name,
      value: Math.round(author.influence * 10) / 10,
      rank: index + 1
    }));
  
  const byProductivity = authors
    .sort((a, b) => b.averagePapersPerYear - a.averagePapersPerYear)
    .slice(0, 20)
    .map((author, index) => ({
      name: author.name,
      value: Math.round(author.averagePapersPerYear * 10) / 10,
      rank: index + 1
    }));
  
  return {
    byPaperCount,
    byInfluence,
    byProductivity
  };
}

/**
 * Generate collaboration timeline data
 */
export function generateCollaborationTimeline(
  authors: AuthorProfile[],
  collaborations: CollaborationEdge[]
): {
  year: number;
  collaborations: number;
  newAuthors: number;
  totalAuthors: number;
}[] {
  const yearlyData = new Map<number, {
    collaborations: Set<string>;
    authors: Set<string>;
  }>();
  
  // Initialize yearly data
  const allYears = new Set<number>();
  authors.forEach(author => {
    author.papers.forEach(paper => {
      if (paper.publicationYear) {
        allYears.add(paper.publicationYear);
      }
    });
  });
  
  Array.from(allYears).sort().forEach(year => {
    yearlyData.set(year, {
      collaborations: new Set(),
      authors: new Set()
    });
  });
  
  // Count collaborations and authors by year
  authors.forEach(author => {
    author.papers.forEach(paper => {
      if (paper.publicationYear && yearlyData.has(paper.publicationYear)) {
        const yearData = yearlyData.get(paper.publicationYear)!;
        yearData.authors.add(author.cleanName);
        
        // Add collaboration edges for this paper
        paper.authors.forEach(coAuthor => {
          if (coAuthor !== author.name) {
            const edgeKey = [author.cleanName, cleanAuthorName(coAuthor)]
              .sort()
              .join('|');
            yearData.collaborations.add(edgeKey);
          }
        });
      }
    });
  });
  
  // Convert to timeline format
  const timeline: {
    year: number;
    collaborations: number;
    newAuthors: number;
    totalAuthors: number;
  }[] = [];
  
  const seenAuthors = new Set<string>();
  
  Array.from(yearlyData.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([year, data]) => {
      const newAuthors = Array.from(data.authors).filter(author => 
        !seenAuthors.has(author)
      ).length;
      
      data.authors.forEach(author => seenAuthors.add(author));
      
      timeline.push({
        year,
        collaborations: data.collaborations.size,
        newAuthors,
        totalAuthors: seenAuthors.size
      });
    });
  
  return timeline;
}

/**
 * Helper function to clean author names (duplicate from authorAnalysis.ts)
 */
function cleanAuthorName(name: string): string {
  return name
    .trim()
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .replace(/\s*(Jr\.|Sr\.|III|IV)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Generate author community visualization data
 */
export function generateCommunityVisualization(communities: AuthorCommunity[]): {
  id: string;
  name: string;
  size: number;
  centralAuthors: string[];
  primaryTopics: string[];
  color: string;
  collaborationStrength: number;
}[] {
  return communities.slice(0, 10).map((community, index) => ({
    id: community.id,
    name: community.name,
    size: community.members.length,
    centralAuthors: community.centralAuthors,
    primaryTopics: community.primaryTopics,
    color: COMMUNITY_COLORS[index % COMMUNITY_COLORS.length],
    collaborationStrength: Math.round(community.collaborationStrength * 100) / 100
  }));
}

/**
 * Calculate author influence over time
 */
export function calculateAuthorInfluenceOverTime(
  authors: AuthorProfile[]
): {
  author: string;
  timeline: { year: number; cumulativePapers: number; influence: number }[];
}[] {
  return authors
    .filter(author => author.paperCount >= 5) // Only prolific authors
    .slice(0, 10)
    .map(author => {
      const yearlyPapers = new Map<number, number>();
      
      author.papers.forEach(paper => {
        if (paper.publicationYear) {
          yearlyPapers.set(
            paper.publicationYear,
            (yearlyPapers.get(paper.publicationYear) || 0) + 1
          );
        }
      });
      
      const timeline: { year: number; cumulativePapers: number; influence: number }[] = [];
      let cumulativePapers = 0;
      
      Array.from(yearlyPapers.entries())
        .sort(([a], [b]) => a - b)
        .forEach(([year, papers]) => {
          cumulativePapers += papers;
          const influence = Math.log(cumulativePapers + 1) * 10;
          
          timeline.push({
            year,
            cumulativePapers,
            influence: Math.round(influence * 10) / 10
          });
        });
      
      return {
        author: author.name,
        timeline
      };
    });
}