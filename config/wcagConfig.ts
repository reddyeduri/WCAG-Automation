export interface WCAGTestConfig {
  baseUrl: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  runAxeTests: boolean;
  runKeyboardTests: boolean;
  runA11yTreeTests: boolean;
  includeManualFlags: boolean;
  excelAssessmentPath?: string;
  outputDir: string;
  screenshotOnFailure: boolean;
  headless: boolean;
}

export const defaultConfig: WCAGTestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  wcagLevel: 'AA',
  runAxeTests: true,
  runKeyboardTests: true,
  runA11yTreeTests: true,
  includeManualFlags: true,
  excelAssessmentPath: './wcag-assessment.xlsx',
  outputDir: './reports',
  screenshotOnFailure: true,
  headless: false
};

/**
 * WCAG 2.1 Success Criteria Mappings
 */
export const WCAG_CRITERIA = {
  // PERCEIVABLE
  '1.1.1': {
    title: 'Non-text Content',
    level: 'A',
    principle: 'Perceivable',
    automated: true
  },
  '1.2.1': {
    title: 'Audio-only and Video-only (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    automated: false
  },
  '1.2.2': {
    title: 'Captions (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    automated: false
  },
  '1.2.3': {
    title: 'Audio Description or Media Alternative',
    level: 'A',
    principle: 'Perceivable',
    automated: false
  },
  '1.3.1': {
    title: 'Info and Relationships',
    level: 'A',
    principle: 'Perceivable',
    automated: true
  },
  '1.3.2': {
    title: 'Meaningful Sequence',
    level: 'A',
    principle: 'Perceivable',
    automated: true
  },
  '1.3.3': {
    title: 'Sensory Characteristics',
    level: 'A',
    principle: 'Perceivable',
    automated: false
  },
  '1.4.1': {
    title: 'Use of Color',
    level: 'A',
    principle: 'Perceivable',
    automated: false
  },
  '1.4.2': {
    title: 'Audio Control',
    level: 'A',
    principle: 'Perceivable',
    automated: false
  },
  '1.4.3': {
    title: 'Contrast (Minimum)',
    level: 'AA',
    principle: 'Perceivable',
    automated: true
  },
  '1.4.4': {
    title: 'Resize Text',
    level: 'AA',
    principle: 'Perceivable',
    automated: false
  },
  '1.4.5': {
    title: 'Images of Text',
    level: 'AA',
    principle: 'Perceivable',
    automated: false
  },

  // OPERABLE
  '2.1.1': {
    title: 'Keyboard',
    level: 'A',
    principle: 'Operable',
    automated: true
  },
  '2.1.2': {
    title: 'No Keyboard Trap',
    level: 'A',
    principle: 'Operable',
    automated: true
  },
  '2.1.4': {
    title: 'Character Key Shortcuts',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.2.1': {
    title: 'Timing Adjustable',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.2.2': {
    title: 'Pause, Stop, Hide',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.3.1': {
    title: 'Three Flashes or Below Threshold',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.4.1': {
    title: 'Bypass Blocks',
    level: 'A',
    principle: 'Operable',
    automated: true
  },
  '2.4.2': {
    title: 'Page Titled',
    level: 'A',
    principle: 'Operable',
    automated: true
  },
  '2.4.3': {
    title: 'Focus Order',
    level: 'A',
    principle: 'Operable',
    automated: true
  },
  '2.4.4': {
    title: 'Link Purpose (In Context)',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.4.5': {
    title: 'Multiple Ways',
    level: 'AA',
    principle: 'Operable',
    automated: false
  },
  '2.4.6': {
    title: 'Headings and Labels',
    level: 'AA',
    principle: 'Operable',
    automated: true
  },
  '2.4.7': {
    title: 'Focus Visible',
    level: 'AA',
    principle: 'Operable',
    automated: true
  },
  '2.5.1': {
    title: 'Pointer Gestures',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.5.2': {
    title: 'Pointer Cancellation',
    level: 'A',
    principle: 'Operable',
    automated: false
  },
  '2.5.3': {
    title: 'Label in Name',
    level: 'A',
    principle: 'Operable',
    automated: true
  },
  '2.5.4': {
    title: 'Motion Actuation',
    level: 'A',
    principle: 'Operable',
    automated: false
  },

  // UNDERSTANDABLE
  '3.1.1': {
    title: 'Language of Page',
    level: 'A',
    principle: 'Understandable',
    automated: true
  },
  '3.1.2': {
    title: 'Language of Parts',
    level: 'AA',
    principle: 'Understandable',
    automated: true
  },
  '3.2.1': {
    title: 'On Focus',
    level: 'A',
    principle: 'Understandable',
    automated: false
  },
  '3.2.2': {
    title: 'On Input',
    level: 'A',
    principle: 'Understandable',
    automated: false
  },
  '3.2.3': {
    title: 'Consistent Navigation',
    level: 'AA',
    principle: 'Understandable',
    automated: false
  },
  '3.2.4': {
    title: 'Consistent Identification',
    level: 'AA',
    principle: 'Understandable',
    automated: false
  },
  '3.3.1': {
    title: 'Error Identification',
    level: 'A',
    principle: 'Understandable',
    automated: true
  },
  '3.3.2': {
    title: 'Labels or Instructions',
    level: 'A',
    principle: 'Understandable',
    automated: true
  },
  '3.3.3': {
    title: 'Error Suggestion',
    level: 'AA',
    principle: 'Understandable',
    automated: false
  },
  '3.3.4': {
    title: 'Error Prevention (Legal, Financial, Data)',
    level: 'AA',
    principle: 'Understandable',
    automated: false
  },

  // ROBUST
  '4.1.1': {
    title: 'Parsing',
    level: 'A',
    principle: 'Robust',
    automated: true
  },
  '4.1.2': {
    title: 'Name, Role, Value',
    level: 'A',
    principle: 'Robust',
    automated: true
  },
  '4.1.3': {
    title: 'Status Messages',
    level: 'AA',
    principle: 'Robust',
    automated: true
  }
};

