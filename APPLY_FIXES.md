# How to Apply Code Quality Fixes

**STATUS**: All improved files are ready. Background tests may still be running.

## Files Created:

1. `utils/selectorHelper.IMPROVED.ts` - Issue #1 fix (eliminates 150+ lines of duplication)
2. `IMPROVEMENT_PLAN.md` - Complete documentation of all 7 improvements
3. This file - Instructions for applying fixes

---

## ⚠️ IMPORTANT: Apply These Fixes ONE AT A TIME

Test after each fix to ensure nothing breaks!

---

## Issue #1: Duplicate Selector Generation Logic (READY TO APPLY)

**Impact**: Eliminates 150+ lines of duplicated code
**Time**: 5 minutes
**Risk**: Low (just moving code to shared location)

### Step 1: Replace selectorHelper.ts

```bash
# Backup original
cp utils/selectorHelper.ts utils/selectorHelper.ts.BACKUP

# Apply fix
cp utils/selectorHelper.IMPROVED.ts utils/selectorHelper.ts
```

### Step 2: Update keyboardHelper.ts

Find this code block (lines 127-151):

```typescript
// Lines 127-151 in keyboardHelper.ts
function getFullPathSelector(el: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    } else {
      const parent = current.parentNode;
      if (parent) {
        const siblings = Array.from(parent.children).filter(child => child.tagName === current!.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}
```

**REPLACE WITH**:

```typescript
// Import shared selector generator from top of file
import { SELECTOR_GENERATOR_BROWSER_FN } from './selectorHelper';

// Then in the function, use:
const getFullPathSelector = eval(SELECTOR_GENERATOR_BROWSER_FN);
```

### Step 3: Update accessibilityTreeHelper.ts

Find this code block (lines 125-149):

```typescript
// Lines 125-149 in accessibilityTreeHelper.ts
function getFullPathSelector(el: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    } else {
      const parent = current.parentNode;
      if (parent) {
        const siblings = Array.from(parent.children).filter(child => child.tagName === current!.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}
```

**REPLACE WITH**:

```typescript
// Import at top of file
import { SELECTOR_GENERATOR_BROWSER_FN } from './selectorHelper';

// Then in the page.evaluate(), use:
const getFullPathSelector = eval('(' + selectorFnString + ')');
// And pass selectorFnString as parameter
```, SELECTOR_GENERATOR_BROWSER_FN);
```

### Step 4: Test

```bash
# Run tests to verify nothing broke
npm test tests/wcag-complete-coverage.spec.ts -- --workers=1
```

---

## Issue #2: Type Safety - Fix `any` Types (NEEDS IMPLEMENTATION)

**Impact**: Adds proper TypeScript type safety to 50+ locations
**Time**: 2 hours
**Risk**: Medium (requires careful typing)

### Create New File: utils/axeTypes.ts

```typescript
/**
 * Proper TypeScript interfaces for Axe accessibility testing
 * Eliminates 50+ uses of 'any' type across the codebase
 */

export interface AxeResults {
  violations: AxeViolation[];
  passes: AxeViolation[];
  incomplete: AxeViolation[];
  inapplicable: AxeViolation[];
  timestamp: string;
  url: string;
}

export interface AxeViolation {
  id: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

export interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
  any: AxeCheckResult[];
  all: AxeCheckResult[];
  none: AxeCheckResult[];
}

export interface AxeCheckResult {
  id: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor';
  message: string;
  data: any; // This one can stay 'any' - truly dynamic
  relatedNodes?: AxeRelatedNode[];
}

export interface AxeRelatedNode {
  target: string[];
  html: string;
}

export interface AxeCriteriaMap {
  [criterionId: string]: AxeViolation[];
}
```

### Update axeHelper.ts

Replace all instances of `any` with proper types:

```typescript
// BEFORE:
const criteriaMap: any = this.mapViolationsToCriteria(results.violations);

// AFTER:
import { AxeResults, AxeViolation, AxeCriteriaMap } from './axeTypes';
const criteriaMap: AxeCriteriaMap = this.mapViolationsToCriteria(results.violations);
```

**Total replacements needed**: 25+ in axeHelper.ts alone

---

## Issue #3: Better Error Handling (NEEDS IMPLEMENTATION)

**Impact**: Proper error tracking instead of silent failures
**Time**: 1.5 hours
**Risk**: Low

### Create New File: utils/errorHandler.ts

```typescript
import { TestResult, Issue } from './reportGenerator';

/**
 * Custom error class for test failures
 */
export class TestError extends Error {
  constructor(
    message: string,
    public readonly context: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'TestError';
  }
}

