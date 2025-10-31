import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

interface OverflowInfo {
  offenders: string[];
  docOverflowX: boolean;
  docOverflowY: boolean;
}

export class ResponsiveHelper {
  /**
   * Test 1.4.4 (Resize text) and 1.4.10 (Reflow) by zooming to 200% and reducing viewport width.
   */
  static async testZoomAndReflow(page: Page): Promise<TestResult[]> {
    const originalViewport = page.viewportSize();
    const defaultViewport = originalViewport ?? { width: 1280, height: 720 };

    const zoomState = await page.evaluate(() => ({
      docZoom: (document.documentElement as HTMLElement).style.zoom || '',
      bodyZoom: (document.body as HTMLElement).style.zoom || ''
    }));

    await page.setViewportSize({ width: 320, height: defaultViewport.height });
    await page.evaluate(() => {
      (document.documentElement as HTMLElement).style.zoom = '2';
      (document.body as HTMLElement).style.zoom = '2';
    });

    await page.waitForTimeout(500);

    const overflow = await this.inspectOverflow(page);
    const currentUrl = page.url();

    await page.evaluate(state => {
      (document.documentElement as HTMLElement).style.zoom = state.docZoom;
      (document.body as HTMLElement).style.zoom = state.bodyZoom;
    }, zoomState);
    await page.setViewportSize(defaultViewport);

    const issues: Issue[] = [];
    if (overflow.docOverflowX || overflow.offenders.length) {
      // Create example HTML showing problematic elements
      const offenderExamples = overflow.offenders.length > 0
        ? overflow.offenders.slice(0, 3).map(offender => `<${offender.split('.')[0]} class="..."> <!-- This element causes horizontal scroll --> </${offender.split('.')[0]}>`).join('\n')
        : '<div style="width: 400px;"> <!-- Fixed width elements cause overflow at 200% zoom --> </div>';
      
      issues.push({
        description: `Content introduces horizontal scrolling when zoomed to 200% at 320px width.` +
          (overflow.offenders.length ? ` Examples: ${overflow.offenders.join(', ')}` : ''),
        severity: 'serious',
        element: offenderExamples || '<body>\n  <!-- Page-wide issue: content does not reflow at 200% zoom -->\n</body>',
        target: overflow.offenders.length > 0 ? [overflow.offenders[0]] : undefined,
        help: 'Ensure layouts reflow without requiring horizontal scrolling and text remains readable at 200% zoom. This is a page-wide issue affecting layout structure.',
        wcagTags: ['wcag2aa', 'wcag1410']
      });
    }

    const resizeResult: TestResult = {
      criterionId: '1.4.4',
      criterionTitle: 'Resize Text',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: issues.length ? 'fail' : 'pass',
      issues: issues.length ? issues : [],
      timestamp: new Date().toISOString(),
      url: currentUrl
    };

    const reflowIssues: Issue[] = [];
    if (overflow.docOverflowX) {
      const offenderExamples = overflow.offenders.length > 0
        ? overflow.offenders.slice(0, 3).map(offender => `<${offender.split('.')[0]} class="..."> <!-- This element causes horizontal scroll --> </${offender.split('.')[0]}>`).join('\n')
        : '<div style="width: 400px; min-width: 400px;"> <!-- Fixed width elements prevent reflow --> </div>';
      
      reflowIssues.push({
        description: 'Horizontal scrolling detected when viewport width is 320px and zoom is 200%.',
        severity: 'serious',
        element: offenderExamples || '<body>\n  <!-- Page-wide issue: content does not reflow at narrow viewport -->\n</body>',
        target: overflow.offenders.length > 0 ? [overflow.offenders[0]] : undefined,
        help: 'Ensure all content fits within 320 CSS pixels without horizontal scrolling. This is a page-wide issue affecting layout structure.',
        wcagTags: ['wcag2aa', 'wcag1410']
      });
    }

    const reflowResult: TestResult = {
      criterionId: '1.4.10',
      criterionTitle: 'Reflow',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: reflowIssues.length ? 'fail' : 'pass',
      issues: reflowIssues,
      timestamp: new Date().toISOString(),
      url: currentUrl
    };

    return [resizeResult, reflowResult];
  }

  /**
   * Test 1.4.12 Text Spacing by applying the required spacing adjustments.
   */
  static async testTextSpacing(page: Page): Promise<TestResult> {
    const styleId = '__wcag_text_spacing_style__';

    await page.evaluate(id => {
      if (document.getElementById(id)) return;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        body * {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
          font-size: 1.2em !important;
        }
      `;
      document.head.appendChild(style);
    }, styleId);

    await page.waitForTimeout(200);

    const overflow = await this.inspectOverflow(page);

    const currentUrl = page.url();

    await page.evaluate(id => {
      const style = document.getElementById(id);
      if (style) style.remove();
    }, styleId);

    const issues: Issue[] = [];
    if (overflow.docOverflowX || overflow.docOverflowY || overflow.offenders.length) {
      const offenderExamples = overflow.offenders.length > 0
        ? overflow.offenders.slice(0, 3).map(offender => `<${offender.split('.')[0]} class="..."> <!-- This element breaks with text spacing --> </${offender.split('.')[0]}>`).join('\n')
        : '<div style="line-height: 1.2; letter-spacing: normal;"> <!-- Text spacing adjustments break layout --> </div>';
      
      issues.push({
        description: 'Layout breaks when WCAG text spacing adjustments are applied.' +
          (overflow.offenders.length ? ` Examples: ${overflow.offenders.join(', ')}` : ''),
        severity: 'serious',
        element: offenderExamples || '<body>\n  <!-- Page-wide issue: layout breaks with text spacing adjustments -->\n</body>',
        target: overflow.offenders.length > 0 ? [overflow.offenders[0]] : undefined,
        help: 'Ensure users can apply text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em) without loss of content. This is a page-wide issue affecting layout structure.',
        wcagTags: ['wcag2aa', 'wcag1412']
      });
    }

    return {
      criterionId: '1.4.12',
      criterionTitle: 'Text Spacing',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: issues.length ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: currentUrl
    };
  }

  private static async inspectOverflow(page: Page): Promise<OverflowInfo> {
    return page.evaluate(() => {
      const offenders: string[] = [];

      function describe(el: Element): string {
        const tag = el.tagName.toLowerCase();
        const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
        const classList = (el as HTMLElement).className && typeof (el as HTMLElement).className === 'string'
          ? '.' + (el as HTMLElement).className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.')
          : '';
        return `${tag}${id}${classList}`;
      }

      function isVisible(el: HTMLElement): boolean {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      const host = document.body; 
      const elements = host ? Array.from(host.querySelectorAll<HTMLElement>('*')) : [];
      for (const el of elements) {
        if (!isVisible(el)) continue;
        if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
          offenders.push(describe(el));
          if (offenders.length >= 5) break;
        }
      }

      const doc = document.documentElement;
      return {
        offenders,
        docOverflowX: doc.scrollWidth > doc.clientWidth + 2,
        docOverflowY: doc.scrollHeight > doc.clientHeight + 40 // allow small vertical scroll
      };
    });
  }
}

