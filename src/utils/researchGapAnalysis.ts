import { PaperRecord, TopicCluster, AuthorNode } from '../types';

export interface ResearchGap {
  id: string;
  type: 'topical' | 'temporal' | 'methodological' | 'geographic';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  evidence: {
    underRepresentedTopics: string[];
    citationGaps: PaperRecord[];
    temporalGaps: YearRange[];
    potentialImpact: number;
    supportingData: any;
  };
  recommendations: string[];
  opportunityScore: number;
}

export interface YearRange {
  startYear: number;
  endYear: number;
  expectedPapers: number;
  actualPapers: number;
  gapSize: number;
}

export interface TopicIntersection {
  topics: string[];
  combinedLabel: string;
  expectedPapers: number;
  actualPapers: number;
  gapSize: number;
  potentialImpact: number;
}

export interface CitationGapAnalysis {
  underCitedPapers: Array<{
    paper: PaperRecord;
    expectedCitations: number;
    actualCitations: number;
    gapReason: string;
  }>;
  emergingTopics: string[];
  stagnantAreas: string[];
}

/**
 * Research Gap Analysis Engine
 */
export class ResearchGapAnalyzer {
  private papers: PaperRecord[];
  private topicClusters: TopicCluster[];
  private authors: AuthorNode[];

  constructor(papers: PaperRecord[], topicClusters: TopicCluster[], authors: AuthorNode[]) {
    this.papers = papers;
    this.topicClusters = topicClusters;
    this.authors = authors;
  }

  /**
   * Analyze all types of research gaps
   */
  analyzeAllGaps(): ResearchGap[] {
    const gaps: ResearchGap[] = [];

    gaps.push(...this.analyzeTopicalGaps());
    gaps.push(...this.analyzeTemporalGaps());
    gaps.push(...this.analyzeMethodologicalGaps());
    gaps.push(...this.analyzeGeographicGaps());

    return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Identify under-researched topic intersections
   */
  analyzeTopicalGaps(): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    const topicIntersections = this.findTopicIntersections();

    // Find intersections with high potential but low actual research
    const underResearchedIntersections = topicIntersections.filter(
      intersection => intersection.gapSize > 5 && intersection.potentialImpact > 0.7
    );

    underResearchedIntersections.forEach((intersection, index) => {
      gaps.push({
        id: `topical_${index}`,
        type: 'topical',
        title: `Under-researched: ${intersection.combinedLabel}`,
        description: `The intersection of ${intersection.topics.join(' and ')} shows significant research potential but limited current coverage.`,
        severity: intersection.gapSize > 15 ? 'high' : intersection.gapSize > 10 ? 'medium' : 'low',
        evidence: {
          underRepresentedTopics: intersection.topics,
          citationGaps: [],
          temporalGaps: [],
          potentialImpact: intersection.potentialImpact,
          supportingData: {
            expectedPapers: intersection.expectedPapers,
            actualPapers: intersection.actualPapers,
            gapSize: intersection.gapSize
          }
        },
        recommendations: [
          `Investigate ${intersection.combinedLabel} applications in real-world scenarios`,
          `Develop theoretical frameworks combining ${intersection.topics.join(' and ')}`,
          `Conduct empirical studies bridging these research areas`,
          `Explore policy implications of ${intersection.combinedLabel}`
        ],
        opportunityScore: intersection.potentialImpact * (intersection.gapSize / 20) * 100
      });
    });

    // Identify emerging vs stagnant topics
    const emergingTopics = this.identifyEmergingTopics();
    const stagnantTopics = this.identifyStagnantTopics();

    if (stagnantTopics.length > 0) {
      gaps.push({
        id: 'topical_stagnant',
        type: 'topical',
        title: 'Stagnant Research Areas',
        description: 'Several research areas show declining activity and may need revitalization or new approaches.',
        severity: 'medium',
        evidence: {
          underRepresentedTopics: stagnantTopics,
          citationGaps: [],
          temporalGaps: [],
          potentialImpact: 0.6,
          supportingData: { stagnantTopics, emergingTopics }
        },
        recommendations: [
          'Re-examine fundamental assumptions in stagnant areas',
          'Apply new methodologies to traditional problems',
          'Explore connections with emerging technologies',
          'Consider interdisciplinary approaches'
        ],
        opportunityScore: 60
      });
    }

    return gaps;
  }

