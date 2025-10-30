/**
 * WCAG 2.1 Accessibility Testing Framework
 * Main exports for easy imports
 */

// Core helpers
export { AxeHelper } from './axeHelper';
export { KeyboardHelper } from './keyboardHelper';
export { AccessibilityTreeHelper } from './accessibilityTreeHelper';
export { ManualTestFlags } from './manualTestFlags';

// Utilities
export { ExcelParser } from './excelParser';
export { ReportGenerator } from './reportGenerator';

// Types
export type { 
  TestResult, 
  Issue 
} from './reportGenerator';

export type { 
  WCAGCriterion, 
  ExcelAssessment 
} from './excelParser';

export type { 
  FocusableElement 
} from './keyboardHelper';

export type { 
  AccessibilityNode 
} from './accessibilityTreeHelper';

export type { 
  AxeTestConfig 
} from './axeHelper';

