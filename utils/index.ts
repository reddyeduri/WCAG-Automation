/**
 * WCAG 2.1 Accessibility Testing Framework
 * Main exports for easy imports
 */

// Core helpers
export { AxeHelper } from './axeHelper';
export { KeyboardHelper } from './keyboardHelper';
export { AccessibilityTreeHelper } from './accessibilityTreeHelper';
export { ManualTestFlags } from './manualTestFlags';
export { ResponsiveHelper } from './responsiveHelper';
export { WCAG22Helper } from './wcag22Helper';
export { WCAGAdvancedHelper } from './wcagAdvancedHelper';
export { MeaningfulSequenceHelper } from './meaningfulSequenceHelper';

// NEW: Comprehensive helpers for 100% coverage
export { MediaHelper } from './mediaHelper';
export { TimingAnimationHelper } from './timingAnimationHelper';
export { PredictabilityHelper } from './predictabilityHelper';
export { HoverFocusHelper } from './hoverFocusHelper';
export { MotionGestureHelper } from './motionGestureHelper';
export { ContentAnalysisHelper } from './contentAnalysisHelper';

// Utilities
export { ExcelParser } from './excelParser';
export { ReportGenerator } from './reportGenerator';
export { ComprehensiveReportGenerator } from './comprehensiveReportGenerator';
export { AccessibilityScorer } from './accessibilityScorer';

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

export type { 
  AccessibilityScore 
} from './accessibilityScorer';

