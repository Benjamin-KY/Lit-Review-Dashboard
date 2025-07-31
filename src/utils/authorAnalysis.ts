import { PaperRecord, AuthorNode, CollaborationEdge } from '../types';

/**
 * Author network analysis and collaboration detection utilities
 */

export interface AuthorProfile {
  id: string;
  name: string;
  cleanName: string;
  paperCount: number;
  papers: PaperRecord[];
  collaborators: string[];
  primaryTopics: string[];
  influence: number;
  firstPublication?: number;
  lastPublication?: number;
  yearSpan: number;
  averagePapersPerYear: number;
}

export interface AuthorNetworkData {
  authors: AuthorProfile[];
  collaborations: CollaborationEdge[];
  communities: AuthorCommunity[];
  statistics: AuthorNetworkStats;
}

export interface AuthorCommunity {
  id: string;
  name: string;
  members: string[];
  centralAuthors: string[];
  primaryTopics: string[];
  paperCount: number;
  collaborationStrength: number;
}

export interface AuthorNetworkStats {
  totalAuthors: number;
  totalCollaborations: number;
  averageCollaboratorsPerAuthor: number;
  mostProlificAuthors: { name: string; paperCount: number }[];
  mostInfluentialAuthors: { name: string; influence: number }[];
  collaborationDensity: number;
}

/**
 * Clean and normalize author names for deduplication
 */
