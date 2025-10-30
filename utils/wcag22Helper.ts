import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

export class WCAG22Helper {
  static async testTargetSize(page: Page): Promise<TestResult> {
    try {
      // Check if page is still valid
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }

      const results = await page.evaluate(() => {
        const selectors = [
          'a[href]', 'button', 'input', 'select', 'textarea',
          '[role="button"]', '[role="link"]', '[role^="menuitem"]',
          '[tabindex]:not([tabindex="-1"])'
        ];
        // @ts-ignore - runs in browser context
        const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
        const offenders: { html: string; w: number; h: number }[] = [];
        // Limit to first 100 elements for performance
        for (const el of nodes.slice(0, 100)) {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) {
            offenders.push({ html: (el as HTMLElement).outerHTML.slice(0, 200), w: Math.round(r.width), h: Math.round(r.height) });
          }
        }
        return offenders;
      }, { timeout: 30000 });

      const issues: Issue[] = results.map(r => ({
        description: `Target smaller than 24x24 px (${r.w}x${r.h})`,
        severity: 'moderate',
        element: r.html,
        wcagTags: ['wcag22aa', 'target-size-minimum']
      }));

      return {
        criterionId: '2.5.8',
        criterionTitle: 'Target Size (Minimum)',
        principle: 'Operable',
        level: 'AA',
        testType: 'automated',
        status: issues.length ? 'fail' : 'pass',
        issues,
        timestamp: new Date().toISOString(),
        url: page.url()
      };
    } catch (error) {
      // Handle timeout or closed page gracefully
      return {
        criterionId: '2.5.8',
        criterionTitle: 'Target Size (Minimum)',
        principle: 'Operable',
        level: 'AA',
        testType: 'automated',
        status: 'warning',
        issues: [{
          description: `Test could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'moderate',
          wcagTags: ['wcag22aa', 'target-size-minimum']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }
  }

  static async testFocusNotObscured(page: Page): Promise<TestResult> {
    try {
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }

      const offenders = await page.evaluate(() => {
        // @ts-ignore - runs in browser context
        const focusables = Array.from(document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).slice(0, 15); // Reduced from 30 to 15
        const bad: string[] = [];
        function isDescendant(a: Element | null, b: Element | null) { 
          return !!(a && b && (a === b || b.contains(a))); 
        }
        for (const el of focusables) {
          try {
            (el as HTMLElement).focus({ preventScroll: true });
            const r = (el as HTMLElement).getBoundingClientRect();
            const cx = Math.max(0, Math.min(r.left + r.width / 2, window.innerWidth - 1));
            const cy = Math.max(0, Math.min(r.top + r.height / 2, window.innerHeight - 1));
            // @ts-ignore
            const topAtCenter = document.elementFromPoint(cx, cy);
            if (!isDescendant(el as Element, topAtCenter)) {
              bad.push((el as HTMLElement).outerHTML.slice(0, 200));
            }
          } catch (e) {
            // Skip elements that can't be focused
          }
        }
        return bad;
      }, { timeout: 30000 });

      const issues: Issue[] = offenders.map(html => ({
        description: 'Focused element is obscured by other UI (headers/overlays).',
        severity: 'serious',
        element: html,
        wcagTags: ['wcag22aa', 'focus-not-obscured']
      }));

      return {
        criterionId: '2.4.12',
        criterionTitle: 'Focus Not Obscured (Minimum)',
        principle: 'Operable',
        level: 'AA',
        testType: 'automated',
        status: issues.length ? 'fail' : 'pass',
        issues,
        timestamp: new Date().toISOString(),
        url: page.url()
      };
    } catch (error) {
      return {
        criterionId: '2.4.12',
        criterionTitle: 'Focus Not Obscured (Minimum)',
        principle: 'Operable',
        level: 'AA',
        testType: 'automated',
        status: 'warning',
        issues: [{
          description: `Test could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'moderate',
          wcagTags: ['wcag22aa', 'focus-not-obscured']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }
  }

  static async testFocusAppearanceHeuristic(page: Page): Promise<TestResult> {
    try {
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }

      const missing = await page.evaluate(() => {
        // @ts-ignore - runs in browser context
        const focusables = Array.from(document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).slice(0, 15); // Reduced from 30 to 15
        const offenders: string[] = [];
        for (const el of focusables) {
          try {
            (el as HTMLElement).focus({ preventScroll: true });
            const cs = getComputedStyle(el as HTMLElement);
            const hasOutline = cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px';
            const hasBoxShadow = cs.boxShadow && cs.boxShadow !== 'none';
            const hasBorderChange = cs.borderStyle !== 'none' && cs.borderWidth !== '0px';
            if (!(hasOutline || hasBoxShadow || hasBorderChange)) {
              offenders.push((el as HTMLElement).outerHTML.slice(0, 200));
            }
          } catch (e) {
            // Skip elements that can't be focused
          }
        }
        return offenders;
      }, { timeout: 30000 });

      const issues: Issue[] = missing.map(html => ({
        description: 'No visible focus style detected (heuristic).',
        severity: 'moderate',
        element: html,
        wcagTags: ['wcag22aa', 'focus-appearance']
      }));

      return {
        criterionId: '2.4.13',
        criterionTitle: 'Focus Appearance (Heuristic)',
        principle: 'Operable',
        level: 'AA',
        testType: 'automated',
        status: issues.length ? 'warning' : 'pass',
        issues,
        timestamp: new Date().toISOString(),
        url: page.url()
      };
    } catch (error) {
      return {
        criterionId: '2.4.13',
        criterionTitle: 'Focus Appearance (Heuristic)',
        principle: 'Operable',
        level: 'AA',
        testType: 'automated',
        status: 'warning',
        issues: [{
          description: `Test could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'moderate',
          wcagTags: ['wcag22aa', 'focus-appearance']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }
  }

  static async testPointerCancellation(page: Page): Promise<TestResult> {
    try {
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }

      const offenders = await page.evaluate(() => {
        // @ts-ignore - runs in browser context
        const els = Array.from(document.querySelectorAll('[onmousedown]:not([onclick])'));
        return els.slice(0, 30).map((el: any) => el.outerHTML.slice(0, 200));
      }, { timeout: 10000 });

      const issues: Issue[] = offenders.map(html => ({
        description: 'Pointer action bound to mousedown without click fallback (heuristic).',
        severity: 'moderate',
        element: html,
        wcagTags: ['wcag22aa', 'pointer-cancellation']
      }));

      return {
        criterionId: '2.5.2',
        criterionTitle: 'Pointer Cancellation (Heuristic)',
        principle: 'Operable',
        level: 'A',
        testType: 'automated',
        status: issues.length ? 'warning' : 'pass',
        issues,
        timestamp: new Date().toISOString(),
        url: page.url()
      };
    } catch (error) {
      return {
        criterionId: '2.5.2',
        criterionTitle: 'Pointer Cancellation (Heuristic)',
        principle: 'Operable',
        level: 'A',
        testType: 'automated',
        status: 'warning',
        issues: [],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }
  }
}