  /**
   * Identify temporal gaps in research activity
   */
  analyzeTemporalGaps(): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    const temporalGaps = this.findTemporalGaps();

    if (temporalGaps.length > 0) {
      const significantGaps = temporalGaps.filter(gap => gap.gapSize > 10);

      significantGaps.forEach((gap, index) => {
        gaps.push({
          id: `temporal_${index}`,
          type: 'temporal',
          title: `Research Activity Gap (${gap.startYear}-${gap.endYear})`,
          description: `Significant reduction in research activity during ${gap.startYear}-${gap.endYear}, with ${gap.gapSize} fewer papers than expected.`,
          severity: gap.gapSize > 20 ? 'high' : 'medium',
          evidence: {
            underRepresentedTopics: [],
            citationGaps: [],
            temporalGaps: [gap],
            potentialImpact: 0.5,
            supportingData: gap
          },
          recommendations: [
            'Investigate reasons for reduced research activity during this period',
            'Identify if important developments were missed',
            'Consider if external factors (funding, events) influenced research',
            'Explore if catch-up research is needed'
          ],
          opportunityScore: (gap.gapSize / gap.expectedPapers) * 50
        });
      });
    }

    // Check for recent decline
    const recentTrend = this.analyzeRecentTrend();
    if (recentTrend.isDecline) {
      gaps.push({
        id: 'temporal_recent_decline',
        type: 'temporal',
        title: 'Recent Research Decline',
        description: `Research activity has declined in recent years, potentially indicating field maturation or shift in focus.`,
        severity: 'medium',
        evidence: {
          underRepresentedTopics: [],
          citationGaps: [],
          temporalGaps: [],
          potentialImpact: 0.4,
          supportingData: recentTrend
        },
        recommendations: [
          'Assess if decline indicates field maturation or loss of interest',
          'Identify new directions or applications',
          'Consider emerging technologies that might revitalize the field',
          'Explore policy or industry developments creating new research needs'
        ],
        opportunityScore: 40
      });
    }

