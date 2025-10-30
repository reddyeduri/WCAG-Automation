import { test, expect } from '@playwright/test';
import { AxeHelper } from '../utils/axeHelper';
import { KeyboardHelper } from '../utils/keyboardHelper';
import { AccessibilityTreeHelper } from '../utils/accessibilityTreeHelper';
import { ReportGenerator } from '../utils/reportGenerator';

/**
 * Basic example: Testing a single page
 * 
 * This example shows how to:
 * 1. Run axe-core scans
 * 2. Test keyboard navigation
 * 3. Analyze accessibility tree
 * 4. Generate reports
 */

test.describe('Basic WCAG Testing Example', () => {
  const reportGen = new ReportGenerator('./reports/examples');

  test('Complete accessibility check for homepage', async ({ page }) => {
    // Navigate to your page
    await page.goto('https://www.w3.org/WAI/');

    console.log('\n🔍 Starting comprehensive accessibility check...\n');

    // 1. Run axe-core scan for all WCAG 2.1 AA criteria
    console.log('📊 Running axe-core scan...');
    const axeResults = await AxeHelper.runAxeScan(page, {
      wcagLevel: 'AA',
      tags: ['wcag21aa', 'wcag2aa']
    });
    reportGen.addResults(axeResults);
    console.log(`   Found ${axeResults.length} testable criteria\n`);

    // 2. Test specific critical criteria
    console.log('🎨 Testing color contrast (1.4.3)...');
    const contrastResult = await AxeHelper.testColorContrast(page);
    reportGen.addResult(contrastResult);
    console.log(`   Status: ${contrastResult.status}\n`);

    console.log('🖼️  Testing alt text (1.1.1)...');
    const altTextResult = await AxeHelper.testAltText(page);
    reportGen.addResult(altTextResult);
    console.log(`   Status: ${altTextResult.status}\n`);

    // 3. Test keyboard navigation
    console.log('⌨️  Testing keyboard accessibility (2.1.1)...');
    const keyboardResult = await KeyboardHelper.testKeyboardAccessibility(page);
    reportGen.addResult(keyboardResult);
    console.log(`   Status: ${keyboardResult.status}\n`);

    console.log('🔒 Testing for keyboard traps (2.1.2)...');
    const trapResult = await KeyboardHelper.testNoKeyboardTrap(page);
    reportGen.addResult(trapResult);
    console.log(`   Status: ${trapResult.status}\n`);

    console.log('👁️  Testing focus visibility (2.4.7)...');
    const focusResult = await KeyboardHelper.testFocusVisible(page);
    reportGen.addResult(focusResult);
    console.log(`   Status: ${focusResult.status}\n`);

    // 4. Analyze accessibility tree
    console.log('🌳 Analyzing accessibility tree...');
    const landmarksResult = await AccessibilityTreeHelper.testLandmarks(page);
    reportGen.addResult(landmarksResult);
    console.log(`   Landmarks: ${landmarksResult.status}\n`);

    const namesResult = await AccessibilityTreeHelper.testAccessibleNames(page);
    reportGen.addResult(namesResult);
    console.log(`   Accessible names: ${namesResult.status}\n`);

    // 5. Generate NVDA-like output
    console.log('🔊 Generating screen reader output...');
    const nvdaOutput = await AccessibilityTreeHelper.generateNVDAOutput(page);
    console.log(`   Generated ${nvdaOutput.length} lines of output\n`);

    // 6. Generate reports
    console.log('📄 Generating reports...');
    const excelPath = reportGen.generateExcelReport('basic-example-report.xlsx');
    const jsonPath = reportGen.generateJsonReport('basic-example-report.json');
    
    reportGen.printSummary();
    
    console.log(`\n✅ Reports generated:`);
    console.log(`   📊 Excel: ${excelPath}`);
    console.log(`   📋 JSON: ${jsonPath}\n`);

    // Assert that critical tests pass
    expect(altTextResult.status).toBe('pass');
    expect(trapResult.status).toBe('pass');
  });

  test('Quick keyboard navigation check', async ({ page }) => {
    await page.goto('https://www.w3.org/WAI/');

    // Perform tab navigation test
    const tabTest = await KeyboardHelper.performTabNavigationTest(page);
    
    console.log('\n⌨️  Tab Navigation Results:');
    console.log(`   Total focusable elements: ${tabTest.totalFocusable}`);
    console.log(`   Focus order (first 10):`);
    tabTest.focusOrder.slice(0, 10).forEach((el, i) => {
      console.log(`      ${i + 1}. ${el.substring(0, 60)}`);
    });

    expect(tabTest.totalFocusable).toBeGreaterThan(0);
  });

  test('Generate accessibility snapshot', async ({ page }) => {
    await page.goto('https://www.w3.org/WAI/');

    // Get the accessibility tree
    const snapshot = await AccessibilityTreeHelper.getAccessibilitySnapshot(page);
    
    expect(snapshot).not.toBeNull();
    
    console.log('\n🌳 Accessibility Tree Structure:');
    console.log(JSON.stringify(snapshot, null, 2).substring(0, 500));
    console.log('   ...(truncated)');
  });
});

