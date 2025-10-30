import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for testing timing, animations, and moving content
 * Covers WCAG 2.1 Success Criteria 2.2.x and 2.3.x
 */
export class TimingAnimationHelper {
  /**
   * 2.2.1 Timing Adjustable
   * Comprehensive timing detection
   */
  static async testTimingAdjustable(page: Page): Promise<TestResult> {
    const timingInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check meta refresh
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        const content = metaRefresh.getAttribute('content') || '';
        const seconds = parseInt(content.split(';')[0] || '0');
        if (seconds > 0) {
          issues.push({
            html: metaRefresh.outerHTML,
            description: `Meta refresh with ${seconds} second timeout`,
            type: 'meta-refresh'
          });
        }
      }

      // Check for setTimeout/setInterval in inline scripts (heuristic)
      const scripts = Array.from(document.querySelectorAll('script'));
      const hasTimingCode = scripts.some(script => {
        const content = script.textContent || '';
        return content.includes('setTimeout') || 
               content.includes('setInterval') || 
               content.includes('window.location');
      });

      if (hasTimingCode) {
        issues.push({
          html: '<script>',
          description: 'Detected timing functions (setTimeout/setInterval) - verify user can extend/disable timers',
          type: 'timing-code'
        });
      }

      // Check for session timeout warnings
      const sessionWarnings = Array.from(document.querySelectorAll('[id*="timeout" i], [class*="timeout" i], [id*="session" i]'));
      if (sessionWarnings.length > 0) {
        issues.push({
          html: 'Session timeout UI detected',
          description: 'Verify user can extend session before timeout',
          type: 'session-timeout'
        });
      }