export function cleanAuthorName(name: string): string {
  return name
    .trim()
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .replace(/\s*(Jr\.|Sr\.|III|IV)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Detect potential duplicate authors based on name similarity
 */
export function detectDuplicateAuthors(authors: string[]): Map<string, string[]> {
  const duplicates = new Map<string, string[]>();
  const processed = new Set<string>();
  
  authors.forEach(author => {
    if (processed.has(author)) return;
    
    const cleanName = cleanAuthorName(author);
    const similar: string[] = [author];
    
    authors.forEach(otherAuthor => {
      if (author === otherAuthor || processed.has(otherAuthor)) return;
      
      const otherCleanName = cleanAuthorName(otherAuthor);
      
      if (areAuthorNamesSimilar(cleanName, otherCleanName)) {
        similar.push(otherAuthor);
        processed.add(otherAuthor);
      }
    });
    
    if (similar.length > 1) {
      duplicates.set(cleanName, similar);
    }
    
    processed.add(author);
  });
  
  return duplicates;
}

/**
 * Check if two author names are similar (potential duplicates)
 */
function areAuthorNamesSimilar(name1: string, name2: string): boolean {
  // Exact match
  if (name1 === name2) return true;
  
  const parts1 = name1.split(' ');
  const parts2 = name2.split(' ');
  
  // Check for initials vs full names
  if (parts1.length === parts2.length) {
    let matches = 0;
    for (let i = 0; i < parts1.length; i++) {
      const part1 = parts1[i];
      const part2 = parts2[i];
      
      // Exact match
      if (part1 === part2) {
        matches++;
      }
      // Initial match (e.g., "j" matches "john")
      else if (part1.length === 1 && part2.startsWith(part1)) {
        matches++;
      }
      else if (part2.length === 1 && part1.startsWith(part2)) {
        matches++;
      }
    }
    
    return matches === parts1.length;
  }
  
  // Check for different name orders (e.g., "John Smith" vs "Smith, John")
  if (parts1.length === 2 && parts2.length === 2) {
    return (parts1[0] === parts2[1] && parts1[1] === parts2[0]);
  }
  
  return false;
}

/**
 * Build author profiles from papers
 */
export function buildAuthorProfiles(papers: PaperRecord[]): AuthorProfile[] {
  const authorMap = new Map<string, AuthorProfile>();
  
  // Collect all unique authors
  const allAuthors = new Set<string>();
  papers.forEach(paper => {
    paper.authors.forEach(author => allAuthors.add(author));
  });
  
  // Detect and merge duplicates
  const duplicates = detectDuplicateAuthors(Array.from(allAuthors));
  const authorMapping = new Map<string, string>();
  
  duplicates.forEach((variants, canonical) => {
    const primaryName = variants.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
    
    variants.forEach(variant => {
      authorMapping.set(variant, primaryName);
    });
  });
  
  // Build profiles
  papers.forEach(paper => {
    paper.authors.forEach(authorName => {
      const canonicalName = authorMapping.get(authorName) || authorName;
      const cleanName = cleanAuthorName(canonicalName);
      
      if (!authorMap.has(cleanName)) {
        authorMap.set(cleanName, {
          id: cleanName.replace(/\s+/g, '_'),
          name: canonicalName,
          cleanName,
          paperCount: 0,
          papers: [],
          collaborators: [],
          primaryTopics: [],
          influence: 0,
          yearSpan: 0,
          averagePapersPerYear: 0
        });
      }
      
      const profile = authorMap.get(cleanName)!;
      profile.paperCount++;
      profile.papers.push(paper);
    });
  });
  
  // Calculate additional metrics for each author
  authorMap.forEach(profile => {
    // Calculate year span and average papers per year
    const years = profile.papers
      .map(p => p.publicationYear)
      .filter((year): year is number => year !== null)
      .sort();
    
    if (years.length > 0) {
      profile.firstPublication = years[0];
      profile.lastPublication = years[years.length - 1];
      profile.yearSpan = profile.lastPublication - profile.firstPublication + 1;
      profile.averagePapersPerYear = profile.paperCount / Math.max(profile.yearSpan, 1);
    }
    
    // Extract primary topics
    profile.primaryTopics = extractAuthorTopics(profile.papers);
    
    // Calculate influence score
    profile.influence = calculateAuthorInfluence(profile);
  });
  
  return Array.from(authorMap.values()).sort((a, b) => b.paperCount - a.paperCount);
}

/**
 * Extract primary research topics for an author
 */
function extractAuthorTopics(papers: PaperRecord[]): string[] {
  const topicCounts = new Map<string, number>();
  
  papers.forEach(paper => {
    const text = `${paper.title} ${paper.abstract} ${paper.tags.join(' ')}`.toLowerCase();
    
    // Simple keyword-based topic detection
    const topics = [
      { name: 'Security', keywords: ['security', 'cyber', 'attack', 'defense'] },
      { name: 'Economics', keywords: ['economic', 'cost', 'market', 'incentive'] },
      { name: 'Game Theory', keywords: ['game', 'strategy', 'equilibrium', 'player'] },
      { name: 'Risk', keywords: ['risk', 'uncertainty', 'probability'] },
      { name: 'AI/ML', keywords: ['ai', 'machine', 'learning', 'neural'] },
      { name: 'Network', keywords: ['network', 'distributed', 'protocol'] },
      { name: 'Privacy', keywords: ['privacy', 'anonymous', 'confidential'] }
    ];
    
    topics.forEach(topic => {
      const matches = topic.keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        topicCounts.set(topic.name, (topicCounts.get(topic.name) || 0) + matches);
      }
    });
  });
  
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

/**
 * Calculate author influence score based on multiple factors
 */
function calculateAuthorInfluence(profile: AuthorProfile): number {
  let influence = 0;
  
  // Paper count factor (logarithmic to avoid extreme values)
  influence += Math.log(profile.paperCount + 1) * 10;
  
  // Consistency factor (papers per year)
  influence += profile.averagePapersPerYear * 5;
  
  // Longevity factor
  influence += Math.min(profile.yearSpan, 10) * 2;
  
  // Topic diversity factor
  influence += profile.primaryTopics.length * 3;
  
  return Math.round(influence * 10) / 10;
}

/**
 * Detect co-authorship relationships and build collaboration network
 */
export function buildCollaborationNetwork(papers: PaperRecord[]): CollaborationEdge[] {
  const collaborations = new Map<string, number>();
  
  papers.forEach(paper => {
    const authors = paper.authors.map(cleanAuthorName);
    
    // Create collaboration edges between all pairs of authors
    for (let i = 0; i < authors.length; i++) {
      for (let j = i + 1; j < authors.length; j++) {
        const author1 = authors[i];
        const author2 = authors[j];
        
        // Create consistent edge key (alphabetical order)
        const edgeKey = [author1, author2].sort().join('|');
        
        collaborations.set(edgeKey, (collaborations.get(edgeKey) || 0) + 1);
      }
    }
  });
  
  // Convert to collaboration edges
  return Array.from(collaborations.entries())
    .map(([edgeKey, weight]) => {
      const [source, target] = edgeKey.split('|');
      return { source, target, weight };
    })
    .filter(edge => edge.weight > 0) // Only include actual collaborations
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Detect author communities using simple clustering
 */
export function detectAuthorCommunities(
  authors: AuthorProfile[],
  collaborations: CollaborationEdge[]
): AuthorCommunity[] {
  const communities: AuthorCommunity[] = [];
  const processed = new Set<string>();
  
  // Build adjacency list for collaboration network
  const adjacencyList = new Map<string, Set<string>>();
  
  collaborations.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, new Set());
    }
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, new Set());
    }
    
    adjacencyList.get(edge.source)!.add(edge.target);
    adjacencyList.get(edge.target)!.add(edge.source);
  });
  
  // Find communities using connected components
  authors.forEach(author => {
    if (processed.has(author.cleanName)) return;
    
    const community = findConnectedComponent(author.cleanName, adjacencyList, processed);
    
    if (community.size >= 3) { // Minimum community size
      const communityAuthors = Array.from(community);
      const communityProfiles = communityAuthors
        .map(name => authors.find(a => a.cleanName === name))
        .filter((profile): profile is AuthorProfile => profile !== undefined);
      
      // Calculate community metrics
      const totalPapers = communityProfiles.reduce((sum, p) => sum + p.paperCount, 0);
      const allTopics = communityProfiles.flatMap(p => p.primaryTopics);
      const topicCounts = new Map<string, number>();
      
      allTopics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
      
      const primaryTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic]) => topic);
      
      // Find central authors (most connected within community)
      const centralAuthors = communityAuthors
        .map(author => ({
          author,
          connections: (adjacencyList.get(author) || new Set()).size
        }))
        .sort((a, b) => b.connections - a.connections)
        .slice(0, Math.max(1, Math.floor(communityAuthors.length * 0.3)))
        .map(item => item.author);
      
      communities.push({
        id: `community_${communities.length + 1}`,
        name: `Research Group ${communities.length + 1}`,
        members: communityAuthors,
        centralAuthors,
        primaryTopics,
        paperCount: totalPapers,
        collaborationStrength: calculateCommunityCollaborationStrength(
          communityAuthors,
          collaborations
        )
      });
    }
  });
  
  return communities.sort((a, b) => b.paperCount - a.paperCount);
}

