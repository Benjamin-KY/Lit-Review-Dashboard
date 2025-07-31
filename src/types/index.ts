// Core data interfaces for the literature review showcase

export interface PaperRecord {
  key: string;
  itemType: string;
  publicationYear: number | null;
  authors: string[];
  title: string;
  publicationTitle: string;
  doi?: string;
  url?: string;
  abstract: string;
  tags: string[];
  venue: string;
}

export interface AuthorNode {
  id: string;
  name: string;
  paperCount: number;
  collaborators: string[];
  primaryTopics: string[];
  influence: number;
}

export interface TopicCluster {
  id: string;
  label: string;
  size: number;
  papers: PaperRecord[];
  connections: string[];
  coverage: number;
}

export interface VenueStatistics {
  name: string;
  paperCount: number;
  impactFactor?: number;
  type: 'journal' | 'conference' | 'book' | 'other';
}

export interface QualityIndicators {
  totalPapers: number;
  doiCoverage: number;
  urlCoverage: number;
  abstractCoverage: number;
  recentPapers: number; // Papers from last 5 years
}

export interface ProcessedData {
  papers: PaperRecord[];
  yearRange: [number, number];
  authorNetwork: AuthorNode[];
  topicClusters: TopicCluster[];
  venueStats: VenueStatistics[];
  qualityMetrics: QualityIndicators;
}

export interface YearlyStatistics {
  year: number;
  paperCount: number;
  papers: PaperRecord[];
  topTopics: string[];
  majorEvents?: string[];
}

export interface CollaborationEdge {
  source: string;
  target: string;
  weight: number;
}

export interface TopicEdge {
  source: string;
  target: string;
  strength: number;
}