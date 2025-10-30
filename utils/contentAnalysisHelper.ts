import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for analyzing content patterns and sensory characteristics
 * Covers various WCAG criteria related to content presentation
 */
export class ContentAnalysisHelper {
  /**
   * 1.3.3 Sensory Characteristics
   * Detects instructions that rely only on shape, size, location, or sound
   */
  static async testSensoryCharacteristics(page: Page): Promise<TestResult> {
    const sensoryInfo = await page.evaluate(() => {
      const issues: any[] = [];
      
      // Common sensory-only instruction patterns
      const sensoryPatterns = [
        /click\s+the\s+(round|square|circular|triangular|red|green|blue)\s+(button|icon)/i,
        /press\s+the\s+(button|icon)\s+(on\s+the\s+)?(left|right|top|bottom|above|below)/i,
        /the\s+(button|link|icon)\s+(on\s+the\s+)?(left|right|top|bottom)/i,
        /(round|square|circular)\s+(button|icon)/i,
        /click\s+(above|below|left|right)/i,
        /see\s+the\s+(diagram|chart|map)\s+above/i,
        /hear\s+the\s+(sound|audio|tone)/i,
        /listen\s+for/i
      ];

      // Check all text content
      const allText = Array.from(document.querySelectorAll('p, li, div, span, label, button')).map(el => ({
        text: el.textContent?.trim() || '',
        html: el.outerHTML.slice(0, 200)
      }));

      allText.forEach(item => {
        sensoryPatterns.forEach(pattern => {
          if (pattern.test(item.text)) {
            issues.push({
              element: item.html,
              description: `Possible sensory-only instruction: "${item.text.slice(0, 100)}"`,
              text: item.text.slice(0, 150)
            });
          }
        });
      });

      // Check for images that might be used for spatial references
      const images = Array.from(document.querySelectorAll('img[alt*="arrow" i], img[alt*="icon" i]'));
      images.forEach(img => {
        const alt = img.getAttribute('alt') || '';
        if (alt && (alt.includes('click') || alt.includes('see'))) {
          issues.push({
            element: img.outerHTML.slice(0, 200),
            description: `Image with instructional alt text may rely on visual characteristics: "${alt}"`,
            text: alt
          });
        }
      });

      return issues.slice(0, 20); // Limit results
    });

    const issues: Issue[] = sensoryInfo.map(item => ({
      description: item.description,
      severity: 'moderate',
      element: item.element,
      help: 'Provide instructions that don\'t rely solely on shape, size, location, or sound',
      wcagTags: ['wcag2a', 'wcag133']
    }));

    return {
      criterionId: '1.3.3',
      criterionTitle: 'Sensory Characteristics',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 1.3.4 Orientation
   * Checks for orientation locks in CSS or viewport meta
   */
  static async testOrientation(page: Page): Promise<TestResult> {
    const orientationInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check stylesheets for orientation locks
      const styles = Array.from(document.styleSheets);
      styles.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            const cssText = rule.cssText;
            if (cssText.includes('@media') && cssText.includes('orientation')) {
              if (cssText.includes('transform: rotate') || 
                  cssText.includes('writing-mode')) {
                issues.push({
                  description: 'CSS media query with orientation lock detected',
                  css: cssText.slice(0, 200),
                  severity: 'moderate'
                });
              }
            }
          });
        } catch (e) {
          // Cross-origin stylesheets can't be accessed
        }
      });

      // Check viewport meta
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const content = viewport.getAttribute('content') || '';
        if (content.includes('orientation=')) {
          issues.push({
            element: viewport.outerHTML,
            description: 'Viewport meta tag specifies orientation',
            severity: 'serious'
          });
        }
      }

      return issues;
    });

    const issues: Issue[] = orientationInfo.map(item => ({
      description: item.description,
      severity: item.severity,
      element: item.element || item.css || 'CSS',
      help: 'Do not restrict content to specific display orientation unless essential',
      wcagTags: ['wcag2aa', 'wcag134']
    }));

    return {
      criterionId: '1.3.4',
      criterionTitle: 'Orientation',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Text pattern analysis - whitespace tables/columns
   * Related to 1.3.1 and 1.3.2
   */
  static async testWhitespaceFormatting(page: Page): Promise<TestResult> {
    const whitespaceInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check <pre> elements for tabular data
      const preElements = Array.from(document.querySelectorAll('pre'));
      preElements.forEach(pre => {
        const text = pre.textContent || '';
        
        // Check for multiple spaces in a row (might be column formatting)
        if (text.includes('  ') && text.split('\n').length > 3) {
          const lines = text.split('\n');
          const hasConsistentSpacing = lines.filter(line => /\s{2,}/.test(line)).length > 2;
          
          if (hasConsistentSpacing) {
            issues.push({
              element: pre.outerHTML.slice(0, 200),
              description: 'Pre element with whitespace formatting - may be tabular data',
              type: 'pre-table'
            });
          }
        }

        // Check for ASCII art
        if (text.includes('|') || text.includes('─') || text.includes('┌') || 
            text.includes('*') && text.includes('/') || text.includes('\\')) {
          issues.push({
            element: pre.outerHTML.slice(0, 200),
            description: 'Pre element with ASCII art or box drawing - provide text alternative',
            type: 'ascii-art'
          });
        }
      });

      // Check for multiple &nbsp; in regular content
      const allElements = Array.from(document.querySelectorAll('p, div, span, td'));
      allElements.forEach(el => {
        const html = el.innerHTML;
        const nbspCount = (html.match(/&nbsp;/g) || []).length;
        
        if (nbspCount > 5) {
          issues.push({
            element: el.outerHTML.slice(0, 200),
            description: `Multiple non-breaking spaces (${nbspCount}) - may be used for layout`,
            type: 'nbsp-spacing'
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = whitespaceInfo.map(item => ({
      description: item.description,
      severity: 'moderate',
      element: item.element,
      help: item.type === 'ascii-art' ? 
        'Provide text alternative for ASCII art' : 
        'Use proper HTML tables or CSS for layout instead of whitespace',
      wcagTags: ['wcag2a', 'wcag131', 'wcag132']
    }));

    return {
      criterionId: '1.3.1',
      criterionTitle: 'Info and Relationships - Whitespace Formatting',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * CSS content property usage
   * Related to 1.3.1
   */
  static async testCSSContent(page: Page): Promise<TestResult> {
    const cssContentInfo = await page.evaluate(() => {
      const issues: any[] = [];

      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        const beforeContent = getComputedStyle(el, '::before').content;
        const afterContent = getComputedStyle(el, '::after').content;

        // Check for non-decorative content in pseudo-elements
        if (beforeContent && beforeContent !== 'none' && beforeContent !== '""') {
          const content = beforeContent.replace(/^["']|["']$/g, '');
          // If content looks like actual text (not just symbols)
          if (content.length > 2 && /[a-zA-Z]/.test(content)) {
            issues.push({
              element: (el as HTMLElement).outerHTML.slice(0, 200),
              description: `::before pseudo-element with text content: "${content.slice(0, 50)}"`,
              content: content.slice(0, 50)
            });
          }
        }

        if (afterContent && afterContent !== 'none' && afterContent !== '""') {
          const content = afterContent.replace(/^["']|["']$/g, '');
          if (content.length > 2 && /[a-zA-Z]/.test(content)) {
            issues.push({
              element: (el as HTMLElement).outerHTML.slice(0, 200),
              description: `::after pseudo-element with text content: "${content.slice(0, 50)}"`,
              content: content.slice(0, 50)
            });
          }
        }
      });

      return issues.slice(0, 20);
    });

    const issues: Issue[] = cssContentInfo.map(item => ({
      description: item.description,
      severity: 'moderate',
      element: item.element,
      help: 'Avoid inserting important content via CSS ::before/::after - it\'s not accessible',
      wcagTags: ['wcag2a', 'wcag131']
    }));

    return {
      criterionId: '1.3.1',
      criterionTitle: 'Info and Relationships - CSS Content',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Run all content analysis tests
   */
  static async runAllContentAnalysisTests(page: Page): Promise<TestResult[]> {
    const results: TestResult[] = [];

    results.push(await this.testSensoryCharacteristics(page));
    results.push(await this.testOrientation(page));
    results.push(await this.testWhitespaceFormatting(page));
    results.push(await this.testCSSContent(page));

    return results;
  }
}

