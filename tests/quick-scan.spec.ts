import { test, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { AxeHelper } from '../utils/axeHelper';
import { KeyboardHelper } from '../utils/keyboardHelper';
import { AccessibilityTreeHelper } from '../utils/accessibilityTreeHelper';
import { ManualTestFlags } from '../utils/manualTestFlags';
import { ComprehensiveReportGenerator } from '../utils/comprehensiveReportGenerator';
import { ResponsiveHelper } from '../utils/responsiveHelper';
import { WCAG22Helper } from '../utils/wcag22Helper';
import { WCAGAdvancedHelper } from '../utils/wcagAdvancedHelper';
import { MeaningfulSequenceHelper } from '../utils/meaningfulSequenceHelper';
import type { TestResult } from '../utils/reportGenerator';

/**
 * Comprehensive WCAG 2.1 Quick Scan
 * Shows status of ALL WCAG criteria from your list
 * 
 * Usage: 
 * Windows: $env:BASE_URL="https://www.winnipeg.ca/"; npm run quick-scan
 * Mac/Linux: BASE_URL=https://www.winnipeg.ca/ npm run quick-scan
 */

const targetUrl = process.env.BASE_URL || process.env.SCAN_URL || 'https://www.w3.org/WAI/';

test.describe(`Comprehensive WCAG 2.1 Scan: ${targetUrl}`, () => {
  test('Run ALL WCAG 2.1 Tests', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name.replace(/\s+/g, '-').toLowerCase();
    const reportDir = path.join('reports', 'quick-scan', projectName);
    const reportGen = new ComprehensiveReportGenerator(reportDir);
    reportGen.setTestedUrl(targetUrl);
    const artifactsDir = path.join(reportDir, 'artifacts');

    const addResults = async (results: TestResult[]) => {
      for (const result of results) {
        await enrichResultWithArtifacts(page, result, artifactsDir, reportDir);
      }
      reportGen.addResults(results);
    };

    console.log(`\n🔍 Starting comprehensive WCAG 2.1 accessibility scan...`);
    console.log(`🌐 URL: ${targetUrl}\n`);

    // Navigate with wait - use 'domcontentloaded' for faster/more reliable loading
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      // Wait for page to settle
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log(`⚠ Navigation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue anyway - page may have partially loaded
    }

    // Close common overlays / cookie banners
    const dismissSelectors = [
      'button:has-text("Close")',
      'button:has-text("Accept")',
      'button:has-text("Allow all")',
      '#onetrust-accept-btn-handler',
      '[aria-label="Close"]',
      '[aria-label="Dismiss"]',
      '[data-testid="close-button"]'
    ];

    for (const selector of dismissSelectors) {
      const control = page.locator(selector).first();
      if (await control.isVisible({ timeout: 1000 }).catch(() => false)) {
        await control.click({ timeout: 1000 }).catch(() => undefined);
        await page.waitForTimeout(300);
      }
    }

    // === AUTOMATED TESTS ===
    console.log('📊 Running comprehensive axe-core scan (all WCAG rules)...');
    const results = await AxeHelper.runAxeScan(page, { wcagLevel: 'AA' });
    await addResults(results);
    console.log(`   ✓ Found ${results.length} testable criteria`);

    // Test specific critical criteria
    console.log('\n🎨 Testing Perceivable criteria...');
    const altText = await AxeHelper.testAltText(page);
    await addResults([altText]);
    console.log(`   • 1.1.1 Alt Text: ${altText.status}`);

    const meaningfulSequence = await MeaningfulSequenceHelper.testMeaningfulSequence(page);
    await addResults([meaningfulSequence]);
    console.log(`   • 1.3.2 Meaningful Sequence: ${meaningfulSequence.status}`);

    const contrast = await AxeHelper.testColorContrast(page);
    await addResults([contrast]);
    console.log(`   • 1.4.3 Contrast: ${contrast.status}`);

    const headings = await AxeHelper.testHeadingHierarchy(page);
    await addResults([headings]);
    console.log(`   • 1.3.1 Headings: ${headings.status}`);

    // === KEYBOARD TESTS ===
    console.log('\n⌨️  Testing Operable criteria (Keyboard)...');
    const keyboardResult = await KeyboardHelper.testKeyboardAccessibility(page);
    await addResults([keyboardResult]);
    console.log(`   • 2.1.1 Keyboard: ${keyboardResult.status}`);

    const trapResult = await KeyboardHelper.testNoKeyboardTrap(page);
    await addResults([trapResult]);
    console.log(`   • 2.1.2 No Trap: ${trapResult.status}`);

    const focusResult = await KeyboardHelper.testFocusVisible(page);
    await addResults([focusResult]);
    console.log(`   • 2.4.7 Focus Visible: ${focusResult.status}`);

    const skipLinks = await AxeHelper.testSkipLinks(page);
    await addResults([skipLinks]);
    console.log(`   • 2.4.1 Skip Links: ${skipLinks.status}`);

    const pageTitle = await AxeHelper.testPageTitle(page);
    await addResults([pageTitle]);
    console.log(`   • 2.4.2 Page Title: ${pageTitle.status}`);

    // === UNDERSTANDABLE TESTS ===
    console.log('\n📝 Testing Understandable criteria...');
    const formLabels = await AxeHelper.testFormLabels(page);
    await addResults([formLabels]);
    console.log(`   • 3.3.2 Form Labels: ${formLabels.status}`);

    // === ROBUST TESTS ===
    console.log('\n🔧 Testing Robust criteria...');
    const aria = await AxeHelper.testARIA(page);
    await addResults([aria]);
    console.log(`   • 4.1.2 ARIA: ${aria.status}`);

    // === ACCESSIBILITY TREE ===
    console.log('\n🌳 Testing Accessibility Tree (NVDA approximation)...');
    const landmarks = await AccessibilityTreeHelper.testLandmarks(page);
    await addResults([landmarks]);
    console.log(`   • Landmarks: ${landmarks.status}`);

    const accessibleNames = await AccessibilityTreeHelper.testAccessibleNames(page);
    await addResults([accessibleNames]);
    console.log(`   • Accessible Names: ${accessibleNames.status}`);

    const statusMessages = await AccessibilityTreeHelper.testStatusMessages(page);
    await addResults([statusMessages]);
    console.log(`   • 4.1.3 Status Messages: ${statusMessages.status}`);

    console.log('\n📱 Testing responsiveness (zoom + spacing)...');
    const zoomResults = await ResponsiveHelper.testZoomAndReflow(page);
    await addResults(zoomResults);
    zoomResults.forEach(r => console.log(`   • ${r.criterionId} ${r.criterionTitle}: ${r.status}`));

    const textSpacing = await ResponsiveHelper.testTextSpacing(page);
    await addResults([textSpacing]);
    console.log(`   • ${textSpacing.criterionId} ${textSpacing.criterionTitle}: ${textSpacing.status}`);

    // === WCAG 2.2 ENHANCEMENTS ===
    console.log('\n🧭 Testing WCAG 2.2 enhancements...');
    const targetSize = await WCAG22Helper.testTargetSize(page);
    await addResults([targetSize]);
    console.log(`   • ${targetSize.criterionId} ${targetSize.criterionTitle}: ${targetSize.status}`);

    const focusObscured = await WCAG22Helper.testFocusNotObscured(page);
    await addResults([focusObscured]);
    console.log(`   • ${focusObscured.criterionId} ${focusObscured.criterionTitle}: ${focusObscured.status}`);

    const focusAppearance = await WCAG22Helper.testFocusAppearanceHeuristic(page);
    await addResults([focusAppearance]);
    console.log(`   • ${focusAppearance.criterionId} ${focusAppearance.criterionTitle}: ${focusAppearance.status}`);

    const pointerCancel = await WCAG22Helper.testPointerCancellation(page);
    await addResults([pointerCancel]);
    console.log(`   • ${pointerCancel.criterionId} ${pointerCancel.criterionTitle}: ${pointerCancel.status}`);

    console.log('\n🧪 Testing advanced heuristics...');
    const dragFallback = await WCAGAdvancedHelper.testDraggingFallback(page);
    await addResults([dragFallback]);
    console.log(`   • ${dragFallback.criterionId} ${dragFallback.criterionTitle}: ${dragFallback.status}`);

    const consistentHelp = await WCAGAdvancedHelper.testConsistentHelp(page);
    await addResults([consistentHelp]);
    console.log(`   • ${consistentHelp.criterionId} ${consistentHelp.criterionTitle}: ${consistentHelp.status}`);

    const accessibleAuth = await WCAGAdvancedHelper.testAccessibleAuth(page);
    await addResults([accessibleAuth]);
    console.log(`   • ${accessibleAuth.criterionId} ${accessibleAuth.criterionTitle}: ${accessibleAuth.status}`);

    const nonTextContrast = await AxeHelper.testNonTextContrast(page);
    await addResults([nonTextContrast]);
    console.log(`   • ${nonTextContrast.criterionId} ${nonTextContrast.criterionTitle}: ${nonTextContrast.status}`);

    // === EXTRA HEURISTICS ===
    // 2.4.4 Link purpose (in context) – heuristic for empty/ambiguous texts
    try {
      if (!page.isClosed()) {
        const badLinks = await page.$$eval('a[href]', (as: any) => as
          .filter((a: any) => {
            const t = (a.textContent || '').trim();
            return !t || /^(click here|read more|learn more)$/i.test(t);
          })
          .map((a: any) => a.outerHTML.slice(0, 200)),
          { timeout: 10000 }
        );
        await addResults([{
          criterionId: '2.4.4',
          criterionTitle: 'Link Purpose (In Context) – heuristic',
          principle: 'Operable',
          level: 'A',
          testType: 'automated',
          status: badLinks.length ? 'warning' : 'pass',
          issues: badLinks.map(h => ({ description: 'Ambiguous or empty link text', severity: 'moderate', element: h, wcagTags: ['wcag2a','wcag244'] })),
          timestamp: new Date().toISOString(),
          url: page.url()
        }]);
      }
    } catch (error) {
      console.log('   ⚠ Link purpose test skipped (page closed or timeout)');
    }

    // 2.2.1 Timing adjustable – meta refresh detection
    try {
      if (!page.isClosed()) {
        const hasMetaRefresh = !!(await page.$('meta[http-equiv="refresh"]', { timeout: 5000 }));
        await addResults([{
          criterionId: '2.2.1',
          criterionTitle: 'Timing Adjustable – meta refresh',
          principle: 'Operable',
          level: 'A',
          testType: 'automated',
          status: hasMetaRefresh ? 'fail' : 'pass',
          issues: hasMetaRefresh ? [{ description: 'Meta refresh present', severity: 'serious', wcagTags: ['wcag2a','wcag221'] }] : [],
          timestamp: new Date().toISOString(),
          url: page.url()
        }]);
      }
    } catch (error) {
      console.log('   ⚠ Meta refresh test skipped (page closed or timeout)');
    }

    // 2.3.3 Reduced motion – verify animations reduce
    try {
      if (!page.isClosed()) {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const stillAnimating = await page.evaluate(() => {
          // @ts-ignore - runs in browser context
          return Array.from(document.querySelectorAll('*')).slice(0, 200).some((el: any) => {
            const s = getComputedStyle(el as HTMLElement);
            const ad = parseFloat(s.animationDuration || '0');
            const td = parseFloat(s.transitionDuration || '0');
            return (ad > 0 || td > 0) && s.animationPlayState !== 'paused';
          });
        }, { timeout: 15000 });
        await addResults([{
          criterionId: '2.3.3',
          criterionTitle: 'Animation from Interactions (Reduced Motion) – heuristic',
          principle: 'Operable',
          level: 'AAA',
          testType: 'automated',
          status: stillAnimating ? 'warning' : 'pass',
          issues: stillAnimating ? [{ description: 'Animations remain with prefers-reduced-motion', severity: 'moderate', wcagTags: ['wcag23','wcag233'] }] : [],
          timestamp: new Date().toISOString(),
          url: page.url()
        }]);
      }
    } catch (error) {
      console.log('   ⚠ Reduced motion test skipped (page closed or timeout)');
    }

    // === MANUAL FLAGS ===
    console.log('\n⚑ Flagging criteria requiring manual testing...');
    const manualFlags = ManualTestFlags.generateManualFlags(page.url());
    await addResults(manualFlags);
    console.log(`   • ${manualFlags.length} criteria flagged for manual review`);

    console.log('\n📄 Generating comprehensive WCAG 2.1 report...');
    console.log('   This shows the status of ALL 78 WCAG 2.1 criteria\n');

    const excelName = `wcag-comprehensive-report-${projectName}.xlsx`;
    const htmlName = `wcag-comprehensive-report-${projectName}.html`;
    const excelPath = path.resolve(reportGen.generateComprehensiveReport(excelName));
    const htmlPath = path.resolve(reportGen.generateComprehensiveHtmlReport(htmlName));

    reportGen.printConsoleSummary();

    console.log(`\n✅ Comprehensive scan complete!`);
    console.log(`📊 Excel report: ${excelPath}`);
    console.log(`🌐 HTML report:  ${htmlPath}`);

    testInfo.attach('WCAG report (Excel)', {
      path: excelPath,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }).catch(() => undefined);

    testInfo.attach('WCAG report (HTML)', {
      path: htmlPath,
      contentType: 'text/html'
    }).catch(() => undefined);

    openReportInBrowser(htmlPath);
  });
});

function openReportInBrowser(filePath: string) {
  const command = process.platform === 'win32'
    ? `cmd.exe /c start "" "${filePath}"`
    : process.platform === 'darwin'
      ? `open "${filePath}"`
      : `xdg-open "${filePath}"`;

  exec(command, error => {
    if (error) {
      console.warn('⚠️  Unable to auto-open HTML report:', error.message);
    }
  });
}

/**
 * Capture screenshot of specific element with highlighting
 * IMPROVED: Uses axe-core's CSS selector (target) for 100% accuracy
 */
async function captureIssueScreenshot(page: Page, issue: any, screenshotPath: string): Promise<boolean> {
  try {
    // Debug: Log issue structure
    console.log(`\n📸 Screenshot attempt for: "${issue.description?.slice(0, 60)}..."`);
    console.log(`   Has target: ${!!issue.target}, Type: ${Array.isArray(issue.target) ? 'array' : typeof issue.target}, Length: ${issue.target?.length || 0}`);
    
    // Check if this is a page-wide issue (responsive/reflow/spacing/landmark issues)
    const isLandmarkIssue = issue.description?.includes('Missing') && 
                           (issue.description?.includes('landmark') || 
                            issue.description?.includes('Main content') || 
                            issue.description?.includes('Navigation'));
    
    const isPageWideIssue = issue.description?.includes('horizontal scrolling') || 
                           issue.description?.includes('Reflow') ||
                           issue.description?.includes('text spacing') ||
                           issue.description?.includes('page-wide') ||
                           isLandmarkIssue ||
                           issue.help?.includes('page-wide');
    
    // For page-wide issues (especially landmarks), show viewport screenshot with context
    // Landmarks are always page-wide, so show screenshot even if target exists
    if (isPageWideIssue && (isLandmarkIssue || !issue.target || (issue.target && Array.isArray(issue.target) && issue.target.length === 0))) {
      console.log(`   ℹ️  Page-wide issue detected${isLandmarkIssue ? ' (landmark issue)' : ''} - showing viewport screenshot`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        timeout: 15000,
        animations: 'disabled'
      });
      return true;
    }
    
    // Strategy 1: Use axe-core's target selector (MOST RELIABLE)
    if (issue.target && Array.isArray(issue.target) && issue.target.length > 0) {
      try {
        // axe-core provides selector as array. The full path is in the LAST item, or combined
        const fullSelector = issue.target.join(' '); // Combine all parts for full path
        console.log(`🎯 Axe target array:`, JSON.stringify(issue.target));
        console.log(`🔍 Trying selector: "${fullSelector}"`);
        
        // Try the combined selector first
        let element = await page.$(fullSelector);
        let usedSelector = fullSelector;
        
        // If that fails, try each selector individually
        if (!element) {
          for (const selector of issue.target) {
            console.log(`   → Trying: "${selector}"`);
            element = await page.$(selector);
            if (element) {
              console.log(`   ✓ Found with: "${selector}"`);
              usedSelector = selector;
              break;
            }
          }
        }
        
        if (element) {
          // Get element info FIRST to check visibility and dimensions
          const elementInfo = await element.evaluate((el: HTMLElement) => {
            const rect = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);
            return {
              tag: el.tagName,
              id: el.id,
              classes: el.className,
              text: (el.textContent || '').trim().slice(0, 50),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              isHidden: computed.display === 'none' || 
                       computed.visibility === 'hidden' || 
                       computed.opacity === '0' ||
                       rect.width === 0 || 
                       rect.height === 0,
              hasHiddenClass: el.className.includes('hidden')
            };
          });
          console.log(`   📍 Element found:`, JSON.stringify(elementInfo));
          console.log(`   🔍 Selector used: ${usedSelector}`);
          
          // If element is hidden or not visible, skip Strategy 1 and try Strategy 2 (HTML matching)
          const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
          const shouldUseStrategy1 = !elementInfo.isHidden && !elementInfo.hasHiddenClass && isVisible;
          
          if (!shouldUseStrategy1) {
            if (elementInfo.isHidden || elementInfo.hasHiddenClass) {
              console.warn(`   ⚠️  Element is HIDDEN (display: ${elementInfo.display}, visibility: ${elementInfo.visibility}, dimensions: ${elementInfo.width}x${elementInfo.height})`);
              console.warn(`   ⚠️  Element classes: "${elementInfo.classes}" - may contain hidden-* classes`);
              
              // Try resizing viewport for responsive hidden elements
              // Elements with hidden-md/hidden-lg are visible on mobile screens
              const hasResponsiveHidden = elementInfo.classes.includes('hidden-md') || 
                                        elementInfo.classes.includes('hidden-lg') ||
                                        elementInfo.classes.includes('hidden-sm');
              
              if (hasResponsiveHidden) {
                console.log(`   📱 Element has responsive hidden classes - trying mobile viewport (375px)...`);
                
                // Save original viewport
                const originalViewport = page.viewportSize();
                
                // Try mobile viewport (375px wide)
                await page.setViewportSize({ width: 375, height: originalViewport?.height || 667 });
                await page.waitForTimeout(500); // Wait for layout to adjust
                
                // Check if element is now visible
                const mobileElement = await page.$(usedSelector).catch(() => null);
                if (mobileElement) {
                  const mobileVisible = await mobileElement.isVisible({ timeout: 1000 }).catch(() => false);
                  const mobileInfo = await mobileElement.evaluate((el: HTMLElement) => {
                    const rect = el.getBoundingClientRect();
                    return {
                      width: Math.round(rect.width),
                      height: Math.round(rect.height),
                      visible: rect.width > 0 && rect.height > 0
                    };
                  }).catch(() => ({ width: 0, height: 0, visible: false }));
                  
                  if (mobileVisible && mobileInfo.visible && mobileInfo.width > 0 && mobileInfo.height > 0) {
                    console.log(`   ✓ Element is visible at mobile viewport (${mobileInfo.width}x${mobileInfo.height})`);
                    console.log(`   📸 Capturing screenshot at mobile viewport...`);
                    
                    // Highlight and capture at mobile size
                    await mobileElement.evaluate((el: HTMLElement) => {
                      (el as any)._originalStyles = {
                        outline: el.style.outline,
                        outlineOffset: el.style.outlineOffset,
                        boxShadow: el.style.boxShadow,
                        backgroundColor: el.style.backgroundColor,
                        position: el.style.position,
                        zIndex: el.style.zIndex
                      };
                      el.style.outline = '3px solid #ff0000';
                      el.style.outlineOffset = '2px';
                      el.style.boxShadow = '0 0 0 6px rgba(255, 0, 0, 0.15), 0 0 15px rgba(255, 0, 0, 0.4)';
                      el.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
                      el.style.position = 'relative';
                      el.style.zIndex = '9999';
                    });
                    
                    await mobileElement.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(300);
                    
                    const boundingBox = await mobileElement.boundingBox();
                    if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
                      const padding = 15;
                      const clipX = Math.max(0, Math.round(boundingBox.x - padding));
                      const clipY = Math.max(0, Math.round(boundingBox.y - padding));
                      const clipWidth = Math.round(boundingBox.width + (padding * 2));
                      const clipHeight = Math.round(boundingBox.height + (padding * 2));
                      
                      await page.screenshot({
                        path: screenshotPath,
                        clip: {
                          x: clipX,
                          y: clipY,
                          width: Math.min(clipWidth, 375 - clipX),
                          height: Math.min(clipHeight, (originalViewport?.height || 667) - clipY)
                        },
                        timeout: 15000,
                        animations: 'disabled',
                        type: 'png'
                      });
                      
                      // Remove highlighting
                      await mobileElement.evaluate((el: HTMLElement) => {
                        if ((el as any)._originalStyles) {
                          const orig = (el as any)._originalStyles;
                          el.style.outline = orig.outline;
                          el.style.outlineOffset = orig.outlineOffset;
                          el.style.boxShadow = orig.boxShadow;
                          el.style.backgroundColor = orig.backgroundColor;
                          el.style.position = orig.position;
                          el.style.zIndex = orig.zIndex;
                          delete (el as any)._originalStyles;
                        }
                      });
                      
                      // Restore original viewport
                      if (originalViewport) {
                        await page.setViewportSize(originalViewport);
                      }
                      
                      console.log(`   ✅ Screenshot captured at mobile viewport for responsive hidden element`);
                      return true;
                    }
                    
                    // Restore original viewport if screenshot failed
                    if (originalViewport) {
                      await page.setViewportSize(originalViewport);
                    }
                  } else {
                    console.log(`   ⚠️  Element still not visible at mobile viewport`);
                    // Restore original viewport
                    if (originalViewport) {
                      await page.setViewportSize(originalViewport);
                    }
                  }
                } else {
                  // Restore original viewport
                  if (originalViewport) {
                    await page.setViewportSize(originalViewport);
                  }
                }
              }
            } else if (!isVisible) {
              console.warn(`   ⚠️  Element is not visible (Playwright isVisible check failed)`);
            }
            console.warn(`   ⚠️  Trying Strategy 2 (HTML matching) as fallback...`);
            // Continue to Strategy 2 below instead of returning false
          } else {
            // Element is visible - proceed with Strategy 1 screenshot
          
          // Check if element might be a container (has many children or takes up large portion of viewport) - try to find the actual problematic element
          const elementChildrenCount = await element.evaluate((el: HTMLElement) => {
            return el.children.length;
          });
          
          // Get viewport size to calculate ratio
          const viewport = page.viewportSize();
          const viewportWidth = viewport?.width || 1280;
          const viewportHeight = viewport?.height || 720;
          const viewportArea = viewportWidth * viewportHeight;
          const elementArea = elementInfo.width * elementInfo.height;
          const viewportRatio = viewportArea > 0 ? elementArea / viewportArea : 0;
          
          // If element is large AND (has many children OR takes up >40% of viewport), it's likely a container
          const isLikelyContainer = (elementInfo.width > 500 || elementInfo.height > 400) && 
                                   (elementChildrenCount > 5 || viewportRatio > 0.4);
          
          if (isLikelyContainer) {
            console.warn(`   ⚠️  Element is large (${elementInfo.width}x${elementInfo.height}, ${Math.round(viewportRatio * 100)}% of viewport) with ${elementChildrenCount} children - likely a container`);
            console.warn(`   🔍 Attempting to find the specific problematic child element...`);
            
            // Try to find interactive children that might be the actual issue
            const interactiveChild = await page.evaluate((parentSelector) => {
              // @ts-ignore - runs in browser context
              const parent = document.querySelector(parentSelector);
              if (!parent) return null;
              
              // Find first interactive child (button, link, input, etc.)
              const interactive = parent.querySelector('button, a[href], input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])');
              if (interactive) {
                const rect = interactive.getBoundingClientRect();
                return {
                  selector: interactive.tagName.toLowerCase() + (interactive.id ? `#${interactive.id}` : ''),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                  text: (interactive.textContent || '').trim().slice(0, 50)
                };
              }
              return null;
            }, usedSelector).catch(() => null);
            
            if (interactiveChild && interactiveChild.width > 0 && interactiveChild.height > 0) {
              console.log(`   ✓ Found interactive child: ${interactiveChild.selector} (${interactiveChild.width}x${interactiveChild.height})`);
              // Use the child element instead
              const childSelector = `${usedSelector} > ${interactiveChild.selector}`;
              let childElement = await page.$(childSelector);
              
              // Try alternative selectors if first doesn't work
              if (!childElement) {
                childElement = await page.$(interactiveChild.selector);
              }
              
              if (childElement) {
                console.log(`   ✓ Using child element for screenshot`);
                element = childElement;
                // Re-evaluate element info for the child
                const childInfo = await element.evaluate((el: HTMLElement) => {
                  const rect = el.getBoundingClientRect();
                  const computed = window.getComputedStyle(el);
                  return {
                    tag: el.tagName,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    display: computed.display,
                    visibility: computed.visibility
                  };
                });
                elementInfo.width = childInfo.width;
                elementInfo.height = childInfo.height;
                
                // Check if child is still too large
                if (childInfo.width > 1000 || childInfo.height > 800) {
                  console.warn(`   ⚠️  Child element is still very large (${childInfo.width}x${childInfo.height}) - cannot accurately screenshot`);
                  console.warn(`   ⚠️  Skipping screenshot for this issue.`);
                  // Remove highlighting from parent element
                  await element.evaluate((el: HTMLElement) => {
                    if ((el as any)._originalStyles) {
                      const orig = (el as any)._originalStyles;
                      el.style.outline = orig.outline;
                      el.style.outlineOffset = orig.outlineOffset;
                      el.style.boxShadow = orig.boxShadow;
                      el.style.backgroundColor = orig.backgroundColor;
                      el.style.position = orig.position;
                      el.style.zIndex = orig.zIndex;
                      delete (el as any)._originalStyles;
                    }
                  });
                  return false;
                }
              }
            }
          }
          
          // Check if element is suspiciously large - might be a parent container, not the actual element
          if (elementInfo.width > 1000 || elementInfo.height > 800) {
            // If this is a page-wide issue, show viewport screenshot with context
            if (isPageWideIssue) {
              console.warn(`   ⚠️  Element is VERY LARGE (${elementInfo.width}x${elementInfo.height}) - page-wide issue detected`);
              console.log(`   ℹ️  Showing viewport screenshot for page-wide issue`);
              // Remove highlighting before viewport screenshot
              await element.evaluate((el: HTMLElement) => {
                if ((el as any)._originalStyles) {
                  const orig = (el as any)._originalStyles;
                  el.style.outline = orig.outline;
                  el.style.outlineOffset = orig.outlineOffset;
                  el.style.boxShadow = orig.boxShadow;
                  el.style.backgroundColor = orig.backgroundColor;
                  el.style.position = orig.position;
                  el.style.zIndex = orig.zIndex;
                  delete (el as any)._originalStyles;
                }
              });
              await page.screenshot({
                path: screenshotPath,
                fullPage: false,
                timeout: 15000,
                animations: 'disabled'
              });
              return true;
            } else {
              console.warn(`   ⚠️  Element is VERY LARGE (${elementInfo.width}x${elementInfo.height}) - likely a parent container, not the specific element`);
              console.warn(`   ⚠️  Selector may be too generic. Cannot accurately screenshot - skipping screenshot for this issue.`);
              // Remove highlighting
              await element.evaluate((el: HTMLElement) => {
                if ((el as any)._originalStyles) {
                  const orig = (el as any)._originalStyles;
                  el.style.outline = orig.outline;
                  el.style.outlineOffset = orig.outlineOffset;
                  el.style.boxShadow = orig.boxShadow;
                  el.style.backgroundColor = orig.backgroundColor;
                  el.style.position = orig.position;
                  el.style.zIndex = orig.zIndex;
                  delete (el as any)._originalStyles;
                }
              });
              return false;
            }
          }
          
          // Check if element has reasonable dimensions (not too small)
          if (elementInfo.width < 5 || elementInfo.height < 5) {
            console.warn(`   ⚠️  Element is very small (${elementInfo.width}x${elementInfo.height}) - might not be visible in screenshot`);
          }
          
          // Add highlighting with improved visibility
          await element.evaluate((el: HTMLElement) => {
            (el as any)._originalStyles = {
              outline: el.style.outline,
              outlineOffset: el.style.outlineOffset,
              boxShadow: el.style.boxShadow,
              backgroundColor: el.style.backgroundColor,
              position: el.style.position,
              zIndex: el.style.zIndex
            };
            
            // Strong red border that's clearly visible
            el.style.outline = '3px solid #ff0000';
            el.style.outlineOffset = '2px';
            el.style.boxShadow = '0 0 0 6px rgba(255, 0, 0, 0.15), 0 0 15px rgba(255, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 0, 0, 0.3)';
            el.style.backgroundColor = 'rgba(255, 0, 0, 0.05)'; // Slight red tint
            el.style.position = 'relative';
            el.style.zIndex = '9999';
          });

          // Scroll element into view with center alignment
          await element.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500); // Longer pause for rendering
          
          // Verify element dimensions haven't changed (double-check)
          const finalElementInfo = await element.evaluate((el: HTMLElement) => {
            const rect = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);
            return {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              display: computed.display,
              visibility: computed.visibility
            };
          });
          
          // If element is still hidden or too large after scrolling, skip screenshot
          if (finalElementInfo.display === 'none' || 
              finalElementInfo.visibility === 'hidden' ||
              finalElementInfo.width === 0 || 
              finalElementInfo.height === 0 ||
              finalElementInfo.width > 1000 || 
              finalElementInfo.height > 800) {
            console.warn(`   ⚠️  Element dimensions changed or invalid after scroll - cannot accurately screenshot`);
            // Remove highlighting before skipping
            await element.evaluate((el: HTMLElement) => {
              if ((el as any)._originalStyles) {
                const orig = (el as any)._originalStyles;
                el.style.outline = orig.outline;
                el.style.outlineOffset = orig.outlineOffset;
                el.style.boxShadow = orig.boxShadow;
                el.style.backgroundColor = orig.backgroundColor;
                el.style.position = orig.position;
                el.style.zIndex = orig.zIndex;
                delete (el as any)._originalStyles;
              }
            });
            return false;
          }
          
          // Take screenshot of ONLY the element with tight crop
          // Use getBoundingClientRect() to ensure we only capture the element's actual bounds
          const boundingBox = await element.boundingBox();
          if (!boundingBox || boundingBox.width === 0 || boundingBox.height === 0) {
            console.warn(`   ⚠️  Element has no valid bounding box - cannot accurately screenshot`);
            await element.evaluate((el: HTMLElement) => {
              if ((el as any)._originalStyles) {
                const orig = (el as any)._originalStyles;
                el.style.outline = orig.outline;
                el.style.outlineOffset = orig.outlineOffset;
                el.style.boxShadow = orig.boxShadow;
                el.style.backgroundColor = orig.backgroundColor;
                el.style.position = orig.position;
                el.style.zIndex = orig.zIndex;
                delete (el as any)._originalStyles;
              }
            });
            return false;
          }
          
          // Only proceed if bounding box is reasonable (not too large)
          if (boundingBox.width > 1000 || boundingBox.height > 800) {
            console.warn(`   ⚠️  Bounding box is too large (${boundingBox.width}x${boundingBox.height}) - likely capturing parent container`);
            console.warn(`   ⚠️  Cannot accurately screenshot - skipping screenshot for this issue.`);
            await element.evaluate((el: HTMLElement) => {
              if ((el as any)._originalStyles) {
                const orig = (el as any)._originalStyles;
                el.style.outline = orig.outline;
                el.style.outlineOffset = orig.outlineOffset;
                el.style.boxShadow = orig.boxShadow;
                el.style.backgroundColor = orig.backgroundColor;
                el.style.position = orig.position;
                el.style.zIndex = orig.zIndex;
                delete (el as any)._originalStyles;
              }
            });
            return false;
          }
          
          // Use page.screenshot() with clip to ensure we only capture the exact element bounds
          // Add small padding to include the red outline/shadow we added (3px outline + 2px offset + 6px shadow = ~15px)
          const padding = 15;
          const clipX = Math.max(0, Math.round(boundingBox.x - padding));
          const clipY = Math.max(0, Math.round(boundingBox.y - padding));
          const clipWidth = Math.round(boundingBox.width + (padding * 2));
          const clipHeight = Math.round(boundingBox.height + (padding * 2));
          
          // Ensure clip doesn't exceed viewport (reuse viewport variable from line 411)
          // viewport is already defined above, just reuse it
          if (viewport) {
            const maxX = viewport.width - clipX;
            const maxY = viewport.height - clipY;
            const finalWidth = Math.min(clipWidth, maxX);
            const finalHeight = Math.min(clipHeight, maxY);
            
            await page.screenshot({
              path: screenshotPath,
              clip: {
                x: clipX,
                y: clipY,
                width: Math.max(1, finalWidth),
                height: Math.max(1, finalHeight)
              },
              timeout: 15000,
              animations: 'disabled',
              type: 'png'
            });
          } else {
            // Fallback if viewport size not available
            await page.screenshot({
              path: screenshotPath,
              clip: {
                x: clipX,
                y: clipY,
                width: clipWidth,
                height: clipHeight
              },
              timeout: 15000,
              animations: 'disabled',
              type: 'png'
            });
          }
          
          console.log(`   ✓ Screenshot captured with exact bounds: ${clipWidth}x${clipHeight} at (${clipX}, ${clipY})`);
          console.log(`   📏 Element bounds were: ${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)} at (${Math.round(boundingBox.x)}, ${Math.round(boundingBox.y)})`);

          // Remove highlighting
          await element.evaluate((el: HTMLElement) => {
            if ((el as any)._originalStyles) {
              const orig = (el as any)._originalStyles;
              el.style.outline = orig.outline;
              el.style.outlineOffset = orig.outlineOffset;
              el.style.boxShadow = orig.boxShadow;
              el.style.backgroundColor = orig.backgroundColor;
              el.style.position = orig.position;
              el.style.zIndex = orig.zIndex;
              delete (el as any)._originalStyles;
            }
          });

          console.log(`✅ Screenshot captured successfully`);
          return true;
          } // End of Strategy 1 (shouldUseStrategy1)
        } else {
          console.log(`❌ No element found with any selector`);
        }
      } catch (e) {
        console.warn(`⚠️  Axe selector error:`, (e as Error).message);
      }
    }

    // Strategy 2: Fallback to HTML matching (if we have element HTML)
    // This runs if Strategy 1 failed or if we don't have a target selector
    if (!issue.element) {
      // No element info at all, take viewport screenshot
      console.log(`⚠️  No element HTML available - taking viewport screenshot`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        timeout: 15000,
        animations: 'disabled'
      });
      return true;
    }
    
    // We have element HTML - try Strategy 2 (HTML matching)
    console.log(`🔍 Trying Strategy 2 (HTML matching) for element with HTML...`);
    
    // Get the EXACT HTML string from the issue
    const targetHtml = issue.element.trim();
    console.log(`🔍 Falling back to HTML matching...`);
    
    // STRATEGY: Find element by EXACT outerHTML match + position
    const foundElement = await page.evaluateHandle((searchHtml) => {
      // @ts-ignore
      const allElements = Array.from(document.querySelectorAll('*'));
      
      // Normalize HTML for comparison (remove whitespace variations)
      const normalizeHtml = (html: string): string => {
        return html
          .replace(/\s+/g, ' ')           // Multiple spaces → single space
          .replace(/>\s+</g, '><')        // Remove space between tags
          .replace(/"\s+/g, '"')          // Remove space after quotes
          .replace(/\s+"/g, '"')          // Remove space before quotes
          .trim()
          .toLowerCase();
      };
      
      const normalizedTarget = normalizeHtml(searchHtml);
      
      // Try 1: Exact outerHTML match (most reliable)
      for (const el of allElements) {
        try {
          const elHtml = (el as HTMLElement).outerHTML;
          if (normalizeHtml(elHtml) === normalizedTarget) {
            console.log('✓ Found by EXACT outerHTML match');
            return el;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Try 2: Match first 300 chars of HTML (for truncated HTML)
      const targetPrefix = normalizedTarget.slice(0, 300);
      for (const el of allElements) {
        try {
          const elHtml = (el as HTMLElement).outerHTML;
          const elPrefix = normalizeHtml(elHtml).slice(0, 300);
          if (elPrefix === targetPrefix) {
            console.log('✓ Found by HTML prefix match (300 chars)');
            return el;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Try 3: Extract unique selector and find by position in collection
      // Extract tag, classes, and text from target HTML
      const tagMatch = searchHtml.match(/<(\w+)/);
      const classMatch = searchHtml.match(/class=["']([^"']+)["']/);
      const idMatch = searchHtml.match(/id=["']([^"']+)["']/);
      const textMatch = searchHtml.match(/>([^<]+)</);
      
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        let selector = tag;
        
        // Use ID if available (most specific)
        if (idMatch) {
          selector = `#${idMatch[1]}`;
          const el = document.querySelector(selector);
          if (el) {
            console.log('✓ Found by ID selector:', selector);
            return el;
          }
        }
        
        // Build selector with classes
        if (classMatch) {
          const classes = classMatch[1].split(/\s+/).filter(c => c).join('.');
          selector = `${tag}.${classes}`;
        }
        
        // Get all matches
        const matches = Array.from(document.querySelectorAll(selector));
        
        if (matches.length === 1) {
          console.log('✓ Found by unique selector:', selector);
          return matches[0];
        }
        
        // Multiple matches - use text content to disambiguate
        if (textMatch && matches.length > 1) {
          const targetText = textMatch[1].trim().toLowerCase();
          for (const match of matches) {
            const matchText = (match.textContent || '').trim().toLowerCase();
            if (matchText.startsWith(targetText) || targetText.startsWith(matchText.slice(0, 50))) {
              console.log('✓ Found by selector + text match:', selector, targetText.slice(0, 30));
              return match;
            }
          }
        }
        
        // Last resort: return first match (better than nothing)
        if (matches.length > 0) {
          console.log('⚠ Using first match of', matches.length, 'for selector:', selector);
          return matches[0];
        }
      }
      
      console.log('✗ Element not found - will use viewport screenshot');
      return null;
    }, targetHtml);

    // Check if we found the element
    if (!foundElement || !(await foundElement.asElement())) {
      // Element not found, take viewport screenshot as fallback
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        timeout: 15000,
        animations: 'disabled'
      });
      return true;
    }

    const element = foundElement.asElement()!;
    const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
    
    // If element is not visible, check if it's a responsive hidden element
    if (!isVisible && issue.element) {
      const hasResponsiveHidden = issue.element.includes('hidden-md') || 
                                  issue.element.includes('hidden-lg') ||
                                  issue.element.includes('hidden-sm');
      
      if (hasResponsiveHidden) {
        console.log(`   📱 Strategy 2: Element has responsive hidden classes - trying mobile viewport (375px)...`);
        
        // Save original viewport
        const originalViewport = page.viewportSize();
        
        // Try mobile viewport (375px wide)
        await page.setViewportSize({ width: 375, height: originalViewport?.height || 667 });
        await page.waitForTimeout(500); // Wait for layout to adjust
        
        // Re-find element at mobile viewport
        const mobileFoundElement = await page.evaluateHandle((searchHtml) => {
          // @ts-ignore - runs in browser context
          const allElements = Array.from(document.querySelectorAll('*'));
          const normalizeHtml = (html: string): string => {
            return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').replace(/"\s+/g, '"').replace(/\s+"/g, '"').trim().toLowerCase();
          };
          const normalizedTarget = normalizeHtml(searchHtml);
          for (const el of allElements) {
            try {
              const elHtml = (el as HTMLElement).outerHTML;
              if (normalizeHtml(elHtml) === normalizedTarget || normalizeHtml(elHtml).slice(0, 300) === normalizedTarget.slice(0, 300)) {
                return el;
              }
            } catch (e) { continue; }
          }
          return null;
        }, targetHtml);
        
        const mobileElement = mobileFoundElement?.asElement();
        if (mobileElement) {
          const mobileVisible = await mobileElement.isVisible({ timeout: 1000 }).catch(() => false);
          const mobileInfo = await mobileElement.evaluate((el: HTMLElement) => {
            const rect = el.getBoundingClientRect();
            return {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              visible: rect.width > 0 && rect.height > 0
            };
          }).catch(() => ({ width: 0, height: 0, visible: false }));
          
          if (mobileVisible && mobileInfo.visible && mobileInfo.width > 0 && mobileInfo.height > 0 && mobileInfo.width < 400) {
            console.log(`   ✓ Strategy 2: Element is visible at mobile viewport (${mobileInfo.width}x${mobileInfo.height})`);
            
            // Highlight and capture at mobile size
            await mobileElement.evaluate((el: HTMLElement) => {
              (el as any)._originalStyles = {
                outline: el.style.outline,
                outlineOffset: el.style.outlineOffset,
                boxShadow: el.style.boxShadow,
                backgroundColor: el.style.backgroundColor,
                position: el.style.position,
                zIndex: el.style.zIndex
              };
              el.style.outline = '3px solid #ff0000';
              el.style.outlineOffset = '2px';
              el.style.boxShadow = '0 0 0 6px rgba(255, 0, 0, 0.15), 0 0 15px rgba(255, 0, 0, 0.4)';
              el.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
              el.style.position = 'relative';
              el.style.zIndex = '9999';
            });
            
            await mobileElement.scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);
            
            const boundingBox = await mobileElement.boundingBox();
            if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
              const padding = 15;
              const clipX = Math.max(0, Math.round(boundingBox.x - padding));
              const clipY = Math.max(0, Math.round(boundingBox.y - padding));
              const clipWidth = Math.round(boundingBox.width + (padding * 2));
              const clipHeight = Math.round(boundingBox.height + (padding * 2));
              
              await page.screenshot({
                path: screenshotPath,
                clip: {
                  x: clipX,
                  y: clipY,
                  width: Math.min(clipWidth, 375 - clipX),
                  height: Math.min(clipHeight, (originalViewport?.height || 667) - clipY)
                },
                timeout: 15000,
                animations: 'disabled',
                type: 'png'
              });
              
              // Remove highlighting and restore viewport
              await mobileElement.evaluate((el: HTMLElement) => {
                if ((el as any)._originalStyles) {
                  const orig = (el as any)._originalStyles;
                  el.style.outline = orig.outline;
                  el.style.outlineOffset = orig.outlineOffset;
                  el.style.boxShadow = orig.boxShadow;
                  el.style.backgroundColor = orig.backgroundColor;
                  el.style.position = orig.position;
                  el.style.zIndex = orig.zIndex;
                  delete (el as any)._originalStyles;
                }
              });
              
              if (originalViewport) {
                await page.setViewportSize(originalViewport);
              }
              
              console.log(`   ✅ Strategy 2: Screenshot captured at mobile viewport for responsive hidden element`);
              return true;
            }
            
            // Restore viewport if screenshot failed
            if (originalViewport) {
              await page.setViewportSize(originalViewport);
            }
          }
        }
        
        // Restore original viewport
        if (originalViewport) {
          await page.setViewportSize(originalViewport);
        }
      }
    }
      
    if (isVisible) {
      // Add highlighting to the element using the element handle
      await element.evaluate((el: HTMLElement) => {
        // Store original styles
        const original = {
          outline: el.style.outline,
          outlineOffset: el.style.outlineOffset,
          boxShadow: el.style.boxShadow,
          position: el.style.position,
          zIndex: el.style.zIndex
        };
        
        // Add highlight
        el.style.outline = '4px solid #ff0000';
        el.style.outlineOffset = '2px';
        el.style.boxShadow = '0 0 0 8px rgba(255, 0, 0, 0.2), 0 0 20px rgba(255, 0, 0, 0.3)';
        el.style.position = 'relative';
        el.style.zIndex = '9999';
        
        // Store original styles for cleanup
        (el as any)._originalStyles = original;
      });

      // Scroll element into view with some padding
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300); // Brief pause for rendering

      // Take screenshot of the element with some context
      await element.screenshot({
        path: screenshotPath,
        timeout: 15000,
        animations: 'disabled'
      });

      // Remove highlighting using the element handle
      await element.evaluate((el: HTMLElement) => {
        if ((el as any)._originalStyles) {
          const orig = (el as any)._originalStyles;
          el.style.outline = orig.outline;
          el.style.outlineOffset = orig.outlineOffset;
          el.style.boxShadow = orig.boxShadow;
          el.style.position = orig.position;
          el.style.zIndex = orig.zIndex;
          delete (el as any)._originalStyles;
        }
      });

      return true;
    }

    // Element not visible, take viewport screenshot as fallback
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      timeout: 15000,
      animations: 'disabled'
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

async function enrichResultWithArtifacts(page: Page, result: TestResult, artifactDir: string, reportDir: string) {
  if (result.status !== 'fail' || result.issues.length === 0) {
    return;
  }

  await fs.promises.mkdir(artifactDir, { recursive: true });

  const slug = `${result.criterionId}-${slugify(result.criterionTitle)}`;

  // Capture targeted screenshots for each issue with highlighting
  const issueScreenshots: string[] = [];
  
  if (!page.isClosed()) {
    for (let i = 0; i < result.issues.length && i < 10; i++) { // Limit to 10 screenshots
      const issue = result.issues[i];
      const screenshotFile = `${slug}-issue-${i + 1}.png`;
      const screenshotPath = path.join(artifactDir, screenshotFile);
      
      try {
        // Try to capture element-specific screenshot with highlighting
        const captured = await captureIssueScreenshot(page, issue, screenshotPath);
        if (captured) {
          issueScreenshots.push(path.basename(screenshotFile));
        }
      } catch (error) {
        console.warn(`⚠️  Unable to capture screenshot for issue ${i + 1}:`, (error as Error).message);
      }
    }
  } else {
    console.warn(`⚠️  Screenshots skipped for ${result.criterionId}: page was closed`);
  }

  // Store screenshot filenames in result
  result.issueScreenshots = issueScreenshots;

  const issueSections = result.issues.map((issue, index) => {
    const helpLink = issue.helpUrl ? `<p><a href="${issue.helpUrl}" target="_blank" rel="noopener">Learn more</a></p>` : '';
    
    // Enhanced DOM snippet with more details
    const targetSelector = issue.target && issue.target.length > 0 ? issue.target.join(' ') : 'Not available';
    const elementHtml = issue.element || 'Not available';
    
    const snippet = `
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 12px 0;">
        <h4 style="margin-top: 0; color: #334155; font-size: 15px;">🎯 CSS Selector (Target)</h4>
        <div style="position: relative;">
          <pre id="selector-${index}" style="background: #1e293b; color: #10b981; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 13px; margin: 0; display: inline-flex; align-items: center; gap: 8px; width: 100%;"><code style="display: inline-flex; align-items: center; gap: 6px;"><span>${escapeHtml(targetSelector)}</span><button onclick="copyToClipboard('selector-${index}', 'btn-selector-${index}')" id="btn-selector-${index}" style="background: transparent; color: #64748b; border: none; padding: 2px 4px; cursor: pointer; font-size: 14px; opacity: 0.7; transition: opacity 0.2s; flex-shrink: 0;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Copy to clipboard">📋</button></code></pre>
        </div>
        
        <h4 style="margin-top: 16px; color: #334155; font-size: 15px;">📝 Element HTML</h4>
        <div style="position: relative;">
          <pre id="html-${index}" style="background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 13px; margin: 0; display: inline-flex; align-items: center; gap: 8px; width: 100%;"><code style="display: inline-flex; align-items: center; gap: 6px;"><span>${escapeHtml(elementHtml)}</span><button onclick="copyToClipboard('html-${index}', 'btn-html-${index}')" id="btn-html-${index}" style="background: transparent; color: #94a3b8; border: none; padding: 2px 4px; cursor: pointer; font-size: 14px; opacity: 0.7; transition: opacity 0.2s; flex-shrink: 0;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Copy to clipboard">📋</button></code></pre>
        </div>
        
        ${issue.target && issue.target.length > 0 ? `
        <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <strong style="color: #856404;">💡 How to find this element:</strong>
          <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px;">
            <strong>Option 1 (Navigate & Highlight):</strong><br>
            Open DevTools → Console → Run:<br>
            <code id="code-option1-${index}" style="background: #fff; padding: 4px 8px; border-radius: 3px; font-family: monospace; display: inline-flex; align-items: center; gap: 6px; margin: 4px 0; white-space: pre-wrap;"><span style="flex: 1;">el = document.querySelector('${escapeHtml(issue.target[0])}'); el.scrollIntoView({block: 'center'}); inspect(el);</span><button onclick="copyToClipboard('code-option1-${index}', 'btn-option1-${index}')" id="btn-option1-${index}" style="background: transparent; color: #856404; border: none; padding: 2px 4px; cursor: pointer; font-size: 14px; opacity: 0.7; transition: opacity 0.2s; flex-shrink: 0;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Copy to clipboard">📋</button></code>
          </p>
          <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px;">
            <strong>Option 2 (Just Return Element):</strong><br>
            <code id="code-option2-${index}" style="background: #fff; padding: 4px 8px; border-radius: 3px; font-family: monospace; display: inline-flex; align-items: center; gap: 6px; margin: 4px 0;"><span style="flex: 1;">document.querySelector('${escapeHtml(issue.target[0])}')</span><button onclick="copyToClipboard('code-option2-${index}', 'btn-option2-${index}')" id="btn-option2-${index}" style="background: transparent; color: #856404; border: none; padding: 2px 4px; cursor: pointer; font-size: 14px; opacity: 0.7; transition: opacity 0.2s; flex-shrink: 0;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Copy to clipboard">📋</button></code>
            Then right-click result → "Reveal in Elements panel"
          </p>
        </div>
        ` : ''}
      </div>
    `;
    
    // Check if this is a page-wide issue (responsive/reflow/spacing/landmark issues)
    const isLandmarkIssue = issue.description?.includes('Missing') && 
                           (issue.description?.includes('landmark') || 
                            issue.description?.includes('Main content') || 
                            issue.description?.includes('Navigation'));
    
    const isPageWideIssue = issue.description?.includes('horizontal scrolling') || 
                           issue.description?.includes('Reflow') ||
                           issue.description?.includes('text spacing') ||
                           issue.description?.includes('page-wide') ||
                           isLandmarkIssue ||
                           issue.help?.includes('page-wide');
    
    // Add screenshot for this specific issue if available
    const screenshotHtml = issueScreenshots[index] 
      ? `<div class="screenshot-container">
           <h3>Visual Location ${isPageWideIssue ? '(Page-Wide Issue)' : '(Highlighted)'}</h3>
           <img src="${issueScreenshots[index]}" alt="Screenshot showing issue ${index + 1}${isPageWideIssue ? ' (page-wide issue)' : ' highlighted in red'}" class="issue-screenshot" />
           ${isPageWideIssue 
             ? '<p class="screenshot-note" style="color: #2563eb;">ℹ️ This is a <strong>page-wide issue</strong> affecting the entire layout structure (e.g., horizontal scrolling, reflow, or text spacing). The screenshot shows the viewport to provide context about how the page renders with this issue.</p>'
             : '<p class="screenshot-note">🔴 The problematic element is highlighted with a red border</p>'
           }
           ${issue.element && issue.element.includes('hidden') && !isPageWideIssue ? 
             '<p class="screenshot-note" style="color: #f57c00;">⚠️ Note: This element has "hidden" classes and may not be visible on all screen sizes. If no specific element is highlighted, this element is currently not rendered.</p>' 
             : ''}
         </div>`
      : '';
    
    return `
      <section class="issue">
        <h2>Issue ${index + 1}</h2>
        <p><strong>Severity:</strong> ${issue.severity}</p>
        <p><strong>Description:</strong> ${escapeHtml(issue.description)}</p>
        ${issue.help ? `<p><strong>How to fix:</strong> ${escapeHtml(issue.help)}</p>` : ''}
        ${helpLink}
        ${screenshotHtml}
        <h3>DOM Details</h3>
        ${snippet}
      </section>
    `;
  }).join('\n');

  const detailHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${result.criterionId} – ${escapeHtml(result.criterionTitle)}</title>
    <style>
      body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; background: #f8fafc; color: #1f2933; }
      h1 { margin-bottom: 1rem; }
      section.issue { background: #fff; border: 1px solid #e4e7eb; padding: 16px; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08); }
      pre { background: #0f172a; color: #e2e8f0; padding: 12px; overflow-x: auto; border-radius: 6px; }
      .screenshot-container { margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; }
      .screenshot-container h3 { margin-top: 0; color: #1e293b; }
      img.issue-screenshot { border: 3px solid #ef4444; border-radius: 8px; max-width: 100%; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
      .screenshot-note { font-size: 14px; color: #64748b; margin-top: 8px; font-style: italic; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <h1>${result.criterionId} – ${escapeHtml(result.criterionTitle)}</h1>
    <p><strong>Status:</strong> ${result.status} | <strong>Issues Found:</strong> ${result.issues.length}</p>
    ${issueSections}
    <script>
      function copyToClipboard(codeElementId, buttonId) {
        const codeElement = document.getElementById(codeElementId);
        const button = document.getElementById(buttonId);
        
        if (!codeElement) return;
        
        // Get text from code element, handling different structures
        let text = '';
        if (codeElement.tagName === 'PRE') {
          // For <pre><code><span>...</span><button>...</button></code></pre>
          const codeTag = codeElement.querySelector('code');
          if (codeTag) {
            const spanTag = codeTag.querySelector('span');
            text = (spanTag ? spanTag.textContent : codeTag.textContent) || '';
            // Remove button text if it was included
            if (button && button.textContent) {
              text = text.replace(button.textContent, '').trim();
            }
          } else {
            text = codeElement.textContent || '';
          }
        } else if (codeElement.tagName === 'CODE') {
          // For <code><span>...</span><button>...</button></code>
          const spanTag = codeElement.querySelector('span');
          text = (spanTag ? spanTag.textContent : codeElement.textContent) || '';
          // Remove button text if it was included
          if (button && button.textContent) {
            text = text.replace(button.textContent, '').trim();
          }
        } else {
          text = codeElement.textContent || codeElement.innerText || '';
        }
        
        // Use modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            // Show success feedback
            const originalText = button.innerHTML;
            button.innerHTML = '✓';
            button.style.opacity = '1';
            button.style.color = '#10b981';
            setTimeout(() => {
              button.innerHTML = originalText;
              button.style.color = '';
              button.style.opacity = '0.7';
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback to old method
            fallbackCopy(text, button);
          });
        } else {
          // Fallback for older browsers
          fallbackCopy(text, button);
        }
      }
      
      function fallbackCopy(text, button) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            const originalText = button.innerHTML;
            button.innerHTML = '✓';
            button.style.opacity = '1';
            button.style.color = '#10b981';
            setTimeout(() => {
              button.innerHTML = originalText;
              button.style.color = '';
              button.style.opacity = '0.7';
            }, 2000);
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
          alert('Failed to copy. Please copy manually.');
        }
        
        document.body.removeChild(textarea);
      }
    </script>
  </body>
</html>`;

  const detailFile = `${slug}.html`;
  const detailPath = path.join(artifactDir, detailFile);
  await fs.promises.writeFile(detailPath, detailHtml, 'utf8');

  result.detailPage = path.relative(reportDir, detailPath).replace(/\\/g, '/');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    || 'criterion';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
