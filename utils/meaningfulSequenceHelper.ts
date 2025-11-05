import { Page } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';

/**
 * Meaningful Sequence Helper - WCAG 1.3.2 (Level A)
 *
 * AUTOMATION OPPORTUNITY: 75% accuracy
 * Enhanced detection for reading sequence issues
 *
 * Detects:
 * - CSS-based visual reordering that breaks logical reading order
 * - Flexbox/Grid order mismatches
 * - Float-based layouts with incorrect DOM order
 * - Tabindex misuse creating illogical focus order
 */

export class MeaningfulSequenceHelper {
  /**
   * Test Meaningful Sequence (Enhanced)
   * Check if content sequence is preserved when CSS is removed
   */
  static async testMeaningfulSequence(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const sequenceIssues = await page.evaluate(() => {
        const problems: Array<{
          description: string;
          severity: 'serious' | 'moderate';
          element?: string;
        }> = [];

        // Check 1: CSS order property usage (Flexbox/Grid reordering)
        const elementsWithOrder = Array.from(document.querySelectorAll('*')).filter(el => {
          const computedStyle = window.getComputedStyle(el);
          const order = computedStyle.order;
          return order && order !== '0' && order !== 'auto';
        });

        if (elementsWithOrder.length > 0) {
          // Check if the visual order differs from DOM order
          const orderValues = elementsWithOrder.map(el => {
            const order = window.getComputedStyle(el).order;
            const domIndex = Array.from(el.parentElement?.children || []).indexOf(el as Element);
            return { order: parseInt(order), domIndex, text: (el.textContent || '').trim().substring(0, 50) };
          });

          const hasReordering = orderValues.some((item, index) => {
            return orderValues[index + 1] && item.order > orderValues[index + 1].order;
          });

          if (hasReordering) {
            problems.push({
              description: `Found ${elementsWithOrder.length} elements using CSS order property for visual reordering - verify reading order makes sense without CSS`,
              severity: 'moderate',
              element: (elementsWithOrder[0] as HTMLElement).outerHTML.substring(0, 150)
            });
          }
        }

        // Check 2: Tabindex values greater than 0 (manual focus order manipulation)
        const positiveTabindex = Array.from(document.querySelectorAll('[tabindex]')).filter(el => {
          const tabindex = parseInt(el.getAttribute('tabindex') || '0');
          return tabindex > 0;
        });

        if (positiveTabindex.length > 0) {
          problems.push({
            description: `Found ${positiveTabindex.length} element(s) with positive tabindex values - creates unpredictable focus order that may not match reading order`,
            severity: 'serious',
            element: (positiveTabindex[0] as HTMLElement).outerHTML.substring(0, 150)
          });
        }

        // Check 3: Floated elements that might break reading order
        const floatedElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const computedStyle = window.getComputedStyle(el);
          return computedStyle.float !== 'none' && (el.textContent || '').trim().length > 50;
        });

        if (floatedElements.length > 5) {
          problems.push({
            description: `Found ${floatedElements.length} floated elements with significant content - verify reading order is logical in DOM`,
            severity: 'moderate'
          });
        }

        // Check 4: Absolutely positioned elements that might be out of logical order
        const absoluteElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const computedStyle = window.getComputedStyle(el);
          const hasContent = (el.textContent || '').trim().length > 20;
          return computedStyle.position === 'absolute' && hasContent;
        });

        if (absoluteElements.length > 3) {
          // Check if these elements are in a different visual position than DOM position
          const visualPositions = absoluteElements.map(el => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            const domIndex = Array.from(document.body.querySelectorAll('*')).indexOf(el as Element);
            return { top: rect.top, left: rect.left, domIndex };
          });

          // Sort by visual position (top to bottom, left to right)
          const sortedVisually = [...visualPositions].sort((a, b) => {
            if (Math.abs(a.top - b.top) > 10) return a.top - b.top;
            return a.left - b.left;
          });

          // Check if visual order matches DOM order
          const orderMismatch = sortedVisually.some((item, index) => {
            const nextItem = sortedVisually[index + 1];
            return nextItem && item.domIndex > nextItem.domIndex;
          });

          if (orderMismatch) {
            problems.push({
              description: `Found ${absoluteElements.length} absolutely positioned elements with content - visual order may not match DOM reading order`,
              severity: 'moderate'
            });
          }
        }

        // Check 5: Column layouts that might cause reading order issues
        const multiColumnElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const computedStyle = window.getComputedStyle(el);
          const columnCount = computedStyle.columnCount;
          return columnCount && columnCount !== '1' && columnCount !== 'auto';
        });

        if (multiColumnElements.length > 0) {
          multiColumnElements.forEach(el => {
            const hasInteractiveContent = el.querySelectorAll('a, button, input, select, textarea').length > 0;
            if (hasInteractiveContent) {
              problems.push({
                description: 'Multi-column layout contains interactive elements - verify keyboard navigation follows expected reading order',
                severity: 'moderate',
                element: (el as HTMLElement).outerHTML.substring(0, 150)
              });
            }
          });
        }

        // Check 6: Right-to-left (RTL) content mixed with LTR
        const rtlElements = Array.from(document.querySelectorAll('[dir="rtl"]'));
        const ltrElements = Array.from(document.querySelectorAll('[dir="ltr"]'));

        if (rtlElements.length > 0 && ltrElements.length > 0) {
          problems.push({
            description: 'Page contains mixed RTL and LTR content - verify reading order is logical for all text directions',
            severity: 'moderate'
          });
        }

        return problems;
      });

      sequenceIssues.forEach(problem => {
        issues.push({
          description: problem.description,
          severity: problem.severity,
          element: problem.element,
          help: 'WCAG 1.3.2: When the sequence in which content is presented affects its meaning, the correct reading sequence must be programmatically determinable. ' +
                'Ensure the DOM order matches the intended reading order. Avoid using CSS to create a visual order that differs from the DOM order, ' +
                'and never use positive tabindex values (use tabindex="0" or "-1" only).',
          wcagTags: ['wcag2a', 'wcag132']
        });
      });

    } catch (error) {
      issues.push({
        description: `Meaningful sequence test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze reading sequence. Manual review required.',
        wcagTags: ['wcag2a', 'wcag132']
      });
    }

    return {
      criterionId: '1.3.2',
      criterionTitle: 'Meaningful Sequence',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url
    };
  }
}
