import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

export class WCAGAdvancedHelper {
  // 2.5.7 Dragging Movements – keyboard/click fallback heuristic
  static async testDraggingFallback(page: Page): Promise<TestResult> {
    const offenders = await page.evaluate(() => {
      const sel = ['[draggable="true"]','[aria-grabbed]','[data-draggable]','[class*="drag"]'];
      const els = Array.from(document.querySelectorAll<HTMLElement>(sel.join(',')));
      return els.slice(0, 20).map(el => el.outerHTML.slice(0, 200));
    });

    const issues: Issue[] = offenders.map(html => ({
      description: 'Draggable widget detected – verify keyboard/click alternative (heuristic).',
      severity: 'moderate',
      element: html,
      wcagTags: ['wcag22aa','dragging-movements']
    }));

    return {
      criterionId: '2.5.7',
      criterionTitle: 'Dragging Movements (Heuristic)',
      principle: 'Operable',
      level: 'AA',
      testType: 'automated',
      status: issues.length ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  // 3.2.6 Consistent Help – shallow crawl of same-origin pages and check for help/contact
  static async testConsistentHelp(page: Page): Promise<TestResult> {
    const context = page.context();
    const selectors = ['a:has-text("Help")','a:has-text("Contact")','a:has-text("Support")','a:has-text("FAQ")'];

    async function hasHelp(p: Page) {
      for (const s of selectors) {
        const loc = p.locator(s).first();
        if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) return true;
      }
      return false;
    }

    const links = await page.$$eval('a[href]', as => (as as HTMLAnchorElement[])
      .map(a => (a as HTMLAnchorElement).href)
      .filter(h => !!h)
      .slice(0, 10)
    );

    const sample = Array.from(new Set(links)).filter(h => {
      try { const u = new URL(h); return u.origin === location.origin; } catch { return false; }
    }).slice(0, 3);

    const pages: Page[] = [];
    try {
      const flags: boolean[] = [];
      flags.push(await hasHelp(page));
      for (const href of sample) {
        const p = await context.newPage();
        pages.push(p);
        await p.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => undefined);
        flags.push(await hasHelp(p));
      }

      const consistent = flags.length > 0 && flags.every(Boolean);
      return {
        criterionId: '3.2.6',
        criterionTitle: 'Consistent Help (Heuristic)',
        principle: 'Understandable',
        level: 'AA',
        testType: 'automated',
        status: consistent ? 'pass' : 'warning',
        issues: consistent ? [] : [{ description: 'Help/Contact not consistently present across sampled pages', severity: 'moderate' }],
        timestamp: new Date().toISOString(),
        url: page.url()
      };
    } finally {
      for (const p of pages) { try { await p.close(); } catch {} }
    }
  }

  // 3.3.8 Accessible Authentication (No cognitive function test) – form hints
  static async testAccessibleAuth(page: Page): Promise<TestResult> {
    const info = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const data = forms.map(f => {
        const u = f.querySelector<HTMLInputElement>('input[type="email"], input[name*="user" i], input[name*="email" i]');
        const p = f.querySelector<HTMLInputElement>('input[type="password"]');
        return {
          userAuto: u?.getAttribute('autocomplete') || '',
          passAuto: p?.getAttribute('autocomplete') || '',
          hasReveal: !!f.querySelector('[aria-label*="show" i], [aria-pressed], [data-show-password]')
        };
      });
      return data;
    });

    const issues: Issue[] = [];
    for (const f of info) {
      if (f.passAuto && !/current-password|new-password/.test(f.passAuto)) {
        issues.push({ description: `Password field missing proper autocomplete (found: ${f.passAuto || 'none'})`, severity: 'moderate' });
      }
      if (f.userAuto && !/username|email/.test(f.userAuto)) {
        issues.push({ description: `Username field missing proper autocomplete (found: ${f.userAuto || 'none'})`, severity: 'moderate' });
      }
      if (!f.hasReveal) {
        issues.push({ description: 'No password reveal affordance detected (heuristic).', severity: 'minor' });
      }
    }

    return {
      criterionId: '3.3.8',
      criterionTitle: 'Accessible Authentication (Heuristic)',
      principle: 'Understandable',
      level: 'AA',
      testType: 'automated',
      status: issues.length ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }
}
