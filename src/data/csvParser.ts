import { PaperRecord, ProcessedData, QualityIndicators, VenueStatistics } from '../types';
import { generateTopicClusters } from '../utils/textAnalysis';
import { analyzeAuthorNetwork } from '../utils/authorAnalysis';

/**
 * Parse CSV content into structured paper records
 * Handles the 647-paper dataset with proper data cleaning and validation
 */
export function parseCSV(csvContent: string): PaperRecord[] {
  console.log('🔄 Starting CSV parsing...');
  console.log(`📄 CSV content length: ${csvContent.length} characters`);
  
  const lines = csvContent.split('\n');
  console.log(`📋 Total lines in CSV: ${lines.length}`);
  
  if (lines.length < 2) {
    console.error('❌ CSV file has insufficient lines');
    return [];
  }
  
  // Use a more robust CSV parsing approach
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
  console.log(`📊 Headers found: ${headers.length} columns`);
  console.log(`📝 First few headers: ${headers.slice(0, 5).join(', ')}`);
  
  const papers: PaperRecord[] = [];
  let validPapers = 0;
  let skippedPapers = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Parse CSV line handling quoted fields
      const fields = parseCSVLine(line);
      
      // More lenient field count check
      if (fields.length < headers.length * 0.5) {
        skippedPapers++;
        continue;
      }
      
      const paper = createPaperRecord(headers, fields);
      if (paper) {
        papers.push(paper);
        validPapers++;
      } else {
        skippedPapers++;
      }
    } catch (error) {
      console.warn(`⚠️ Error parsing line ${i}:`, error);
      skippedPapers++;
    }
  }
  
  console.log(`✅ CSV parsing complete:`);
  console.log(`📈 Valid papers: ${validPapers}`);
  console.log(`⚠️ Skipped papers: ${skippedPapers}`);
  console.log(`📊 Total papers parsed: ${papers.length}`);
  
  return papers;
}

/**
 * Parse a single CSV line handling quoted fields and commas within quotes
 * Enhanced to handle complex Zotero CSV format with nested quotes
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes (double quotes)
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2; // Skip both quotes
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      i++;
      continue;
    } else {
      current += char;
    }
    
    i++;
  }
  
  fields.push(current.trim());
  return fields;
}

/**
 * Create a paper record from CSV headers and fields
 */
function createPaperRecord(headers: string[], fields: string[]): PaperRecord | null {
  try {
    const getField = (fieldName: string): string => {
      // Map Zotero field names to our expected field names
      const fieldMappings: Record<string, string[]> = {
        'title': ['Title'],
        'author': ['Author'],
        'year': ['Publication Year'],
        'abstract': ['Abstract Note'],
        'doi': ['DOI'],
        'url': ['Url'],
        'type': ['Item Type'],
        'venue': ['Publication Title'],
        'key': ['Key'],
        'tags': ['Manual Tags', 'Automatic Tags']
      };
      
      const possibleFields = fieldMappings[fieldName.toLowerCase()] || [fieldName];
      
      for (const possibleField of possibleFields) {
        const index = headers.findIndex(h => 
          h && (
            h.toLowerCase() === possibleField.toLowerCase() ||
            h.toLowerCase().includes(possibleField.toLowerCase())
          )
        );
        if (index >= 0 && index < fields.length && fields[index] && fields[index].trim()) {
          return cleanField(fields[index]);
        }
      }
      
      return '';
    };
    
    const title = getField('title');
    if (!title || title.length < 5) return null; // Skip records without meaningful title
    
    // Parse publication year with validation
    const yearStr = getField('year') || getField('date');
    const publicationYear = parseYear(yearStr);
    
    // Parse authors
    const authorsStr = getField('author') || getField('authors');
    const authors = parseAuthors(authorsStr);
    
    // Parse tags (combine manual and automatic tags from Zotero)
    const manualTags = getField('Manual Tags');
    const autoTags = getField('Automatic Tags');
    const combinedTagsStr = [manualTags, autoTags].filter(Boolean).join('; ');
    const tags = parseTags(combinedTagsStr);
    
    const paper: PaperRecord = {
      key: getField('key') || generateKey(title, authors[0] || 'unknown'),
      itemType: getField('type') || getField('itemtype') || 'article',
      publicationYear,
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      title,
      publicationTitle: getField('venue') || getField('Publication Title') || '',
      doi: getField('doi'),
      url: getField('url'),
      abstract: getField('abstract'),
      tags,
      venue: getField('venue') || getField('Publication Title') || ''
    };
    
    return paper;
  } catch (error) {
    console.warn('Error parsing paper record:', error);
    return null;
  }
}

/**
 * Clean field content by removing quotes and extra whitespace
 */
function cleanField(field: string): string {
  return field.replace(/^"|"$/g, '').trim();
}

