import * as XLSX from 'xlsx';
import { PaperRecord } from '../types';

/**
 * Parse Excel file (screened dataset) into paper records
 */
export async function parseExcelFile(file: ArrayBuffer): Promise<PaperRecord[]> {
  try {
    console.log('📊 Parsing screened Excel dataset...');
    
    const workbook = XLSX.read(file, { type: 'array' });
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }
    
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);
    
    console.log(`📋 Found ${headers.length} columns and ${dataRows.length} rows in screened dataset`);
    
    const papers: PaperRecord[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const paper = createPaperFromExcelRow(headers, row);
      
      if (paper) {
        papers.push(paper);
      }
    }
    
    console.log(`✅ Successfully parsed ${papers.length} papers from screened dataset`);
    return papers;
    
  } catch (error) {
    console.error('❌ Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a paper record from Excel row data
 */
function createPaperFromExcelRow(headers: string[], row: string[]): PaperRecord | null {
  try {
    const getField = (fieldName: string): string => {
      // Common field mappings for screened datasets
      const fieldMappings: Record<string, string[]> = {
        'title': ['Title', 'Paper Title', 'Article Title'],
        'author': ['Author', 'Authors', 'Author(s)'],
        'year': ['Year', 'Publication Year', 'Pub Year', 'Date'],
        'abstract': ['Abstract', 'Abstract Note', 'Summary'],
        'doi': ['DOI', 'Digital Object Identifier'],
        'url': ['URL', 'Link', 'Web Link'],
        'type': ['Type', 'Item Type', 'Publication Type'],
        'venue': ['Venue', 'Journal', 'Conference', 'Publication', 'Source'],
        'key': ['Key', 'ID', 'Reference ID'],
        'tags': ['Tags', 'Keywords', 'Subject'],
        'notes': ['Notes', 'Comments', 'Screening Notes'],
        'included': ['Included', 'Include', 'Selected', 'Final'],
        'quality': ['Quality', 'Quality Score', 'Rating']
      };
      
      const possibleFields = fieldMappings[fieldName.toLowerCase()] || [fieldName];
      
      for (const possibleField of possibleFields) {
        const index = headers.findIndex(h => 
          h && (
            h.toLowerCase() === possibleField.toLowerCase() ||
            h.toLowerCase().includes(possibleField.toLowerCase())
          )
        );
        
        if (index >= 0 && row[index] && String(row[index]).trim()) {
          return String(row[index]).trim();
        }
      }
      
      return '';
    };
    
    const title = getField('title');
    if (!title) return null; // Skip rows without title
    
    // Parse publication year
    const yearStr = getField('year');
    const publicationYear = parseYear(yearStr);
    
    // Parse authors
    const authorsStr = getField('author');
    const authors = parseAuthors(authorsStr);
    
    // Parse tags/keywords
    const tagsStr = getField('tags');
    const tags = parseTags(tagsStr);
    
    // Generate key if not present
    const key = getField('key') || generateKey(title, authors[0]);
    
    const paper: PaperRecord = {
      key,
      itemType: getField('type') || 'article',
      publicationYear,
      authors,
      title,
      publicationTitle: getField('venue'),
      doi: getField('doi'),
      url: getField('url'),
      abstract: getField('abstract'),
      tags,
      venue: getField('venue')
    };
    
    return paper;
    
  } catch (error) {
    console.warn('⚠️ Error parsing Excel row:', error);
    return null;
  }
}

/**
 * Parse publication year from various formats
 */
function parseYear(yearStr: string): number | null {
  if (!yearStr) return null;
  
  // Handle Excel date formats and plain years
  const yearMatch = String(yearStr).match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    if (year >= 1990 && year <= 2025) {
      return year;
    }
  }
  
  return null;
}

/**
 * Parse authors string into array
 */
function parseAuthors(authorsStr: string): string[] {
  if (!authorsStr) return [];
  
  return String(authorsStr)
    .split(/[;,&]|and\s+|\n/)
    .map(author => author.trim())
    .filter(author => author.length > 0)
    .map(author => cleanAuthorName(author));
}

/**
 * Clean author name
 */
function cleanAuthorName(name: string): string {
  return name
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .replace(/\s*(Jr\.|Sr\.|III|IV)\.?$/i, '')
    .trim();
}

/**
 * Parse tags/keywords
 */
function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  
  return String(tagsStr)
    .split(/[;,\n]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Generate unique key for paper
 */
function generateKey(title: string, firstAuthor: string): string {
  const titleWords = title.toLowerCase().split(/\s+/).slice(0, 3);
  const authorLastName = firstAuthor ? firstAuthor.split(' ').pop() || '' : '';
  return `${authorLastName.toLowerCase()}_${titleWords.join('_')}`.replace(/[^a-z0-9_]/g, '');
}