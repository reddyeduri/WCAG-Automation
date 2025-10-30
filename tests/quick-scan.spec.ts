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

async function enrichResultWithArtifacts(page: Page, result: TestResult, artifactDir: string, reportDir: string) {
  if (result.status !== 'fail' || result.issues.length === 0) {
    return;
  }

  await fs.promises.mkdir(artifactDir, { recursive: true });

  const slug = `${result.criterionId}-${slugify(result.criterionTitle)}`;
  const screenshotFile = `${slug}-page.png`;
  const screenshotPath = path.join(artifactDir, screenshotFile);

  // Only attempt screenshot if page is still open
  if (!page.isClosed()) {
    try {
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true, // Full page screenshot for comprehensive results
        timeout: 60000, // 60 seconds max for full page screenshot
        animations: 'disabled' // Disable animations for faster screenshots
      });
    } catch (error) {
      console.warn(`⚠️  Unable to capture screenshot for ${result.criterionId}:`, (error as Error).message);
    }
  } else {
    console.warn(`⚠️  Screenshot skipped for ${result.criterionId}: page was closed`);
  }

  const issueSections = result.issues.map((issue, index) => {
    const helpLink = issue.helpUrl ? `<p><a href="${issue.helpUrl}" target="_blank" rel="noopener">Learn more</a></p>` : '';
    const snippet = issue.element ? `<pre><code>${escapeHtml(issue.element)}</code></pre>` : '<p><em>No DOM snippet provided.</em></p>';
    return `
      <section class="issue">
        <h2>Issue ${index + 1}</h2>
        <p><strong>Severity:</strong> ${issue.severity}</p>
        <p><strong>Description:</strong> ${escapeHtml(issue.description)}</p>
        ${issue.help ? `<p><strong>How to fix:</strong> ${escapeHtml(issue.help)}</p>` : ''}
        ${helpLink}
        <h3>DOM Snippet</h3>
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
      img.page-shot { border: 1px solid #e4e7eb; border-radius: 8px; max-width: 100%; margin-bottom: 20px; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <h1>${result.criterionId} – ${escapeHtml(result.criterionTitle)}</h1>
    <p><strong>Severity:</strong> ${result.issues.map(i => i.severity).join(', ')}</p>
    ${fs.existsSync(screenshotPath) ? `<img class="page-shot" src="${path.basename(screenshotFile)}" alt="Screenshot highlighting ${escapeHtml(result.criterionTitle)}" />` : ''}
    ${issueSections}
  </body>
</html>`;

  const detailFile = `${slug}.html`;
  const detailPath = path.join(artifactDir, detailFile);
  await fs.promises.writeFile(detailPath, detailHtml, 'utf8');

  result.detailPage = path.relative(reportDir, detailPath).replace(/\\/g, '/');
  result.detailScreenshot = fs.existsSync(screenshotPath)
    ? path.relative(reportDir, screenshotPath).replace(/\\/g, '/')
    : undefined;
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