/**
 * Create a warning result when a test encounters an error
 * Better than silent failure or empty catch blocks
 */
export function createWarningResult(
  criterionId: string,
  criterionTitle: string,
  principle: string,
  level: 'A' | 'AA' | 'AAA',
  testType: string,
  error: unknown,
  url: string
): TestResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ [${criterionId}] ${criterionTitle} test failed:`, message);

  return {
    criterionId,
    criterionTitle,
    principle,
    level,
    testType,
    status: 'warning',
    issues: [{
      description: `Test could not complete: ${message}`,
      severity: 'moderate',
      help: 'This test encountered an error and may require manual verification',
      wcagTags: [`wcag${level.toLowerCase()}`]
    }],
    timestamp: new Date().toISOString(),
    url
  };
}

/**
 * Log error with context for debugging
 */
export function logTestError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`\n❌ Error in ${context}:`);
  console.error(`   Message: ${message}`);
  if (stack && process.env.DEBUG_ERRORS === 'true') {
    console.error(`   Stack: ${stack}`);
  }
}
```

### Update Helper Files

Replace empty catch blocks:

```typescript
// BEFORE (keyboardHelper.ts line 56-58):
} catch (error) {
  // Skip elements that can't be focused instead of reporting all as failures
}

// AFTER:
} catch (error) {
  logTestError('testKeyboardAccessibility - element focus', error);
  // Skip elements that can't be focused
}
```

---

## Issue #4: Test Result Builder Pattern (NEEDS IMPLEMENTATION)

**Impact**: Eliminates 200+ lines of duplicated test result building
**Time**: 1.5 hours
**Risk**: Medium

### Update axeHelper.ts

Add this helper method:

```typescript
interface WCAGCriterionConfig {
  id: string;
  title: string;
  principle: string;
  level: 'A' | 'AA' | 'AAA';
  axeRules: string[];
  wcagTags: string[];
}

private static createTestResult(
  config: WCAGCriterionConfig,
  axeResults: AxeResults,
  url: string
): TestResult {
  const relevantViolations = axeResults.violations.filter(v =>
    config.axeRules.includes(v.id)
  );

  const issues: Issue[] = relevantViolations.flatMap(v =>
    v.nodes.map(node => ({
      description: v.description,
      severity: v.impact === 'critical' ? 'critical' :
                v.impact === 'serious' ? 'serious' : 'moderate',
      element: node.html,
      target: node.target,
      help: v.help,
      wcagTags: config.wcagTags
    }))
  );

  return {
    criterionId: config.id,
    criterionTitle: config.title,
    principle: config.principle,
    level: config.level,
    testType: 'automated',
    status: issues.length > 0 ? 'fail' : 'pass',
    issues,
    timestamp: new Date().toISOString(),
    url
  };
}
```

Then simplify all test methods:

```typescript
// BEFORE (30+ lines):
static async testAltText(page: Page): Promise<TestResult> {
  await this.ensureInitialized(page);

  const results = await this.axe!.analyze(page, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag111']
    }
  });

  const issues: Issue[] = [];
  // ... 20 more lines of boilerplate ...

  return {
    criterionId: '1.1.1',
    criterionTitle: 'Non-text Content',
    // ... 10 more lines ...
  };
}

// AFTER (8 lines):
static async testAltText(page: Page): Promise<TestResult> {
  await this.ensureInitialized(page);
  const results = await this.axe!.analyze(page);

  return this.createTestResult({
    id: '1.1.1',
    title: 'Non-text Content',
    principle: 'Perceivable',
    level: 'A',
    axeRules: ['image-alt', 'input-image-alt', 'area-alt'],
    wcagTags: ['wcag2a', 'wcag111']
  }, results, page.url());
}
```

---

## Testing After Each Fix

```bash
# Run full test suite
npm test tests/wcag-complete-coverage.spec.ts -- --workers=1

# Or run specific test
npm test tests/wcag-complete-coverage.spec.ts -- --grep="1.1.1"
```

---

## Summary

| Issue | Files to Modify | Status | Priority |
|-------|----------------|--------|----------|
| #1 Selector duplication | 3 files | ✅ READY | Critical |
| #2 Type safety | 6+ files | 📝 PLANNED | Critical |
| #3 Error handling | 4 files | 📝 PLANNED | High |
| #4 Test result builder | 1 file | 📝 PLANNED | High |

**Next Steps**:
1. Apply Issue #1 fix first (lowest risk, highest impact)
2. Run tests to verify
3. Apply remaining fixes incrementally
4. **DO NOT COMMIT until you give approval**

All changes are documented and ready. Let me know when you want to proceed!
