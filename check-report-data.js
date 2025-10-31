/**
 * Diagnostic script to check what data is in the generated reports
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking report data...\n');

// Find the most recent comprehensive report
const reportsDirs = [
  path.join(__dirname, 'reports', 'quick-scan', 'chromium'),
  path.join(__dirname, 'reports', 'quick-scan', 'firefox'),
  path.join(__dirname, 'reports', 'quick-scan', 'webkit'),
  path.join(__dirname, 'reports')
];

let files = [];
let reportsDir = '';

// Check each directory
for (const dir of reportsDirs) {
  if (fs.existsSync(dir)) {
    const dirFiles = fs.readdirSync(dir);
    if (dirFiles.length > 0) {
      files = dirFiles;
      reportsDir = dir;
      break;
    }
  }
}

try {
  const htmlReports = files.filter(f => f.includes('comprehensive') && f.endsWith('.html'));
  
  if (htmlReports.length === 0) {
    console.log('❌ No comprehensive reports found in ./reports/');
    console.log('   Please run a test first: npm run quick-scan');
    process.exit(1);
  }
  
  // Get most recent report
  const latestReport = htmlReports
    .map(f => ({
      name: f,
      path: path.join(reportsDir, f),
      mtime: fs.statSync(path.join(reportsDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)[0];
  
  console.log(`📄 Reading: ${latestReport.name}`);
  console.log(`📅 Modified: ${latestReport.mtime}\n`);
  
  const htmlContent = fs.readFileSync(latestReport.path, 'utf8');
  
  // Extract issue details from HTML
  const targetMatches = htmlContent.match(/🎯 CSS Selector \(Target\)<\/h4>[\s\S]*?<code>(.*?)<\/code>/g);
  const elementMatches = htmlContent.match(/📝 Element HTML<\/h4>[\s\S]*?<code>(.*?)<\/code>/g);
  
  if (targetMatches && elementMatches) {
    console.log('✅ Found issue data in report:\n');
    
    for (let i = 0; i < Math.min(5, targetMatches.length); i++) {
      const target = targetMatches[i].match(/<code>(.*?)<\/code>/)[1];
      const element = elementMatches[i].match(/<code>(.*?)<\/code>/)[1];
      
      // Decode HTML entities
      const decodeHtml = (html) => html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      
      console.log(`Issue ${i + 1}:`);
      console.log(`  Target:  ${decodeHtml(target)}`);
      console.log(`  Element: ${decodeHtml(element)}`);
      console.log('');
    }
    
    // Check for patterns
    const notAvailableCount = (htmlContent.match(/Not available/g) || []).length;
    if (notAvailableCount > 0) {
      console.log(`⚠️  Found ${notAvailableCount} instances of "Not available"`);
    }
    
    // Check if elements look like selectors
    const selectorPattern = /:\w+-of-type\(\d+\)/;
    let selectorCount = 0;
    for (const match of elementMatches) {
      const element = match.match(/<code>(.*?)<\/code>/)[1];
      if (selectorPattern.test(element)) {
        selectorCount++;
      }
    }
    
    if (selectorCount > 0) {
      console.log(`⚠️  Found ${selectorCount} elements that look like selectors (not HTML)`);
    }
    
  } else {
    console.log('⚠️  Could not extract issue data from report');
    console.log('    Report structure might be different than expected');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📁 Current directory:', __dirname);
  console.log('📁 Reports directory:', path.join(__dirname, 'reports'));
}

