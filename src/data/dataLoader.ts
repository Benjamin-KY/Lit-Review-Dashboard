import { PaperRecord, ProcessedData } from '../types';
import { parseCSV, transformDataForVisualization } from './csvParser';
import { parseExcelFile } from './excelParser';

/**
 * Generate comprehensive sample data for demonstration (fallback only)
 */
export function generateSampleData(): ProcessedData {
  const samplePapers: PaperRecord[] = [
    {
      key: 'moore2024security',
      itemType: 'article',
      publicationYear: 2024,
      authors: ['Tyler Moore', 'John Smith'],
      title: 'Economic Incentives in Cybersecurity: A Game-Theoretic Analysis',
      publicationTitle: 'Journal of Cybersecurity Economics',
      doi: '10.1000/sample.2024.001',
      url: 'https://example.com/paper1',
      abstract: 'This paper analyzes the economic incentives that drive cybersecurity decisions using game theory. We examine how rational actors make security investment decisions under uncertainty and propose mechanisms to align individual incentives with collective security goals.',
      tags: ['cybersecurity', 'economics', 'game theory'],
      venue: 'Journal of Cybersecurity Economics'
    },
    {
      key: 'anderson2023ai',
      itemType: 'inproceedings',
      publicationYear: 2023,
      authors: ['Ross Anderson', 'Alice Johnson'],
      title: 'AI Security Economics: Market Failures and Policy Interventions',
      publicationTitle: 'Proceedings of Security Economics Workshop',
      doi: '10.1000/sample.2023.002',
      url: 'https://example.com/paper2',
      abstract: 'We examine market failures in AI security and propose policy interventions to address coordination problems. The paper analyzes how information asymmetries and externalities lead to underinvestment in AI safety measures.',
      tags: ['AI security', 'market failure', 'policy'],
      venue: 'Security Economics Workshop'
    },
    {
      key: 'huang2022network',
      itemType: 'article',
      publicationYear: 2022,
      authors: ['Ken Huang', 'Maria Garcia'],
      title: 'Network Security Games with Incomplete Information',
      publicationTitle: 'IEEE Transactions on Information Forensics and Security',
      doi: '10.1000/sample.2022.003',
      url: 'https://example.com/paper3',
      abstract: 'This work studies network security games where players have incomplete information about threats and other players strategies. We develop equilibrium concepts for these games and analyze their implications for network defense.',
      tags: ['network security', 'incomplete information', 'game theory'],
      venue: 'IEEE Transactions on Information Forensics and Security'
    },
    {
      key: 'chen2021adversarial',
      itemType: 'article',
      publicationYear: 2021,
      authors: ['Wei Chen', 'Sarah Davis'],
      title: 'Adversarial Machine Learning: Economic Perspectives on Defense Strategies',
      publicationTitle: 'AI Security Review',
      doi: '10.1000/sample.2021.004',
      url: 'https://example.com/paper4',
      abstract: 'We analyze adversarial machine learning from an economic perspective, examining the costs and benefits of different defense strategies. The paper proposes a framework for optimal resource allocation in ML security.',
      tags: ['adversarial ML', 'defense strategies', 'economics'],
      venue: 'AI Security Review'
    },
    {
      key: 'wilson2020privacy',
      itemType: 'inproceedings',
      publicationYear: 2020,
      authors: ['Michael Wilson', 'Lisa Brown'],
      title: 'Privacy Economics in the Age of AI: A Game-Theoretic Analysis',
      publicationTitle: 'Conference on Privacy and Security',
      doi: '10.1000/sample.2020.005',
      url: 'https://example.com/paper5',
      abstract: 'This paper examines privacy economics in AI systems using game theory. We model the strategic interactions between data subjects, AI companies, and regulators in privacy protection scenarios.',
      tags: ['privacy', 'AI economics', 'regulation'],
      venue: 'Conference on Privacy and Security'
    },
    {
      key: 'taylor2019blockchain',
      itemType: 'article',
      publicationYear: 2019,
      authors: ['Robert Taylor', 'Emma White'],
      title: 'Blockchain Security Economics: Incentive Mechanisms and Attack Models',
      publicationTitle: 'Blockchain Economics Journal',
      doi: '10.1000/sample.2019.006',
      url: 'https://example.com/paper6',
      abstract: 'We study the economic incentives in blockchain systems and analyze various attack models. The paper examines how consensus mechanisms align individual incentives with network security goals.',
      tags: ['blockchain', 'incentive mechanisms', 'security'],
      venue: 'Blockchain Economics Journal'
    }
  ];
  
  return transformDataForVisualization(samplePapers);
}

/**
 * Load research literature dataset - both raw and screened datasets
 */
