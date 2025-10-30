import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for testing motion, gestures, and input modalities
 * Covers WCAG 2.1 Success Criteria 2.5.x
 */
export class MotionGestureHelper {
  /**
   * 2.5.1 Pointer Gestures
   * Detects multi-point or path-based gestures without single-pointer alternatives
   */
  static async testPointerGestures(page: Page): Promise<TestResult> {
    const gestureInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check for touch event listeners
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        
        // Check for multi-touch gestures
        if (content.includes('touchstart') || content.includes('touchmove')) {
          if (content.includes('touches.length') && 
              (content.includes('> 1') || content.includes('>= 2') || content.includes('=== 2'))) {
            issues.push({
              description: 'Multi-touch gesture detected - verify single-pointer alternative exists',
              type: 'multi-touch',
              severity: 'serious'
            });
          }
        }

        // Check for swipe/drag gestures
        if ((content.includes('swipe') || content.includes('drag')) && 
            !content.includes('click') && !content.includes('button')) {
          issues.push({
            description: 'Swipe/drag gesture detected - verify click/tap alternative exists',
            type: 'swipe',
            severity: 'serious'
          });
        }

        // Check for pinch zoom
        if (content.includes('pinch') || content.includes('scale')) {
          issues.push({
            description: 'Pinch/zoom gesture detected - verify button alternative exists',
            type: 'pinch',
            severity: 'moderate'
          });
        }
      });

      // Check for draggable elements
      const draggables = Array.from(document.querySelectorAll('[draggable="true"], [data-draggable]'));
      draggables.forEach(el => {
        const hasButtons = !!el.querySelector('button, [role="button"]') ||
                          !!el.closest('*')?.querySelector('[aria-controls="' + el.id + '"]');
        
        if (!hasButtons && el.id) {
          issues.push({
            element: el.outerHTML.slice(0, 200),
            description: 'Draggable element without button control alternative',
            type: 'draggable',
            severity: 'serious'
          });
        }
      });

      // Check for slider inputs
      const sliders = Array.from(document.querySelectorAll('input[type="range"]'));
      sliders.forEach(slider => {
        // Range inputs are OK if they have keyboard support (which they do by default)
        // But check for custom sliders
        const hasAriaSlider = document.querySelector('[role="slider"]');
        if (hasAriaSlider) {
          issues.push({
            element: '<div role="slider">',
            description: 'Custom slider detected - verify keyboard arrow key support',
            type: 'slider',
            severity: 'moderate'
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = gestureInfo.map(item => ({
      description: item.description,
      severity: item.severity,
      element: item.element || '<script>',
      help: 'Provide single-pointer alternatives for all multi-point or path-based gestures',
      wcagTags: ['wcag2a', 'wcag251']
    }));

    return {
      criterionId: '2.5.1',
      criterionTitle: 'Pointer Gestures',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 2.5.4 Motion Actuation
   * Detects device motion or user motion as input mechanism
   */
  static async testMotionActuation(page: Page): Promise<TestResult> {
    const motionInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check for device motion event listeners
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        
        if (content.includes('devicemotion') || 
            content.includes('deviceorientation') ||
            content.includes('DeviceMotionEvent') ||
            content.includes('DeviceOrientationEvent')) {
          
          // Check if there's a way to disable it
          const hasDisable = content.includes('disable') || 
                            content.includes('toggle') || 
                            content.includes('settings');
          
          issues.push({
            description: hasDisable ? 
              'Device motion detected - verify disable mechanism works' : 
              'Device motion detected - no disable mechanism found',
            severity: hasDisable ? 'moderate' : 'serious',
            hasDisable
          });
        }

        // Check for shake detection
        if (content.includes('shake') || content.includes('Shake')) {
          issues.push({
            description: 'Shake gesture detected - verify UI alternative exists',
            severity: 'serious'
          });
        }

        // Check for tilt controls
        if (content.includes('tilt') || content.includes('orientation.gamma') || content.includes('orientation.beta')) {
          issues.push({
            description: 'Tilt controls detected - verify UI alternative exists',
            severity: 'serious'
          });
        }
      });

      // Check for camera/video for motion detection
      const videos = Array.from(document.querySelectorAll('video'));
      videos.forEach(video => {
        if (video.srcObject) {
          issues.push({
            element: video.outerHTML.slice(0, 200),
            description: 'Video stream detected - if used for motion sensing, provide alternative',
            severity: 'moderate'
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = motionInfo.map(item => ({
      description: item.description,
      severity: item.severity,
      element: item.element || '<script>',
      help: 'Provide UI alternatives and disable mechanism for motion-actuated functionality',
      wcagTags: ['wcag2a', 'wcag254']
    }));

    return {
      criterionId: '2.5.4',
      criterionTitle: 'Motion Actuation',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 2.1.4 Character Key Shortcuts
   * Detects single character keyboard shortcuts
   */
  static async testCharacterKeyShortcuts(page: Page): Promise<TestResult> {
    const shortcutInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check for keyboard event listeners
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        
        // Look for single key handling
        if (content.includes('addEventListener') && 
            (content.includes('keydown') || content.includes('keypress') || content.includes('keyup'))) {
          
          // Check if it's checking for modifier keys
          const hasModifierCheck = content.includes('ctrlKey') || 
                                  content.includes('altKey') || 
                                  content.includes('shiftKey') || 
                                  content.includes('metaKey');
          
          // Check if there's a way to disable shortcuts
          const hasDisableOption = content.includes('shortcuts') && 
                                  (content.includes('disable') || content.includes('off'));

          // Pattern for single character shortcuts (e.g., key === 'a')
          const singleKeyPattern = /key\s*===?\s*['"][a-zA-Z0-9]['"]/.test(content);
          
          if (singleKeyPattern && !hasModifierCheck) {
            issues.push({
              description: hasDisableOption ? 
                'Single key shortcuts detected - verify users can disable them' :
                'Single key shortcuts detected without modifier keys or disable option',
              severity: hasDisableOption ? 'moderate' : 'serious',
              hasDisable: hasDisableOption
            });
          }
        }

        // Check for accesskey attribute usage
        const accesskeys = Array.from(document.querySelectorAll('[accesskey]'));
        if (accesskeys.length > 0) {
          accesskeys.forEach(el => {
            const key = el.getAttribute('accesskey') || '';
            if (key.length === 1) {
              issues.push({
                element: el.outerHTML.slice(0, 200),
                description: `Single character accesskey "${key}" - verify it can be remapped or disabled`,
                severity: 'moderate'
              });
            }
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = shortcutInfo.map(item => ({
      description: item.description,
      severity: item.severity,
      element: item.element || '<script>',
      help: 'Single key shortcuts must be remappable, disableable, or only active on focus',
      wcagTags: ['wcag2a', 'wcag214']
    }));

    return {
      criterionId: '2.1.4',
      criterionTitle: 'Character Key Shortcuts',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Run all motion and gesture tests
   */
  static async runAllMotionGestureTests(page: Page): Promise<TestResult[]> {
    const results: TestResult[] = [];

    results.push(await this.testPointerGestures(page));
    results.push(await this.testMotionActuation(page));
    results.push(await this.testCharacterKeyShortcuts(page));

    return results;
  }
}

