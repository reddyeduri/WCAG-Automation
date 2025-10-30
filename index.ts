/**
 * WCAG 2.1 Accessibility Testing Framework
 * 
 * Main entry point for the framework
 * 
 * @example
 * ```typescript
 * import { AxeHelper, ReportGenerator } from './index';
 * 
 * const reportGen = new ReportGenerator();
 * const results = await AxeHelper.runAxeScan(page);
 * reportGen.addResults(results);
 * reportGen.generateExcelReport();
 * ```
 */

// Re-export all utilities
export * from './utils';

// Re-export configuration
export { defaultConfig, WCAG_CRITERIA } from './config/wcagConfig';
export type { WCAGTestConfig } from './config/wcagConfig';

// Version
export const VERSION = '1.0.0';

// Framework info
export const FRAMEWORK_INFO = {
  name: 'WCAG 2.1 Accessibility Testing Framework',
  version: VERSION,
  description: 'Playwright-based framework for WCAG 2.1 accessibility validation',
  features: [
    'axe-core automated testing',
    'Keyboard navigation validation',
    'Accessibility tree analysis (NVDA approximation)',
    'Excel and JSON reporting',
    'WCAG criteria mapping and tagging',
    'Manual test flagging'
  ],
  coverage: {
    automated: '~40%',
    semiAutomated: '~20%',
    manualFlags: '~40%'
  },
  wcagLevels: ['A', 'AA', 'AAA'],
  defaultLevel: 'AA'
};

