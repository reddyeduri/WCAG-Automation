import { test, expect } from '@playwright/test';
import { ExcelParser } from '../utils/excelParser';
import { AxeHelper } from '../utils/axeHelper';
import { KeyboardHelper } from '../utils/keyboardHelper';
import { AccessibilityTreeHelper } from '../utils/accessibilityTreeHelper';
import { ReportGenerator } from '../utils/reportGenerator';
import { defaultConfig } from '../config/wcagConfig';
import * as fs from 'fs';

/**
 * Excel-driven WCAG tests
 * This test suite reads criteria from an Excel file and runs corresponding tests
 */

const reportGen = new ReportGenerator(defaultConfig.outputDir);

test.describe('Excel-Driven WCAG 2.1 Tests', () => {
  let assessment: ReturnType<typeof ExcelParser.parseAssessment>;

  test.beforeAll(() => {
    // Check if Excel assessment file exists
    const excelPath = defaultConfig.excelAssessmentPath || './wcag-assessment.xlsx';
    
    if (!fs.existsSync(excelPath)) {
      console.log(`\n⚠ Excel assessment file not found at: ${excelPath}`);
      console.log(`Creating sample template...`);
      ExcelParser.createTemplate(excelPath);
      console.log(`✓ Template created. Please fill it with your WCAG criteria.\n`);
    }

    // Parse the assessment
    assessment = ExcelParser.parseAssessment(excelPath);
    console.log(`\n📋 Loaded ${assessment.criteria.length} WCAG criteria from Excel`);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(assessment.url || defaultConfig.baseUrl);
  });

  test.afterAll(async () => {
    const excelPath = reportGen.generateExcelReport('excel-driven-report.xlsx');
    const jsonPath = reportGen.generateJsonReport('excel-driven-report.json');
    reportGen.printSummary();
    
    console.log(`\n📊 Excel-Driven Reports generated:`);
    console.log(`   Excel: ${excelPath}`);
    console.log(`   JSON: ${jsonPath}`);
  });

  // Dynamically generate tests based on Excel criteria
  test('Run all testable criteria from Excel', async ({ page }) => {
    const testableByPrinciple: Record<string, number> = {
      'Perceivable': 0,
      'Operable': 0,
      'Understandable': 0,
      'Robust': 0
    };

    for (const criterion of assessment.criteria) {
      if (!criterion.testable) {
        console.log(`⏭ Skipping ${criterion.id} - marked as not testable`);
        continue;
      }

      console.log(`\n🧪 Testing [${criterion.id}] ${criterion.title}`);
      
      try {
        const result = await testCriterion(page, criterion.id);
        if (result) {
          reportGen.addResult(result);
          testableByPrinciple[criterion.principle]++;
          
          if (result.status === 'fail') {
            console.log(`  ✗ FAILED: ${result.issues.length} issues found`);
          } else {
            console.log(`  ✓ PASSED`);
          }
        } else {
          console.log(`  ⚠ No automated test available for ${criterion.id}`);
        }
      } catch (error) {
        console.error(`  ✗ Error testing ${criterion.id}:`, error);
      }
    }

    console.log('\n📊 Tests completed by principle:');
    Object.entries(testableByPrinciple).forEach(([principle, count]) => {
      console.log(`  ${principle}: ${count} criteria tested`);
    });
  });

  test('Test manual criteria and generate flags', async ({ page }) => {
    const manualCriteria = assessment.criteria.filter(c => c.requiresManual);
    
    console.log(`\n⚑ ${manualCriteria.length} criteria require manual verification:`);
    
    for (const criterion of manualCriteria) {
      console.log(`  [${criterion.id}] ${criterion.title} - ${criterion.description}`);
      
      // Add to report as manual-required
      reportGen.addResult({
        criterionId: criterion.id,
        criterionTitle: criterion.title,
        principle: criterion.principle,
        level: criterion.level,
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [{
          description: `Manual verification required: ${criterion.description}`,
          severity: 'moderate',
          help: 'Test with NVDA or manual review',
          wcagTags: [`wcag2${criterion.level.toLowerCase()}`, `wcag${criterion.id.replace(/\./g, '')}`]
        }],
        timestamp: new Date().toISOString(),
        url: page.url()
      });
    }
  });
});

/**
 * Route criterion ID to appropriate test function
 */
async function testCriterion(page: any, criterionId: string) {
  switch (criterionId) {
    // Perceivable
    case '1.1.1':
      return await AxeHelper.testAltText(page);
    case '1.3.1':
      return await AxeHelper.testHeadingHierarchy(page);
    case '1.4.3':
      return await AxeHelper.testColorContrast(page);
    
    // Operable
    case '2.1.1':
      return await KeyboardHelper.testKeyboardAccessibility(page);
    case '2.1.2':
      return await KeyboardHelper.testNoKeyboardTrap(page);
    case '2.4.1':
      return await AxeHelper.testSkipLinks(page);
    case '2.4.2':
      return await AxeHelper.testPageTitle(page);
    case '2.4.7':
      return await KeyboardHelper.testFocusVisible(page);
    
    // Understandable
    case '3.3.2':
      return await AxeHelper.testFormLabels(page);
    
    // Robust
    case '4.1.2':
      return await AxeHelper.testARIA(page);
    case '4.1.3':
      return await AccessibilityTreeHelper.testStatusMessages(page);
    
    default:
      // Try generic axe scan for unmapped criteria
      const results = await AxeHelper.runAxeScan(page, {
        tags: [`wcag${criterionId.replace(/\./g, '')}`]
      });
      return results.find(r => r.criterionId === criterionId) || null;
  }
}

