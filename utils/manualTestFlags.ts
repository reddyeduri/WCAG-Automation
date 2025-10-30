import { TestResult } from './reportGenerator';

/**
 * Criteria that require manual testing with NVDA or human judgment
 */
export class ManualTestFlags {
  /**
   * Generate manual test flags for criteria that cannot be fully automated
   */
  static generateManualFlags(url: string): TestResult[] {
    return [
      {
        criterionId: '1.2.2',
        criterionTitle: 'Captions (Prerecorded)',
        principle: 'Perceivable',
        level: 'A',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check if all prerecorded video content has accurate captions',
            severity: 'moderate',
            help: 'Verify caption quality, synchronization, and accuracy with NVDA or manual review',
            wcagTags: ['wcag2a', 'wcag122']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '1.2.3',
        criterionTitle: 'Audio Description or Media Alternative',
        principle: 'Perceivable',
        level: 'A',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check if video has audio description or text alternative',
            severity: 'moderate',
            help: 'Verify that visual content is described for blind users',
            wcagTags: ['wcag2a', 'wcag123']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '1.2.5',
        criterionTitle: 'Audio Description (Prerecorded)',
        principle: 'Perceivable',
        level: 'AA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check if video has audio description track',
            severity: 'moderate',
            help: 'Verify audio description quality and completeness',
            wcagTags: ['wcag2aa', 'wcag125']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '1.2.6',
        criterionTitle: 'Sign Language (Prerecorded)',
        principle: 'Perceivable',
        level: 'AAA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check if audio content has sign language interpretation',
            severity: 'minor',
            help: 'Level AAA: Provide sign language for prerecorded audio',
            wcagTags: ['wcag2aaa', 'wcag126']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '1.4.13',
        criterionTitle: 'Content on Hover or Focus',
        principle: 'Perceivable',
        level: 'AA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Test hover/focus content can be dismissed and persists',
            severity: 'moderate',
            help: 'Tooltips and hover content must be dismissible, hoverable, and persistent',
            wcagTags: ['wcag2aa', 'wcag1413']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '2.2.1',
        criterionTitle: 'Timing Adjustable',
        principle: 'Operable',
        level: 'A',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check if time limits can be turned off, adjusted, or extended',
            severity: 'serious',
            help: 'Users must be able to control time limits',
            wcagTags: ['wcag2a', 'wcag221']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '2.3.1',
        criterionTitle: 'Three Flashes or Below Threshold',
        principle: 'Operable',
        level: 'A',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Ensure no content flashes more than 3 times per second',
            severity: 'critical',
            help: 'Flashing content can cause seizures - must be below threshold',
            wcagTags: ['wcag2a', 'wcag231']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '2.4.4',
        criterionTitle: 'Link Purpose (In Context)',
        principle: 'Operable',
        level: 'A',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Verify link text clearly describes link purpose',
            severity: 'moderate',
            help: 'Test with NVDA to ensure link purposes are clear from context',
            wcagTags: ['wcag2a', 'wcag244']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '3.1.1',
        criterionTitle: 'Language of Page',
        principle: 'Understandable',
        level: 'A',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Confirm language attribute matches actual content language',
            severity: 'moderate',
            help: 'Verify with NVDA that correct language pronunciation is used',
            wcagTags: ['wcag2a', 'wcag311']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '3.1.2',
        criterionTitle: 'Language of Parts',
        principle: 'Understandable',
        level: 'AA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check if content in different languages is marked with lang attribute',
            severity: 'moderate',
            help: 'Test multi-language content with NVDA for proper pronunciation',
            wcagTags: ['wcag2aa', 'wcag312']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '3.1.5',
        criterionTitle: 'Reading Level',
        principle: 'Understandable',
        level: 'AAA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Assess if content requires reading ability beyond lower secondary education',
            severity: 'minor',
            help: 'Level AAA: Content should be understandable at appropriate reading level',
            wcagTags: ['wcag2aaa', 'wcag315']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '3.2.5',
        criterionTitle: 'Change on Request',
        principle: 'Understandable',
        level: 'AAA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Check that context changes only occur on user request',
            severity: 'minor',
            help: 'Level AAA: Test that automatic context changes can be prevented',
            wcagTags: ['wcag2aaa', 'wcag325']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      },
      {
        criterionId: '3.3.3',
        criterionTitle: 'Error Suggestion',
        principle: 'Understandable',
        level: 'AA',
        testType: 'manual-flag',
        status: 'manual-required',
        issues: [
          {
            description: 'Manual verification required: Verify error messages provide suggestions for correction',
            severity: 'moderate',
            help: 'Test form validation with NVDA to ensure helpful error messages',
            wcagTags: ['wcag2aa', 'wcag333']
          }
        ],
        timestamp: new Date().toISOString(),
        url
      }
    ];
  }

  /**
   * Get list of all manual test criteria IDs
   */
  static getManualCriteriaIds(): string[] {
    return [
      '1.2.2', '1.2.3', '1.2.5', '1.2.6',
      '1.4.13',
      '2.2.1', '2.3.1', '2.4.4',
      '3.1.1', '3.1.2', '3.1.5',
      '3.2.5', '3.3.3'
    ];
  }

  /**
   * Check if a criterion requires manual testing
   */
  static requiresManualTest(criterionId: string): boolean {
    return this.getManualCriteriaIds().includes(criterionId);
  }
}