    return gaps;
  }

  /**
   * Identify methodological gaps
   */
  analyzeMethodologicalGaps(): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    const methodologyAnalysis = this.analyzeMethodologies();

    // Identify under-utilized methodologies
    const underUtilizedMethods = methodologyAnalysis.underUtilized;
    if (underUtilizedMethods.length > 0) {
      gaps.push({
        id: 'methodological_underutilized',
        type: 'methodological',
        title: 'Under-utilized Research Methodologies',
        description: 'Several research methodologies are underrepresented, potentially limiting research depth and validity.',
        severity: 'medium',
        evidence: {
          underRepresentedTopics: underUtilizedMethods,
          citationGaps: [],
          temporalGaps: [],
          potentialImpact: 0.7,
          supportingData: methodologyAnalysis
        },
        recommendations: [
          'Encourage mixed-method approaches combining quantitative and qualitative research',
          'Promote experimental and empirical studies in theoretical areas',
          'Develop standardized evaluation frameworks',
          'Foster collaboration between theoretical and applied researchers'
        ],
        opportunityScore: 70
      });
    }

    // Identify lack of empirical validation
    const theoreticalBias = this.assessTheoreticalBias();
    if (theoreticalBias.score > 0.7) {
      gaps.push({
        id: 'methodological_empirical',
        type: 'methodological',
        title: 'Lack of Empirical Validation',
        description: 'Research shows strong theoretical bias with limited empirical validation of proposed models and frameworks.',
        severity: 'high',
        evidence: {
          underRepresentedTopics: ['empirical studies', 'experimental validation'],
          citationGaps: [],
          temporalGaps: [],
          potentialImpact: 0.8,
          supportingData: theoreticalBias
        },
        recommendations: [
          'Conduct empirical studies to validate theoretical models',
          'Develop real-world case studies and applications',
          'Create standardized datasets for comparative evaluation',
          'Establish industry partnerships for practical validation'
        ],
        opportunityScore: 85
      });
    }

    return gaps;
  }

  /**
   * Identify geographic gaps in research
   */
  analyzeGeographicGaps(): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    const geographicAnalysis = this.analyzeGeographicDistribution();

    if (geographicAnalysis.underRepresentedRegions.length > 0) {
      gaps.push({
        id: 'geographic_representation',
        type: 'geographic',
        title: 'Geographic Research Imbalance',
        description: 'Research is concentrated in certain regions, potentially missing diverse perspectives and applications.',
        severity: 'medium',
        evidence: {
          underRepresentedTopics: geographicAnalysis.underRepresentedRegions,
          citationGaps: [],
          temporalGaps: [],
          potentialImpact: 0.6,
          supportingData: geographicAnalysis
        },
        recommendations: [
          'Encourage international collaboration and research exchanges',
          'Study region-specific applications and challenges',
          'Consider cultural and regulatory differences in research design',
          'Develop funding mechanisms for underrepresented regions'
        ],
        opportunityScore: 60
      });
    }

    return gaps;
  }

  /**
   * Find topic intersections with research gaps
   */
  private findTopicIntersections(): TopicIntersection[] {
    const intersections: TopicIntersection[] = [];
    
    // Analyze all pairs of topics
    for (let i = 0; i < this.topicClusters.length; i++) {
      for (let j = i + 1; j < this.topicClusters.length; j++) {
        const topic1 = this.topicClusters[i];
        const topic2 = this.topicClusters[j];
        
        // Find papers that belong to both topics
        const intersection = topic1.papers.filter(p1 =>
          topic2.papers.some(p2 => p2.key === p1.key)
        );
        
        // Calculate expected papers based on topic sizes
        const expectedRatio = (topic1.coverage / 100) * (topic2.coverage / 100);
        const expectedPapers = Math.round(this.papers.length * expectedRatio * 0.3); // 30% overlap expected
        
        const actualPapers = intersection.length;
        const gapSize = Math.max(0, expectedPapers - actualPapers);
        
        // Calculate potential impact based on topic importance and complementarity
        const potentialImpact = this.calculateTopicComplementarity(topic1, topic2);
        
        if (gapSize > 0) {
          intersections.push({
            topics: [topic1.label, topic2.label],
            combinedLabel: `${topic1.label} + ${topic2.label}`,
            expectedPapers,
            actualPapers,
            gapSize,
            potentialImpact
          });
        }
      }
    }
    
    return intersections.sort((a, b) => b.gapSize - a.gapSize);
  }

  /**
   * Calculate how complementary two topics are
   */
  private calculateTopicComplementarity(topic1: TopicCluster, topic2: TopicCluster): number {
    // Higher complementarity for topics that are important but don't overlap much
    const importanceScore = (topic1.coverage + topic2.coverage) / 200; // Normalize to 0-1
    
    // Check if topics are in different domains (higher complementarity)
    const domainDifference = this.assessDomainDifference(topic1.label, topic2.label);
    
    return Math.min(1, importanceScore * domainDifference);
  }

  /**
   * Assess if two topics are from different domains
   */
  private assessDomainDifference(topic1: string, topic2: string): number {
    const domains = {
      technical: ['AI/ML', 'Network', 'Privacy'],
      economic: ['Economics', 'Risk Management'],
      theoretical: ['Game Theory', 'Security']
    };
    
    let domain1 = 'other';
    let domain2 = 'other';
    
    for (const [domain, topics] of Object.entries(domains)) {
      if (topics.includes(topic1)) domain1 = domain;
      if (topics.includes(topic2)) domain2 = domain;
    }
    
    return domain1 !== domain2 ? 1.5 : 1.0;
  }

  /**
   * Find temporal gaps in research activity
   */
  private findTemporalGaps(): YearRange[] {
    const yearlyPapers = this.papers.reduce((acc, paper) => {
      if (paper.publicationYear) {
        acc[paper.publicationYear] = (acc[paper.publicationYear] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const years = Object.keys(yearlyPapers).map(Number).sort();
    const gaps: YearRange[] = [];
    
    // Calculate moving average to identify expected activity
    const windowSize = 3;
    for (let i = windowSize; i < years.length - windowSize; i++) {
      const currentYear = years[i];
      const currentPapers = yearlyPapers[currentYear] || 0;
      
      // Calculate expected papers based on surrounding years
      const surroundingYears = years.slice(i - windowSize, i).concat(years.slice(i + 1, i + windowSize + 1));
      const avgSurrounding = surroundingYears.reduce((sum, year) => sum + (yearlyPapers[year] || 0), 0) / surroundingYears.length;
      
      const expectedPapers = Math.round(avgSurrounding);
      const gapSize = Math.max(0, expectedPapers - currentPapers);
      
      if (gapSize > 5) { // Significant gap threshold
        gaps.push({
          startYear: currentYear,
          endYear: currentYear,
          expectedPapers,
          actualPapers: currentPapers,
          gapSize
        });
      }
    }
    
    return gaps;
  }

  /**
   * Analyze recent research trends
   */
  private analyzeRecentTrend(): { isDecline: boolean; trendData: any } {
    const currentYear = new Date().getFullYear();
    const recentYears = 5;
    
    const recentPapers = this.papers.filter(p => 
      p.publicationYear && p.publicationYear >= currentYear - recentYears
    );
    
    const yearlyCount = recentPapers.reduce((acc, paper) => {
      if (paper.publicationYear) {
        acc[paper.publicationYear] = (acc[paper.publicationYear] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    const years = Object.keys(yearlyCount).map(Number).sort();
    if (years.length < 3) return { isDecline: false, trendData: {} };
    
    // Simple trend analysis: compare first half vs second half
    const midPoint = Math.floor(years.length / 2);
    const firstHalf = years.slice(0, midPoint);
    const secondHalf = years.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, year) => sum + yearlyCount[year], 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, year) => sum + yearlyCount[year], 0) / secondHalf.length;
    
    const isDecline = secondHalfAvg < firstHalfAvg * 0.8; // 20% decline threshold
    
    return {
      isDecline,
      trendData: {
        firstHalfAvg,
        secondHalfAvg,
        declinePercentage: ((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100
      }
    };
  }

  /**
   * Analyze research methodologies used
   */
  private analyzeMethodologies(): { underUtilized: string[]; overUtilized: string[]; balance: number } {
    // Simple methodology detection based on keywords in titles and abstracts
    const methodologies = {
      'Theoretical': ['theoretical', 'theory', 'model', 'framework', 'conceptual'],
      'Empirical': ['empirical', 'experimental', 'study', 'analysis', 'evaluation'],
      'Simulation': ['simulation', 'monte carlo', 'agent-based', 'modeling'],
      'Survey': ['survey', 'questionnaire', 'interview', 'qualitative'],
      'Case Study': ['case study', 'real-world', 'practical', 'implementation']
    };
    
    const methodCounts = Object.keys(methodologies).reduce((acc, method) => {
      acc[method] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    this.papers.forEach(paper => {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      
      Object.entries(methodologies).forEach(([method, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          methodCounts[method]++;
        }
      });
    });
    
    const totalPapers = this.papers.length;
    const methodPercentages = Object.entries(methodCounts).map(([method, count]) => ({
      method,
      percentage: (count / totalPapers) * 100
    }));
    
    // Identify under and over-utilized methods
    const underUtilized = methodPercentages.filter(m => m.percentage < 15).map(m => m.method);
    const overUtilized = methodPercentages.filter(m => m.percentage > 60).map(m => m.method);
    
    // Calculate balance score (higher is more balanced)
    const variance = methodPercentages.reduce((sum, m) => sum + Math.pow(m.percentage - 20, 2), 0) / methodPercentages.length;
    const balance = Math.max(0, 1 - (variance / 400)); // Normalize to 0-1
    
    return { underUtilized, overUtilized, balance };
  }

  /**
   * Assess theoretical vs empirical bias
   */
  private assessTheoreticalBias(): { score: number; details: any } {
    const theoreticalKeywords = ['theoretical', 'theory', 'model', 'framework', 'conceptual', 'analytical'];
    const empiricalKeywords = ['empirical', 'experimental', 'study', 'evaluation', 'validation', 'testing'];
    
    let theoreticalCount = 0;
    let empiricalCount = 0;
    
    this.papers.forEach(paper => {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      
      if (theoreticalKeywords.some(keyword => text.includes(keyword))) {
        theoreticalCount++;
      }
      if (empiricalKeywords.some(keyword => text.includes(keyword))) {
        empiricalCount++;
      }
    });
    
    const total = theoreticalCount + empiricalCount;
    const theoreticalRatio = total > 0 ? theoreticalCount / total : 0;
    
    return {
      score: theoreticalRatio,
      details: {
        theoreticalCount,
        empiricalCount,
        theoreticalRatio,
        empiricalRatio: 1 - theoreticalRatio
      }
    };
  }

  /**
   * Analyze geographic distribution (simplified)
   */
  private analyzeGeographicDistribution(): { underRepresentedRegions: string[]; analysis: any } {
    // This is a simplified analysis - in reality, you'd need author affiliation data
    // For now, we'll identify this as a gap that needs better data
    
    return {
      underRepresentedRegions: ['Developing Countries', 'Non-Western Perspectives', 'Regional Applications'],
      analysis: {
        note: 'Geographic analysis requires author affiliation data',
        recommendation: 'Collect and analyze author institutional affiliations'
      }
    };
  }

  /**
   * Identify emerging topics based on recent growth
   */
  private identifyEmergingTopics(): string[] {
    const currentYear = new Date().getFullYear();
    const recentYears = 3;
    
    return this.topicClusters
      .filter(topic => {
        const recentPapers = topic.papers.filter(p => 
          p.publicationYear && p.publicationYear >= currentYear - recentYears
        );
        const recentRatio = recentPapers.length / topic.papers.length;
        return recentRatio > 0.4; // More than 40% of papers are recent
      })
      .map(topic => topic.label);
  }

  /**
   * Identify stagnant topics with declining activity
   */
  private identifyStagnantTopics(): string[] {
    const currentYear = new Date().getFullYear();
    const recentYears = 5;
    
    return this.topicClusters
      .filter(topic => {
        const recentPapers = topic.papers.filter(p => 
          p.publicationYear && p.publicationYear >= currentYear - recentYears
        );
        const recentRatio = recentPapers.length / topic.papers.length;
        return recentRatio < 0.2 && topic.papers.length > 10; // Less than 20% recent, but significant total
      })
      .map(topic => topic.label);
  }
}

/**
 * Factory function to create and run gap analysis
 */
export function analyzeResearchGaps(
  papers: PaperRecord[], 
  topicClusters: TopicCluster[], 
  authors: AuthorNode[]
): ResearchGap[] {
  const analyzer = new ResearchGapAnalyzer(papers, topicClusters, authors);
  return analyzer.analyzeAllGaps();
}