/**
 * Verify Framework Setup
 * Checks that all dependencies and files are properly installed
 * 
 * Usage: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying WCAG Framework Setup...\n');

const checks = [];
let passed = 0;
let failed = 0;

// Helper function
function check(name, condition, errorMsg = '') {
  checks.push({ name, condition, errorMsg });
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (errorMsg) console.log(`   ${errorMsg}`);
    failed++;
  }
}

// Check Node.js version
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
check(
  'Node.js version (16+)',
  nodeMajor >= 16,
  `Current: ${nodeVersion}, Required: 16+`
);

// Check package.json
check(
  'package.json exists',
  fs.existsSync('./package.json')
);

// Check node_modules
check(
  'Dependencies installed',
  fs.existsSync('./node_modules'),
  'Run: npm install'
);

// Check critical dependencies
if (fs.existsSync('./node_modules')) {
  check(
    'Playwright installed',
    fs.existsSync('./node_modules/@playwright'),
    'Run: npm install'
  );
  
  check(
    'axe-core installed',
    fs.existsSync('./node_modules/@axe-core'),
    'Run: npm install'
  );
  
  check(
    'xlsx installed',
    fs.existsSync('./node_modules/xlsx'),
    'Run: npm install'
  );
}

// Check Playwright browsers
const playwrightCache = process.env.PLAYWRIGHT_BROWSERS_PATH || 
  path.join(require('os').homedir(), '.cache', 'ms-playwright');
check(
  'Playwright browsers installed',
  fs.existsSync(playwrightCache) || fs.existsSync('./node_modules/@playwright/test/.local-browsers'),
  'Run: npm run install:browsers'
);

// Check configuration files
check('playwright.config.ts exists', fs.existsSync('./playwright.config.ts'));
check('tsconfig.json exists', fs.existsSync('./tsconfig.json'));
check('config/wcagConfig.ts exists', fs.existsSync('./config/wcagConfig.ts'));

// Check utility files
const utils = [
  'axeHelper.ts',
  'keyboardHelper.ts',
  'accessibilityTreeHelper.ts',
  'reportGenerator.ts',
  'excelParser.ts',
  'manualTestFlags.ts'
];

utils.forEach(util => {
  check(
    `utils/${util} exists`,
    fs.existsSync(`./utils/${util}`)
  );
});

// Check test files
check('tests/wcag.spec.ts exists', fs.existsSync('./tests/wcag.spec.ts'));
check('tests/wcag-excel-driven.spec.ts exists', fs.existsSync('./tests/wcag-excel-driven.spec.ts'));

// Check documentation
const docs = [
  'README.md',
  'QUICK_START.md',
  'SETUP.md',
  'TESTING_GUIDE.md',
  'PROJECT_OVERVIEW.md',
  'START_HERE.md'
];

docs.forEach(doc => {
  check(`${doc} exists`, fs.existsSync(`./${doc}`));
});

// Check scripts
check('scripts/generate-template.js exists', fs.existsSync('./scripts/generate-template.js'));
check('scripts/quick-scan.js exists', fs.existsSync('./scripts/quick-scan.js'));

// Check examples
check('examples/basic-example.spec.ts exists', fs.existsSync('./examples/basic-example.spec.ts'));
check('examples/custom-test-example.ts exists', fs.existsSync('./examples/custom-test-example.ts'));

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 Setup verification complete! All checks passed.\n');
  console.log('Next steps:');
  console.log('  1. Read START_HERE.md for guidance');
  console.log('  2. Run: npm run test:example');
  console.log('  3. Check reports in reports/ directory\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.\n');
  console.log('Common fixes:');
  console.log('  - npm install');
  console.log('  - npm run install:browsers');
  console.log('  - Check file permissions\n');
  process.exit(1);
}

