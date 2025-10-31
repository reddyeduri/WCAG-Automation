import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  criterionId: string;
  criterionTitle: string;
  principle: string;
  level: string;
  testType: 'automated' | 'keyboard' | 'a11y-tree' | 'manual-flag';
  status: 'pass' | 'fail' | 'warning' | 'manual-required';
  issues: Issue[];
  timestamp: string;
  url?: string;
  /** Optional path (relative to the report directory) to a detailed issue page */
  detailPage?: string;
  /** Optional array of screenshot filenames, one per issue with highlighted elements */
  issueScreenshots?: string[];
}

export interface Issue {
  description: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  element?: string;
  target?: string[]; // CSS selector array from axe-core for unique element identification
  help?: string;
  helpUrl?: string;
  wcagTags?: string[];
  /** Optional link to a detail section */
  detailLink?: string;
}

export class ReportGenerator {
  private results: TestResult[] = [];
  private outputDir: string;
  private scorer: any; // Will be imported later

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    // Import scorer dynamically to avoid circular dependencies
    const { AccessibilityScorer } = require('./accessibilityScorer');
    this.scorer = new AccessibilityScorer();
  }

  addResult(result: TestResult): void {
    this.results.push(result);
  }

  addResults(results: TestResult[]): void {
    this.results.push(...results);
  }

  /**
   * Generate Excel report with WCAG results
   */
  generateExcelReport(filename: string = 'wcag-assessment-report.xlsx'): string {
    const filePath = path.join(this.outputDir, filename);
    
    // Summary sheet
    const summary = this.generateSummary();
    const summarySheet = XLSX.utils.json_to_sheet([summary]);

    // Detailed results sheet
    const detailedData = this.results.map(result => ({
      'Criterion ID': result.criterionId,
      'Title': result.criterionTitle,
      'Principle': result.principle,
      'Level': result.level,
      'Test Type': result.testType,
      'Status': result.status,
      'Issues Count': result.issues.length,
      'Timestamp': result.timestamp,
      'URL': result.url || 'N/A'
    }));
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);

    // Issues sheet
    const issuesData: any[] = [];
    this.results.forEach(result => {
      result.issues.forEach(issue => {
        issuesData.push({
          'Criterion ID': result.criterionId,
          'Severity': issue.severity,
          'Description': issue.description,
          'Element': issue.element || 'N/A',
          'Help': issue.help || '',
          'WCAG Tags': issue.wcagTags?.join(', ') || ''
        });
      });
    });
    const issuesSheet = XLSX.utils.json_to_sheet(issuesData.length > 0 ? issuesData : [{}]);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Test Results');
    XLSX.utils.book_append_sheet(workbook, issuesSheet, 'Issues');

    XLSX.writeFile(workbook, filePath);
    return filePath;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(filename: string = 'wcag-assessment-report.json'): string {
    const filePath = path.join(this.outputDir, filename);
    
    const report = {
      summary: this.generateSummary(),
      results: this.results,
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const manualRequired = this.results.filter(r => r.status === 'manual-required').length;

    const byPrinciple = this.groupByPrinciple();
    const totalIssues = this.results.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = this.results.reduce(
      (sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 
      0
    );

    return {
      'Total Tests': total,
      'Passed': passed,
      'Failed': failed,
      'Warnings': warnings,
      'Manual Review Required': manualRequired,
      'Pass Rate': total > 0 ? `${((passed / total) * 100).toFixed(2)}%` : '0%',
      'Total Issues': totalIssues,
      'Critical Issues': criticalIssues,
      'Perceivable': byPrinciple['Perceivable'] || 0,
      'Operable': byPrinciple['Operable'] || 0,
      'Understandable': byPrinciple['Understandable'] || 0,
      'Robust': byPrinciple['Robust'] || 0,
      'Generated At': new Date().toISOString()
    };
  }

  private groupByPrinciple(): Record<string, number> {
    const grouped: Record<string, number> = {};
    this.results.forEach(result => {
      const principle = result.principle;
      grouped[principle] = (grouped[principle] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Generate console summary
   */
  printSummary(): void {
    const summary = this.generateSummary();
    console.log('\n========== WCAG 2.1 Assessment Summary ==========');
    console.log(`Total Tests: ${summary['Total Tests']}`);
    console.log(`✓ Passed: ${summary['Passed']}`);
    console.log(`✗ Failed: ${summary['Failed']}`);
    console.log(`⚠ Warnings: ${summary['Warnings']}`);
    console.log(`⚑ Manual Review Required: ${summary['Manual Review Required']}`);
    console.log(`Pass Rate: ${summary['Pass Rate']}`);
    console.log(`\nTotal Issues: ${summary['Total Issues']}`);
    console.log(`Critical Issues: ${summary['Critical Issues']}`);
    console.log('\nBy Principle:');
    console.log(`  Perceivable: ${summary['Perceivable']}`);
    console.log(`  Operable: ${summary['Operable']}`);
    console.log(`  Understandable: ${summary['Understandable']}`);
    console.log(`  Robust: ${summary['Robust']}`);
    console.log('================================================\n');
  }

  clear(): void {
    this.results = [];
  }
}

