import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { TestResult } from './reportGenerator';
import { AccessibilityScorer } from './accessibilityScorer';

/**
 * Comprehensive WCAG Report Generator
 * Shows status of ALL WCAG 2.1 criteria from your list
 */

interface WCAGCriterionStatus {
  id: string;
  principle: string;
  guideline: string;
  level: string;
  title: string;
  status: 'Pass' | 'Fail' | 'Warning' | 'Manual Required' | 'Not Tested' | 'Not Applicable';
  issuesCount: number;
  testType: string;
  notes: string;
  detailPage?: string;
}

export class ComprehensiveReportGenerator {
  private testResults: TestResult[] = [];
  private outputDir: string;
  private scorer: AccessibilityScorer;
  private testedUrl: string = '';

  // Complete WCAG 2.1 criteria from your list
  private allWCAGCriteria = [
    // 1. Perceivable
    { id: '1.1.1', principle: 'Perceivable', guideline: 'Text alternatives', level: 'A', title: 'Non-text content' },
    { id: '1.2.1', principle: 'Perceivable', guideline: 'Time-based Media', level: 'A', title: 'Audio-only and video-only (Prerecorded)' },
    { id: '1.2.2', principle: 'Perceivable', guideline: 'Time-based Media', level: 'A', title: 'Captions (Prerecorded)' },
    { id: '1.2.3', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AA', title: 'Audio description or media alternative (Prerecorded)' },
    { id: '1.2.4', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AA', title: 'Captions (Live)' },
    { id: '1.2.5', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AAA', title: 'Audio description (Prerecorded)' },
    { id: '1.2.6', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AAA', title: 'Sign language (Prerecorded)' },
    { id: '1.2.7', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AAA', title: 'Extended audio description (Prerecorded)' },
    { id: '1.2.8', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AAA', title: 'Media alternative (Prerecorded)' },
    { id: '1.2.9', principle: 'Perceivable', guideline: 'Time-based Media', level: 'AAA', title: 'Audio-only (Live)' },
    { id: '1.3.1', principle: 'Perceivable', guideline: 'Adaptable', level: 'A', title: 'Info and relationships' },
    { id: '1.3.2', principle: 'Perceivable', guideline: 'Adaptable', level: 'A', title: 'Meaningful sequence' },
    { id: '1.3.3', principle: 'Perceivable', guideline: 'Adaptable', level: 'A', title: 'Sensory characteristics' },
    { id: '1.3.4', principle: 'Perceivable', guideline: 'Adaptable', level: 'AA', title: 'Orientation' },
    { id: '1.3.5', principle: 'Perceivable', guideline: 'Adaptable', level: 'AA', title: 'Identify input purpose' },
    { id: '1.3.6', principle: 'Perceivable', guideline: 'Adaptable', level: 'AAA', title: 'Identify purpose' },
    { id: '1.4.1', principle: 'Perceivable', guideline: 'Distinguishable', level: 'A', title: 'Use of colour' },
    { id: '1.4.2', principle: 'Perceivable', guideline: 'Distinguishable', level: 'A', title: 'Audio control' },
    { id: '1.4.3', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Contrast (Minimum)' },
    { id: '1.4.4', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Resize text' },
    { id: '1.4.5', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Images of text' },
    { id: '1.4.6', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AAA', title: 'Contrast (Enhanced)' },
    { id: '1.4.7', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AAA', title: 'Low or no background audio' },
    { id: '1.4.8', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AAA', title: 'Visual presentation' },
    { id: '1.4.9', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AAA', title: 'Images of text (No exception)' },
    { id: '1.4.10', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Reflow' },
    { id: '1.4.11', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Non-text contrast' },
    { id: '1.4.12', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Text spacing' },
    { id: '1.4.13', principle: 'Perceivable', guideline: 'Distinguishable', level: 'AA', title: 'Content on hover or focus' },

    // 2. Operable
    { id: '2.1.1', principle: 'Operable', guideline: 'Keyboard accessible', level: 'A', title: 'Keyboard' },
    { id: '2.1.2', principle: 'Operable', guideline: 'Keyboard accessible', level: 'A', title: 'No keyboard trap' },
    { id: '2.1.3', principle: 'Operable', guideline: 'Keyboard accessible', level: 'AAA', title: 'Keyboard (No exception)' },
    { id: '2.1.4', principle: 'Operable', guideline: 'Keyboard accessible', level: 'A', title: 'Character key shortcuts' },
    { id: '2.2.1', principle: 'Operable', guideline: 'Enough time', level: 'A', title: 'Timing adjustable' },
    { id: '2.2.2', principle: 'Operable', guideline: 'Enough time', level: 'A', title: 'Pause, stop, hide' },
    { id: '2.2.3', principle: 'Operable', guideline: 'Enough time', level: 'AAA', title: 'No timing' },
    { id: '2.2.4', principle: 'Operable', guideline: 'Enough time', level: 'AAA', title: 'Interruptions' },
    { id: '2.2.5', principle: 'Operable', guideline: 'Enough time', level: 'AAA', title: 'Re-authenticating' },
    { id: '2.2.6', principle: 'Operable', guideline: 'Enough time', level: 'AAA', title: 'Timeouts' },
    { id: '2.3.1', principle: 'Operable', guideline: 'Seizures and physical reactions', level: 'A', title: 'Three flashes or below threshold' },
    { id: '2.3.2', principle: 'Operable', guideline: 'Seizures and physical reactions', level: 'AA', title: 'Three flashes' },
    { id: '2.3.3', principle: 'Operable', guideline: 'Seizures and physical reactions', level: 'AAA', title: 'Animation from interactions' },
    { id: '2.4.1', principle: 'Operable', guideline: 'Navigable', level: 'A', title: 'Bypass blocks' },
    { id: '2.4.2', principle: 'Operable', guideline: 'Navigable', level: 'A', title: 'Page titled' },
    { id: '2.4.3', principle: 'Operable', guideline: 'Navigable', level: 'A', title: 'Focus order' },
    { id: '2.4.4', principle: 'Operable', guideline: 'Navigable', level: 'A', title: 'Link purpose (In context)' },
    { id: '2.4.5', principle: 'Operable', guideline: 'Navigable', level: 'AA', title: 'Multiple ways' },
    { id: '2.4.6', principle: 'Operable', guideline: 'Navigable', level: 'AA', title: 'Headings and labels' },
    { id: '2.4.7', principle: 'Operable', guideline: 'Navigable', level: 'AA', title: 'Focus visible' },
    { id: '2.4.8', principle: 'Operable', guideline: 'Navigable', level: 'AAA', title: 'Location' },
    { id: '2.4.9', principle: 'Operable', guideline: 'Navigable', level: 'AAA', title: 'Link purpose (Link only)' },
    { id: '2.4.10', principle: 'Operable', guideline: 'Navigable', level: 'AAA', title: 'Section headings' },
    { id: '2.5.1', principle: 'Operable', guideline: 'Input modalities', level: 'A', title: 'Pointer gestures' },
    { id: '2.5.2', principle: 'Operable', guideline: 'Input modalities', level: 'A', title: 'Pointer cancellation' },
    { id: '2.5.3', principle: 'Operable', guideline: 'Input modalities', level: 'A', title: 'Label in name' },
    { id: '2.5.4', principle: 'Operable', guideline: 'Input modalities', level: 'A', title: 'Motion actuation' },
    { id: '2.5.5', principle: 'Operable', guideline: 'Input modalities', level: 'AAA', title: 'Target size' },
    { id: '2.5.6', principle: 'Operable', guideline: 'Input modalities', level: 'AAA', title: 'Concurrent input mechanisms' },

    // 3. Understandable
    { id: '3.1.1', principle: 'Understandable', guideline: 'Readable', level: 'A', title: 'Language of page' },
    { id: '3.1.2', principle: 'Understandable', guideline: 'Readable', level: 'AA', title: 'Language of parts' },
    { id: '3.1.3', principle: 'Understandable', guideline: 'Readable', level: 'AAA', title: 'Unusual words' },
    { id: '3.1.4', principle: 'Understandable', guideline: 'Readable', level: 'AAA', title: 'Abbreviations' },
    { id: '3.1.5', principle: 'Understandable', guideline: 'Readable', level: 'AAA', title: 'Reading level' },
    { id: '3.1.6', principle: 'Understandable', guideline: 'Readable', level: 'AAA', title: 'Pronunciation' },
    { id: '3.2.1', principle: 'Understandable', guideline: 'Predictable', level: 'A', title: 'On focus' },
    { id: '3.2.2', principle: 'Understandable', guideline: 'Predictable', level: 'A', title: 'On input' },
    { id: '3.2.3', principle: 'Understandable', guideline: 'Predictable', level: 'AA', title: 'Consistent navigation' },
    { id: '3.2.4', principle: 'Understandable', guideline: 'Predictable', level: 'AA', title: 'Consistent identification' },
    { id: '3.2.5', principle: 'Understandable', guideline: 'Predictable', level: 'AAA', title: 'Change on request' },
    { id: '3.3.1', principle: 'Understandable', guideline: 'Input assistance', level: 'A', title: 'Error identification' },
    { id: '3.3.2', principle: 'Understandable', guideline: 'Input assistance', level: 'A', title: 'Labels or instructions' },
    { id: '3.3.3', principle: 'Understandable', guideline: 'Input assistance', level: 'AA', title: 'Error suggestion' },
    { id: '3.3.4', principle: 'Understandable', guideline: 'Input assistance', level: 'AA', title: 'Error prevention' },
    { id: '3.3.5', principle: 'Understandable', guideline: 'Input assistance', level: 'AAA', title: 'Help' },
    { id: '3.3.6', principle: 'Understandable', guideline: 'Input assistance', level: 'AAA', title: 'Error prevention (All)' },

    // 4. Robust
    { id: '4.1.1', principle: 'Robust', guideline: 'Compatible', level: 'A', title: 'Parsing' },
    { id: '4.1.2', principle: 'Robust', guideline: 'Compatible', level: 'A', title: 'Name, role, value' },
    { id: '4.1.3', principle: 'Robust', guideline: 'Compatible', level: 'AA', title: 'Status messages' }
  ];

  constructor(outputDir: string = './reports') {
    this.outputDir = outputDir;
    this.scorer = new AccessibilityScorer();
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  addResults(results: TestResult[]): void {
    this.testResults.push(...results);
  }

  setTestedUrl(url: string): void {
    this.testedUrl = url;
  }

  /**
   * Generate comprehensive Excel report with ALL WCAG criteria
   */
  generateComprehensiveReport(filename: string = 'wcag-comprehensive-report.xlsx'): string {
    const filePath = path.join(this.outputDir, filename);

    const criteriaStatus = this.buildCriteriaStatus();

    // Sheet 1: Executive Summary
    const summary = this.generateExecutiveSummary(criteriaStatus);
    const summarySheet = XLSX.utils.json_to_sheet([summary]);

    // Sheet 2: All WCAG 2.1 Criteria Status
    const statusData = criteriaStatus.map(c => ({
      'WCAG ID': c.id,
      'Principle': c.principle,
      'Guideline': c.guideline,
      'Level': c.level,
      'Success Criterion': c.title,
      'Status': c.status,
      'Issues': c.issuesCount,
      'Test Method': c.testType,
      'Notes': c.notes,
      'Detail Link': c.detailPage ? `=HYPERLINK("${c.detailPage.replace(/"/g, '""')}","View details")` : ''
    }));
    const statusSheet = XLSX.utils.json_to_sheet(statusData);

    // Sheet 3: Failed Criteria Details
    const failedCriteria = criteriaStatus.filter(c => c.status === 'Fail');
    const failedData = failedCriteria.map(c => ({
      'WCAG ID': c.id,
      'Title': c.title,
      'Level': c.level,
      'Issues Count': c.issuesCount,
      'Notes': c.notes
    }));
    const failedSheet = XLSX.utils.json_to_sheet(failedData.length > 0 ? failedData : [{ 'Message': 'No failures - Excellent!' }]);

    // Sheet 4: Manual Review Required
    const manualCriteria = criteriaStatus.filter(c => c.status === 'Manual Required');
    const manualData = manualCriteria.map(c => ({
      'WCAG ID': c.id,
      'Title': c.title,
      'Level': c.level,
      'Notes': c.notes
    }));
    const manualSheet = XLSX.utils.json_to_sheet(manualData.length > 0 ? manualData : [{ 'Message': 'No manual tests required' }]);

    // Sheet 5: Level A Compliance
    const levelA = criteriaStatus.filter(c => c.level === 'A');
    const levelASheet = XLSX.utils.json_to_sheet(levelA.map(c => ({
      'WCAG ID': c.id,
      'Title': c.title,
      'Status': c.status,
      'Notes': c.notes
    })));

    // Sheet 6: Level AA Compliance
    const levelAA = criteriaStatus.filter(c => c.level === 'AA');
    const levelAASheet = XLSX.utils.json_to_sheet(levelAA.map(c => ({
      'WCAG ID': c.id,
      'Title': c.title,
      'Status': c.status,
      'Notes': c.notes
    })));

    // Sheet 7: Level AAA Compliance
    const levelAAA = criteriaStatus.filter(c => c.level === 'AAA');
    const levelAAASheet = XLSX.utils.json_to_sheet(levelAAA.map(c => ({
      'WCAG ID': c.id,
      'Title': c.title,
      'Status': c.status,
      'Notes': c.notes
    })));

    // Sheet 8: Detailed Issues
    const issuesData: any[] = [];
    this.testResults.forEach(result => {
      result.issues.forEach(issue => {
        issuesData.push({
          'WCAG ID': result.criterionId,
          'Criterion': result.criterionTitle,
          'Severity': issue.severity,
          'Description': issue.description,
          'Element': issue.element || 'N/A',
          'How to Fix': issue.help || ''
        });
      });
    });
    const issuesSheet = XLSX.utils.json_to_sheet(issuesData.length > 0 ? issuesData : [{ 'Message': 'No issues found!' }]);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, '1-Executive Summary');
    XLSX.utils.book_append_sheet(workbook, statusSheet, '2-All WCAG Criteria');
    XLSX.utils.book_append_sheet(workbook, failedSheet, '3-Failed Criteria');
    XLSX.utils.book_append_sheet(workbook, manualSheet, '4-Manual Review');
    XLSX.utils.book_append_sheet(workbook, levelASheet, '5-Level A');
    XLSX.utils.book_append_sheet(workbook, levelAASheet, '6-Level AA');
    XLSX.utils.book_append_sheet(workbook, levelAAASheet, '7-Level AAA');
    XLSX.utils.book_append_sheet(workbook, issuesSheet, '8-Detailed Issues');

    XLSX.writeFile(workbook, filePath);
    return filePath;
  }

  /**
   * Generate standalone HTML report that can be opened in a browser
   */
  generateComprehensiveHtml(filename: string = 'wcag-comprehensive-report.html'): string {
    const filePath = path.join(this.outputDir, filename);
    const criteriaStatus = this.allWCAGCriteria.map(criterion => this.getCriterionStatus(criterion));

    const rows = criteriaStatus.map(c => {
      const detailLink = c.detailPage
        ? `<a href="${c.detailPage}" target="_blank">View details</a>`
        : '';
      return `
      <tr>
        <td>${c.id}</td>
        <td>${c.principle}</td>
        <td>${c.guideline}</td>
        <td>${c.level}</td>
        <td>${c.title}</td>
        <td class="status status-${c.status.replace(/\s+/g, '-').toLowerCase()}">${c.status}</td>
        <td>${c.issuesCount}</td>
        <td>${c.testType}</td>
        <td>${c.notes}</td>
        <td>${detailLink}</td>
      </tr>
    `;
    }).join('');

    // Calculate summary stats
    const passCount = criteriaStatus.filter(c => c.status === 'Pass').length;
    const failCount = criteriaStatus.filter(c => c.status === 'Fail').length;
    const warningCount = criteriaStatus.filter(c => c.status === 'Warning').length;
    const manualCount = criteriaStatus.filter(c => c.status === 'Manual Required').length;
    const notTestedCount = criteriaStatus.filter(c => c.status === 'Not Tested').length;
    const totalCount = criteriaStatus.length;

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WCAG 2.1 Comprehensive Report</title>
    <style>
      body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; background: #f9fafb; color: #1f2933; }
      h1 { margin-bottom: 0.5rem; }
      p.meta { margin-top: 0; color: #52606d; }
      
      /* Summary Cards */
      .summary-section { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
      .summary-card { 
        background: #fff; 
        border-radius: 8px; 
        padding: 20px; 
        flex: 1; 
        min-width: 150px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        border-left: 4px solid #cbd5e1;
      }
      .summary-card.pass { border-left-color: #0b8e00; }
      .summary-card.fail { border-left-color: #d91e18; }
      .summary-card.warning { border-left-color: #d97706; }
      .summary-card.manual { border-left-color: #2563eb; }
      .summary-card.not-tested { border-left-color: #64748b; }
      
      .summary-label { 
        font-size: 12px; 
        text-transform: uppercase; 
        letter-spacing: 0.05em; 
        color: #64748b;
        margin-bottom: 8px;
      }
      .summary-value { 
        font-size: 32px; 
        font-weight: 700; 
        color: #1f2933;
      }
      .summary-percentage {
        font-size: 14px;
        color: #64748b;
        margin-top: 4px;
      }
      
      table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08); }
      th, td { border: 1px solid #e4e7eb; padding: 10px 12px; text-align: left; font-size: 14px; }
      th { background: #f1f5f9; text-transform: uppercase; font-size: 12px; letter-spacing: 0.06em; color: #364152; }
      tbody tr:nth-child(even) { background: #f8fafc; }
      .status { font-weight: 600; }
      .status-pass { color: #0b8e00; }
      .status-fail { color: #d91e18; }
      .status-warning { color: #d97706; }
      .status-manual-required { color: #2563eb; }
      .grid { margin-top: 1.5rem; }
    </style>
  </head>
  <body>
    <h1>WCAG 2.1 Comprehensive Report</h1>
    <p class="meta">Generated: ${new Date().toLocaleString()}</p>
    
    <!-- Summary Section -->
    <div class="summary-section">
      <div class="summary-card pass">
        <div class="summary-label">✓ Passed</div>
        <div class="summary-value">${passCount}</div>
        <div class="summary-percentage">${((passCount/totalCount)*100).toFixed(1)}%</div>
      </div>
      <div class="summary-card fail">
        <div class="summary-label">✗ Failed</div>
        <div class="summary-value">${failCount}</div>
        <div class="summary-percentage">${((failCount/totalCount)*100).toFixed(1)}%</div>
      </div>
      <div class="summary-card warning">
        <div class="summary-label">⚠ Warnings</div>
        <div class="summary-value">${warningCount}</div>
        <div class="summary-percentage">${((warningCount/totalCount)*100).toFixed(1)}%</div>
      </div>
      <div class="summary-card manual">
        <div class="summary-label">👤 Manual Review</div>
        <div class="summary-value">${manualCount}</div>
        <div class="summary-percentage">${((manualCount/totalCount)*100).toFixed(1)}%</div>
      </div>
      <div class="summary-card not-tested">
        <div class="summary-label">— Not Tested</div>
        <div class="summary-value">${notTestedCount}</div>
        <div class="summary-percentage">${((notTestedCount/totalCount)*100).toFixed(1)}%</div>
      </div>
    </div>
    
    <div class="grid">
      <table>
        <thead>
          <tr>
            <th>WCAG ID</th>
            <th>Principle</th>
            <th>Guideline</th>
            <th>Level</th>
            <th>Success Criterion</th>
            <th>Status</th>
            <th>Issues</th>
            <th>Test Method</th>
            <th>Notes</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </body>
</html>`;

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(filePath, html, 'utf8');
    return filePath;
  }

  generateComprehensiveHtmlReport(filename: string = 'wcag-comprehensive-report.html'): string {
    const filePath = path.join(this.outputDir, filename);
    const criteriaStatus = this.buildCriteriaStatus();

    // Log debug info about test results
    const timestamp = new Date().toISOString();
    console.log(`\n📊 Generating comprehensive report at ${timestamp}`);
    console.log(`   Total test results: ${this.testResults.length}`);
    console.log(`   Total criteria: ${criteriaStatus.length}`);
    const levelBreakdown = {
      A: criteriaStatus.filter(c => c.level === 'A').length,
      AA: criteriaStatus.filter(c => c.level === 'AA').length,
      AAA: criteriaStatus.filter(c => c.level === 'AAA').length
    };
    console.log(`   Level breakdown: A=${levelBreakdown.A}, AA=${levelBreakdown.AA}, AAA=${levelBreakdown.AAA}`);

    // Calculate accessibility score
    const scoreData = this.scorer.calculateScore(this.testResults);
    console.log(`   Score data: ${scoreData.score}/100 (Grade: ${scoreData.grade})`);
    console.log(`   Level scores: A=${scoreData.levelScores.A.passed}/${scoreData.levelScores.A.total}, AA=${scoreData.levelScores.AA.passed}/${scoreData.levelScores.AA.total}, AAA=${scoreData.levelScores.AAA.passed}/${scoreData.levelScores.AAA.total}`);
    
    const scoreBadge = this.scorer.generateScoreBadge(scoreData);
    const recommendations = this.scorer.getRecommendations(scoreData);

    const summary = this.generateExecutiveSummary(criteriaStatus);

    const statusColours: Record<WCAGCriterionStatus['status'], string> = {
      'Pass': '#2e7d32',
      'Fail': '#c62828',
      'Warning': '#f9a825',
      'Manual Required': '#ef6c00',
      'Not Applicable': '#607d8b',
      'Not Tested': '#607d8b'
    } as any;

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WCAG 2.1 Comprehensive Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; background: #f5f5f5; }
      h1 { color: #26374a; }
      table { border-collapse: collapse; width: 100%; margin-top: 1.5rem; }
      th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: left; }
      th { background: #26374a; color: #fff; position: sticky; top: 0; }
      tr:nth-child(even) { background: #fafafa; }
      .status { font-weight: 600; color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; display: inline-block; }
      .pass { background: #2e7d32; }
      .fail { background: #c62828; }
      .warning { background: #f9a825; color: #212121; }
      .manual { background: #ef6c00; }
      .not-tested { background: #607d8b; }
      .summary-card { background: #fff; border-radius: 8px; padding: 1rem 1.5rem; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-top: 1rem; }
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem; }
      .summary-item { background: #e8eaf6; border-radius: 6px; padding: 0.75rem 1rem; }
      .summary-title { font-size: 0.85rem; color: #283593; text-transform: uppercase; letter-spacing: 0.08em; }
      .summary-value { font-size: 1.5rem; font-weight: 700; margin-top: 0.35rem; color: #26374a; }
      .level-section { margin-top: 2.5rem; }
    </style>
  </head>
  <body>
    <h1>WCAG 2.1 Comprehensive Accessibility Assessment</h1>
    
    ${scoreBadge}
    
    ${recommendations.length > 0 ? `
    <div class="summary-card" style="background: #fff3e0; border-left: 4px solid #ff6f00;">
      <h3 style="margin-top: 0; color: #e65100;">📋 Recommendations</h3>
      <ul style="margin: 0; padding-left: 1.5rem;">
        ${recommendations.map(rec => `<li style="margin: 0.5rem 0;">${this.escapeHtml(rec)}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="summary-card">
      <h3 style="margin-top: 0;">Executive Summary</h3>
      <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid #2196f3;">
        <p style="margin: 0; font-weight: 600; color: #1565c0;">
          📅 <strong>Report Generated:</strong> ${this.escapeHtml(new Date(summary['Generated At']).toLocaleString())}
        </p>
        ${this.testedUrl ? `<p style="margin: 8px 0 0 0; font-weight: 600; color: #1565c0;">
          🌐 <strong>Tested URL:</strong> <a href="${this.escapeHtml(this.testedUrl)}" target="_blank" style="color: #1976d2;">${this.escapeHtml(this.testedUrl)}</a>
        </p>` : ''}
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #1976d2;">
          💡 <strong>Note:</strong> If you see the same results for different URLs, please clear your browser cache or hard refresh (Ctrl+F5 / Cmd+Shift+R)
        </p>
      </div>
      <div class="summary-grid">
        <div class="summary-item"><div class="summary-title">Total Criteria</div><div class="summary-value">${summary['Total WCAG 2.1 Criteria']}</div></div>
        <div class="summary-item"><div class="summary-title">Passed</div><div class="summary-value">${summary['Passed']}</div></div>
        <div class="summary-item"><div class="summary-title">Failed</div><div class="summary-value">${summary['Failed']}</div></div>
        <div class="summary-item"><div class="summary-title">Manual Review</div><div class="summary-value">${summary['Manual Review Required']}</div></div>
      </div>
      <div class="summary-grid" style="margin-top:1.5rem;">
        <div class="summary-item"><div class="summary-title">Level A</div><div class="summary-value">${this.escapeHtml(summary['Level A Criteria'])}</div></div>
        <div class="summary-item"><div class="summary-title">Level AA</div><div class="summary-value">${this.escapeHtml(summary['Level AA Criteria'])}</div></div>
        <div class="summary-item"><div class="summary-title">Level AAA</div><div class="summary-value">${this.escapeHtml(summary['Level AAA Criteria'])}</div></div>
      </div>
    </div>

    <div class="level-section">
      <h2>All WCAG 2.1 Success Criteria</h2>
      <table>
        <thead>
          <tr>
            <th>WCAG ID</th>
            <th>Principle</th>
            <th>Guideline</th>
            <th>Level</th>
            <th>Success Criterion</th>
            <th>Status</th>
            <th>Issues</th>
            <th>Test Method</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${criteriaStatus.map(c => {
            const statusClass = c.status === 'Pass' ? 'pass' :
              c.status === 'Fail' ? 'fail' :
              c.status === 'Warning' ? 'warning' :
              c.status === 'Manual Required' ? 'manual' : 'not-tested';
            const statusText = this.escapeHtml(c.status);
            const colourStyle = statusColours[c.status] ? `style=\"background:${statusColours[c.status]};\"` : '';
            const notesHtml = c.detailPage && c.issuesCount > 0
              ? `${this.escapeHtml(c.notes)} - <a href="${c.detailPage}" target="_blank" style="color: #1976d2; text-decoration: underline;">View details</a>`
              : this.escapeHtml(c.notes);
            return `<tr>
              <td>${this.escapeHtml(c.id)}</td>
              <td>${this.escapeHtml(c.principle)}</td>
              <td>${this.escapeHtml(c.guideline)}</td>
              <td>${this.escapeHtml(c.level)}</td>
              <td>${this.escapeHtml(c.title)}</td>
              <td><span class="status ${statusClass}" ${colourStyle}>${statusText}</span></td>
              <td>${c.issuesCount}</td>
              <td>${this.escapeHtml(c.testType)}</td>
              <td>${notesHtml}</td>
            </tr>`;
          }).join('\n')}
        </tbody>
      </table>
    </div>
  </body>
</html>`;

    fs.writeFileSync(filePath, html, 'utf8');
    return filePath;
  }

  private buildCriteriaStatus(): WCAGCriterionStatus[] {
    return this.allWCAGCriteria.map(criterion => this.getCriterionStatus(criterion));
  }

  private getCriterionStatus(criterion: any): WCAGCriterionStatus {
    // Find test result for this criterion
    const testResult = this.testResults.find(r => r.criterionId === criterion.id);

    if (!testResult) {
      // No automated coverage – require manual verification
      const isAAA = criterion.level === 'AAA';
      return {
        id: criterion.id,
        principle: criterion.principle,
        guideline: criterion.guideline,
        level: criterion.level,
        title: criterion.title,
        status: 'Manual Required',
        issuesCount: 0,
        testType: isAAA ? 'Manual (Level AAA)' : 'Manual Assessment',
        notes: isAAA
          ? 'Level AAA criterion – validate manually if in scope'
          : 'Automation not available – evaluate this criterion manually'
      };
    }

    let status: WCAGCriterionStatus['status'];
    let notes = '';

    switch (testResult.status) {
      case 'pass':
        status = 'Pass';
        notes = `✓ All checks passed`;
        break;
      case 'fail':
        status = 'Fail';
        notes = `✗ ${testResult.issues.length} issue(s) found`;
        break;
      case 'warning':
        status = 'Warning';
        notes = `⚠ Potential issues detected - Manual review recommended`;
        break;
      case 'manual-required':
        status = 'Manual Required';
        notes = `⚑ Requires manual testing with NVDA or human judgment`;
        break;
      default:
        status = 'Manual Required';
        notes = 'Manual verification needed';
    }

    return {
      id: criterion.id,
      principle: criterion.principle,
      guideline: criterion.guideline,
      level: criterion.level,
      title: criterion.title,
      status,
      issuesCount: testResult.issues.length,
      testType: this.getTestTypeDescription(testResult.testType),
      notes,
      detailPage: testResult.detailPage
    };
  }

  private getTestTypeDescription(testType: string): string {
    switch (testType) {
      case 'automated':
        return 'Automated (axe-core)';
      case 'keyboard':
        return 'Keyboard Testing';
      case 'a11y-tree':
        return 'Accessibility Tree';
      case 'manual-flag':
        return 'Manual Test Required';
      default:
        return testType;
    }
  }

  private generateExecutiveSummary(criteriaStatus: WCAGCriterionStatus[]) {
    const total = criteriaStatus.length;
    const passed = criteriaStatus.filter(c => c.status === 'Pass').length;
    const failed = criteriaStatus.filter(c => c.status === 'Fail').length;
    const warnings = criteriaStatus.filter(c => c.status === 'Warning').length;
    const manualRequired = criteriaStatus.filter(c => c.status === 'Manual Required').length;
    const notTested = criteriaStatus.filter(c => c.status === 'Not Tested').length;

    // By level
    const levelA = criteriaStatus.filter(c => c.level === 'A');
    const levelAPass = levelA.filter(c => c.status === 'Pass').length;
    const levelATotal = levelA.length;

    const levelAA = criteriaStatus.filter(c => c.level === 'AA');
    const levelAAPass = levelAA.filter(c => c.status === 'Pass').length;
    const levelAATotal = levelAA.length;

    const levelAAA = criteriaStatus.filter(c => c.level === 'AAA');
    const levelAAAPass = levelAAA.filter(c => c.status === 'Pass').length;
    const levelAAATotal = levelAAA.length;

    return {
      'Report Title': 'WCAG 2.1 Comprehensive Accessibility Assessment',
      'Generated At': new Date().toISOString(),
      '': '',
      'Total WCAG 2.1 Criteria': total,
      'Passed': passed,
      'Failed': failed,
      'Warnings': warnings,
      'Manual Review Required': manualRequired,
      'Not Tested': notTested,
      ' ': '',
      'Overall Pass Rate': total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0%',
      '  ': '',
      'Level A Criteria': `${levelAPass}/${levelATotal} passed (${((levelAPass/levelATotal)*100).toFixed(1)}%)`,
      'Level AA Criteria': `${levelAAPass}/${levelAATotal} passed (${((levelAAPass/levelAATotal)*100).toFixed(1)}%)`,
      'Level AAA Criteria': `${levelAAAPass}/${levelAAATotal} passed (${((levelAAAPass/levelAAATotal)*100).toFixed(1)}%)`,
      '   ': '',
      'Recommendation': failed > 0 ? 'Fix failed criteria before deployment' : 'Site meets tested WCAG criteria'
    };
  }

  printConsoleSummary(): void {
    const criteriaStatus = this.buildCriteriaStatus();

    const passed = criteriaStatus.filter(c => c.status === 'Pass').length;
    const failed = criteriaStatus.filter(c => c.status === 'Fail').length;
    const warnings = criteriaStatus.filter(c => c.status === 'Warning').length;
    const manual = criteriaStatus.filter(c => c.status === 'Manual Required').length;

    console.log('\n' + '='.repeat(60));
    console.log('WCAG 2.1 COMPREHENSIVE ASSESSMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Criteria: ${this.allWCAGCriteria.length}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⚠ Warnings: ${warnings}`);
    console.log(`⚑ Manual Review: ${manual}`);
    console.log('='.repeat(60));

    if (failed > 0) {
      console.log('\n⚠️  FAILED CRITERIA:');
      criteriaStatus
        .filter(c => c.status === 'Fail')
        .forEach(c => {
          console.log(`   ✗ ${c.id} - ${c.title} (Level ${c.level})`);
        });
    }

    console.log('\n');
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

