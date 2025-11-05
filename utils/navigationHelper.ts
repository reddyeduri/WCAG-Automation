import { Page } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';

/**
 * Navigation Helper - WCAG 2.4.5 (Level AA) & 2.4.8 (Level AAA)
 *
 * AUTOMATION OPPORTUNITY: 75-85% accuracy
 * Converts manual review items to automated tests
 *
 * Detects:
 * - Multiple ways to find pages (search, sitemap, navigation, breadcrumbs, table of contents)
 * - Location indicators (breadcrumbs, "you are here", page hierarchy)
 */

export class NavigationHelper {
  /**
   * Test Multiple Ways (WCAG 2.4.5 - Level AA)
   * More than one way to locate a page within a set of pages
   */
  static async testMultipleWays(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const navigationMethods = await page.evaluate(() => {
        const methods: Array<{ method: string; found: boolean; details: string }> = [];

        // Method 1: Search functionality
        const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search" i], input[placeholder*="search" i], input[aria-label*="search" i]');
        const searchForms = document.querySelectorAll('form[role="search"], form[action*="search"]');
        if (searchInputs.length > 0 || searchForms.length > 0) {
          methods.push({
            method: 'Search',
            found: true,
            details: `Found ${searchInputs.length} search input(s) and ${searchForms.length} search form(s)`
          });
        }

        // Method 2: Sitemap link
        const sitemapLinks = Array.from(document.querySelectorAll('a[href*="sitemap" i], a[href*="site-map" i]'));
        const sitemapText = sitemapLinks.filter(link =>
          /sitemap|site\s*map/i.test((link.textContent || '').trim())
        );
        if (sitemapText.length > 0) {
          methods.push({
            method: 'Sitemap',
            found: true,
            details: `Found link to sitemap`
          });
        }

        // Method 3: Breadcrumb navigation
        const breadcrumbs = document.querySelectorAll('[aria-label*="breadcrumb" i], .breadcrumb, .breadcrumbs, nav[class*="breadcrumb" i]');
        const breadcrumbLists = document.querySelectorAll('ol[typeof="BreadcrumbList"], ul[typeof="BreadcrumbList"]');
        if (breadcrumbs.length > 0 || breadcrumbLists.length > 0) {
          methods.push({
            method: 'Breadcrumbs',
            found: true,
            details: `Found ${breadcrumbs.length + breadcrumbLists.length} breadcrumb navigation(s)`
          });
        }

        // Method 4: Navigation menu (must have significant links)
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        let significantNavs = 0;
        navElements.forEach(nav => {
          const links = nav.querySelectorAll('a[href]');
          if (links.length >= 3) { // At least 3 links to be considered navigation
            significantNavs++;
          }
        });
        if (significantNavs > 0) {
          methods.push({
            method: 'Navigation menu',
            found: true,
            details: `Found ${significantNavs} navigation menu(s) with multiple links`
          });
        }

        // Method 5: Table of contents
        const tocElements = document.querySelectorAll('[class*="toc" i], [class*="table-of-contents" i], [id*="toc" i], [aria-label*="table of contents" i]');
        if (tocElements.length > 0) {
          methods.push({
            method: 'Table of Contents',
            found: true,
            details: `Found table of contents`
          });
        }

        // Method 6: Footer navigation
        const footerNavs = document.querySelectorAll('footer nav, footer [role="navigation"]');
        if (footerNavs.length > 0) {
          const footerLinks = Array.from(footerNavs).reduce((sum, nav) => sum + nav.querySelectorAll('a[href]').length, 0);
          if (footerLinks >= 3) {
            methods.push({
              method: 'Footer navigation',
              found: true,
              details: `Found footer navigation with ${footerLinks} links`
            });
          }
        }

        return methods;
      });

      // WCAG AA requires at least 2 different ways to find pages
      const foundMethods = navigationMethods.filter(m => m.found);

      if (foundMethods.length < 2) {
        issues.push({
          description: `Only ${foundMethods.length} navigation method(s) detected. WCAG AA requires at least 2 ways to locate pages.`,
          severity: 'serious',
          help: `Found methods: ${foundMethods.map(m => m.method).join(', ') || 'none'}. ` +
                `Consider adding: ` +
                (foundMethods.findIndex(m => m.method === 'Search') === -1 ? 'search functionality, ' : '') +
                (foundMethods.findIndex(m => m.method === 'Sitemap') === -1 ? 'sitemap, ' : '') +
                (foundMethods.findIndex(m => m.method === 'Breadcrumbs') === -1 ? 'breadcrumb navigation, ' : '') +
                (foundMethods.findIndex(m => m.method === 'Navigation menu') === -1 ? 'navigation menu' : ''),
          wcagTags: ['wcag2aa', 'wcag245']
        });
      }

    } catch (error) {
      issues.push({
        description: `Multiple ways test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze navigation methods. Manual review required.',
        wcagTags: ['wcag2aa', 'wcag245']
      });
    }

    return {
      criterionId: '2.4.5',
      criterionTitle: 'Multiple Ways',
      principle: 'Operable',
      level: 'AA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url
    };
  }

  /**
   * Test Location (WCAG 2.4.8 - Level AAA)
   * Information about user's location within a set of pages is available
   */
  static async testLocation(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const locationIndicators = await page.evaluate(() => {
        const indicators: Array<{ type: string; found: boolean; details: string }> = [];

        // Indicator 1: Breadcrumb navigation
        const breadcrumbs = document.querySelectorAll('[aria-label*="breadcrumb" i], .breadcrumb, .breadcrumbs, nav[class*="breadcrumb" i]');
        const breadcrumbLists = document.querySelectorAll('ol[typeof="BreadcrumbList"], ul[typeof="BreadcrumbList"]');
        if (breadcrumbs.length > 0 || breadcrumbLists.length > 0) {
          // Extract breadcrumb text
          const breadcrumbText = Array.from(breadcrumbs).concat(Array.from(breadcrumbLists))
            .map(bc => (bc.textContent || '').trim())
            .filter(text => text.length > 0)[0];

          indicators.push({
            type: 'Breadcrumbs',
            found: true,
            details: breadcrumbText ? `"${breadcrumbText.substring(0, 100)}"` : 'Found breadcrumb navigation'
          });
        }

        // Indicator 2: "You are here" or current page highlighting in navigation
        const youAreHere = document.querySelectorAll('[aria-current="page"], .current, .active, [class*="you-are-here"]');
        if (youAreHere.length > 0) {
          indicators.push({
            type: 'Current page indicator',
            found: true,
            details: `Found ${youAreHere.length} current page indicator(s) (aria-current or .current/.active classes)`
          });
        }

        // Indicator 3: Page title in a hierarchy (e.g., "Parent > Child > Current Page")
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
          const titleText = (pageTitle.textContent || '').trim();
          if (titleText.includes('>') || titleText.includes('»') || titleText.includes('•')) {
            indicators.push({
              type: 'Hierarchical page title',
              found: true,
              details: `Page title shows hierarchy: "${titleText.substring(0, 100)}"`
            });
          }
        }

        // Indicator 4: Sitemap with current page highlighted
        const sitemapCurrent = document.querySelectorAll('.sitemap [aria-current="page"], .sitemap .current');
        if (sitemapCurrent.length > 0) {
          indicators.push({
            type: 'Sitemap with location',
            found: true,
            details: 'Current page highlighted in sitemap'
          });
        }

        // Indicator 5: Navigation with active state
        const activeNavLinks = document.querySelectorAll('nav [aria-current="page"], nav .active, nav .current');
        if (activeNavLinks.length > 0) {
          indicators.push({
            type: 'Navigation with active state',
            found: true,
            details: `Found ${activeNavLinks.length} active navigation link(s)`
          });
        }

        return indicators;
      });

      const foundIndicators = locationIndicators.filter(i => i.found);

      if (foundIndicators.length === 0) {
        issues.push({
          description: 'No location indicators found (breadcrumbs, current page highlighting, or hierarchical structure)',
          severity: 'moderate',
          help: 'WCAG 2.4.8 (AAA): Provide information about the user\'s location within the website. ' +
                'Add breadcrumb navigation, highlight the current page in navigation menus (using aria-current="page"), ' +
                'or show the page hierarchy in the title.',
          wcagTags: ['wcag2aaa', 'wcag248']
        });
      }

    } catch (error) {
      issues.push({
        description: `Location test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze location indicators. Manual review required.',
        wcagTags: ['wcag2aaa', 'wcag248']
      });
    }

    return {
      criterionId: '2.4.8',
      criterionTitle: 'Location',
      principle: 'Operable',
      level: 'AAA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url
    };
  }
}
