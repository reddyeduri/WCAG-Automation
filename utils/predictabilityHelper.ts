import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for testing predictable behavior and context changes
 * Covers WCAG 2.1 Success Criteria 3.2.x
 */
export class PredictabilityHelper {
  /**
   * 3.2.1 On Focus
   * Detects automatic context changes when elements receive focus
   */
  static async testOnFocus(page: Page): Promise<TestResult> {
    const focusInfo = await page.evaluate(() => {
      const issues: any[] = [];
      
      // Check for onfocus attributes
      const elementsWithOnFocus = Array.from(document.querySelectorAll('[onfocus]'));
      elementsWithOnFocus.forEach(el => {
        const onfocus = el.getAttribute('onfocus') || '';
        // Check for navigation changes
        if (onfocus.includes('window.open') || 
            onfocus.includes('window.location') || 
            onfocus.includes('submit()') ||
            onfocus.includes('.focus()')) {
          issues.push({
            html: el.outerHTML.slice(0, 200),
            description: 'Element has onfocus handler that may change context',
            code: onfocus.slice(0, 100)
          });
        }
      });

      // Check for focus event listeners (heuristic - can't detect all)
      const scriptsWithFocus = Array.from(document.querySelectorAll('script')).filter(script => {
        const content = script.textContent || '';
        return content.includes('addEventListener') && 
               content.includes('focus') && 
               (content.includes('window.open') || content.includes('window.location'));
      });

      if (scriptsWithFocus.length > 0) {
        issues.push({
          html: '<script>',
          description: `${scriptsWithFocus.length} script(s) with focus event listeners - verify they don't change context automatically`,
          code: 'focus event handlers detected'
        });
      }

      return issues;
    });

    const issues: Issue[] = focusInfo.map(item => ({
      description: item.description,
      severity: 'serious',
      element: item.html,
      help: 'Do not automatically open new windows, navigate, or submit forms when elements receive focus',
      wcagTags: ['wcag2a', 'wcag321']
    }));

    return {
      criterionId: '3.2.1',
      criterionTitle: 'On Focus',
      principle: 'Understandable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 3.2.2 On Input
   * Detects automatic context changes when input values change
   */
  static async testOnInput(page: Page): Promise<TestResult> {
    const inputInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check select elements with onchange that might submit or navigate
      const selects = Array.from(document.querySelectorAll('select[onchange]'));
      selects.forEach(select => {
        const onchange = select.getAttribute('onchange') || '';
        if (onchange.includes('submit()') || 
            onchange.includes('window.location') || 
            onchange.includes('window.open')) {
          issues.push({
            html: select.outerHTML.slice(0, 200),
            description: 'Select with onchange that changes context automatically',
            type: 'select'
          });
        }
      });

      // Check radio buttons/checkboxes with automatic submission
      const inputs = Array.from(document.querySelectorAll('input[type="radio"][onchange], input[type="checkbox"][onchange], input[type="radio"][onclick], input[type="checkbox"][onclick]'));
      inputs.forEach(input => {
        const handler = input.getAttribute('onchange') || input.getAttribute('onclick') || '';
        if (handler.includes('submit()') || 
            handler.includes('window.location') || 
            handler.includes('window.open')) {
          issues.push({
            html: input.outerHTML.slice(0, 200),
            description: 'Input with automatic context change on selection',
            type: 'input'
          });
        }
      });

      // Check for forms with no submit button (may auto-submit)
      const forms = Array.from(document.querySelectorAll('form'));
      forms.forEach(form => {
        const hasSubmitButton = !!form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
        const hasOnChange = !!form.querySelector('[onchange]');
        
        if (!hasSubmitButton && hasOnChange) {
          issues.push({
            html: form.outerHTML.slice(0, 200),
            description: 'Form without submit button but with onchange handlers - may auto-submit',
            type: 'form'
          });
        }
      });

      // Check scripts for addEventListener on change/input
      const scriptsWithChange = Array.from(document.querySelectorAll('script')).filter(script => {
        const content = script.textContent || '';
        return (content.includes('addEventListener') && 
               (content.includes('change') || content.includes('input')) && 
               (content.includes('submit') || content.includes('window.location')));
      });

      if (scriptsWithChange.length > 0) {
        issues.push({
          html: '<script>',
          description: `${scriptsWithChange.length} script(s) with change handlers that may auto-submit`,
          type: 'script'
        });
      }

      return issues;
    });

    const issues: Issue[] = inputInfo.map(item => ({
      description: item.description,
      severity: 'serious',
      element: item.html,
      help: 'Provide submit button and do not automatically change context when input values change',
      wcagTags: ['wcag2a', 'wcag322']
    }));

    return {
      criterionId: '3.2.2',
      criterionTitle: 'On Input',
      principle: 'Understandable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 3.2.3 Consistent Navigation
   * Requires multi-page crawling to compare navigation order
   */
  static async testConsistentNavigation(page: Page, crawlDepth: number = 3): Promise<TestResult> {
    const currentUrl = page.url();
    const issues: Issue[] = [];

    try {
      // Get navigation structure of current page
      const currentNav = await this.extractNavigationStructure(page);
      
      // Get links to crawl
      const links = await page.$$eval('a[href]', (anchors) => 
        Array.from(new Set(
          anchors
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => {
              try {
                const url = new URL(href);
                return url.origin === window.location.origin && 
                       !href.includes('#') && 
                       !href.includes('logout') &&
                       !href.includes('download');
              } catch {
                return false;
              }
            })
        )).slice(0, crawlDepth)
      );

      // Compare navigation on other pages
      const context = page.context();
      for (const link of links) {
        const otherPage = await context.newPage();
        try {
          await otherPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const otherNav = await this.extractNavigationStructure(otherPage);
          
          // Compare navigation order
          const inconsistencies = this.compareNavigation(currentNav, otherNav);
          if (inconsistencies.length > 0) {
            issues.push({
              description: `Navigation order inconsistent between ${currentUrl} and ${link}`,
              severity: 'moderate',
              element: inconsistencies.join(', '),
              help: 'Keep navigation components in consistent order across pages',
              wcagTags: ['wcag2aa', 'wcag323']
            });
          }
        } catch (error) {
          // Skip pages that fail to load
        } finally {
          await otherPage.close();
        }
      }
    } catch (error) {
      issues.push({
        description: 'Unable to fully test navigation consistency - manual review recommended',
        severity: 'moderate',
        help: 'Manually verify navigation appears in same order across pages',
        wcagTags: ['wcag2aa', 'wcag323']
      });
    }

    return {
      criterionId: '3.2.3',
      criterionTitle: 'Consistent Navigation',
      principle: 'Understandable',
      level: 'AA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: currentUrl
    };
  }

  /**
   * 3.2.4 Consistent Identification
   * Checks for same functionality with different labels across page
   */
  static async testConsistentIdentification(page: Page): Promise<TestResult> {
    const identificationInfo = await page.evaluate(() => {
      const issues: any[] = [];
      const functionMap = new Map<string, Set<string>>();

      // Track submit buttons
      const submitButtons = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"]'));
      submitButtons.forEach(btn => {
        const label = (btn as HTMLInputElement).value || btn.textContent?.trim() || '';
        if (!functionMap.has('submit')) {
          functionMap.set('submit', new Set());
        }
        functionMap.get('submit')!.add(label);
      });

      // Track search functionality
      const searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[name*="search" i], input[aria-label*="search" i]'));
      searchInputs.forEach(input => {
        const label = input.getAttribute('aria-label') || 
                     input.getAttribute('placeholder') || 
                     document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || '';
        if (!functionMap.has('search')) {
          functionMap.set('search', new Set());
        }
        functionMap.get('search')!.add(label);
      });

      // Track home links
      const homeLinks = Array.from(document.querySelectorAll('a[href="/"], a[href="index.html"], a[href*="home"]'));
      homeLinks.forEach(link => {
        const label = link.textContent?.trim() || link.getAttribute('aria-label') || '';
        if (!functionMap.has('home')) {
          functionMap.set('home', new Set());
        }
        functionMap.get('home')!.add(label);
      });

      // Check for inconsistencies
      functionMap.forEach((labels, func) => {
        if (labels.size > 1) {
          issues.push({
            description: `Inconsistent labels for ${func} function: ${Array.from(labels).join(', ')}`,
            type: func,
            labels: Array.from(labels)
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = identificationInfo.map(item => ({
      description: item.description,
      severity: 'moderate',
      element: item.labels.join('; '),
      help: 'Use consistent labels for components with same functionality',
      wcagTags: ['wcag2aa', 'wcag324']
    }));

    return {
      criterionId: '3.2.4',
      criterionTitle: 'Consistent Identification',
      principle: 'Understandable',
      level: 'AA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 3.2.5 Change on Request
   * Detects automatic changes that occur without user request
   */
  static async testChangeOnRequest(page: Page): Promise<TestResult> {
    const changeInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check for window.onload that changes location
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        if ((content.includes('window.onload') || content.includes('addEventListener(\'load\'')) && 
            (content.includes('window.location') || content.includes('window.open'))) {
          issues.push({
            description: 'Script that navigates/opens window on page load',
            type: 'onload'
          });
        }
      });

      // Already checked meta refresh in timing tests, but include here too
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        issues.push({
          html: metaRefresh.outerHTML,
          description: 'Meta refresh causes automatic navigation',
          type: 'meta'
        });
      }

      return issues;
    });

    const issues: Issue[] = changeInfo.map(item => ({
      description: item.description,
      severity: 'serious',
      element: item.html || '<script>',
      help: 'Changes of context should only occur when user initiates action',
      wcagTags: ['wcag2aaa', 'wcag325']
    }));

    return {
      criterionId: '3.2.5',
      criterionTitle: 'Change on Request',
      principle: 'Understandable',
      level: 'AAA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Helper: Extract navigation structure
   */
  private static async extractNavigationStructure(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      if (!nav) return [];
      
      const links = Array.from(nav.querySelectorAll('a'));
      return links.map(a => a.textContent?.trim() || a.getAttribute('aria-label') || '').filter(Boolean);
    });
  }

  /**
   * Helper: Compare navigation structures
   */
  private static compareNavigation(nav1: string[], nav2: string[]): string[] {
    const inconsistencies: string[] = [];
    
    // Check if nav items appear in different order
    const commonItems = nav1.filter(item => nav2.includes(item));
    commonItems.forEach((item, index) => {
      const index1 = nav1.indexOf(item);
      const index2 = nav2.indexOf(item);
      
      if (index1 !== index2) {
        inconsistencies.push(`"${item}" at position ${index1} vs ${index2}`);
      }
    });

    return inconsistencies;
  }

  /**
   * Run all predictability tests
   */
  static async runAllPredictabilityTests(page: Page, crawlDepth: number = 2): Promise<TestResult[]> {
    const results: TestResult[] = [];

    results.push(await this.testOnFocus(page));
    results.push(await this.testOnInput(page));
    results.push(await this.testConsistentNavigation(page, crawlDepth));
    results.push(await this.testConsistentIdentification(page));
    results.push(await this.testChangeOnRequest(page));

    return results;
  }
}

