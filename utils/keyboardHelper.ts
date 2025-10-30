import { Page, Locator } from '@playwright/test';
import { TestResult, Issue } from './reportGenerator';

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
    
    // Get all interactive elements
    const interactiveElements = await this.getInteractiveElements(page);
    
    // Test if each element is keyboard accessible
    for (const element of interactiveElements) {
      try {
        const locator = page.locator(element.selector).first();
        await locator.focus({ timeout: 2000 });
        
        // Check if element actually received focus
        const isFocused = await locator.evaluate(el => el === document.activeElement);
        
        if (!isFocused) {
          issues.push({
            description: `Element is not keyboard accessible: ${element.text || element.tagName}`,
            severity: 'serious',
            element: element.selector,
            help: 'All interactive elements must be keyboard accessible',
            wcagTags: ['wcag2a', 'wcag211']
          });
        }
      } catch (error) {
        issues.push({
          description: `Cannot focus element: ${element.text || element.tagName}`,
          severity: 'serious',
          element: element.selector,
          help: 'Element should be focusable via keyboard',
          wcagTags: ['wcag2a', 'wcag211']
        });
      }
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
    
    // Get all focusable elements
    const focusableElements = await page.$$eval(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      elements => elements.map((el, index) => ({
        index,
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : `:nth-of-type(${index + 1})`)
      }))
    );

    // Tab through all elements and check if we can escape
    for (let i = 0; i < Math.min(focusableElements.length, 50); i++) {
      await page.keyboard.press('Tab');
      
      // Try to tab backwards
      await page.keyboard.press('Shift+Tab');
      
      // Check if we're trapped (same element after forward and backward tab)
      const currentElement = await page.evaluate(() => {
        const active = document.activeElement;
        return {
          tag: active?.tagName,
          id: active?.id,
          class: active?.className
        };
      });

      // Advanced trap detection: try to escape with multiple tabs
      const escapable = await this.canEscapeCurrentFocus(page);
      
      if (!escapable) {
        issues.push({
          description: `Potential keyboard trap detected at element: ${currentElement.tag}`,
          severity: 'critical',
          element: `${currentElement.tag}${currentElement.id ? `#${currentElement.id}` : ''}`,
          help: 'Users must be able to navigate away from any focused element',
          wcagTags: ['wcag2a', 'wcag212']
        });
        break; // Exit if trap detected
      }
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
    
    // Get all interactive elements
    const interactiveElements = await this.getInteractiveElements(page);
    
    for (const element of interactiveElements.slice(0, 20)) { // Test first 20 elements
      try {
        const locator = page.locator(element.selector).first();
        await locator.focus({ timeout: 2000 });
        
        // Check if focus indicator is visible
        const focusStyles = await locator.evaluate(el => {
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
        });

        const hasFocusIndicator = this.checkFocusIndicator(focusStyles);
        
        if (!hasFocusIndicator) {
          issues.push({
            description: `Element lacks visible focus indicator: ${element.text || element.tagName}`,
            severity: 'serious',
            element: element.selector,
            help: 'Interactive elements must have a visible focus indicator',
            wcagTags: ['wcag2aa', 'wcag247']
          });
        }
      } catch (error) {
        // Skip elements that can't be focused
      }
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

    // Start from the beginning
    await page.keyboard.press('Tab');

    for (let i = 0; i < 100; i++) { // Maximum 100 tabs
      const currentElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        
        return {
          tag: el.tagName,
          id: el.id,
          role: el.getAttribute('role'),
          text: el.textContent?.substring(0, 50),
          selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}`
        };
      });

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

    return {
      totalFocusable: focusOrder.length,
      focusOrder,
      issues
    };
  }

  private static async getInteractiveElements(page: Page): Promise<FocusableElement[]> {
    return await page.$$eval(
      'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])',
      elements => elements.map((el, index) => {
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
      }).filter(el => el.isVisible)
    );
  }

  private static async canEscapeCurrentFocus(page: Page): Promise<boolean> {
    const initialElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Try multiple escape attempts
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const newElement = await page.evaluate(() => document.activeElement?.tagName);
      
      if (newElement !== initialElement) {
        return true; // Successfully escaped
      }
    }
    
    return false; // Trapped
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

