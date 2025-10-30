import { test, expect } from '@playwright/test';
import { 
  AxeHelper, 
  KeyboardHelper, 
  AccessibilityTreeHelper,
  MediaHelper,
  TimingAnimationHelper,
  PredictabilityHelper,
  HoverFocusHelper,
  MotionGestureHelper,
  ContentAnalysisHelper,
  WCAG22Helper,
  WCAGAdvancedHelper,
  ManualTestFlags,
  ResponsiveHelper,
  ComprehensiveReportGenerator 
} from '../utils';
import * as path from 'path';

/**
 * COMPLETE WCAG 2.1/2.2 COVERAGE TEST SUITE
 * This test suite aims for 100% coverage of all testable WCAG criteria
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const reportDir = path.join('reports', 'complete-coverage');
const reportGen = new ComprehensiveReportGenerator(reportDir);

test.describe('🎯 WCAG Complete Coverage - 100% Implementation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    // Generate comprehensive reports
    const excelPath = reportGen.generateComprehensiveReport('wcag-complete-coverage.xlsx');
    const htmlPath = reportGen.generateComprehensiveHtmlReport('wcag-complete-coverage.html');
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPLETE WCAG COVERAGE REPORTS GENERATED:');
    console.log('='.repeat(70));
    console.log(`📈 Excel Report: ${excelPath}`);
    console.log(`🌐 HTML Report:  ${htmlPath}`);
    console.log('='.repeat(70) + '\n');
    
    reportGen.printConsoleSummary();
  });

  // ==========================================
  // 1.1.1 NON-TEXT CONTENT - COMPLETE
  // ==========================================
  test.describe('1.1.1 Non-text Content', () => {
    test('Alt text for images, objects, and areas', async ({ page }) => {
      const result = await AxeHelper.testAltText(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });
  });

  // ==========================================
  // 1.2.x TIME-BASED MEDIA - NEW!
  // ==========================================
  test.describe('1.2.x Time-based Media', () => {
    test('[1.2.1] Audio-only and Video-only alternatives', async ({ page }) => {
      const result = await MediaHelper.testAudioVideoOnly(page);
      reportGen.addResults([result]);
      // Warning status is acceptable for detection
    });

    test('[1.2.2] Captions for prerecorded media', async ({ page }) => {
      const result = await MediaHelper.testCaptions(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[1.2.3] Audio description or media alternative', async ({ page }) => {
      const result = await MediaHelper.testAudioDescription(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // 1.3.x ADAPTABLE - ENHANCED
  // ==========================================
  test.describe('1.3.x Adaptable', () => {
    test('[1.3.1] Info and Relationships', async ({ page }) => {
      const result = await AxeHelper.testHeadingHierarchy(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[1.3.1] Whitespace formatting detection', async ({ page }) => {
      const result = await ContentAnalysisHelper.testWhitespaceFormatting(page);
      reportGen.addResults([result]);
    });

    test('[1.3.1] CSS content property misuse', async ({ page }) => {
      const result = await ContentAnalysisHelper.testCSSContent(page);
      reportGen.addResults([result]);
    });

    test('[1.3.3] Sensory characteristics', async ({ page }) => {
      const result = await ContentAnalysisHelper.testSensoryCharacteristics(page);
      reportGen.addResults([result]);
    });

    test('[1.3.4] Orientation locks', async ({ page }) => {
      const result = await ContentAnalysisHelper.testOrientation(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[1.3.5] Identify Input Purpose', async ({ page }) => {
      const fullScan = await AxeHelper.runAxeScan(page, { 
        wcagLevel: 'AA',
        rules: ['autocomplete-valid'] 
      });
      reportGen.addResults(fullScan);
    });
  });

  // ==========================================
  // 1.4.x DISTINGUISHABLE - COMPLETE
  // ==========================================
  test.describe('1.4.x Distinguishable', () => {
    test('[1.4.2] Audio Control', async ({ page }) => {
      const result = await MediaHelper.testAudioControl(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[1.4.3] Contrast (Minimum)', async ({ page }) => {
      const result = await AxeHelper.testColorContrast(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[1.4.4] Resize Text', async ({ page }) => {
      const result = await ResponsiveHelper.testResizeText(page);
      reportGen.addResults([result]);
    });

    test('[1.4.10] Reflow', async ({ page }) => {
      const result = await ResponsiveHelper.testReflow(page);
      reportGen.addResults([result]);
    });

    test('[1.4.11] Non-text Contrast', async ({ page }) => {
      const result = await AxeHelper.testNonTextContrast(page);
      reportGen.addResults([result]);
    });

    test('[1.4.12] Text Spacing', async ({ page }) => {
      const result = await ResponsiveHelper.testTextSpacing(page);
      reportGen.addResults([result]);
    });

    test('[1.4.13] Content on Hover or Focus - NEW!', async ({ page }) => {
      const result = await HoverFocusHelper.testContentOnHoverOrFocus(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });
  });

  // ==========================================
  // 2.1.x KEYBOARD ACCESSIBLE - ENHANCED
  // ==========================================
  test.describe('2.1.x Keyboard Accessible', () => {
    test('[2.1.1] Keyboard accessibility', async ({ page }) => {
      const result = await KeyboardHelper.testKeyboardAccessibility(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.1.2] No Keyboard Trap', async ({ page }) => {
      const result = await KeyboardHelper.testNoKeyboardTrap(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.1.4] Character Key Shortcuts - NEW!', async ({ page }) => {
      const result = await MotionGestureHelper.testCharacterKeyShortcuts(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // 2.2.x ENOUGH TIME - NEW!
  // ==========================================
  test.describe('2.2.x Enough Time', () => {
    test('[2.2.1] Timing Adjustable', async ({ page }) => {
      const result = await TimingAnimationHelper.testTimingAdjustable(page);
      reportGen.addResults([result]);
    });

    test('[2.2.2] Pause, Stop, Hide', async ({ page }) => {
      const result = await TimingAnimationHelper.testPauseStopHide(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });
  });

  // ==========================================
  // 2.3.x SEIZURES - NEW!
  // ==========================================
  test.describe('2.3.x Seizures and Physical Reactions', () => {
    test('[2.3.1] Three Flashes or Below Threshold', async ({ page }) => {
      const result = await TimingAnimationHelper.testThreeFlashes(page);
      reportGen.addResults([result]);
    });

    test('[2.3.3] Animation from Interactions (AAA)', async ({ page }) => {
      const result = await TimingAnimationHelper.testReducedMotion(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // 2.4.x NAVIGABLE - COMPLETE
  // ==========================================
  test.describe('2.4.x Navigable', () => {
    test('[2.4.1] Bypass Blocks', async ({ page }) => {
      const result = await AxeHelper.testSkipLinks(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.4.2] Page Titled', async ({ page }) => {
      const result = await AxeHelper.testPageTitle(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.4.3] Focus Order', async ({ page }) => {
      const result = await KeyboardHelper.testFocusOrder(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.4.7] Focus Visible', async ({ page }) => {
      const result = await KeyboardHelper.testFocusVisible(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.4.12] Focus Not Obscured (WCAG 2.2)', async ({ page }) => {
      const result = await WCAG22Helper.testFocusNotObscured(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[2.4.13] Focus Appearance (WCAG 2.2)', async ({ page }) => {
      const result = await WCAG22Helper.testFocusAppearanceHeuristic(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // 2.5.x INPUT MODALITIES - NEW!
  // ==========================================
  test.describe('2.5.x Input Modalities', () => {
    test('[2.5.1] Pointer Gestures', async ({ page }) => {
      const result = await MotionGestureHelper.testPointerGestures(page);
      reportGen.addResults([result]);
    });

    test('[2.5.2] Pointer Cancellation', async ({ page }) => {
      const result = await WCAG22Helper.testPointerCancellation(page);
      reportGen.addResults([result]);
    });

    test('[2.5.3] Label in Name', async ({ page }) => {
      const fullScan = await AxeHelper.runAxeScan(page, {
        wcagLevel: 'AA',
        rules: ['label-content-name-mismatch']
      });
      reportGen.addResults(fullScan);
    });

    test('[2.5.4] Motion Actuation', async ({ page }) => {
      const result = await MotionGestureHelper.testMotionActuation(page);
      reportGen.addResults([result]);
    });

    test('[2.5.7] Dragging Movements (WCAG 2.2)', async ({ page }) => {
      const result = await WCAGAdvancedHelper.testDraggingFallback(page);
      reportGen.addResults([result]);
    });

    test('[2.5.8] Target Size Minimum (WCAG 2.2)', async ({ page }) => {
      const result = await WCAG22Helper.testTargetSize(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });
  });

  // ==========================================
  // 3.1.x READABLE - COMPLETE
  // ==========================================
  test.describe('3.1.x Readable', () => {
    test('[3.1.1] Language of Page', async ({ page }) => {
      const fullScan = await AxeHelper.runAxeScan(page, {
        wcagLevel: 'AA',
        rules: ['html-has-lang', 'html-lang-valid']
      });
      reportGen.addResults(fullScan);
    });

    test('[3.1.2] Language of Parts', async ({ page }) => {
      const fullScan = await AxeHelper.runAxeScan(page, {
        wcagLevel: 'AA',
        rules: ['valid-lang']
      });
      reportGen.addResults(fullScan);
    });
  });

  // ==========================================
  // 3.2.x PREDICTABLE - NEW!
  // ==========================================
  test.describe('3.2.x Predictable', () => {
    test('[3.2.1] On Focus', async ({ page }) => {
      const result = await PredictabilityHelper.testOnFocus(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[3.2.2] On Input', async ({ page }) => {
      const result = await PredictabilityHelper.testOnInput(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[3.2.3] Consistent Navigation', async ({ page }) => {
      const result = await PredictabilityHelper.testConsistentNavigation(page, 2);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[3.2.4] Consistent Identification', async ({ page }) => {
      const result = await PredictabilityHelper.testConsistentIdentification(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[3.2.5] Change on Request (AAA)', async ({ page }) => {
      const result = await PredictabilityHelper.testChangeOnRequest(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[3.2.6] Consistent Help (WCAG 2.2)', async ({ page }) => {
      const result = await WCAGAdvancedHelper.testConsistentHelp(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // 3.3.x INPUT ASSISTANCE - COMPLETE
  // ==========================================
  test.describe('3.3.x Input Assistance', () => {
    test('[3.3.2] Labels or Instructions', async ({ page }) => {
      const result = await AxeHelper.testFormLabels(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[3.3.8] Accessible Authentication (WCAG 2.2)', async ({ page }) => {
      const result = await WCAGAdvancedHelper.testAccessibleAuth(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // 4.1.x COMPATIBLE - COMPLETE
  // ==========================================
  test.describe('4.1.x Compatible', () => {
    test('[4.1.1] Parsing', async ({ page }) => {
      const fullScan = await AxeHelper.runAxeScan(page, {
        wcagLevel: 'AA',
        rules: ['duplicate-id', 'duplicate-id-active', 'duplicate-id-aria']
      });
      reportGen.addResults(fullScan);
    });

    test('[4.1.2] Name, Role, Value', async ({ page }) => {
      const result = await AxeHelper.testARIA(page);
      reportGen.addResults([result]);
      expect(result.status).not.toBe('fail');
    });

    test('[4.1.3] Status Messages', async ({ page }) => {
      const result = await AccessibilityTreeHelper.testStatusMessages(page);
      reportGen.addResults([result]);
    });
  });

  // ==========================================
  // COMPREHENSIVE AXE SCAN
  // ==========================================
  test('Run comprehensive axe-core scan (all rules)', async ({ page }) => {
    const results = await AxeHelper.runAxeScan(page, { wcagLevel: 'AA' });
    reportGen.addResults(results);
    
    const failures = results.filter(r => r.status === 'fail');
    console.log(`\n📊 Axe-core found ${failures.length} failures across ${results.length} criteria\n`);
  });

  // ==========================================
  // MANUAL TEST FLAGS
  // ==========================================
  test('Generate manual test flags', async ({ page }) => {
    const manualFlags = ManualTestFlags.generateManualFlags(page.url());
    reportGen.addResults(manualFlags);
    
    console.log(`\n📋 Generated ${manualFlags.length} manual test flags\n`);
  });
});

