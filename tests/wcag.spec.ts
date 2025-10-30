import { test, expect } from '@playwright/test';
import { AxeHelper } from '../utils/axeHelper';
import { KeyboardHelper } from '../utils/keyboardHelper';
import { AccessibilityTreeHelper } from '../utils/accessibilityTreeHelper';
import { ManualTestFlags } from '../utils/manualTestFlags';
import { ReportGenerator } from '../utils/reportGenerator';
import { defaultConfig } from '../config/wcagConfig';

// Initialize report generator
const reportGen = new ReportGenerator(defaultConfig.outputDir);

test.describe('WCAG 2.1 Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page under test
    await page.goto(defaultConfig.baseUrl);
  });

  test.afterAll(async () => {
    // Generate reports after all tests
    const excelPath = reportGen.generateExcelReport();
    const jsonPath = reportGen.generateJsonReport();
    reportGen.printSummary();
    
    console.log(`\n📊 Reports generated:`);
    console.log(`   Excel: ${excelPath}`);
    console.log(`   JSON: ${jsonPath}`);
  });

  test.describe('Perceivable - axe-core Automated Tests', () => {
    test('[1.1.1] Non-text Content - Alt Text', async ({ page }) => {
      const result = await AxeHelper.testAltText(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} alt text issues:`, result.issues);
      }
    });

    test('[1.4.3] Contrast (Minimum)', async ({ page }) => {
      const result = await AxeHelper.testColorContrast(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} contrast issues:`, result.issues);
      }
    });

    test('[1.3.1] Info and Relationships - Heading Hierarchy', async ({ page }) => {
      const result = await AxeHelper.testHeadingHierarchy(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} heading issues:`, result.issues);
      }
    });

    test('[1.3.1] Info and Relationships - Landmarks (A11y Tree)', async ({ page }) => {
      const result = await AccessibilityTreeHelper.testLandmarks(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} landmark issues:`, result.issues);
      }
    });

    test('[1.3.1] Heading Structure (A11y Tree)', async ({ page }) => {
      const result = await AccessibilityTreeHelper.testHeadingStructure(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} heading structure issues:`, result.issues);
      }
    });
  });

  test.describe('Operable - Keyboard Navigation Tests', () => {
    test('[2.1.1] Keyboard - All Elements Reachable', async ({ page }) => {
      const result = await KeyboardHelper.testKeyboardAccessibility(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} keyboard accessibility issues:`, result.issues);
      }
    });

    test('[2.1.2] No Keyboard Trap', async ({ page }) => {
      const result = await KeyboardHelper.testNoKeyboardTrap(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} keyboard trap issues:`, result.issues);
      }
    });

    test('[2.4.7] Focus Visible', async ({ page }) => {
      const result = await KeyboardHelper.testFocusVisible(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} focus visibility issues:`, result.issues);
      }
    });

    test('[2.4.1] Bypass Blocks - Skip Links', async ({ page }) => {
      const result = await AxeHelper.testSkipLinks(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} skip link issues:`, result.issues);
      }
    });

    test('[2.4.2] Page Titled', async ({ page }) => {
      const result = await AxeHelper.testPageTitle(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} page title issues:`, result.issues);
      }
    });

    test('[2.4.3] Focus Order - Tab Navigation', async ({ page }) => {
      const tabResult = await KeyboardHelper.performTabNavigationTest(page);
      
      reportGen.addResult({
        criterionId: '2.4.3',
        criterionTitle: 'Focus Order',
        principle: 'Operable',
        level: 'A',
        testType: 'keyboard',
        status: tabResult.issues.length > 0 ? 'fail' : 'pass',
        issues: tabResult.issues,
        timestamp: new Date().toISOString(),
        url: page.url()
      });
      
      console.log(`Tab navigation: ${tabResult.totalFocusable} focusable elements found`);
      expect(tabResult.totalFocusable).toBeGreaterThan(0);
    });
  });

  test.describe('Understandable - Form and Content Tests', () => {
    test('[3.3.2] Labels or Instructions - Form Labels', async ({ page }) => {
      const result = await AxeHelper.testFormLabels(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} form label issues:`, result.issues);
      }
    });

    test('[3.3.2] Form Control Labels (A11y Tree)', async ({ page }) => {
      const result = await AccessibilityTreeHelper.testFormControlLabels(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} form control issues:`, result.issues);
      }
    });
  });

  test.describe('Robust - ARIA and Compatibility Tests', () => {
    test('[4.1.2] Name, Role, Value - ARIA', async ({ page }) => {
      const result = await AxeHelper.testARIA(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} ARIA issues:`, result.issues);
      }
    });

    test('[4.1.2] Accessible Names (A11y Tree)', async ({ page }) => {
      const result = await AccessibilityTreeHelper.testAccessibleNames(page);
      reportGen.addResult(result);
      
      expect(result.status).toBe('pass');
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} accessible name issues:`, result.issues);
      }
    });

    test('[4.1.3] Status Messages', async ({ page }) => {
      const result = await AccessibilityTreeHelper.testStatusMessages(page);
      reportGen.addResult(result);
      
      // Status messages test is informational, so we don't fail on warnings
      if (result.issues.length > 0) {
        console.log(`Status message analysis:`, result.issues);
      }
    });
  });

  test.describe('Comprehensive axe-core Scan', () => {
    test('Full WCAG 2.1 AA Scan', async ({ page }) => {
      const results = await AxeHelper.runAxeScan(page, {
        wcagLevel: 'AA',
        tags: ['wcag21aa', 'wcag2aa']
      });
      
      reportGen.addResults(results);
      
      const failedResults = results.filter(r => r.status === 'fail');
      console.log(`\nFull scan completed: ${results.length} criteria tested`);
      console.log(`Failed: ${failedResults.length}`);
      
      if (failedResults.length > 0) {
        console.log('\nFailed criteria:');
        failedResults.forEach(r => {
          console.log(`  [${r.criterionId}] ${r.criterionTitle}: ${r.issues.length} issues`);
        });
      }
    });
  });

  test.describe('NVDA Approximation - Accessibility Tree', () => {
    test('Generate NVDA-like Output', async ({ page }) => {
      const nvdaOutput = await AccessibilityTreeHelper.generateNVDAOutput(page);
      
      console.log('\n========== NVDA Approximation ==========');
      console.log(nvdaOutput.slice(0, 50).join('\n')); // Show first 50 lines
      console.log('========================================\n');
      
      expect(nvdaOutput.length).toBeGreaterThan(0);
    });
  });

  test.describe('Manual Testing Flags', () => {
    test('Generate Manual Test Flags', async ({ page }) => {
      if (defaultConfig.includeManualFlags) {
        const manualFlags = ManualTestFlags.generateManualFlags(page.url());
        reportGen.addResults(manualFlags);
        
        console.log(`\n⚑ ${manualFlags.length} criteria require manual testing:`);
        manualFlags.forEach(flag => {
          console.log(`  [${flag.criterionId}] ${flag.criterionTitle}`);
        });
      }
    });
  });
});