/**
 * Find connected component in collaboration network
 */
function findConnectedComponent(
  startAuthor: string,
  adjacencyList: Map<string, Set<string>>,
  processed: Set<string>
): Set<string> {
  const component = new Set<string>();
  const queue = [startAuthor];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (processed.has(current)) continue;
    
    processed.add(current);
    component.add(current);
    
    const neighbors = adjacencyList.get(current) || new Set();
    neighbors.forEach(neighbor => {
      if (!processed.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }
  
  return component;
}

/**
 * Calculate collaboration strength within a community
 */
function calculateCommunityCollaborationStrength(
  members: string[],
  collaborations: CollaborationEdge[]
): number {
  const memberSet = new Set(members);
  
  const internalCollaborations = collaborations.filter(edge =>
    memberSet.has(edge.source) && memberSet.has(edge.target)
  );
  
  const totalPossibleEdges = (members.length * (members.length - 1)) / 2;
  const actualEdges = internalCollaborations.length;
  
  return totalPossibleEdges > 0 ? actualEdges / totalPossibleEdges : 0;
}

/**
 * Generate comprehensive author network analysis
 */
export function analyzeAuthorNetwork(papers: PaperRecord[]): AuthorNetworkData {
  const authors = buildAuthorProfiles(papers);
  const collaborations = buildCollaborationNetwork(papers);
  const communities = detectAuthorCommunities(authors, collaborations);
  
  // Calculate network statistics
  const totalAuthors = authors.length;
  const totalCollaborations = collaborations.length;
  const averageCollaboratorsPerAuthor = totalAuthors > 0 
    ? (totalCollaborations * 2) / totalAuthors 
    : 0;
  
  const mostProlificAuthors = authors
    .slice(0, 10)
    .map(author => ({ name: author.name, paperCount: author.paperCount }));
  
  const mostInfluentialAuthors = authors
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 10)
    .map(author => ({ name: author.name, influence: author.influence }));
  
  const maxPossibleEdges = (totalAuthors * (totalAuthors - 1)) / 2;
  const collaborationDensity = maxPossibleEdges > 0 
    ? totalCollaborations / maxPossibleEdges 
    : 0;
  
  const statistics: AuthorNetworkStats = {
    totalAuthors,
    totalCollaborations,
    averageCollaboratorsPerAuthor: Math.round(averageCollaboratorsPerAuthor * 10) / 10,
    mostProlificAuthors,
    mostInfluentialAuthors,
    collaborationDensity: Math.round(collaborationDensity * 1000) / 1000
  };
  
  return {
    authors,
    collaborations,
    communities,
    statistics
  };
}

/**
 * Find prolific authors (those mentioned in requirements)
 */
export function findProlificAuthors(authors: AuthorProfile[]): {
  tylerMoore?: AuthorProfile;
  rossAnderson?: AuthorProfile;
  kenHuang?: AuthorProfile;
  quanyanZhu?: AuthorProfile;
  others: AuthorProfile[];
} {
  const findAuthor = (searchName: string) => 
    authors.find(author => 
      author.cleanName.includes(searchName.toLowerCase()) ||
      author.name.toLowerCase().includes(searchName.toLowerCase())
    );
  
  return {
    tylerMoore: findAuthor('tyler moore'),
    rossAnderson: findAuthor('ross anderson'),
    kenHuang: findAuthor('ken huang'),
    quanyanZhu: findAuthor('quanyan zhu'),
    others: authors.filter(author => 
      !['tyler moore', 'ross anderson', 'ken huang', 'quanyan zhu'].some(name =>
        author.cleanName.includes(name) || author.name.toLowerCase().includes(name)
      )
    ).slice(0, 20)
  };
}