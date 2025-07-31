import { PaperRecord } from '../types';

// Types for external data
export interface CitationData {
  paperId: string;
  citationCount: number;
  influentialCitationCount: number;
  citingPapers: CitingPaper[];
  citationTrend: YearlyCount[];
}

export interface CitingPaper {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
}

export interface YearlyCount {
  year: number;
  count: number;
}

export interface JournalImpactData {
  venue: string;
  impactFactor?: number;
  hIndex?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  category: string;
}

export interface AuthorMetrics {
  authorName: string;
  hIndex?: number;
  citationCount: number;
  paperCount: number;
  affiliations: string[];
}

// Cache for external data to avoid repeated API calls
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMinutes: number = 60) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new DataCache();

/**
 * Semantic Scholar API integration for citation data
 */
export class SemanticScholarService {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';
  private rateLimitDelay = 100; // ms between requests

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited, wait longer and retry
          await this.delay(1000);
          return this.makeRequest(url);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Semantic Scholar API request failed:', error);
      return null;
    }
  }

  async getCitationData(paper: PaperRecord): Promise<CitationData | null> {
    const cacheKey = `citations_${paper.doi || paper.title}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      let searchQuery = '';
      if (paper.doi) {
        searchQuery = `doi:${paper.doi}`;
      } else {
        // Use title and first author for search
        const firstAuthor = paper.authors[0] || '';
        searchQuery = `${paper.title} ${firstAuthor}`.substring(0, 100);
      }

      const searchUrl = `${this.baseUrl}/paper/search?query=${encodeURIComponent(searchQuery)}&fields=paperId,title,citationCount,influentialCitationCount,citations,citations.title,citations.authors,citations.year,citations.venue`;
      
      const searchResult = await this.makeRequest(searchUrl);
      
      if (!searchResult?.data?.length) {
        return null;
      }

      const bestMatch = searchResult.data[0]; // Take the first result
      
      const citationData: CitationData = {
        paperId: bestMatch.paperId,
        citationCount: bestMatch.citationCount || 0,
        influentialCitationCount: bestMatch.influentialCitationCount || 0,
        citingPapers: (bestMatch.citations || []).slice(0, 10).map((citation: any) => ({
          paperId: citation.paperId,
          title: citation.title || 'Unknown Title',
          authors: (citation.authors || []).map((author: any) => author.name),
          year: citation.year || 0,
          venue: citation.venue || 'Unknown Venue'
        })),
        citationTrend: this.generateCitationTrend(bestMatch.citationCount || 0, paper.publicationYear)
      };

      cache.set(cacheKey, citationData, 120); // Cache for 2 hours
      return citationData;
    } catch (error) {
      console.warn('Failed to fetch citation data:', error);
      return null;
    }
  }

  private generateCitationTrend(totalCitations: number, publicationYear: number | null): YearlyCount[] {
    if (!publicationYear || totalCitations === 0) return [];

    const currentYear = new Date().getFullYear();
    const yearsSincePublication = currentYear - publicationYear;
    
    if (yearsSincePublication <= 0) return [];

    // Simple model: citations grow over time with some randomness
    const trend: YearlyCount[] = [];
    let cumulativeCitations = 0;
    
    for (let i = 0; i <= Math.min(yearsSincePublication, 10); i++) {
      const year = publicationYear + i;
      const yearProgress = i / yearsSincePublication;
      
      // Citations typically grow exponentially then plateau
      const expectedRatio = Math.min(1, yearProgress * 1.5);
      const yearCitations = Math.max(0, Math.round(
        (totalCitations * expectedRatio - cumulativeCitations) * (0.8 + Math.random() * 0.4)
      ));
      
      cumulativeCitations += yearCitations;
      trend.push({ year, count: yearCitations });
    }

    return trend;
  }

  async getAuthorMetrics(authorName: string): Promise<AuthorMetrics | null> {
    const cacheKey = `author_${authorName}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const searchUrl = `${this.baseUrl}/author/search?query=${encodeURIComponent(authorName)}&fields=authorId,name,hIndex,citationCount,paperCount,affiliations`;
      
      const searchResult = await this.makeRequest(searchUrl);
      
      if (!searchResult?.data?.length) {
        return null;
      }

      const author = searchResult.data[0];
      
      const metrics: AuthorMetrics = {
        authorName: author.name,
        hIndex: author.hIndex,
        citationCount: author.citationCount || 0,
        paperCount: author.paperCount || 0,
        affiliations: (author.affiliations || []).map((aff: any) => aff.name || aff)
      };

      cache.set(cacheKey, metrics, 240); // Cache for 4 hours
      return metrics;
    } catch (error) {
      console.warn('Failed to fetch author metrics:', error);
      return null;
    }
  }
}

