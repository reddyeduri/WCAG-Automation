import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TestResult, Issue } from './reportGenerator';

export interface AxeTestConfig {
  wcagLevel?: 'A' | 'AA' | 'AAA';
  tags?: string[];
  rules?: string[];
}

export class AxeHelper {
  /**
   * Run axe-core scan with WCAG tags
   */
  static async runAxeScan(
    page: Page,
    config: AxeTestConfig = {}
  ): Promise<TestResult[]> {
    const { wcagLevel = 'AA', tags = [], rules = [] } = config;

    // Build axe scan with WCAG tags
    let axeBuilder = new AxeBuilder({ page });
    
    // Add WCAG level tags
    const wcagTags = [`wcag2${wcagLevel.toLowerCase()}`, 'wcag21aa', 'wcag2aa'];
    axeBuilder = axeBuilder.withTags([...wcagTags, ...tags]);

    // Include specific rules if provided
    if (rules.length > 0) {
      axeBuilder = axeBuilder.withRules(rules);
    }

    // Run the scan
    const results = await axeBuilder.analyze();

    // Convert axe results to our TestResult format
    const testResults: TestResult[] = [];

    // Map violations to WCAG criteria
    const criteriaMap = this.mapViolationsToCriteria(results.violations);

    for (const [criterionId, violations] of Object.entries(criteriaMap)) {
      const issues: Issue[] = violations.flatMap(violation => 
        violation.nodes.map(node => ({
          description: violation.description,
          severity: this.mapSeverity(violation.impact),
          element: node.html,
          help: violation.help,
          helpUrl: violation.helpUrl,
          wcagTags: violation.tags
        }))
      );

      testResults.push({
        criterionId,
        criterionTitle: violations[0]?.help || 'Unknown',
        principle: this.getPrincipleFromCriterion(criterionId),
        level: this.getLevelFromTags(violations[0]?.tags || []),
        testType: 'automated',
        status: issues.length > 0 ? 'fail' : 'pass',
        issues,
        timestamp: new Date().toISOString(),
        url: page.url()
      });
    }

    return testResults;
  }

  /**
   * Run specific WCAG criterion tests
   */
  static async testAltText(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag111'])
      .withRules(['image-alt', 'input-image-alt', 'object-alt']);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '1.1.1',
      criterionTitle: 'Non-text Content',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test color contrast (1.4.3)
   */
  static async testColorContrast(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag143'])
      .withRules(['color-contrast']);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '1.4.3',
      criterionTitle: 'Contrast (Minimum)',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test ARIA roles, names, values (4.1.2)
   */
  static async testARIA(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag412'])
      .withRules([
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'aria-roles',
        'button-name',
        'link-name'
      ]);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '4.1.2',
      criterionTitle: 'Name, Role, Value',
      principle: 'Robust',
      level: 'A',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test form labels (3.3.2)
   */
  static async testFormLabels(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag332'])
      .withRules(['label', 'label-title-only']);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '3.3.2',
      criterionTitle: 'Labels or Instructions',
      principle: 'Understandable',
      level: 'A',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test page title (2.4.2)
   */
  static async testPageTitle(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag242'])
      .withRules(['document-title']);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '2.4.2',
      criterionTitle: 'Page Titled',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test heading hierarchy (1.3.1)
   */
  static async testHeadingHierarchy(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag131'])
      .withRules(['heading-order', 'empty-heading']);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '1.3.1',
      criterionTitle: 'Info and Relationships',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test skip links (2.4.1)
   */
  static async testSkipLinks(page: Page): Promise<TestResult> {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag241'])
      .withRules(['bypass', 'skip-link']);

    const results = await axeBuilder.analyze();
    
    return {
      criterionId: '2.4.1',
      criterionTitle: 'Bypass Blocks',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: results.violations.length > 0 ? 'fail' : 'pass',
      issues: results.violations.flatMap(v => 
        v.nodes.map(node => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test non-text contrast (1.4.11)
   */
  static async testNonTextContrast(page: Page): Promise<TestResult> {
    let analyzed: any = { violations: [] };
    try {
      analyzed = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();
    } catch {}

    const v1411 = (analyzed.violations || []).filter((v: any) => (v.tags || []).includes('wcag1411'));

    return {
      criterionId: '1.4.11',
      criterionTitle: 'Non-text Contrast',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: v1411.length ? 'fail' : 'warning',
      issues: v1411.flatMap((v: any) => 
        v.nodes.map((node: any) => ({
          description: v.description,
          severity: this.mapSeverity(v.impact),
          element: node.html,
          help: v.help,
          helpUrl: v.helpUrl,
          wcagTags: v.tags
        }))
      ),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  private static mapViolationsToCriteria(violations: any[]): Record<string, any[]> {
    const criteriaMap: Record<string, any[]> = {};

    violations.forEach(violation => {
      // Extract WCAG criterion from tags (e.g., wcag111 -> 1.1.1)
      const wcagTag = violation.tags.find((tag: string) => 
        tag.startsWith('wcag') && /\d/.test(tag)
      );

      let criterionId = 'unknown';
      if (wcagTag) {
        // Convert wcag111 to 1.1.1
        const numbers = wcagTag.replace('wcag', '').replace(/[a-z]/gi, '');
        if (numbers.length >= 3) {
          criterionId = `${numbers[0]}.${numbers[1]}.${numbers.substring(2)}`;
        }
      }

      if (!criteriaMap[criterionId]) {
        criteriaMap[criterionId] = [];
      }
      criteriaMap[criterionId].push(violation);
    });

    return criteriaMap;
  }

  private static mapSeverity(impact?: string): 'critical' | 'serious' | 'moderate' | 'minor' {
    switch (impact) {
      case 'critical':
        return 'critical';
      case 'serious':
        return 'serious';
      case 'moderate':
        return 'moderate';
      case 'minor':
        return 'minor';
      default:
        return 'moderate';
    }
  }

  private static getPrincipleFromCriterion(criterionId: string): string {
    const firstDigit = criterionId.charAt(0);
    switch (firstDigit) {
      case '1':
        return 'Perceivable';
      case '2':
        return 'Operable';
      case '3':
        return 'Understandable';
      case '4':
        return 'Robust';
      default:
        return 'Unknown';
    }
  }

  private static getLevelFromTags(tags: string[]): string {
    if (tags.some(t => t.includes('wcag2aaa'))) return 'AAA';
    if (tags.some(t => t.includes('wcag2aa'))) return 'AA';
    if (tags.some(t => t.includes('wcag2a'))) return 'A';
    return 'AA';
  }
}

