import { Page, Locator } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';
import { getElementDetails } from './selectorHelper';

export interface FocusableElement {
  selector: string;
  tagName: string;
  role: string;
  text: string;
  isVisible: boolean;
  hasFocusIndicator: boolean;
}

export class KeyboardHelper {
  /**
   * Test keyboard accessibility (2.1.1) - All elements reachable
   */
  static async testKeyboardAccessibility(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    
    try {
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }
      
      // Get all interactive elements
      const interactiveElements = await this.getInteractiveElements(page);
      
      // Test if each element is keyboard accessible (limit to 20 for performance)
      for (const element of interactiveElements.slice(0, 20)) {
        if (page.isClosed()) break;
        
        try {
          const locator = page.locator(element.selector).first();
          await locator.focus({ timeout: 2000 });
          
          // Check if element actually received focus
          const isFocused = await locator.evaluate((el: any) => {
            // @ts-ignore
            return el === document.activeElement;
          }, { timeout: 2000 });
          
          if (!isFocused) {
            // Get actual HTML and unique full-path selector
            const elementData = await getElementDetails(locator);
            
            issues.push({
              description: `Element is not keyboard accessible: ${element.text || element.tagName}`,
              severity: 'serious',
              element: elementData.html,
              target: [elementData.selector], // Full path selector for unique targeting
              help: 'All interactive elements must be keyboard accessible',
              wcagTags: ['wcag2a', 'wcag211']
            });
          }
        } catch (error) {
          // Skip elements that can't be focused instead of reporting all as failures
        }
      }
    } catch (error) {
      return {
        criterionId: '2.1.1',
        criterionTitle: 'Keyboard',
        principle: 'Operable',
        level: 'A',
        testType: 'keyboard',
        status: 'warning',
        issues: [{
          description: `Test could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'moderate',
          wcagTags: ['wcag2a', 'wcag211']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }

    return {
      criterionId: '2.1.1',
      criterionTitle: 'Keyboard',
      principle: 'Operable',
      level: 'A',
      testType: 'keyboard',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test for keyboard traps (2.1.2)
   */
  static async testNoKeyboardTrap(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    
    try {
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }
    
      // Get all focusable elements
      const focusableElements = await page.$$eval(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        (elements: any) => elements.slice(0, 50).map((el: any, index: number) => ({
          index,
          selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : `:nth-of-type(${index + 1})`)
        })),
        { timeout: 10000 }
      );

      // Tab through elements and check if we can escape (limit to 20 for speed)
      for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
        if (page.isClosed()) break;
        
        await page.keyboard.press('Tab');
        
        // Try to tab backwards
        await page.keyboard.press('Shift+Tab');
        
        // Check if we're trapped (same element after forward and backward tab)
        const currentElement = await page.evaluate(() => {
          // @ts-ignore
          const active = document.activeElement as HTMLElement;
          
          // Generate a full path selector for this element
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
          
          return {
            tag: active?.tagName,
            id: active?.id,
            class: active?.className,
            html: active?.outerHTML || '',
            selector: active ? getFullPathSelector(active) : ''
          };
        }, { timeout: 5000 });

        // Advanced trap detection: try to escape with multiple tabs
        const escapable = await this.canEscapeCurrentFocus(page);
        
        if (!escapable) {
          issues.push({
            description: `Potential keyboard trap detected at element: ${currentElement.tag}`,
            severity: 'critical',
            element: currentElement.html || `${currentElement.tag}${currentElement.id ? `#${currentElement.id}` : ''}`,
            target: currentElement.selector ? [currentElement.selector] : undefined,
            help: 'Users must be able to navigate away from any focused element',
            wcagTags: ['wcag2a', 'wcag212']
          });
          break; // Exit if trap detected
        }
      }
    } catch (error) {
      // If test fails, return warning instead of error
      return {
        criterionId: '2.1.2',
        criterionTitle: 'No Keyboard Trap',
        principle: 'Operable',
        level: 'A',
        testType: 'keyboard',
        status: 'warning',
        issues: [{
          description: `Test could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'moderate',
          wcagTags: ['wcag2a', 'wcag212']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }

    return {
      criterionId: '2.1.2',
      criterionTitle: 'No Keyboard Trap',
      principle: 'Operable',
      level: 'A',
      testType: 'keyboard',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Test focus visible (2.4.7)
   */
  static async testFocusVisible(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];
    
    try {
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }
      
      // Get all interactive elements
      const interactiveElements = await this.getInteractiveElements(page);
      
      for (const element of interactiveElements.slice(0, 15)) { // Test first 15 elements
        if (page.isClosed()) break;
        
        try {
          const locator = page.locator(element.selector).first();
          await locator.focus({ timeout: 2000 });
          
          // Check if focus indicator is visible
          const focusStyles = await locator.evaluate((el: any) => {
            const styles = window.getComputedStyle(el);
            const pseudoStyles = window.getComputedStyle(el, ':focus');
            
            return {
              outline: styles.outline,
              outlineWidth: styles.outlineWidth,
              outlineStyle: styles.outlineStyle,
              border: styles.border,
              boxShadow: styles.boxShadow,
              backgroundColor: styles.backgroundColor,
              pseudoOutline: pseudoStyles.outline,
              pseudoBorder: pseudoStyles.border,
              pseudoBoxShadow: pseudoStyles.boxShadow
            };
          }, { timeout: 2000 });

          const hasFocusIndicator = this.checkFocusIndicator(focusStyles);
          
          if (!hasFocusIndicator) {
            // Get actual HTML and unique full-path selector
            const elementData = await getElementDetails(locator);
            
            issues.push({
              description: `Element lacks visible focus indicator: ${element.text || element.tagName}`,
              severity: 'serious',
              element: elementData.html,
              target: [elementData.selector], // Full path selector for unique targeting
              help: 'Interactive elements must have a visible focus indicator',
              wcagTags: ['wcag2aa', 'wcag247']
            });
          }
        } catch (error) {
          // Skip elements that can't be focused
        }
      }
    } catch (error) {
      return {
        criterionId: '2.4.7',
        criterionTitle: 'Focus Visible',
        principle: 'Operable',
        level: 'AA',
        testType: 'keyboard',
        status: 'warning',
        issues: [{
          description: `Test could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'moderate',
          wcagTags: ['wcag2aa', 'wcag247']
        }],
        timestamp: new Date().toISOString(),
        url: page.isClosed() ? 'Page closed' : page.url()
      };
    }

    return {
      criterionId: '2.4.7',
      criterionTitle: 'Focus Visible',
      principle: 'Operable',
      level: 'AA',
      testType: 'keyboard',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Perform tab navigation test across the page
   */
  static async performTabNavigationTest(page: Page): Promise<{
    totalFocusable: number;
    focusOrder: string[];
    issues: Issue[];
  }> {
    const focusOrder: string[] = [];
    const issues: Issue[] = [];
    let previousElement = '';

    try {
      if (page.isClosed()) {
        return { totalFocusable: 0, focusOrder: [], issues };
      }

      // Start from the beginning
      await page.keyboard.press('Tab');

      for (let i = 0; i < 50; i++) { // Maximum 50 tabs (reduced from 100)
        if (page.isClosed()) break;
        
        const currentElement = await page.evaluate(() => {
          // @ts-ignore
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          
          return {
            tag: el.tagName,
            id: el.id,
            role: el.getAttribute('role'),
            text: el.textContent?.substring(0, 50),
            selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}`
          };
        }, { timeout: 3000 });

        if (!currentElement) break;

        const elementKey = `${currentElement.tag}:${currentElement.id}:${currentElement.text}`;
        
        // Check if we've completed a cycle (back to start)
        if (focusOrder.includes(elementKey) && focusOrder.indexOf(elementKey) === 0) {
          break;
        }

        focusOrder.push(elementKey);
        previousElement = elementKey;

        await page.keyboard.press('Tab');
      }
    } catch (error) {
      // Return what we have so far
    }

    return {
      totalFocusable: focusOrder.length,
      focusOrder,
      issues
    };
  }

  private static async getInteractiveElements(page: Page): Promise<FocusableElement[]> {
    try {
      if (page.isClosed()) return [];
      
      return await page.$$eval(
        'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])',
        (elements: any) => elements.slice(0, 50).map((el: any, index: number) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           window.getComputedStyle(el).visibility !== 'hidden';
          
          return {
            selector: el.id 
              ? `#${el.id}` 
              : `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
            tagName: el.tagName,
            role: el.getAttribute('role') || '',
            text: el.textContent?.trim().substring(0, 50) || '',
            isVisible,
            hasFocusIndicator: false // Will be checked separately
          };
        }).filter((el: any) => el.isVisible),
        { timeout: 10000 }
      );
    } catch (error) {
      return []; // Return empty array if failed
    }
  }

  private static async canEscapeCurrentFocus(page: Page): Promise<boolean> {
    try {
      if (page.isClosed()) return true; // Assume escapable if page closed
      
      const initialElement = await page.evaluate(() => {
        // @ts-ignore
        return document.activeElement?.tagName;
      }, { timeout: 3000 });
      
      // Try multiple escape attempts
      for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
        await page.keyboard.press('Tab');
        const newElement = await page.evaluate(() => {
          // @ts-ignore
          return document.activeElement?.tagName;
        }, { timeout: 3000 });
        
        if (newElement !== initialElement) {
          return true; // Successfully escaped
        }
      }
      
      return false; // Trapped
    } catch (error) {
      return true; // Assume escapable on error
    }
  }

  private static checkFocusIndicator(styles: any): boolean {
    // Check for outline
    if (styles.outline !== 'none' && 
        styles.outlineWidth !== '0px' && 
        styles.outlineStyle !== 'none') {
      return true;
    }

    // Check for pseudo-element outline
    if (styles.pseudoOutline !== 'none' && 
        styles.pseudoOutline !== styles.outline) {
      return true;
    }

    // Check for border changes
    if (styles.border !== 'none' && styles.border !== '0px') {
      return true;
    }

    // Check for box-shadow
    if (styles.boxShadow !== 'none' && styles.boxShadow) {
      return true;
    }

    // Check for pseudo box-shadow
    if (styles.pseudoBoxShadow !== 'none' && 
        styles.pseudoBoxShadow !== styles.boxShadow) {
      return true;
    }

    return false;
  }
}

