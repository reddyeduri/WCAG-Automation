import { Page } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';

/**
 * Content Analysis Helper - WCAG 2.4.6 (Level AA) & 2.4.10 (Level AAA)
 *
 * AUTOMATION OPPORTUNITY: 70-80% accuracy
 * Converts manual review items to automated tests
 *
 * Detects:
 * - Heading quality (descriptiveness, clarity)
 * - Section heading coverage
 * - Heading structure and organization
 */

export class ContentAnalysisHelper {
  /**
   * Test Headings and Labels Quality (WCAG 2.4.6 - Level AA)
   * Headings and labels describe topic or purpose
   */
  static async testHeadingsAndLabels(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const headingAnalysis = await page.evaluate(() => {
        const problems: Array<{
          html: string;
          text: string;
          level: string;
          issue: string;
          severity: 'serious' | 'moderate';
        }> = [];

        // Get all headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

        // Patterns that indicate poor heading quality
        const vaguePatterns = [
          /^(more|details|information|info|click here|read more|learn more|see more)$/i,
          /^(section|content|main|article|post)$/i,
          /^(untitled|placeholder|heading|title)$/i,
          /^(lorem ipsum)/i,
          /^(test|demo|example|sample)$/i
        ];

        headings.forEach((heading, index) => {
          const text = (heading.textContent || '').trim();
          const level = heading.tagName.toLowerCase();

          // Check 1: Empty heading
          if (text.length === 0) {
            problems.push({
              html: (heading as HTMLElement).outerHTML,
              text: '(empty)',
              level,
              issue: `Empty ${level} heading - headings must have descriptive text`,
              severity: 'serious'
            });
            return;
          }

          // Check 2: Very short non-descriptive headings (1-2 chars)
          if (text.length <= 2) {
            problems.push({
              html: (heading as HTMLElement).outerHTML,
              text,
              level,
              issue: `${level} heading "${text}" is too short to be descriptive`,
              severity: 'moderate'
            });
            return;
          }

          // Check 3: Vague headings
          for (const pattern of vaguePatterns) {
            if (pattern.test(text)) {
              problems.push({
                html: (heading as HTMLElement).outerHTML,
                text,
                level,
                issue: `${level} heading "${text}" is not descriptive - users cannot determine the topic or purpose`,
                severity: 'moderate'
              });
              break;
            }
          }

          // Check 4: All caps headings (potential readability issue)
          if (text.length > 3 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
            problems.push({
              html: (heading as HTMLElement).outerHTML,
              text,
              level,
              issue: `${level} heading is all caps - may reduce readability for some users`,
              severity: 'moderate'
            });
          }

          // Check 5: Very long headings (likely not well-structured)
          if (text.length > 150) {
            problems.push({
              html: (heading as HTMLElement).outerHTML.substring(0, 200),
              text: text.substring(0, 100) + '...',
              level,
              issue: `${level} heading is very long (${text.length} chars) - consider breaking into heading and introductory text`,
              severity: 'moderate'
            });
          }
        });

        // Check form labels
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
        inputs.forEach(input => {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const name = input.getAttribute('name') || '';

          // If no label, aria-label, or aria-labelledby
          if (!ariaLabel && !ariaLabelledBy) {
            // Check for associated label
            const label = id ? document.querySelector(`label[for="${id}"]`) : null;
            const parentLabel = input.closest('label');

            if (!label && !parentLabel) {
              problems.push({
                html: (input as HTMLElement).outerHTML.substring(0, 200),
                text: name || '(no name)',
                level: 'input',
                issue: `Form input has no label - users cannot determine its purpose`,
                severity: 'serious'
              });
            } else {
              const labelText = ((label || parentLabel)?.textContent || '').trim();
              // Check for vague labels
              if (vaguePatterns.some(pattern => pattern.test(labelText))) {
                problems.push({
                  html: (input as HTMLElement).outerHTML.substring(0, 200),
                  text: labelText,
                  level: 'input',
                  issue: `Form input label "${labelText}" is not descriptive`,
                  severity: 'moderate'
                });
              }
            }
          }
        });

        return problems;
      });

      headingAnalysis.forEach(problem => {
        issues.push({
          description: problem.issue,
          severity: problem.severity,
          element: problem.html,
          help: 'WCAG 2.4.6: Headings and labels must describe their topic or purpose. ' +
                (problem.level.startsWith('h') ?
                  'Make the heading more specific and descriptive (e.g., instead of "More", use "More Customer Reviews")' :
                  'Ensure form labels clearly describe what information is required'),
          wcagTags: ['wcag2aa', 'wcag246'],
          target: [problem.level]
        });
      });

    } catch (error) {
      issues.push({
        description: `Headings and labels test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze headings and labels. Manual review required.',
        wcagTags: ['wcag2aa', 'wcag246']
      });
    }

    return {
      criterionId: '2.4.6',
      criterionTitle: 'Headings and Labels',
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
   * Test Section Headings (WCAG 2.4.10 - Level AAA)
   * Section headings are used to organize content
   */
  static async testSectionHeadings(page: Page): Promise<TestResult> {
    const url = page.url();
    const issues: Issue[] = [];

    try {
      const sectionAnalysis = await page.evaluate(() => {
        const problems: Array<{
          description: string;
          severity: 'moderate';
        }> = [];

        // Count semantic sections
        const sections = document.querySelectorAll('section, article, aside, main');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        // Check if sections have headings
        let sectionsWithoutHeadings = 0;
        sections.forEach(section => {
          const sectionHeadings = section.querySelectorAll('h1, h2, h3, h4, h5, h6');
          if (sectionHeadings.length === 0) {
            sectionsWithoutHeadings++;
          }
        });

        if (sectionsWithoutHeadings > 0) {
          problems.push({
            description: `${sectionsWithoutHeadings} semantic section(s) found without headings - section content should be introduced by headings`,
            severity: 'moderate'
          });
        }

        // Check for long content blocks without headings
        const paragraphs = document.querySelectorAll('p');
        let consecutiveParagraphs = 0;
        let maxConsecutive = 0;

        paragraphs.forEach((p, index) => {
          // Count consecutive paragraphs
          if (index === 0 || paragraphs[index - 1].nextElementSibling === p) {
            consecutiveParagraphs++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveParagraphs);
          } else {
            consecutiveParagraphs = 1;
          }
        });

        // More than 5 consecutive paragraphs suggests need for section headings
        if (maxConsecutive > 5 && headings.length < 3) {
          problems.push({
            description: `Long content with ${maxConsecutive} consecutive paragraphs but only ${headings.length} headings - consider adding section headings to organize content`,
            severity: 'moderate'
          });
        }

        // Check heading distribution
        const mainContent = document.querySelector('main, [role="main"], #content, .content');
        if (mainContent) {
          const mainHeadings = mainContent.querySelectorAll('h2, h3, h4, h5, h6');
          const mainText = (mainContent.textContent || '').length;
          const wordsPerHeading = mainText / Math.max(mainHeadings.length, 1);

          // If there's a lot of text but few headings (more than 500 words per heading)
          if (mainText > 2000 && wordsPerHeading > 500) {
            problems.push({
              description: `Main content has ${Math.round(mainText / 5)} words but only ${mainHeadings.length} section headings - consider adding more headings to organize content`,
              severity: 'moderate'
            });
          }
        }

        return problems;
      });

      sectionAnalysis.forEach(problem => {
        issues.push({
          description: problem.description,
          severity: problem.severity,
          help: 'WCAG 2.4.10 (AAA): Use section headings to organize content. ' +
                'Breaking content into logical sections with descriptive headings helps all users navigate and understand the page structure.',
          wcagTags: ['wcag2aaa', 'wcag2410']
        });
      });

    } catch (error) {
      issues.push({
        description: `Section headings test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'moderate',
        help: 'Could not analyze section headings. Manual review required.',
        wcagTags: ['wcag2aaa', 'wcag2410']
      });
    }

    return {
      criterionId: '2.4.10',
      criterionTitle: 'Section Headings',
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
