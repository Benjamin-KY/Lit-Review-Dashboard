import { PaperRecord, TopicCluster } from '../types';

/**
 * Text analysis and topic extraction utilities
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'paper', 'study', 'research',
  'analysis', 'approach', 'method', 'using', 'based', 'propose', 'present'
]);

// Domain-specific keywords for topic identification
const TOPIC_KEYWORDS = {
  security: [
    'security', 'cybersecurity', 'cyber', 'attack', 'defense', 'threat', 'vulnerability',
    'malware', 'intrusion', 'breach', 'protection', 'secure', 'encryption', 'authentication',
    'authorization', 'firewall', 'ids', 'ips', 'forensics', 'incident'
  ],
  economics: [
    'economic', 'economics', 'cost', 'benefit', 'investment', 'roi', 'market', 'price',
    'pricing', 'incentive', 'utility', 'profit', 'loss', 'budget', 'financial',
    'monetary', 'value', 'worth', 'expense', 'revenue', 'insurance'
  ],
  risk: [
    'risk', 'risks', 'risky', 'uncertainty', 'probability', 'likelihood', 'assessment',
    'management', 'mitigation', 'analysis', 'evaluation', 'measurement', 'quantification',
    'modeling', 'prediction', 'forecast', 'scenario', 'impact', 'consequence'
  ],
  aiml: [
    'artificial', 'intelligence', 'machine', 'learning', 'neural', 'network', 'deep',
    'algorithm', 'model', 'training', 'classification', 'prediction', 'ai', 'ml',
    'data', 'mining', 'pattern', 'recognition', 'automation', 'cognitive'
  ],
  gameTheory: [
    'game', 'theory', 'strategic', 'player', 'strategy', 'equilibrium', 'nash',
    'payoff', 'cooperation', 'competition', 'coalition', 'bargaining', 'auction',
    'mechanism', 'design', 'optimal', 'decision', 'rational', 'behavior'
  ],
  network: [
    'network', 'networks', 'networking', 'topology', 'node', 'edge', 'graph',
    'connectivity', 'routing', 'protocol', 'communication', 'distributed',
    'peer', 'client', 'server', 'infrastructure', 'internet', 'web'
  ],
  privacy: [
    'privacy', 'private', 'confidential', 'anonymous', 'anonymity', 'personal',
    'data', 'information', 'disclosure', 'sharing', 'protection', 'gdpr',
    'compliance', 'consent', 'tracking', 'surveillance', 'identity'
  ]
};

/**
 * Preprocess text by cleaning and normalizing
 */
export function preprocessText(text: string): string[] {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(' ')
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
}

/**
 * Extract keywords from text using frequency analysis
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const words = preprocessText(text);
  const wordFreq = new Map<string, number>();
  
  // Count word frequencies
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Classify paper into topic categories based on content
 */
export function classifyPaperTopics(paper: PaperRecord): { [topic: string]: number } {
  const fullText = `${paper.title} ${paper.abstract} ${paper.tags.join(' ')}`.toLowerCase();
  const scores: { [topic: string]: number } = {};
  
  // Calculate topic scores based on keyword matches
  Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = fullText.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    // Normalize score by text length
    scores[topic] = score / Math.max(fullText.length / 100, 1);
  });
  
  return scores;
}

/**
 * Generate topic clusters from papers
 */
export function generateTopicClusters(papers: PaperRecord[]): TopicCluster[] {
  const topicPapers: { [topic: string]: PaperRecord[] } = {};
  const topicScores: { [topic: string]: number } = {};
  
  // Classify each paper and assign to topics
  papers.forEach(paper => {
    const paperTopics = classifyPaperTopics(paper);
    
    Object.entries(paperTopics).forEach(([topic, score]) => {
      if (score > 0.1) { // Minimum threshold for topic assignment
        if (!topicPapers[topic]) {
          topicPapers[topic] = [];
          topicScores[topic] = 0;
        }
        topicPapers[topic].push(paper);
        topicScores[topic] += score;
      }
    });
  });
  
  // Create topic clusters
  const clusters: TopicCluster[] = Object.entries(topicPapers).map(([topic, topicPaperList]) => {
    const coverage = (topicPaperList.length / papers.length) * 100;
    
    return {
      id: topic,
      label: formatTopicLabel(topic),
      size: topicPaperList.length,
      papers: topicPaperList,
      connections: findTopicConnections(topic, topicPapers),
      coverage
    };
  });
  
  // Sort by coverage (descending)
  return clusters.sort((a, b) => b.coverage - a.coverage);
}

/**
 * Format topic label for display
 */
function formatTopicLabel(topic: string): string {
  const labels: { [key: string]: string } = {
    security: 'Security',
    economics: 'Economics',
    risk: 'Risk Management',
    aiml: 'AI/ML',
    gameTheory: 'Game Theory',
    network: 'Network',
    privacy: 'Privacy'
  };
  
  return labels[topic] || topic.charAt(0).toUpperCase() + topic.slice(1);
}

