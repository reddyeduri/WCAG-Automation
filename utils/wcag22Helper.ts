import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

export class WCAG22Helper {
  static async testTargetSize(page: Page): Promise<TestResult> {
    const results = await page.evaluate(() => {
      const selectors = [
        'a[href]', 'button', 'input', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role^="menuitem"]',
        '[tabindex]:not([tabindex="-1"])'
      ];
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));
      const offenders: { html: string; w: number; h: number }[] = [];
      for (const el of nodes) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24)) {
          offenders.push({ html: el.outerHTML.slice(0, 200), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return offenders;
    });

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
  }

  static async testFocusNotObscured(page: Page): Promise<TestResult> {
    const offenders = await page.evaluate(async () => {
      const focusables = Array.from(document.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).slice(0, 30);
      const bad: string[] = [];
      function isDescendant(a: Element | null, b: Element | null) { return !!(a && b && (a === b || b.contains(a))); }
      for (const el of focusables) {
        el.focus({ preventScroll: true });
        const r = el.getBoundingClientRect();
        const cx = Math.max(0, Math.min(r.left + r.width / 2, window.innerWidth - 1));
        const cy = Math.max(0, Math.min(r.top + r.height / 2, window.innerHeight - 1));
        const topAtCenter = document.elementFromPoint(cx, cy);
        if (!isDescendant(el, topAtCenter)) {
          bad.push(el.outerHTML.slice(0, 200));
        }
      }
      return bad;
    });

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
  }

  static async testFocusAppearanceHeuristic(page: Page): Promise<TestResult> {
    const missing = await page.evaluate(() => {
      const focusables = Array.from(document.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).slice(0, 30);
      const offenders: string[] = [];
      for (const el of focusables) {
        el.focus({ preventScroll: true });
        const cs = getComputedStyle(el);
        const hasOutline = cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px';
        const hasBoxShadow = cs.boxShadow && cs.boxShadow !== 'none';
        const hasBorderChange = cs.borderStyle !== 'none' && cs.borderWidth !== '0px';
        if (!(hasOutline || hasBoxShadow || hasBorderChange)) {
          offenders.push(el.outerHTML.slice(0, 200));
        }
      }
      return offenders;
    });

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
  }

  static async testPointerCancellation(page: Page): Promise<TestResult> {
    const offenders = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[onmousedown]:not([onclick])'));
      return els.slice(0, 30).map(el => el.outerHTML.slice(0, 200));
    });

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
  }
}
