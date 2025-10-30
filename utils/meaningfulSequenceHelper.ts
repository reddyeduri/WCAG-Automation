import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for testing WCAG 1.3.2 - Meaningful Sequence
 * Detects potential reading order issues caused by CSS reordering, tabindex, etc.
 */
export class MeaningfulSequenceHelper {
  /**
   * Test for meaningful sequence (1.3.2)
   * Heuristic detection of potential reading order issues
   */
  static async testMeaningfulSequence(page: Page): Promise<TestResult> {
    if (page.isClosed()) {
      console.log('⚠️  testMeaningfulSequence: page is already closed, skipping');
      return {
        criterionId: '1.3.2',
        criterionTitle: 'Meaningful Sequence',
        principle: 'Perceivable',
        level: 'A',
        testType: 'automated',
        status: 'warning',
        issues: [{ description: 'Test skipped - page was closed', severity: 'moderate', wcagTags: ['wcag2a', 'wcag132'] }],
        timestamp: new Date().toISOString(),
        url: ''
      };
    }

    const issues: Issue[] = [];

    try {
      // Detect CSS reordering and layout issues
      const cssIssues = await page.evaluate(() => {
        const problems: Array<{ type: string; element: string; details: string }> = [];

        // @ts-ignore - runs in browser context
        const allElements = Array.from(document.querySelectorAll('*'));

        for (const el of allElements.slice(0, 500)) { // Limit for performance
          try {
            // @ts-ignore
            const computed = window.getComputedStyle(el);
            const tagName = el.tagName.toLowerCase();
            const elementSnippet = (el as HTMLElement).outerHTML.slice(0, 150);

            // 1. Check for flexbox order property
            if (computed.order && computed.order !== '0') {
              problems.push({
                type: 'CSS Flexbox Order',
                element: elementSnippet,
                details: `Element uses CSS order: ${computed.order} which may change visual sequence from DOM order`
              });
            }

            // 2. Check for grid positioning that changes order
            if (computed.display === 'grid' || computed.display === 'inline-grid') {
              const gridRow = computed.gridRow;
              const gridColumn = computed.gridColumn;
              if ((gridRow && gridRow !== 'auto') || (gridColumn && gridColumn !== 'auto')) {
                problems.push({
                  type: 'CSS Grid Positioning',
                  element: elementSnippet,
                  details: `Element uses grid positioning (row: ${gridRow}, col: ${gridColumn}) which may affect reading order`
                });
              }
            }

            // 3. Check for absolute/fixed positioning that might break flow
            if (computed.position === 'absolute' || computed.position === 'fixed') {
              const hasContent = (el.textContent || '').trim().length > 0;
              if (hasContent && tagName !== 'script' && tagName !== 'style') {
                problems.push({
                  type: 'Absolute/Fixed Positioning',
                  element: elementSnippet,
                  details: `Element with ${computed.position} positioning may disrupt natural reading order`
                });
              }
            }

            // 4. Check for negative margins that reorder visually
            const marginTop = parseFloat(computed.marginTop);
            const marginLeft = parseFloat(computed.marginLeft);
            if (marginTop < -50 || marginLeft < -50) {
              problems.push({
                type: 'Negative Margins',
                element: elementSnippet,
                details: `Large negative margin (top: ${marginTop}px, left: ${marginLeft}px) may affect visual order`
              });
            }

            // 5. Check for float that affects order
            if (computed.float !== 'none' && (el.textContent || '').trim().length > 20) {
              problems.push({
                type: 'Float Layout',
                element: elementSnippet,
                details: `Element uses float: ${computed.float} which may affect reading sequence`
              });
            }

            // 6. Check for RTL override issues
            if (computed.direction === 'rtl' && computed.unicodeBidi === 'bidi-override') {
              problems.push({
                type: 'RTL Bidi Override',
                element: elementSnippet,
                details: 'Element uses bidi-override which reverses character sequence'
              });
            }
          } catch (e) {
            // Skip elements that can't be analyzed
          }
        }

        return problems.slice(0, 50); // Limit results
      }, { timeout: 15000 });

      // Add CSS reordering issues
      if (cssIssues.length > 0) {
        cssIssues.forEach(issue => {
          issues.push({
            description: `${issue.type}: ${issue.details}`,
            severity: 'moderate',
            element: issue.element,
            help: 'Ensure that CSS positioning/reordering does not disrupt meaningful reading sequence',
            wcagTags: ['wcag2a', 'wcag132']
          });
        });
      }

      // Detect tabindex issues
      const tabindexIssues = await page.evaluate(() => {
        const problems: Array<{ element: string; tabindex: string; details: string }> = [];
        
        // @ts-ignore
        const elementsWithTabindex = Array.from(document.querySelectorAll('[tabindex]'));
        const tabindexValues: number[] = [];

        elementsWithTabindex.forEach(el => {
          const tabindex = el.getAttribute('tabindex');
          if (tabindex) {
            const value = parseInt(tabindex, 10);
            
            // Flag positive tabindex values (override natural order)
            if (value > 0) {
              problems.push({
                element: (el as HTMLElement).outerHTML.slice(0, 150),
                tabindex: tabindex,
                details: `Positive tabindex (${value}) overrides natural tab order`
              });
              tabindexValues.push(value);
            }
          }
        });

        // Check if tabindex values are sequential
        if (tabindexValues.length > 1) {
          const sorted = [...tabindexValues].sort((a, b) => a - b);
          const isSequential = tabindexValues.every((val, idx) => val === sorted[idx]);
          
          if (!isSequential) {
            problems.push({
              element: 'Multiple elements',
              tabindex: tabindexValues.join(', '),
              details: `Non-sequential tabindex values detected: ${tabindexValues.join(', ')} - should be in order`
            });
          }
        }

        return problems;
      }, { timeout: 10000 });

      // Add tabindex issues
      if (tabindexIssues.length > 0) {
        tabindexIssues.forEach(issue => {
          issues.push({
            description: `Tabindex issue: ${issue.details}`,
            severity: 'serious',
            element: issue.element,
            help: 'Avoid positive tabindex values; use natural DOM order or tabindex="0"',
            wcagTags: ['wcag2a', 'wcag132', 'wcag241']
          });
        });
      }

      // Detect visual vs DOM order mismatches (simplified check)
      const visualOrderIssues = await page.evaluate(() => {
        const problems: string[] = [];
        
        // Check if main content comes before navigation in DOM but appears after visually
        // @ts-ignore
        const mainElement = document.querySelector('main, [role="main"], #main, .main-content');
        // @ts-ignore
        const navElement = document.querySelector('nav, [role="navigation"]');
        
        if (mainElement && navElement) {
          // @ts-ignore
          const mainRect = mainElement.getBoundingClientRect();
          // @ts-ignore
          const navRect = navElement.getBoundingClientRect();
          
          // Check if nav comes after main in DOM but before visually
          // @ts-ignore
          const mainBeforeNav = mainElement.compareDocumentPosition(navElement) & Node.DOCUMENT_POSITION_FOLLOWING;
          const visuallyNavBeforeMain = navRect.top < mainRect.top || navRect.left < mainRect.left;
          
          if (mainBeforeNav && visuallyNavBeforeMain) {
            problems.push('Main content appears before navigation in DOM but after visually - verify reading order is meaningful');
          }
        }

        return problems;
      }, { timeout: 10000 });

      // Add visual order issues
      visualOrderIssues.forEach(issue => {
        issues.push({
          description: issue,
          severity: 'moderate',
          help: 'Ensure DOM order matches meaningful reading sequence',
          wcagTags: ['wcag2a', 'wcag132']
        });
      });

    } catch (error) {
      console.log('⚠️  testMeaningfulSequence: error during analysis');
      return {
        criterionId: '1.3.2',
        criterionTitle: 'Meaningful Sequence',
        principle: 'Perceivable',
        level: 'A',
        testType: 'automated',
        status: 'warning',
        issues: [{
          description: 'Test encountered an error - manual review required',
          severity: 'moderate',
          wcagTags: ['wcag2a', 'wcag132']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? '' : page.url()
      };
    }

    // Determine status
    const hasSeriousIssues = issues.some(i => i.severity === 'serious');
    const status = issues.length === 0 ? 'pass' : (hasSeriousIssues ? 'fail' : 'warning');

    return {
      criterionId: '1.3.2',
      criterionTitle: 'Meaningful Sequence',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status,
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Generate manual test guidance for 1.3.2
   */
  static getManualTestGuidance(): string {
    return `
Manual Testing Required for WCAG 1.3.2 - Meaningful Sequence:

1. Read through the page using a screen reader (NVDA/JAWS)
   - Does the reading order make sense?
   - Is important information presented in logical order?

2. Navigate with Tab key only
   - Does focus move in a logical order?
   - Can you complete tasks in sequence?

3. Linearize the page (disable CSS)
   - Does content still make sense when presented linearly?
   - Are related items grouped together?

4. Check multi-column layouts
   - Do columns read in the correct order?
   - Is vertical reading order preserved where needed?

5. Test with different viewports
   - Does responsive layout maintain meaningful sequence?
   - Are items reordered appropriately for mobile?

Common Issues to Watch For:
- Navigation appearing after main content in DOM but before it visually
- Side-by-side content that should be read in specific order
- Forms where label/input order is confusing
- Tables that need specific reading order
- Multi-step processes that skip around
`;
  }
}

