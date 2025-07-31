// Quick test to verify XLSX file can be read
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing research dataset accessibility...\n');

const xlsxPath = path.join(__dirname, 'public', 'screened-data.xlsx');

if (fs.existsSync(xlsxPath)) {
  const stats = fs.statSync(xlsxPath);
  console.log('✅ Research dataset found and accessible');
  console.log(`📁 Path: ${xlsxPath}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📅 Modified: ${stats.mtime.toLocaleDateString()}`);
  
  // Try to read the file as binary
  try {
    const buffer = fs.readFileSync(xlsxPath);
    console.log(`✅ File readable: ${buffer.length} bytes`);
    console.log('🎯 Research dataset is ready for the web application!');
  } catch (error) {
    console.log('❌ Error reading dataset file:', error.message);
  }
} else {
  console.log('❌ Research dataset not found at:', xlsxPath);
  console.log('   Make sure the dataset file is in the public directory');
}

console.log('\n🚀 Ready to test in browser:');
console.log('   1. Run: npm run dev');
console.log('   2. Check browser console for dataset loading messages');
console.log('   3. Look for: "SUCCESS: Research data loaded and ready!"');