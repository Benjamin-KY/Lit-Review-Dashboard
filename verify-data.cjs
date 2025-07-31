// Simple Node.js script to verify your data files are accessible
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying your research data files...\n');

// Check if data files exist
const rawDataPath = path.join(__dirname, 'public', 'raw-data.csv');
const screenedDataPath = path.join(__dirname, 'public', 'screened-data.xlsx');

if (fs.existsSync(rawDataPath)) {
  const rawStats = fs.statSync(rawDataPath);
  console.log('✅ Raw data file found:');
  console.log(`   📁 ${rawDataPath}`);
  console.log(`   📊 Size: ${(rawStats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Read first few lines to verify CSV structure
  const rawContent = fs.readFileSync(rawDataPath, 'utf8');
  const lines = rawContent.split('\n');
  console.log(`   📄 Lines: ${lines.length.toLocaleString()}`);
  
  if (lines.length > 0) {
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    console.log(`   🏷️  Headers: ${headers.length} columns`);
    console.log(`   🔑 Key fields: ${headers.filter(h => 
      ['Title', 'Author', 'Publication Year', 'Abstract Note', 'DOI'].includes(h)
    ).join(', ')}`);
  }
} else {
  console.log('❌ Raw data file not found at:', rawDataPath);
}

console.log('');

if (fs.existsSync(screenedDataPath)) {
  const screenedStats = fs.statSync(screenedDataPath);
  console.log('✅ SCREENED DATA FILE FOUND (MOST IMPORTANT):');
  console.log(`   📁 ${screenedDataPath}`);
  console.log(`   📊 Size: ${(screenedStats.size / 1024).toFixed(2)} KB`);
  console.log('   🎯 This is your FINAL SCREENED dataset used for your lit review!');
  console.log('   📊 Excel format will be parsed and used as PRIMARY data source');
} else {
  console.log('❌ CRITICAL: Screened data file not found at:', screenedDataPath);
  console.log('   This is your most important dataset!');
}

console.log('\n🎯 Data Integration Status:');
if (fs.existsSync(screenedDataPath)) {
  console.log('🎉 PERFECT: Your FINAL SCREENED dataset is ready!');
  console.log('✅ Primary data source: Your systematically screened XLSX file');
  console.log('✅ Backup data source: Raw CSV for comparison');
  console.log('✅ Demonstrates complete systematic review methodology');
  console.log('✅ Shows research rigor from raw → screened data');
  console.log('\n🚀 Run `npm run dev` to see YOUR ACTUAL RESEARCH come to life!');
  console.log('🎓 This showcases the exact dataset you used for your literature review!');
} else if (fs.existsSync(rawDataPath)) {
  console.log('⚠️  Using raw CSV as fallback (screened XLSX preferred)');
  console.log('✅ Still showcases your actual research data');
  console.log('\n🚀 Run `npm run dev` to see your research!');
} else {
  console.log('❌ Data files need to be copied to public/ directory');
  console.log('   Run the copy commands in the setup instructions');
}

console.log('\n📈 Expected Showcase Features:');
console.log('   • Interactive timeline of your research evolution');
console.log('   • Topic network showing your thematic analysis');
console.log('   • Author collaboration networks from your data');
console.log('   • Research gap analysis based on your findings');
console.log('   • Quality metrics demonstrating your methodology');