/**
 * Find connections between topics based on paper overlap
 */
function findTopicConnections(topic: string, topicPapers: { [topic: string]: PaperRecord[] }): string[] {
  const currentPapers = new Set(topicPapers[topic].map(p => p.key));
  const connections: string[] = [];
  
  Object.entries(topicPapers).forEach(([otherTopic, otherPaperList]) => {
    if (otherTopic === topic) return;
    
    const overlap = otherPaperList.filter(p => currentPapers.has(p.key)).length;
    const overlapRatio = overlap / Math.min(currentPapers.size, otherPaperList.length);
    
    if (overlapRatio > 0.1) { // Minimum 10% overlap
      connections.push(otherTopic);
    }
  });
  
  return connections;
}

/**
 * Analyze topic relationships and cross-cutting themes
 */
export function analyzeTopicRelationships(clusters: TopicCluster[]): {
  relationships: { source: string; target: string; strength: number }[];
  crossCuttingThemes: { theme: string; topics: string[]; paperCount: number }[];
} {
  const relationships: { source: string; target: string; strength: number }[] = [];
  const crossCuttingThemes: { theme: string; topics: string[]; paperCount: number }[] = [];
  
  // Calculate relationship strengths
  clusters.forEach(cluster => {
    cluster.connections.forEach(connectedTopic => {
      const targetCluster = clusters.find(c => c.id === connectedTopic);
      if (targetCluster) {
        const sharedPapers = cluster.papers.filter(p => 
          targetCluster.papers.some(tp => tp.key === p.key)
        );
        const strength = sharedPapers.length / Math.min(cluster.size, targetCluster.size);
        
        relationships.push({
          source: cluster.id,
          target: connectedTopic,
          strength
        });
      }
    });
  });
  
  // Identify cross-cutting themes (papers that span multiple topics)
  const paperTopicMap = new Map<string, string[]>();
  
  clusters.forEach(cluster => {
    cluster.papers.forEach(paper => {
      if (!paperTopicMap.has(paper.key)) {
        paperTopicMap.set(paper.key, []);
      }
      paperTopicMap.get(paper.key)!.push(cluster.id);
    });
  });
  
  // Find common topic combinations
  const topicCombinations = new Map<string, { topics: string[]; papers: string[] }>();
  
  paperTopicMap.forEach((topics, paperKey) => {
    if (topics.length > 1) {
      const sortedTopics = topics.sort();
      const combinationKey = sortedTopics.join('-');
      
      if (!topicCombinations.has(combinationKey)) {
        topicCombinations.set(combinationKey, { topics: sortedTopics, papers: [] });
      }
      topicCombinations.get(combinationKey)!.papers.push(paperKey);
    }
  });
  
  // Convert to cross-cutting themes
  topicCombinations.forEach(({ topics, papers }, combinationKey) => {
    if (papers.length >= 3) { // Minimum 3 papers for a cross-cutting theme
      crossCuttingThemes.push({
        theme: topics.map(formatTopicLabel).join(' + '),
        topics,
        paperCount: papers.length
      });
    }
  });
  
  return {
    relationships: relationships.sort((a, b) => b.strength - a.strength),
    crossCuttingThemes: crossCuttingThemes.sort((a, b) => b.paperCount - a.paperCount)
  };
}

/**
 * Generate topic coverage statistics
 */
export function generateTopicCoverageStats(clusters: TopicCluster[]): {
  [topic: string]: { coverage: number; paperCount: number; label: string };
} {
  const stats: { [topic: string]: { coverage: number; paperCount: number; label: string } } = {};
  
  clusters.forEach(cluster => {
    stats[cluster.id] = {
      coverage: Math.round(cluster.coverage * 10) / 10, // Round to 1 decimal
      paperCount: cluster.size,
      label: cluster.label
    };
  });
  
  return stats;
}

/**
 * Extract trending topics over time
 */
export function analyzeTrendingTopics(papers: PaperRecord[]): {
  topic: string;
  trend: 'rising' | 'stable' | 'declining';
  recentPapers: number;
  totalPapers: number;
}[] {
  const currentYear = new Date().getFullYear();
  const recentYears = 3; // Last 3 years
  
  const clusters = generateTopicClusters(papers);
  
  return clusters.map(cluster => {
    const recentPapers = cluster.papers.filter(p => 
      p.publicationYear && p.publicationYear >= currentYear - recentYears
    ).length;
    
    const recentRatio = recentPapers / cluster.size;
    const expectedRatio = recentYears / 35; // Assuming 35-year span
    
    let trend: 'rising' | 'stable' | 'declining';
    if (recentRatio > expectedRatio * 1.5) {
      trend = 'rising';
    } else if (recentRatio < expectedRatio * 0.5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    return {
      topic: cluster.label,
      trend,
      recentPapers,
      totalPapers: cluster.size
    };
  }).sort((a, b) => b.totalPapers - a.totalPapers);
}