      return issues;
    });

    const issues: Issue[] = timingInfo.map(item => ({
      description: item.description,
      severity: item.type === 'meta-refresh' ? 'serious' : 'moderate',
      element: item.html,
      help: 'Provide mechanism to turn off, adjust, or extend time limits before timeout',
      wcagTags: ['wcag2a', 'wcag221']
    }));

    return {
      criterionId: '2.2.1',
      criterionTitle: 'Timing Adjustable',
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
   * 2.2.2 Pause, Stop, Hide
   * Comprehensive moving/blinking/scrolling content detection
   */
  static async testPauseStopHide(page: Page): Promise<TestResult> {
    const animationInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check deprecated elements
      const blink = document.querySelector('blink');
      const marquee = document.querySelector('marquee');
      if (blink) issues.push({ html: blink.outerHTML, description: 'Deprecated <blink> element', type: 'blink' });
      if (marquee) issues.push({ html: marquee.outerHTML, description: 'Deprecated <marquee> element', type: 'marquee' });

      // Check for CSS animations/transitions
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        const styles = getComputedStyle(el as HTMLElement);
        const animDuration = parseFloat(styles.animationDuration || '0');
        const transitionDuration = parseFloat(styles.transitionDuration || '0');
        const animIterations = styles.animationIterationCount;

        // Check for infinite or long-running animations
        if ((animDuration > 5 || transitionDuration > 5 || animIterations === 'infinite') && 
            styles.animationPlayState !== 'paused') {
          const hasControl = !!(el as HTMLElement).closest('[aria-label*="pause" i], [aria-label*="stop" i]') ||
                            !!document.querySelector('[aria-controls="' + el.id + '"]');
          
          if (!hasControl && el.id) {
            issues.push({
              html: (el as HTMLElement).outerHTML.slice(0, 200),
              description: `Long-running animation (${animDuration}s) without pause control`,
              type: 'animation'
            });
          }
        }
      });

      // Check for text-decoration: blink
      const blinkingElements = allElements.filter(el => {
        const styles = getComputedStyle(el as HTMLElement);
        return styles.textDecoration.includes('blink');
      });

      blinkingElements.forEach(el => {
        issues.push({
          html: (el as HTMLElement).outerHTML.slice(0, 200),
          description: 'Element using text-decoration: blink',
          type: 'css-blink'
        });
      });

      // Check for scrolling content
      const scrollingElements = Array.from(document.querySelectorAll('[behavior="scroll"], [scrollamount]'));
      scrollingElements.forEach(el => {
        issues.push({
          html: el.outerHTML.slice(0, 200),
          description: 'Scrolling content without pause mechanism',
          type: 'scrolling'
        });
      });

      return issues;
    });

    const issues: Issue[] = animationInfo.map(item => ({
      description: item.description,
      severity: item.type === 'blink' || item.type === 'marquee' ? 'critical' : 'serious',
      element: item.html,
      help: 'Provide pause, stop, or hide control for moving/blinking/scrolling content',
      wcagTags: ['wcag2a', 'wcag222']
    }));

    return {
      criterionId: '2.2.2',
      criterionTitle: 'Pause, Stop, Hide',
      principle: 'Operable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 2.3.1 Three Flashes or Below Threshold
   * Detects potentially flashing content
   */
  static async testThreeFlashes(page: Page): Promise<TestResult> {
    const flashInfo = await page.evaluate(() => {
      const issues: any[] = [];

      // Check for rapid animation frame rates
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        const styles = getComputedStyle(el as HTMLElement);
        const animDuration = parseFloat(styles.animationDuration || '0');
        
        // If animation duration is very short (<0.3s), it could flash rapidly
        if (animDuration > 0 && animDuration < 0.33) {
          issues.push({
            html: (el as HTMLElement).outerHTML.slice(0, 200),
            description: `Very fast animation (${animDuration}s) - verify it doesn't flash more than 3 times per second`,
            type: 'fast-animation'
          });
        }
      });

      // Check for GIF images (can't analyze frame rate, but flag for review)
      const gifs = Array.from(document.querySelectorAll('img[src$=".gif" i], img[src*=".gif?" i]'));
      gifs.forEach(img => {
        issues.push({
          html: img.outerHTML.slice(0, 200),
          description: 'Animated GIF detected - manual review required for flash rate',
          type: 'gif'
        });
      });

      // Check for video/canvas elements
      const videos = document.querySelectorAll('video');
      const canvases = document.querySelectorAll('canvas');
      
      if (videos.length > 0 || canvases.length > 0) {
        issues.push({
          html: `${videos.length} video(s), ${canvases.length} canvas(es)`,
          description: 'Video/Canvas content - manual review required for flashing',
          type: 'media'
        });
      }

      return issues;
    });

    const issues: Issue[] = flashInfo.map(item => ({
      description: item.description,
      severity: item.type === 'fast-animation' ? 'serious' : 'moderate',
      element: item.html,
      help: 'Ensure content does not flash more than 3 times per second, or flashes are below threshold',
      wcagTags: ['wcag2a', 'wcag231']
    }));

    return {
      criterionId: '2.3.1',
      criterionTitle: 'Three Flashes or Below Threshold',
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
   * 2.3.3 Animation from Interactions
   * Tests reduced motion preference
   */
  static async testReducedMotion(page: Page): Promise<TestResult> {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);

    const motionInfo = await page.evaluate(() => {
      const issues: any[] = [];
      const allElements = Array.from(document.querySelectorAll('*'));

      allElements.forEach(el => {
        const styles = getComputedStyle(el as HTMLElement);
        const animDuration = parseFloat(styles.animationDuration || '0');
        const transitionDuration = parseFloat(styles.transitionDuration || '0');

        // Check if animations are still running with prefers-reduced-motion
        if ((animDuration > 0 || transitionDuration > 0) && 
            styles.animationPlayState !== 'paused') {
          issues.push({
            html: (el as HTMLElement).outerHTML.slice(0, 200),
            description: 'Animation still active with prefers-reduced-motion: reduce',
            duration: Math.max(animDuration, transitionDuration)
          });
        }
      });

      return issues.slice(0, 10); // Limit to first 10
    });

    // Reset media emulation
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    const issues: Issue[] = motionInfo.map(item => ({
      description: item.description,
      severity: 'moderate',
      element: item.html,
      help: 'Respect prefers-reduced-motion CSS media query to disable or reduce animations',
      wcagTags: ['wcag2aaa', 'wcag233']
    }));

    return {
      criterionId: '2.3.3',
      criterionTitle: 'Animation from Interactions',
      principle: 'Operable',
      level: 'AAA',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Run all timing and animation tests
   */
  static async runAllTimingTests(page: Page): Promise<TestResult[]> {
    const results: TestResult[] = [];

    results.push(await this.testTimingAdjustable(page));
    results.push(await this.testPauseStopHide(page));
    results.push(await this.testThreeFlashes(page));
    results.push(await this.testReducedMotion(page));

    return results;
  }
}

