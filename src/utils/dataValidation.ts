import { PaperRecord } from '../types';

/**
 * Validation utilities for data cleaning and quality assurance
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single paper record
 */
export function validatePaperRecord(paper: PaperRecord): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields validation
  if (!paper.title || paper.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!paper.authors || paper.authors.length === 0) {
    warnings.push('No authors specified');
  }
  
  // Year validation
  if (paper.publicationYear !== null) {
    if (paper.publicationYear < 1990 || paper.publicationYear > 2025) {
      warnings.push(`Publication year ${paper.publicationYear} is outside expected range (1990-2025)`);
    }
  } else {
    warnings.push('Publication year is missing');
  }
  
  // DOI validation
  if (paper.doi && !isValidDOI(paper.doi)) {
    warnings.push('DOI format appears invalid');
  }
  
  // URL validation
  if (paper.url && !isValidURL(paper.url)) {
    warnings.push('URL format appears invalid');
  }
  
  // Author name validation
  paper.authors.forEach((author, index) => {
    if (!isValidAuthorName(author)) {
      warnings.push(`Author name at index ${index} may be malformed: "${author}"`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate an array of paper records
 */
export function validatePaperDataset(papers: PaperRecord[]): {
  validPapers: PaperRecord[];
  invalidPapers: { paper: PaperRecord; validation: ValidationResult }[];
  overallStats: {
    totalPapers: number;
    validPapers: number;
    papersWithWarnings: number;
    duplicateKeys: string[];
  };
} {
  const validPapers: PaperRecord[] = [];
  const invalidPapers: { paper: PaperRecord; validation: ValidationResult }[] = [];
  const keysSeen = new Set<string>();
  const duplicateKeys: string[] = [];
  let papersWithWarnings = 0;
  
  papers.forEach(paper => {
    // Check for duplicate keys
    if (keysSeen.has(paper.key)) {
      duplicateKeys.push(paper.key);
    }
    keysSeen.add(paper.key);
    
    const validation = validatePaperRecord(paper);
    
    if (validation.isValid) {
      validPapers.push(paper);
      if (validation.warnings.length > 0) {
        papersWithWarnings++;
      }
    } else {
      invalidPapers.push({ paper, validation });
    }
  });
  
  return {
    validPapers,
    invalidPapers,
    overallStats: {
      totalPapers: papers.length,
      validPapers: validPapers.length,
      papersWithWarnings,
      duplicateKeys
    }
  };
}

/**
 * Check if DOI format is valid
 */
function isValidDOI(doi: string): boolean {
  // Basic DOI format: 10.xxxx/xxxxx
  const doiPattern = /^10\.\d{4,}\/\S+$/;
  return doiPattern.test(doi.trim());
}

/**
 * Check if URL format is valid
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if author name appears valid
 */
function isValidAuthorName(name: string): boolean {
  const trimmed = name.trim();
  
  // Must have at least 2 characters
  if (trimmed.length < 2) return false;
  
  // Should contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  
  // Should not be all numbers
  if (/^\d+$/.test(trimmed)) return false;
  
  // Should not contain excessive special characters
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s\-\.]/g) || []).length;
  if (specialCharCount > trimmed.length * 0.3) return false;
  
  return true;
}

/**
 * Clean and normalize paper data
 */
export function cleanPaperRecord(paper: PaperRecord): PaperRecord {
  return {
    ...paper,
    title: paper.title.trim(),
    authors: paper.authors.map(author => author.trim()).filter(author => author.length > 0),
    publicationTitle: paper.publicationTitle.trim(),
    abstract: paper.abstract.trim(),
    venue: paper.venue.trim(),
    tags: paper.tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
    doi: paper.doi?.trim(),
    url: paper.url?.trim()
  };
}

/**
 * Remove duplicate papers based on title similarity
 */
export function removeDuplicatePapers(papers: PaperRecord[]): PaperRecord[] {
  const uniquePapers: PaperRecord[] = [];
  const seenTitles = new Set<string>();
  
  papers.forEach(paper => {
    const normalizedTitle = normalizeTitleForComparison(paper.title);
    
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniquePapers.push(paper);
    }
  });
  
  return uniquePapers;
}

/**
 * Normalize title for duplicate detection
 */
function normalizeTitleForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generate data quality report
 */
export function generateDataQualityReport(papers: PaperRecord[]): {
  summary: {
    totalPapers: number;
    completenessScore: number;
    qualityScore: number;
  };
  fieldCompleteness: Record<string, number>;
  qualityIssues: string[];
  recommendations: string[];
} {
  const totalPapers = papers.length;
  
  // Calculate field completeness
  const fieldCompleteness = {
    title: (papers.filter(p => p.title?.trim()).length / totalPapers) * 100,
    authors: (papers.filter(p => p.authors?.length > 0).length / totalPapers) * 100,
    year: (papers.filter(p => p.publicationYear !== null).length / totalPapers) * 100,
    abstract: (papers.filter(p => p.abstract?.trim()).length / totalPapers) * 100,
    doi: (papers.filter(p => p.doi?.trim()).length / totalPapers) * 100,
    url: (papers.filter(p => p.url?.trim()).length / totalPapers) * 100,
    venue: (papers.filter(p => p.venue?.trim()).length / totalPapers) * 100
  };
  
  const completenessScore = Object.values(fieldCompleteness).reduce((a, b) => a + b, 0) / Object.keys(fieldCompleteness).length;
  
  // Identify quality issues
  const qualityIssues: string[] = [];
  const recommendations: string[] = [];
  
  if (fieldCompleteness.year < 80) {
    qualityIssues.push(`${(100 - fieldCompleteness.year).toFixed(1)}% of papers missing publication year`);
    recommendations.push('Consider manual review to add missing publication years');
  }
  
  if (fieldCompleteness.abstract < 60) {
    qualityIssues.push(`${(100 - fieldCompleteness.abstract).toFixed(1)}% of papers missing abstracts`);
    recommendations.push('Abstracts are crucial for topic analysis - consider finding missing abstracts');
  }
  
  if (fieldCompleteness.doi < 50) {
    qualityIssues.push(`${(100 - fieldCompleteness.doi).toFixed(1)}% of papers missing DOI`);
    recommendations.push('DOIs help with citation tracking and paper verification');
  }
  
  // Calculate overall quality score
  const qualityScore = completenessScore * 0.7 + (fieldCompleteness.title * 0.3);
  
  return {
    summary: {
      totalPapers,
      completenessScore: Math.round(completenessScore),
      qualityScore: Math.round(qualityScore)
    },
    fieldCompleteness,
    qualityIssues,
    recommendations
  };
}