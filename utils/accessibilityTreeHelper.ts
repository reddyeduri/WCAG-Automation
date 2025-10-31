import { Page } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';

export interface AccessibilityNode {
  role: string;
  name: string;
  value?: string;
  description?: string;
  children?: AccessibilityNode[];
  level?: number;
}

export class AccessibilityTreeHelper {
  /**
   * Get accessibility snapshot (approximates NVDA output)
   */
  static async getAccessibilitySnapshot(page: Page): Promise<AccessibilityNode | null> {
    try {
      const snapshot = await page.accessibility.snapshot();
      return snapshot as AccessibilityNode | null;
    } catch (error) {
      console.error('Failed to get accessibility snapshot:', error);
      return null;
    }
  }

  /**
   * Validate landmarks exist (WCAG 1.3.1, 2.4.1)
   */
  static async testLandmarks(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    const snapshot = await this.getAccessibilitySnapshot(page);

    if (!snapshot) {
      return this.createFailedResult(
        '1.3.1',
        'Info and Relationships',
        'Perceivable',
        'Could not analyze accessibility tree',
        page.url()
      );
    }

    // Check for required landmarks
    const landmarks = this.findNodesByRole(snapshot, [
      'banner',
      'main',
      'navigation',
      'contentinfo'
    ]);

    const requiredLandmarks = {
      'main': 'Main content landmark',
      'navigation': 'Navigation landmark',
    };

    for (const [role, description] of Object.entries(requiredLandmarks)) {
      const found = landmarks.some(node => node.role === role);
      if (!found) {
        // Provide example HTML for the missing landmark
        const exampleHtml = role === 'main' 
          ? '<main id="wb-main">\n  <!-- Main content here -->\n</main>'
          : `<nav role="navigation" aria-label="Main navigation">\n  <!-- Navigation links here -->\n</nav>`;
        
        issues.push({
          description: `Missing ${description} (role="${role}")`,
          severity: 'serious',
          element: exampleHtml,
          help: 'Page should have semantic landmarks for screen reader navigation. This is a page-wide issue affecting the entire document structure.',
          wcagTags: ['wcag2a', 'wcag131', 'wcag241'],
          target: [`[role="${role}"], main, nav`] // Generic selector for guidance
        });
      }
    }

    return {
      criterionId: '1.3.1',
      criterionTitle: 'Info and Relationships',
      principle: 'Perceivable',
      level: 'A',
      testType: 'a11y-tree',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Validate all interactive elements have accessible names
   */
  static async testAccessibleNames(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    const snapshot = await this.getAccessibilitySnapshot(page);

    if (!snapshot) {
      return this.createFailedResult(
        '4.1.2',
        'Name, Role, Value',
        'Robust',
        'Could not analyze accessibility tree',
        page.url()
      );
    }

    // Find interactive elements without names
    const interactiveRoles = [
      'button',
      'link',
      'textbox',
      'combobox',
      'checkbox',
      'radio',
      'menuitem',
      'tab',
      'option'
    ];

    const interactiveElements = this.findNodesByRole(snapshot, interactiveRoles);

    // Find actual DOM elements for elements missing accessible names
    const elementsWithoutNames = await page.evaluate(() => {
      // @ts-ignore - runs in browser context
      // Generate full path selector for any element
      function getFullPathSelector(el: HTMLElement): string {
        const path: string[] = [];
        let current: HTMLElement | null = el;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let selector = current.tagName.toLowerCase();
          if (current.id) {
            selector += `#${current.id}`;
            path.unshift(selector);
            break;
          } else {
            const parent = current.parentNode;
            if (parent) {
              const siblings = Array.from(parent.children).filter(child => child.tagName === current!.tagName);
              if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
              }
            }
          }
          path.unshift(selector);
          current = current.parentElement;
        }
        return path.join(' > ');
      }
      
      const results: { role: string; html: string; selector: string; accessibleName: string }[] = [];
      
      // Search for elements with these roles that might be missing accessible names
      const roleSelectors: Record<string, string> = {
        'button': 'button, [role="button"]',
        'link': 'a[href], [role="link"]',
        'textbox': 'input[type="text"], input[type="email"], textarea, [role="textbox"]',
        'combobox': 'select, [role="combobox"]',
        'checkbox': 'input[type="checkbox"], [role="checkbox"]',
        'radio': 'input[type="radio"], [role="radio"]',
        'menuitem': '[role="menuitem"]',
        'tab': '[role="tab"]',
        'option': 'option'
      };
      
      for (const [role, selector] of Object.entries(roleSelectors)) {
        const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
        for (const el of elements.slice(0, 50)) { // Check up to 50 per role
          // Check for accessible name
          const ariaLabel = el.getAttribute('aria-label');
          const title = el.getAttribute('title');
          const placeholder = (el as HTMLInputElement).placeholder || '';
          const textContent = el.textContent?.trim() || '';
          const imgAlt = (el.querySelector('img') as HTMLImageElement)?.alt || '';
          
          // Determine accessible name
          let accessibleName = ariaLabel || title || placeholder || imgAlt || textContent || '';
          
          // For inputs, check for associated label
          if (!accessibleName && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
            const id = el.id;
            if (id) {
              const label = document.querySelector(`label[for="${id}"]`);
              accessibleName = label?.textContent?.trim() || '';
            }
            // Also check if label wraps the input
            if (!accessibleName) {
              const parentLabel = el.closest('label');
              accessibleName = parentLabel?.textContent?.trim() || '';
            }
          }
          
          // If no accessible name at all, it's definitely an issue
          if (!accessibleName || accessibleName.trim().length === 0) {
            results.push({
              role,
              html: el.outerHTML.slice(0, 500), // Increased to 500 chars for better context
              selector: getFullPathSelector(el),
              accessibleName: ''
            });
          }
        }
      }
      
      return results;
    }).catch(() => []);

    // Report all DOM elements that are missing accessible names (not just matching accessibility tree)
    // This ensures we report actual elements, not just example HTML
    if (elementsWithoutNames.length > 0) {
      // Group by role for better organization
      const byRole = elementsWithoutNames.reduce((acc, el) => {
        if (!acc[el.role]) acc[el.role] = [];
        acc[el.role].push(el);
        return acc;
      }, {} as Record<string, typeof elementsWithoutNames>);
      
      // Create one issue per element (or group similar ones)
      for (const [role, elements] of Object.entries(byRole)) {
        // Report each element individually for clarity
        for (const element of elements.slice(0, 10)) { // Limit to first 10 per role to avoid too many issues
          issues.push({
            description: `Interactive element (${role}) missing accessible name`,
            severity: 'critical',
            element: element.html,
            target: [element.selector],
            help: 'All interactive elements must have accessible names (aria-label, title, associated label, or visible text)',
            wcagTags: ['wcag2a', 'wcag412']
          });
        }
      }
    }
    
    // Also check accessibility tree for any additional issues not caught by DOM search
    for (const node of interactiveElements) {
      if (!node.name || node.name.trim() === '') {
        // Only add if we haven't already reported elements with this role
        const alreadyReported = issues.some(issue => 
          issue.description.includes(node.role) && issue.target && issue.target.length > 0
        );
        
        if (!alreadyReported) {
          // Find matching DOM element if available
          const matchingElement = elementsWithoutNames.find(el => el.role === node.role);
          
          if (matchingElement) {
            issues.push({
              description: `Interactive element (${node.role}) missing accessible name`,
              severity: 'critical',
              element: matchingElement.html,
              target: [matchingElement.selector],
              help: 'All interactive elements must have accessible names (aria-label, title, or associated label text)',
              wcagTags: ['wcag2a', 'wcag412']
            });
          }
        }
      }
    }

    return {
      criterionId: '4.1.2',
      criterionTitle: 'Name, Role, Value',
      principle: 'Robust',
      level: 'A',
      testType: 'a11y-tree',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test status messages (4.1.3)
   */
  static async testStatusMessages(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    const snapshot = await this.getAccessibilitySnapshot(page);

    if (!snapshot) {
      return this.createFailedResult(
        '4.1.3',
        'Status Messages',
        'Robust',
        'Could not analyze accessibility tree',
        page.url()
      );
    }

    // Check for live regions and status roles
    const statusRoles = ['status', 'alert', 'log'];
    const statusNodes = this.findNodesByRole(snapshot, statusRoles);

    // Also check for aria-live attributes via DOM
    const liveRegions = await page.$$eval('[aria-live]', elements =>
      elements.map(el => ({
        ariaLive: el.getAttribute('aria-live'),
        role: el.getAttribute('role'),
        content: el.textContent?.substring(0, 50)
      }))
    );

    // This is informational - we can't easily test if status messages are properly announced
    // Flag as warning if no status/live regions found
    if (statusNodes.length === 0 && liveRegions.length === 0) {
      issues.push({
        description: 'No status messages or live regions detected',
        severity: 'minor',
        help: 'Consider if status updates need aria-live regions for screen reader announcements',
        wcagTags: ['wcag2aa', 'wcag413']
      });
    }

    return {
      criterionId: '4.1.3',
      criterionTitle: 'Status Messages',
      principle: 'Robust',
      level: 'AA',
      testType: 'a11y-tree',
      status: issues.length > 0 && issues.some(i => i.severity !== 'minor') ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Validate form controls have labels
   */
  static async testFormControlLabels(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    const snapshot = await this.getAccessibilitySnapshot(page);

    if (!snapshot) {
      return this.createFailedResult(
        '3.3.2',
        'Labels or Instructions',
        'Understandable',
        'Could not analyze accessibility tree',
        page.url()
      );
    }

    const formControlRoles = ['textbox', 'combobox', 'checkbox', 'radio', 'searchbox'];
    const formControls = this.findNodesByRole(snapshot, formControlRoles);

    for (const node of formControls) {
      if (!node.name || node.name.trim() === '') {
        issues.push({
          description: `Form control (${node.role}) missing label or accessible name`,
          severity: 'critical',
          element: node.role,
          help: 'All form controls must have associated labels',
          wcagTags: ['wcag2a', 'wcag332']
        });
      }
    }

    return {
      criterionId: '3.3.2',
      criterionTitle: 'Labels or Instructions',
      principle: 'Understandable',
      level: 'A',
      testType: 'a11y-tree',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Generate NVDA-like text output from accessibility tree
   */
  static async generateNVDAOutput(page: Page): Promise<string[]> {
    const snapshot = await this.getAccessibilitySnapshot(page);
    if (!snapshot) return ['Failed to generate accessibility snapshot'];

    const output: string[] = [];
    this.traverseTree(snapshot, output, 0);
    return output;
  }

  /**
   * Validate heading structure
   */
  static async testHeadingStructure(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    const snapshot = await this.getAccessibilitySnapshot(page);

    if (!snapshot) {
      return this.createFailedResult(
        '1.3.1',
        'Info and Relationships',
        'Perceivable',
        'Could not analyze accessibility tree',
        page.url()
      );
    }

    const headings = this.findNodesByRole(snapshot, ['heading']);
    
    if (headings.length === 0) {
      issues.push({
        description: 'No headings found on page',
        severity: 'serious',
        help: 'Pages should have a proper heading structure for navigation',
        wcagTags: ['wcag2a', 'wcag131']
      });
    } else {
      // Check heading levels are sequential
      const levels = headings
        .map(h => h.level)
        .filter(level => level !== undefined) as number[];

      if (levels.length > 0) {
        // Check if first heading is h1
        if (levels[0] !== 1) {
          issues.push({
            description: 'Page should start with h1 heading',
            severity: 'moderate',
            help: 'Heading structure should start with h1',
            wcagTags: ['wcag2a', 'wcag131']
          });
        }

        // Check for skipped levels
        for (let i = 1; i < levels.length; i++) {
          if (levels[i] > levels[i - 1] + 1) {
            issues.push({
              description: `Heading level skipped: h${levels[i - 1]} to h${levels[i]}`,
              severity: 'moderate',
              help: 'Heading levels should not skip (e.g., h2 to h4)',
              wcagTags: ['wcag2a', 'wcag131']
            });
          }
        }
      }
    }

    return {
      criterionId: '1.3.1',
      criterionTitle: 'Info and Relationships',
      principle: 'Perceivable',
      level: 'A',
      testType: 'a11y-tree',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  private static findNodesByRole(
    node: AccessibilityNode,
    roles: string[]
  ): AccessibilityNode[] {
    const results: AccessibilityNode[] = [];

    if (roles.includes(node.role)) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByRole(child, roles));
      }
    }

    return results;
  }

  private static traverseTree(
    node: AccessibilityNode,
    output: string[],
    depth: number
  ): void {
    const indent = '  '.repeat(depth);
    const nodeText = `${indent}${node.role}${node.name ? ` "${node.name}"` : ''}${
      node.value ? ` = ${node.value}` : ''
    }`;
    output.push(nodeText);

    if (node.children) {
      for (const child of node.children) {
        this.traverseTree(child, output, depth + 1);
      }
    }
  }

  private static createFailedResult(
    criterionId: string,
    title: string,
    principle: string,
    description: string,
    url: string
  ): TestResult {
    return {
      criterionId,
      criterionTitle: title,
      principle,
      level: 'A',
      testType: 'a11y-tree',
      status: 'fail',
      issues: [
        {
          description,
          severity: 'critical',
          help: 'Could not perform accessibility tree analysis'
        }
      ],
      timestamp: new Date().toISOString(),
      url
    };
  }
}

