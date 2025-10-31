/**
 * Selector Helper - Generates unique CSS selectors with full DOM paths
 */

/**
 * Generate a unique CSS selector for an element with full DOM path
 * Example: #main > div.container > nav > a:nth-of-type(2)
 */
export function generateUniqueSelector(element: Element): string {
  // If element has ID, use it (most specific)
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    
    // Add ID if available
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break; // Stop here, ID is unique
    }
    
    // Add classes (filter out empty and dynamic classes)
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter(c => c && !c.match(/^(active|focus|hover|js-|is-)/) ) // Exclude dynamic classes
        .slice(0, 2); // Limit to first 2 classes
      
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    // Add nth-of-type if there are siblings of the same type
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
 * Get element details including HTML and unique selector
 */
export async function getElementDetails(locator: any): Promise<{ html: string; selector: string }> {
  return await locator.evaluate((el: Element) => {
    // Import the selector generator into the browser context
    const generateSelector = (element: Element): string => {
      if (element.id) {
        return `#${element.id}`;
      }

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
    };

    return {
      html: (el as HTMLElement).outerHTML,
      selector: generateSelector(el)
    };
  });
}

