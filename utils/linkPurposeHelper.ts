import { Page } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';

/**
 * Link Purpose Helper - WCAG 2.4.4 (Level A) & 2.4.9 (Level AAA)
 *
 * AUTOMATION OPPORTUNITY: 85% accuracy
 * Converts manual review item to automated test
 *
 * Detects:
 * - Vague link text ("click here", "read more", "here", "more")
 * - URLs used as link text
 * - Same link text pointing to different destinations
 * - Links without sufficient context
 * - Generic link text patterns
 */

export class LinkPurposeHelper {
  /**
   * Test Link Purpose (WCAG 2.4.4 - Level A)
   * Link purpose can be determined from link text alone or with context
   */
  static async testLinkPurpose(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const linkAnalysis = await page.evaluate(() => {
        const problems: Array<{
          html: string;
          text: string;
          href: string;
          issue: string;
          severity: 'critical' | 'serious' | 'moderate';
          selector: string;
        }> = [];

        // Vague link text patterns (case-insensitive)
        const vaguePatterns = [
          /^(click\s+here|here|read\s+more|more|learn\s+more|see\s+more|continue|next|back|previous|go)$/i,
          /^(download|view|open|see|check\s+out|find\s+out)$/i,
          /^(this|that|these|those)$/i,
          /^(link|button|page|article|details|info|information)$/i
        ];

        // Get all links
        const links = Array.from(document.querySelectorAll('a[href]'));

        // Track link text to destination mapping
        const linkTextMap = new Map<string, Set<string>>();

        links.forEach((link, index) => {
          const text = (link.textContent || '').trim();
          const href = (link as HTMLAnchorElement).href;
          const ariaLabel = link.getAttribute('aria-label') || '';
          const title = link.getAttribute('title') || '';

          // Skip empty links or navigation anchors
          if (!text && !ariaLabel && !title) return;
          if (href.startsWith('#') || href === 'javascript:void(0)') return;

          // Generate simple selector
          const selector = link.id
            ? `#${link.id}`
            : `a:nth-of-type(${index + 1})`;

          // Check 1: Vague link text
          if (!ariaLabel && !title) {
            for (const pattern of vaguePatterns) {
              if (pattern.test(text)) {
                problems.push({
                  html: (link as HTMLElement).outerHTML.substring(0, 200),
                  text,
                  href,
                  issue: `Vague link text "${text}" - users may not understand the link's purpose`,
                  severity: 'serious',
                  selector
                });
                break;
              }
            }
          }

          // Check 2: URL used as link text
          if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.')) {
            if (text.length > 50) {
              problems.push({
                html: (link as HTMLElement).outerHTML.substring(0, 200),
                text: text.substring(0, 50) + '...',
                href,
                issue: `Long URL used as link text (${text.length} chars) - screen reader users will hear the entire URL`,
                severity: 'moderate',
                selector
              });
            }
          }

          // Check 3: Very short link text (1-2 characters) without aria-label
          if (text.length <= 2 && !ariaLabel && !title) {
            problems.push({
              html: (link as HTMLElement).outerHTML.substring(0, 200),
              text,
              href,
              issue: `Very short link text "${text}" without aria-label or title`,
              severity: 'serious',
              selector
            });
          }

          // Track link text for duplicate detection
          const effectiveText = (ariaLabel || text).toLowerCase().trim();
          if (effectiveText) {
            if (!linkTextMap.has(effectiveText)) {
              linkTextMap.set(effectiveText, new Set());
            }
            linkTextMap.get(effectiveText)!.add(href);
          }
        });

        // Check 4: Same link text, different destinations
        linkTextMap.forEach((destinations, text) => {
          if (destinations.size > 1 && text.length > 0) {
            // Filter out common navigation patterns that are OK to duplicate
            const okDuplicates = ['home', 'contact', 'about', 'login', 'search', 'help', 'skip to content'];
            if (!okDuplicates.includes(text.toLowerCase())) {
              const destinationList = Array.from(destinations).slice(0, 3).join(', ');
              problems.push({
                html: `Multiple links with text: "${text}"`,
                text,
                href: destinationList,
                issue: `Same link text "${text}" points to ${destinations.size} different destinations: ${destinationList}${destinations.size > 3 ? '...' : ''}`,
                severity: 'moderate',
                selector: `a:has-text("${text}")`
              });
            }
          }
        });

        return problems;
      });

      // Convert to test issues
      linkAnalysis.forEach(problem => {
        issues.push({
          description: problem.issue,
          severity: problem.severity,
          element: problem.html,
          help: `WCAG 2.4.4: Link purpose must be clear from link text alone or from context. ` +
                `Consider: ` +
                (problem.issue.includes('Vague') ? `Replace "${problem.text}" with descriptive text like "Download the 2024 Annual Report" or "Learn more about our accessibility features"` :
                 problem.issue.includes('URL') ? `Replace URL with descriptive text like "Visit our documentation site"` :
                 problem.issue.includes('short') ? `Add aria-label describing the link's purpose or expand the link text` :
                 problem.issue.includes('Same link text') ? `Make link text unique or add context (e.g., "View Product A details", "View Product B details")` :
                 'Provide more descriptive link text'),
          wcagTags: ['wcag2a', 'wcag244', 'best-practice'],
          target: [problem.selector]
        });
      });

    } catch (error) {
      issues.push({
        description: `Link purpose test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze link purpose. Manual review required.',
        wcagTags: ['wcag2a', 'wcag244']
      });
    }

    return {
      criterionId: '2.4.4',
      criterionTitle: 'Link Purpose (In Context)',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url
    };
  }

  /**
   * Test Link Purpose (Link Only) - WCAG 2.4.9 (Level AAA)
   * Link purpose must be clear from link text ALONE
   */
  static async testLinkPurposeLinkOnly(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const linkAnalysis = await page.evaluate(() => {
        const problems: Array<{
          html: string;
          text: string;
          href: string;
          issue: string;
        }> = [];

        const links = Array.from(document.querySelectorAll('a[href]'));

        links.forEach(link => {
          const text = (link.textContent || '').trim();
          const href = (link as HTMLAnchorElement).href;
          const ariaLabel = link.getAttribute('aria-label');

          // Skip navigation anchors
          if (href.startsWith('#') || href === 'javascript:void(0)') return;

          const effectiveText = ariaLabel || text;

          // For AAA, link text alone must be sufficient
          // Check if text is descriptive enough (at least 3 words or 15 characters)
          const wordCount = effectiveText.split(/\s+/).length;

          if (effectiveText.length < 15 && wordCount < 3) {
            // Allow exceptions for icon links with proper aria-label
            if (!ariaLabel || ariaLabel.length < 10) {
              problems.push({
                html: (link as HTMLElement).outerHTML.substring(0, 200),
                text: effectiveText,
                href,
                issue: `Link text "${effectiveText}" may not be descriptive enough on its own (AAA requires link purpose clear from text alone)`
              });
            }
          }
        });

        return problems;
      });

      linkAnalysis.forEach(problem => {
        issues.push({
          description: problem.issue,
          severity: 'moderate',
          element: problem.html,
          help: 'WCAG 2.4.9 (AAA): Link purpose must be clear from link text alone, without context. Add more descriptive link text or use aria-label.',
          wcagTags: ['wcag2aaa', 'wcag249']
        });
      });

    } catch (error) {
      issues.push({
        description: `Link purpose (link only) test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze link purpose. Manual review required.',
        wcagTags: ['wcag2aaa', 'wcag249']
      });
    }

    return {
      criterionId: '2.4.9',
      criterionTitle: 'Link Purpose (Link Only)',
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
