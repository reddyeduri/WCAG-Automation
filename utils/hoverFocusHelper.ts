import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for testing hover and focus triggered content
 * Covers WCAG 2.1 Success Criterion 1.4.13
 */
export class HoverFocusHelper {
  /**
   * 1.4.13 Content on Hover or Focus
   * Tests: hoverable, dismissible, persistent
   */
  static async testContentOnHoverOrFocus(page: Page): Promise<TestResult> {
    const issues: Issue[] = [];

    // Test common tooltip/popover patterns
    const tooltipInfo = await page.evaluate(() => {
      const findings: any[] = [];

      // Find elements that trigger content on hover
      const triggers = Array.from(document.querySelectorAll(
        '[aria-describedby], [title], [data-tooltip], [data-popover], .tooltip-trigger, .has-tooltip'
      ));

      triggers.forEach(trigger => {
        const describedBy = trigger.getAttribute('aria-describedby');
        const title = trigger.getAttribute('title');
        
        let tooltipId = '';
        if (describedBy) {
          tooltipId = describedBy;
        } else if (trigger.getAttribute('data-tooltip')) {
          tooltipId = trigger.getAttribute('data-tooltip') || '';
        }

        findings.push({
          triggerHtml: trigger.outerHTML.slice(0, 200),
          tooltipId,
          hasTitle: !!title,
          triggerId: trigger.id || ''
        });
      });

      // Find CSS-based tooltips (::before, ::after with content)
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        const beforeContent = getComputedStyle(el, '::before').content;
        const afterContent = getComputedStyle(el, '::after').content;
        
        if ((beforeContent && beforeContent !== 'none' && beforeContent !== '""') ||
            (afterContent && afterContent !== 'none' && afterContent !== '""')) {
          findings.push({
            triggerHtml: (el as HTMLElement).outerHTML.slice(0, 200),
            hasCSSpseudo: true,
            triggerId: el.id || ''
          });
        }
      });

      return findings.slice(0, 20); // Limit for performance
    });

    // Test each tooltip for WCAG 1.4.13 requirements
    for (const info of tooltipInfo.slice(0, 10)) {
      try {
        // Find the trigger element
        const trigger = info.triggerId ? 
          page.locator(`#${info.triggerId}`).first() : 
          page.locator(`[aria-describedby="${info.tooltipId}"]`).first();

        if (await trigger.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Hover over trigger
          await trigger.hover({ timeout: 2000 }).catch(() => null);
          await page.waitForTimeout(300);

          // Check if tooltip appeared
          let tooltip = null;
          if (info.tooltipId) {
            tooltip = page.locator(`#${info.tooltipId}`).first();
          } else {
            // Try to find tooltip by common patterns
            tooltip = page.locator('[role="tooltip"], .tooltip, [data-tooltip-visible]').first();
          }

          const tooltipVisible = await tooltip?.isVisible({ timeout: 500 }).catch(() => false);

          if (tooltipVisible) {
            // Test 1: Dismissible - Can press Escape?
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
            const dismissedByEscape = !(await tooltip.isVisible({ timeout: 300 }).catch(() => false));

            if (!dismissedByEscape) {
              // Try moving mouse away
              await page.mouse.move(0, 0);
              await page.waitForTimeout(200);
              const dismissedByMove = !(await tooltip.isVisible({ timeout: 300 }).catch(() => false));

              if (!dismissedByMove) {
                issues.push({
                  description: 'Tooltip/popover not dismissible via Escape or mouse movement',
                  severity: 'serious',
                  element: info.triggerHtml,
                  help: 'Allow users to dismiss hover/focus content with Escape key',
                  wcagTags: ['wcag2aa', 'wcag1413']
                });
              }
            }

            // Re-trigger for next tests
            await trigger.hover().catch(() => null);
            await page.waitForTimeout(200);

            // Test 2: Hoverable - Can hover over tooltip content?
            if (tooltip && await tooltip.isVisible({ timeout: 300 }).catch(() => false)) {
              const box = await tooltip.boundingBox().catch(() => null);
              if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.waitForTimeout(200);
                const stillVisible = await tooltip.isVisible({ timeout: 300 }).catch(() => false);

                if (!stillVisible) {
                  issues.push({
                    description: 'Tooltip disappears when hovering over its content',
                    severity: 'serious',
                    element: info.triggerHtml,
                    help: 'Tooltip content should remain visible when pointer is over it',
                    wcagTags: ['wcag2aa', 'wcag1413']
                  });
                }
              }
            }

            // Test 3: Persistent - Check if it disappears too quickly
            await trigger.hover().catch(() => null);
            const appearTime = Date.now();
            await page.waitForTimeout(100);
            
            // Wait and see if tooltip is still visible
            await page.waitForTimeout(500);
            const persistentCheck = await tooltip?.isVisible({ timeout: 300 }).catch(() => false);
            
            // If it disappeared without user action in less than 1 second, it's problematic
            if (!persistentCheck && (Date.now() - appearTime < 1000)) {
              issues.push({
                description: 'Tooltip disappears too quickly without user dismissal',
                severity: 'moderate',
                element: info.triggerHtml,
                help: 'Tooltip should remain visible until user dismisses or moves focus/hover',
                wcagTags: ['wcag2aa', 'wcag1413']
              });
            }
          }

          // Reset mouse position
          await page.mouse.move(0, 0);
        }
      } catch (error) {
        // Skip elements that fail interaction
      }
    }

    // Special case: title attribute tooltips (not ideal but common)
    if (tooltipInfo.some((info: any) => info.hasTitle)) {
      issues.push({
        description: 'Elements using title attribute for tooltips - these are not reliably accessible',
        severity: 'moderate',
        element: 'Multiple elements with title attribute',
        help: 'Use ARIA or custom tooltips instead of title attribute for important information',
        wcagTags: ['wcag2aa', 'wcag1413']
      });
    }

    return {
      criterionId: '1.4.13',
      criterionTitle: 'Content on Hover or Focus',
      principle: 'Perceivable',
      level: 'AA',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }
}

