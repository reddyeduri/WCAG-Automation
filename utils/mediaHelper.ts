import { Page } from '@playwright/test';
import type { TestResult, Issue } from './reportGenerator';

/**
 * Helper for testing time-based media (audio/video) accessibility
 * Covers WCAG 2.1 Success Criteria 1.2.x
 */
export class MediaHelper {
  /**
   * 1.2.1 Audio-only and Video-only (Prerecorded)
   * Detects media elements and checks for alternatives
   */
  static async testAudioVideoOnly(page: Page): Promise<TestResult> {
    const mediaInfo = await page.evaluate(() => {
      const issues: any[] = [];
      
      // Check audio-only elements
      const audioElements = Array.from(document.querySelectorAll('audio'));
      audioElements.forEach(audio => {
        const hasTranscript = !!audio.closest('[aria-describedby]') || 
                             !!document.querySelector(`[aria-labelledby*="${audio.id}"]`) ||
                             !!audio.nextElementSibling?.textContent?.toLowerCase().includes('transcript');
        
        if (!hasTranscript && audio.src) {
          issues.push({
            type: 'audio-only',
            html: audio.outerHTML.slice(0, 200),
            description: 'Audio element without visible transcript or text alternative'
          });
        }
      });

      // Check video-only (no audio track detection requires media API)
      const videoElements = Array.from(document.querySelectorAll('video'));
      videoElements.forEach(video => {
        const hasAlternative = !!video.closest('[aria-describedby]') || 
                              !!document.querySelector(`[aria-labelledby*="${video.id}"]`);
        
        if (!hasAlternative && video.src) {
          issues.push({
            type: 'video-only',
            html: video.outerHTML.slice(0, 200),
            description: 'Video element without text alternative or audio description link'
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = mediaInfo.map(item => ({
      description: item.description,
      severity: 'serious',
      element: item.html,
      help: 'Provide text transcript for audio-only content or text alternative for video-only content',
      wcagTags: ['wcag2a', 'wcag121']
    }));

    return {
      criterionId: '1.2.1',
      criterionTitle: 'Audio-only and Video-only (Prerecorded)',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 1.2.2 Captions (Prerecorded)
   * Checks for caption tracks on video elements
   */
  static async testCaptions(page: Page): Promise<TestResult> {
    const captionInfo = await page.evaluate(() => {
      const issues: any[] = [];
      const videos = Array.from(document.querySelectorAll('video'));

      videos.forEach(video => {
        const tracks = Array.from(video.querySelectorAll('track'));
        const hasCaptions = tracks.some(track => 
          track.kind === 'captions' || track.kind === 'subtitles'
        );

        if (!hasCaptions && video.src) {
          issues.push({
            html: video.outerHTML.slice(0, 200),
            description: 'Video element without captions track'
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = captionInfo.map(item => ({
      description: item.description,
      severity: 'critical',
      element: item.html,
      help: 'Add <track kind="captions"> element to video. Manual review needed for caption quality.',
      wcagTags: ['wcag2a', 'wcag122']
    }));

    return {
      criterionId: '1.2.2',
      criterionTitle: 'Captions (Prerecorded)',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 1.2.3 Audio Description or Media Alternative (Prerecorded)
   */
  static async testAudioDescription(page: Page): Promise<TestResult> {
    const audioDescInfo = await page.evaluate(() => {
      const issues: any[] = [];
      const videos = Array.from(document.querySelectorAll('video'));

      videos.forEach(video => {
        const tracks = Array.from(video.querySelectorAll('track'));
        const hasAudioDesc = tracks.some(track => track.kind === 'descriptions');
        const hasTranscriptLink = !!video.parentElement?.querySelector('a[href*="transcript"]');

        if (!hasAudioDesc && !hasTranscriptLink && video.src) {
          issues.push({
            html: video.outerHTML.slice(0, 200),
            description: 'Video without audio description track or transcript link'
          });
        }
      });

      return issues;
    });

    const issues: Issue[] = audioDescInfo.map(item => ({
      description: item.description,
      severity: 'serious',
      element: item.html,
      help: 'Provide audio description track or link to full text transcript',
      wcagTags: ['wcag2a', 'wcag123']
    }));

    return {
      criterionId: '1.2.3',
      criterionTitle: 'Audio Description or Media Alternative (Prerecorded)',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'warning' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * 1.4.2 Audio Control
   * Detects auto-playing audio that lasts more than 3 seconds
   */
  static async testAudioControl(page: Page): Promise<TestResult> {
    const autoplayInfo = await page.evaluate(() => {
      const issues: any[] = [];
      
      // Check audio elements with autoplay
      const audioElements = Array.from(document.querySelectorAll('audio[autoplay], video[autoplay]'));
      
      audioElements.forEach(media => {
        const hasControls = media.hasAttribute('controls');
        const hasMuteButton = !!media.closest('*')?.querySelector('[aria-label*="mute" i], [aria-label*="pause" i], button:has-text("Stop")');
        
        if (!hasControls && !hasMuteButton) {
          issues.push({
            html: media.outerHTML.slice(0, 200),
            description: 'Auto-playing media without controls to pause/stop/mute',
            tag: media.tagName.toLowerCase()
          });
        }
      });

      // Check for background audio via embeds
      const embeds = Array.from(document.querySelectorAll('embed[src*=".mp3"], embed[src*=".wav"], object[data*=".mp3"]'));
      embeds.forEach(embed => {
        issues.push({
          html: embed.outerHTML.slice(0, 200),
          description: 'Embedded audio file - verify it has stop/pause control',
          tag: 'embed'
        });
      });

      return issues;
    });

    const issues: Issue[] = autoplayInfo.map(item => ({
      description: item.description,
      severity: 'serious',
      element: item.html,
      help: 'Provide controls attribute or separate pause/stop button for auto-playing audio',
      wcagTags: ['wcag2a', 'wcag142']
    }));

    return {
      criterionId: '1.4.2',
      criterionTitle: 'Audio Control',
      principle: 'Perceivable',
      level: 'A',
      testType: 'automated',
      status: issues.length > 0 ? 'fail' : 'pass',
      issues,
      timestamp: new Date().toISOString(),
      url: page.url()
    };
  }

  /**
   * Run all media-related tests
   */
  static async runAllMediaTests(page: Page): Promise<TestResult[]> {
    const results: TestResult[] = [];

    results.push(await this.testAudioVideoOnly(page));
    results.push(await this.testCaptions(page));
    results.push(await this.testAudioDescription(page));
    results.push(await this.testAudioControl(page));

    return results;
  }
}

