import { Page } from '@playwright/test';
import { TestResult, Issue } from '../utils/reportGenerator';

/**
 * Example: Creating custom WCAG tests
 * 
 * This file shows how to create your own WCAG test functions
 * that integrate with the reporting system
 */

/**
 * Custom test for 3.2.1 On Focus
 * Tests that focus does not trigger unexpected context changes
 */
export async function testOnFocus(page: Page): Promise<TestResult> {
  const issues: Issue[] = [];
  
  // Get current URL
  const initialUrl = page.url();
  
  // Find all focusable elements
  const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  
  for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
    const element = focusableElements[i];
    
    // Focus the element
    await element.focus();
    
    // Wait a bit for any side effects
    await page.waitForTimeout(100);
    
    // Check if URL changed unexpectedly
    const currentUrl = page.url();
    if (currentUrl !== initialUrl) {
      const tagName = await element.evaluate(el => el.tagName);
      const id = await element.evaluate(el => el.id);
      
      issues.push({
        description: `Focus on element caused unexpected navigation: ${tagName}${id ? `#${id}` : ''}`,
        severity: 'serious',
        element: `${tagName}${id ? `#${id}` : ''}`,
        help: 'Focus should not trigger context changes',
        wcagTags: ['wcag2a', 'wcag321']
      });
      
      // Navigate back
      await page.goto(initialUrl);
    }
    
    // Check for new windows/tabs (can't directly detect, but can check for popups)
    const hasPopup = await page.evaluate(() => {
      return document.querySelectorAll('[role="dialog"]:not([hidden])').length > 0;
    });
    
    if (hasPopup) {
      // This might be legitimate, so just warn
      issues.push({
        description: 'Focus triggered a dialog - verify this is intentional',
        severity: 'minor',
        help: 'Dialogs should typically open on click, not focus',
        wcagTags: ['wcag2a', 'wcag321']
      });
    }
  }
  
  return {
    criterionId: '3.2.1',
    criterionTitle: 'On Focus',
    principle: 'Understandable',
    level: 'A',
    testType: 'automated',
    status: issues.filter(i => i.severity !== 'minor').length > 0 ? 'fail' : 'pass',
    issues,
    timestamp: new Date().toISOString(),
    url: page.url()
  };
}

/**
 * Custom test for 3.2.2 On Input
 * Tests that input does not trigger unexpected context changes
 */
export async function testOnInput(page: Page): Promise<TestResult> {
  const issues: Issue[] = [];
  
  const initialUrl = page.url();
  
  // Find all input elements
  const inputs = await page.$$('input, select, textarea');
  
  for (let i = 0; i < Math.min(inputs.length, 10); i++) {
    const input = inputs[i];
    const tagName = await input.evaluate(el => el.tagName);
    const type = await input.evaluate(el => el.getAttribute('type'));
    const id = await input.evaluate(el => el.id);
    
    // Skip submit buttons
    if (type === 'submit' || type === 'button') continue;
    
    await input.focus();
    
    // Type or select
    if (tagName === 'SELECT') {
      await input.selectOption({ index: 1 });
    } else if (tagName === 'INPUT' && type === 'checkbox') {
      await input.check();
    } else {
      await input.fill('test');
    }
    
    await page.waitForTimeout(100);
    
    // Check for context change
    const currentUrl = page.url();
    if (currentUrl !== initialUrl) {
      issues.push({
        description: `Input on ${tagName} caused unexpected navigation`,
        severity: 'serious',
        element: `${tagName}${id ? `#${id}` : ''}`,
        help: 'Input should not automatically trigger context changes',
        wcagTags: ['wcag2a', 'wcag322']
      });
      
      await page.goto(initialUrl);
    }
  }
  
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
 * Custom test for 1.4.4 Resize Text
 * Tests that text can be resized up to 200% without loss of content or functionality
 */
export async function testResizeText(page: Page): Promise<TestResult> {
  const issues: Issue[] = [];
  
  // Take initial viewport
  const originalViewport = page.viewportSize();
  
  // Get initial text sizes
  const initialSizes = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a'));
    return elements.map(el => ({
      fontSize: window.getComputedStyle(el).fontSize,
      overflow: window.getComputedStyle(el).overflow
    }));
  });
  
  // Zoom to 200%
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  
  await page.waitForTimeout(500);
  
  // Check for overflow or clipping
  const hasOverflow = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.some(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.overflow === 'hidden' && (
        el.scrollWidth > rect.width ||
        el.scrollHeight > rect.height
      );
    });
  });
  
  if (hasOverflow) {
    issues.push({
      description: 'Content is clipped or hidden when text is resized to 200%',
      severity: 'serious',
      help: 'Text should be resizable up to 200% without loss of content',
      wcagTags: ['wcag2aa', 'wcag144']
    });
  }
  
  // Reset zoom
  await page.evaluate(() => {
    document.body.style.zoom = '1';
  });
  
  return {
    criterionId: '1.4.4',
    criterionTitle: 'Resize Text',
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
 * Custom test for 2.4.3 Focus Order
 * Tests that focus order is logical and meaningful
 */
export async function testFocusOrder(page: Page): Promise<TestResult> {
  const issues: Issue[] = [];
  
  // Get all focusable elements and their positions
  const focusableElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    
    return elements
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el, index) => {
        const rect = el.getBoundingClientRect();
        return {
          index,
          tag: el.tagName,
          id: el.id,
          x: rect.left,
          y: rect.top,
          tabIndex: el.tabIndex
        };
      });
  });
  
  // Check if focus order follows visual order (top to bottom, left to right)
  for (let i = 1; i < focusableElements.length; i++) {
    const prev = focusableElements[i - 1];
    const curr = focusableElements[i];
    
    // If current element is significantly above previous element
    if (curr.y < prev.y - 50 && curr.x < prev.x) {
      issues.push({
        description: `Focus order may not follow visual order: ${curr.tag}${curr.id ? `#${curr.id}` : ''} appears before ${prev.tag} but is positioned above`,
        severity: 'moderate',
        element: `${curr.tag}${curr.id ? `#${curr.id}` : ''}`,
        help: 'Focus order should follow meaningful sequence',
        wcagTags: ['wcag2a', 'wcag243']
      });
    }
  }
  
  return {
    criterionId: '2.4.3',
    criterionTitle: 'Focus Order',
    principle: 'Operable',
    level: 'A',
    testType: 'automated',
    status: issues.length > 0 ? 'warning' : 'pass',
    issues,
    timestamp: new Date().toISOString(),
    url: page.url()
  };
}