export async function loadActualResearchData(): Promise<{
  rawData: ProcessedData;
  screenedData: ProcessedData;
  combinedData: ProcessedData;
}> {
  try {
    console.log('🔄 Loading research literature dataset...');
    
    // PRIORITY 1: Load raw CSV data (we know this exists and has 600+ papers)
    let rawPapers: PaperRecord[] = [];
    try {
      console.log('📄 Loading raw CSV data...');
      const rawResponse = await fetch('/raw-data.csv');
      if (rawResponse.ok) {
        const rawCsvContent = await rawResponse.text();
        console.log(`📋 CSV file loaded, size: ${rawCsvContent.length} characters`);
        rawPapers = parseCSV(rawCsvContent);
        console.log(`📋 Successfully parsed ${rawPapers.length} papers from raw dataset`);
      } else {
        throw new Error(`Raw CSV not accessible: ${rawResponse.status}`);
      }
    } catch (csvError) {
      console.error('❌ Could not load CSV file:', csvError);
      throw csvError; // Don't continue if we can't load the main data
    }
    
    // SECONDARY: Try to load screened dataset
    let screenedPapers: PaperRecord[] = [];
    try {
      console.log('📊 Attempting to load systematically screened dataset...');
      const screenedResponse = await fetch('/screened-data.xlsx');
      if (screenedResponse.ok) {
        const screenedBuffer = await screenedResponse.arrayBuffer();
        screenedPapers = await parseExcelFile(screenedBuffer);
        console.log(`✅ Successfully loaded ${screenedPapers.length} papers from screened dataset`);
      } else {
        console.warn(`⚠️ Screened dataset not accessible: ${screenedResponse.status}`);
      }
    } catch (xlsxError) {
      console.warn('⚠️ Could not load screened dataset:', xlsxError);
    }
    
    // Ensure we have data
    if (rawPapers.length === 0) {
      throw new Error('No papers could be loaded from raw dataset');
    }
    
    // Process datasets
    const rawData = transformDataForVisualization(rawPapers);
    const screenedData = screenedPapers.length > 0 ? 
      transformDataForVisualization(screenedPapers) : 
      rawData; // Use raw data if no screened data
    
    // Use screened data if available, otherwise raw data
    const combinedData = screenedPapers.length > 0 ? screenedData : rawData;
    
    const datasetType = screenedPapers.length > 0 ? 
      'Systematically screened dataset' : 
      'Raw dataset';
    
    console.log('🎉 SUCCESS: Research data loaded and ready!');
    console.log(`📊 Primary Dataset: ${datasetType}`);
    console.log(`📈 Papers: ${combinedData.papers.length}`);
    console.log(`👥 Authors: ${combinedData.authorNetwork.length}`);
    console.log(`🔗 Topics: ${combinedData.topicClusters.length}`);
    console.log(`📅 Year Range: ${combinedData.yearRange[0]}-${combinedData.yearRange[1]}`);
    
    return {
      rawData,
      screenedData,
      combinedData
    };
    
  } catch (error) {
    console.error('❌ Error loading research data:', error);
    console.log('🔄 Falling back to sample data for demonstration');
    
    // Fallback to sample data if all else fails
    const sampleData = generateSampleData();
    return {
      rawData: sampleData,
      screenedData: sampleData,
      combinedData: sampleData
    };
  }
}

/**
 * Load and process CSV data from file
 */
export async function loadCSVData(file: File): Promise<ProcessedData> {
  try {
    const csvContent = await readFileAsText(file);
    const papers = parseCSV(csvContent);
    
    if (papers.length === 0) {
      throw new Error('No valid papers found in CSV file');
    }
    
    console.log(`Successfully parsed ${papers.length} papers from CSV`);
    
    return transformDataForVisualization(papers);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw new Error(`Failed to load CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load CSV data from URL (for demo purposes)
 */
export async function loadCSVFromURL(url: string): Promise<ProcessedData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvContent = await response.text();
    const papers = parseCSV(csvContent);
    
    if (papers.length === 0) {
      throw new Error('No valid papers found in CSV file');
    }
    
    console.log(`Successfully loaded ${papers.length} papers from URL`);
    
    return transformDataForVisualization(papers);
  } catch (error) {
    console.error('Error loading CSV from URL:', error);
    throw new Error(`Failed to load CSV from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read file as text content
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Validate CSV structure before processing
 */
export function validateCSVStructure(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!csvContent || csvContent.trim().length === 0) {
    errors.push('CSV file is empty');
    return { valid: false, errors };
  }
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { valid: false, errors };
  }
  
  const headers = lines[0].toLowerCase();
  const requiredFields = ['title'];
  const recommendedFields = ['author', 'year', 'abstract'];
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check for recommended fields
  for (const field of recommendedFields) {
    if (!headers.includes(field)) {
      console.warn(`Missing recommended field: ${field}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}



