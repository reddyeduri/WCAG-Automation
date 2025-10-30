import * as XLSX from 'xlsx';
import * as fs from 'fs';

export interface WCAGCriterion {
  id: string; // e.g., "1.1.1"
  principle: string; // Perceivable, Operable, Understandable, Robust
  guideline: string;
  level: string; // A, AA, AAA
  title: string;
  description: string;
  testable: boolean; // Can be automated or semi-automated
  requiresManual: boolean; // Requires manual verification
}

export interface ExcelAssessment {
  url: string;
  criteria: WCAGCriterion[];
}

export class ExcelParser {
  /**
   * Parse Excel file containing WCAG assessment criteria
   * Expected columns: ID, Principle, Guideline, Level, Title, Description, Testable, RequiresManual
   */
  static parseAssessment(filePath: string): ExcelAssessment {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const criteria: WCAGCriterion[] = [];

    for (const row of data as any[]) {
      criteria.push({
        id: row['ID'] || row['Criterion ID'] || '',
        principle: row['Principle'] || '',
        guideline: row['Guideline'] || '',
        level: row['Level'] || 'AA',
        title: row['Title'] || '',
        description: row['Description'] || '',
        testable: this.parseBoolean(row['Testable']),
        requiresManual: this.parseBoolean(row['RequiresManual'] || row['Manual'])
      });
    }

    return {
      url: (data[0] as any)?.['URL'] || '',
      criteria
    };
  }

  /**
   * Create a sample Excel template for WCAG assessment
   */
  static createTemplate(outputPath: string): void {
    const sampleData = [
      {
        'ID': '1.1.1',
        'Principle': 'Perceivable',
        'Guideline': 'Text Alternatives',
        'Level': 'A',
        'Title': 'Non-text Content',
        'Description': 'All non-text content must have text alternatives',
        'Testable': 'Yes',
        'RequiresManual': 'No'
      },
      {
        'ID': '1.4.3',
        'Principle': 'Perceivable',
        'Guideline': 'Distinguishable',
        'Level': 'AA',
        'Title': 'Contrast (Minimum)',
        'Description': 'Text and background must have 4.5:1 contrast ratio',
        'Testable': 'Yes',
        'RequiresManual': 'No'
      },
      {
        'ID': '2.1.1',
        'Principle': 'Operable',
        'Guideline': 'Keyboard Accessible',
        'Level': 'A',
        'Title': 'Keyboard',
        'Description': 'All functionality available via keyboard',
        'Testable': 'Yes',
        'RequiresManual': 'Partial'
      },
      {
        'ID': '2.1.2',
        'Principle': 'Operable',
        'Guideline': 'Keyboard Accessible',
        'Level': 'A',
        'Title': 'No Keyboard Trap',
        'Description': 'Keyboard focus can be moved away from any component',
        'Testable': 'Yes',
        'RequiresManual': 'No'
      },
      {
        'ID': '2.4.7',
        'Principle': 'Operable',
        'Guideline': 'Navigable',
        'Level': 'AA',
        'Title': 'Focus Visible',
        'Description': 'Keyboard focus indicator must be visible',
        'Testable': 'Yes',
        'RequiresManual': 'No'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WCAG Assessment');
    XLSX.writeFile(workbook, outputPath);
  }

  private static parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['yes', 'true', '1', 'partial'].includes(value.toLowerCase());
    }
    return false;
  }
}

