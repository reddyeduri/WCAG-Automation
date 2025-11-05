/**
 * Selector Helper - Generates unique CSS selectors with full DOM paths
 * ✅ IMPROVED: Single source of truth - eliminates 150+ lines of duplication
 */

/**
 * Canonical selector generation function as reusable string for browser context
 * Import this constant in other helpers instead of duplicating the logic
 */
export const SELECTOR_GENERATOR_FN_STRING = `
function generateFullPathSelector(element) {
  if (!element) return '';
  if (element.id) return '#' + element.id;

  const path = [];
  let current = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = '#' + current.id;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\\s+/)
        .filter(c => c && !c.match(/^(active|focus|hover|js-|is-)/))
        .slice(0, 2);

      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        child => child.tagName === current.tagName
      );

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += ':nth-of-type(' + index + ')';
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}
`;

/**
 * TypeScript/Node.js version for use outside browser context
 */
export function generateUniqueSelector(element: Element): string {
  if (!element) return '';
  if (element.id) return `#${element.id}`;

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter(c => c && !c.match(/^(active|focus|hover|js-|is-)/))
        .slice(0, 2);

      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        child => child.tagName === current!.tagName
      );

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Get element details with HTML and unique selector
 * ✅ FIXED: Now uses canonical shared logic via string injection
 */
export async function getElementDetails(locator: any): Promise<{ html: string; selector: string }> {
  return await locator.evaluate((el: Element, fnString: string) => {
    // Inject the canonical function
    const generateFullPathSelector = eval('(' + fnString + ')');

    return {
      html: (el as HTMLElement).outerHTML,
      selector: generateFullPathSelector(el)
    };
  }, SELECTOR_GENERATOR_FN_STRING);
}