/**
 * Parse publication year from various formats
 */
function parseYear(yearStr: string): number | null {
  if (!yearStr) return null;
  
  // Extract 4-digit year from string
  const yearMatch = yearStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    // Validate reasonable year range
    if (year >= 1990 && year <= 2025) {
      return year;
    }
  }
  
  return null;
}

/**
 * Parse authors string into array of author names
 */
function parseAuthors(authorsStr: string): string[] {
  if (!authorsStr) return [];
  
  // Split by common separators and clean
  const authors = authorsStr
    .split(/[;,&]|and\s+/)
    .map(author => author.trim())
    .filter(author => author.length > 0)
    .map(author => cleanAuthorName(author));
  
  return authors;
}

/**
 * Clean author name by removing extra formatting
 */
function cleanAuthorName(name: string): string {
  // Remove common prefixes/suffixes and normalize
  return name
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .replace(/\s*(Jr\.|Sr\.|III|IV)\.?$/i, '')
    .trim();
}

/**
 * Parse tags/keywords string into array
 */
function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  
  return tagsStr
    .split(/[;,]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Generate a unique key for papers without explicit keys
 */
function generateKey(title: string, firstAuthor: string): string {
  const titleWords = title.toLowerCase().split(/\s+/).slice(0, 3);
  const authorLastName = firstAuthor ? firstAuthor.split(' ').pop() || '' : '';
  return `${authorLastName.toLowerCase()}_${titleWords.join('_')}`;
}

/**
 * Calculate quality indicators for the dataset
 */
export function calculateQualityMetrics(papers: PaperRecord[]): QualityIndicators {
  const totalPapers = papers.length;
  const currentYear = new Date().getFullYear();
  
  const doiCount = papers.filter(p => p.doi && p.doi.trim().length > 0).length;
  const urlCount = papers.filter(p => p.url && p.url.trim().length > 0).length;
  const abstractCount = papers.filter(p => p.abstract && p.abstract.trim().length > 0).length;
  const recentCount = papers.filter(p => 
    p.publicationYear && p.publicationYear >= currentYear - 5
  ).length;
  
  return {
    totalPapers,
    doiCoverage: (doiCount / totalPapers) * 100,
    urlCoverage: (urlCount / totalPapers) * 100,
    abstractCoverage: (abstractCount / totalPapers) * 100,
    recentPapers: (recentCount / totalPapers) * 100
  };
}

/**
 * Generate venue statistics from papers
 */
export function generateVenueStats(papers: PaperRecord[]): VenueStatistics[] {
  const venueMap = new Map<string, { count: number; type: string }>();
  
  papers.forEach(paper => {
    const venue = paper.venue || paper.publicationTitle || 'Unknown';
    const existing = venueMap.get(venue) || { count: 0, type: 'other' };
    
    // Determine venue type based on common patterns
    let type: 'journal' | 'conference' | 'book' | 'other' = 'other';
    const venueLower = venue.toLowerCase();
    
    if (venueLower.includes('journal') || venueLower.includes('transactions')) {
      type = 'journal';
    } else if (venueLower.includes('conference') || venueLower.includes('proceedings') || 
               venueLower.includes('workshop') || venueLower.includes('symposium')) {
      type = 'conference';
    } else if (venueLower.includes('book') || venueLower.includes('chapter')) {
      type = 'book';
    }
    
    venueMap.set(venue, { count: existing.count + 1, type });
  });
  
  return Array.from(venueMap.entries())
    .map(([name, data]) => ({
      name,
      paperCount: data.count,
      type: data.type as 'journal' | 'conference' | 'book' | 'other'
    }))
    .sort((a, b) => b.paperCount - a.paperCount);
}

/**
 * Main data transformation function for visualization consumption
 */
export function transformDataForVisualization(papers: PaperRecord[]): ProcessedData {
  console.log('Transforming data for visualization...');
  
  // Calculate year range
  const years = papers
    .map(p => p.publicationYear)
    .filter((year): year is number => year !== null);
  
  const yearRange: [number, number] = years.length > 0 
    ? [Math.min(...years), Math.max(...years)]
    : [1990, 2025];
  
  // Generate topic clusters
  console.log('Generating topic clusters...');
  const topicClusters = generateTopicClusters(papers);
  
  // Analyze author network
  console.log('Analyzing author network...');
  const authorNetworkData = analyzeAuthorNetwork(papers);
  
  console.log(`Processed ${papers.length} papers, ${topicClusters.length} topics, ${authorNetworkData.authors.length} authors`);
  
  return {
    papers,
    yearRange,
    authorNetwork: authorNetworkData.authors,
    topicClusters,
    venueStats: generateVenueStats(papers),
    qualityMetrics: calculateQualityMetrics(papers)
  };
}