/**
 * OpenAlex/Crossref integration for journal impact metrics
 */
export class JournalMetricsService {
  private openAlexBaseUrl = 'https://api.openalex.org';

  async getJournalImpactData(venue: string): Promise<JournalImpactData | null> {
    const cacheKey = `journal_${venue}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const searchUrl = `${this.openAlexBaseUrl}/venues?search=${encodeURIComponent(venue)}&per-page=1`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) return null;

      const data = await response.json();
      
      if (!data.results?.length) {
        return null;
      }

      const journal = data.results[0];
      
      const impactData: JournalImpactData = {
        venue: journal.display_name,
        impactFactor: journal.summary_stats?.['2yr_mean_citedness'],
        hIndex: journal.summary_stats?.h_index,
        category: journal.host_organization?.display_name || 'Unknown',
        quartile: this.determineQuartile(journal.summary_stats?.['2yr_mean_citedness'])
      };

      cache.set(cacheKey, impactData, 1440); // Cache for 24 hours
      return impactData;
    } catch (error) {
      console.warn('Failed to fetch journal impact data:', error);
      return null;
    }
  }

  private determineQuartile(impactFactor?: number): 'Q1' | 'Q2' | 'Q3' | 'Q4' | undefined {
    if (!impactFactor) return undefined;
    
    // Simple quartile determination based on impact factor ranges
    if (impactFactor >= 4.0) return 'Q1';
    if (impactFactor >= 2.0) return 'Q2';
    if (impactFactor >= 1.0) return 'Q3';
    return 'Q4';
  }
}

/**
 * Main external data service that coordinates all external APIs
 */
export class ExternalDataService {
  private semanticScholar = new SemanticScholarService();
  private journalMetrics = new JournalMetricsService();

  async enrichPaperData(papers: PaperRecord[], maxPapers: number = 50): Promise<Map<string, any>> {
    const enrichedData = new Map<string, any>();
    
    // Process papers in batches to avoid overwhelming APIs
    const batchSize = 5;
    const papersToProcess = papers.slice(0, maxPapers);
    
    for (let i = 0; i < papersToProcess.length; i += batchSize) {
      const batch = papersToProcess.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (paper) => {
        try {
          const [citationData, journalData] = await Promise.all([
            this.semanticScholar.getCitationData(paper),
            this.journalMetrics.getJournalImpactData(paper.venue || paper.publicationTitle)
          ]);

          return {
            paperKey: paper.key,
            citations: citationData,
            journal: journalData
          };
        } catch (error) {
          console.warn(`Failed to enrich data for paper ${paper.key}:`, error);
          return { paperKey: paper.key, citations: null, journal: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.citations || result.journal) {
          enrichedData.set(result.paperKey, {
            citations: result.citations,
            journal: result.journal
          });
        }
      });

      // Add delay between batches
      if (i + batchSize < papersToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return enrichedData;
  }

  async getAuthorEnrichmentData(authors: string[], maxAuthors: number = 20): Promise<Map<string, AuthorMetrics>> {
    const authorData = new Map<string, AuthorMetrics>();
    
    const authorsToProcess = authors.slice(0, maxAuthors);
    
    for (const author of authorsToProcess) {
      try {
        const metrics = await this.semanticScholar.getAuthorMetrics(author);
        if (metrics) {
          authorData.set(author, metrics);
        }
      } catch (error) {
        console.warn(`Failed to get metrics for author ${author}:`, error);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return authorData;
  }

  clearCache() {
    cache.clear();
  }
}

// Export singleton instance
export const externalDataService = new ExternalDataService();