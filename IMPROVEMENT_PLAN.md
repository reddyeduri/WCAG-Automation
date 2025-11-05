# Code Quality Improvement Plan

**Status**: Discovered 7 critical/high-priority improvements
**Estimated Total Fix Time**: 8-10 hours
**Files Affected**: 10+ files across utils/ and tests/

---

## ✅ COMPLETED IMPROVEMENTS

### 1. Fixed Test Framework Bugs (3 bugs)
- ✅ Fixed `ResponsiveHelper.testResizeText()` - method didn't exist
- ✅ Fixed `ResponsiveHelper.testReflow()` - method didn't exist
- ✅ Fixed `KeyboardHelper.testFocusOrder()` - method didn't exist
- ✅ Fixed report aggregation with `--workers=1` flag

**Result**: Test suite now runs correctly with accurate reporting

---

## 🚧 PENDING IMPROVEMENTS

### Issue #1: Duplicate Selector Generation Logic ⚠️ CRITICAL
**Priority**: CRITICAL
**Effort**: 1 hour
**Files**: `selectorHelper.ts`, `keyboardHelper.ts`, `accessibilityTreeHelper.ts`

**Problem**:
- Same selector function duplicated **150+ lines** across 3 files
- `generateUniqueSelector()` defined TWICE in selectorHelper.ts (lines 9-58, 66-111)
- Inline duplication in keyboardHelper.ts (lines 127-151)
- Inline duplication in accessibilityTreeHelper.ts (lines 125-149)

**Impact**:
- Bug fixes must be applied in 3 places
- Inconsistent behavior if one copy diverges
- Code bloat

**Solution**:
See `utils/selectorHelper.IMPROVED.ts` for the fix:
1. Create single `SELECTOR_GENERATOR_FN_STRING` constant
2. Export it for reuse in other helpers
3. Update keyboardHelper.ts and accessibilityTreeHelper.ts to import it

**Files to Update**:
```typescript
// utils/selectorHelper.ts - Replace with IMPROVED version
// utils/keyboardHelper.ts - Replace getFullPathSelector with import
// utils/accessibilityTreeHelper.ts - Replace getFullPathSelector with import
```

---

### Issue #2: Type Safety - 50+ Uses of `any` Type ⚠️ CRITICAL
**Priority**: CRITICAL
**Effort**: 2 hours
**Files**: `axeHelper.ts` (25+ instances), `reportGenerator.ts`, `mediaHelper.ts`, others

**Problem**:
```typescript
// BEFORE (axeHelper.ts line 40):
const criteriaMap: any = this.mapViolationsToCriteria(results.violations);
const nodes = violations[0].nodes; // any type - no IDE help!

// BEFORE (reportGenerator.ts line 36):
private static scorer: any;
```

**Impact**:
- No compile-time type checking
- No IDE autocomplete
- Silent bugs
- Refactoring is dangerous

**Solution**:
Create proper type interfaces:

```typescript
// utils/axeTypes.ts (NEW FILE)
export interface AxeResults {
  violations: AxeViolation[];
  passes: AxeViolation[];
  incomplete: AxeViolation[];
  inapplicable: AxeViolation[];
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
  impact?: string;
  message: string;
  data: any; // This one can stay any - it's truly dynamic
}
```

**Files to Update**:
- `utils/axeHelper.ts` - Replace all `any` with proper types
- `utils/reportGenerator.ts` - Type the scorer properly
- `utils/mediaHelper.ts` - Type element evaluations
- `utils/timingAnimationHelper.ts` - Type element evaluations

---

### Issue #3: Weak Error Handling
**Priority**: HIGH
**Effort**: 1.5 hours
**Files**: `axeHelper.ts`, `keyboardHelper.ts`, `accessibilityTreeHelper.ts`, `hoverFocusHelper.ts`

**Problem**:
```typescript
// BEFORE (axeHelper.ts lines 59-69):
try {
  const fs = require('fs');
  fs.appendFileSync(logPath, JSON.stringify(debugInfo, null, 2));
} catch (e) {
  console.error('❌ Could not write debug log:', e.message);
  // ❌ Only logs, doesn't throw or return error state!
}

// BEFORE (keyboardHelper.ts lines 56-58):
catch (error) {
  // ❌ Empty catch - swallows all errors silently!
}
```

**Impact**:
- Test failures go unnoticed
- Hard to debug CI/CD issues
- Silent corruption

**Solution**:
Create centralized error handler:

```typescript
// utils/errorHandler.ts (NEW FILE)
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

export function createWarningResult(
  criterionId: string,
  criterionTitle: string,
  principle: string,
  level: 'A' | 'AA' | 'AAA',
  error: unknown,
  url: string
): TestResult {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[${criterionId}] Test failed:`, message);

  return {
    criterionId,
    criterionTitle,
    principle,
    level,
    testType: 'automated',
    status: 'warning',
    issues: [{
      description: `Test could not complete: ${message}`,
      severity: 'moderate',
      help: 'This test encountered an error and may need manual verification',
      wcagTags: [`wcag${level.toLowerCase()}`]
    }],
    timestamp: new Date().toISOString(),
    url
  };
}
```

**Usage**:
```typescript
// After:
try {
  // test logic
} catch (error) {
  return createWarningResult('2.1.1', 'Keyboard', 'Operable', 'A', error, page.url());
}
```

---

### Issue #4: Test Result Building Code Duplication
**Priority**: HIGH
**Effort**: 1.5 hours
**Files**: `axeHelper.ts`

**Problem**:
7 methods in axeHelper.ts have identical result-building logic:
- `testAltText()` (lines 102-130)
- `testColorContrast()` (lines 135-162)
- `testARIA()` (lines 168-203)
- `testColorUsage()` (lines 209-237)
- `testInputLabels()` (lines 242-269)
- `testHeadingStructure()` (lines 275-302)
- `testLinkPurpose()` (lines 308-335)

**Solution**:
Create result builder:

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
  axeResults: any,
  url: string
): TestResult {
  const relevantViolations = axeResults.violations.filter((v: any) =>
    config.axeRules.includes(v.id)
  );

  const issues: Issue[] = relevantViolations.flatMap((v: any) =>
    v.nodes.map((node: any) => ({
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

// Usage:
static async testAltText(page: Page): Promise<TestResult> {
  const results = await AxeCore.analyze(page);
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

### Issue #5: Performance - Inefficient DOM Queries
**Priority**: MEDIUM
**Effort**: 1 hour
**Files**: `accessibilityTreeHelper.ts`, `hoverFocusHelper.ts`

**Problem**:
```typescript
// BEFORE (accessibilityTreeHelper.ts lines 166-168):
for (const [role, selector] of Object.entries(roleSelectors)) {
  const elements = Array.from(document.querySelectorAll(selector));
  // ^ 9 separate queries instead of 1!
  for (const el of elements.slice(0, 50)) {
    // ...
  }
}
```

**Impact**:
- Tests run slow (450+ DOM queries per test)
- Scales poorly with page size

**Solution**:
```typescript
// AFTER - Single batched query:
const allSelectors = Object.values(roleSelectors).join(', ');
const allElements = Array.from(document.querySelectorAll(allSelectors));

// Use Map for O(1) lookups instead of O(n) find():
const elementsByRole = new Map();
for (const el of allElements) {
  const role = el.getAttribute('role') || getRoleFromTag(el.tagName);
  if (!elementsByRole.has(role)) elementsByRole.set(role, []);
  elementsByRole.get(role).push(el);
}
```

---

### Issue #6: Weak Test Assertions
**Priority**: MEDIUM
**Effort**: 1.5 hours
**Files**: `tests/wcag.spec.ts`, `tests/wcag-complete-coverage.spec.ts`

**Problem**:
```typescript
// BEFORE - All tests look like this:
test('[1.1.1] Non-text Content', async ({ page }) => {
  const result = await AxeHelper.testAltText(page);
  reportGen.addResult(result);
  expect(result.status).toBe('pass'); // ❌ Only checks status!
  // Missing: validation of issues, criterionId, proper structure
});
```

**Impact**:
- Tests pass even with critical issues
- No validation that results are properly formatted
- Inconsistent assertions (.toBe('pass') vs .not.toBe('fail'))

**Solution**:
Create test helper:

```typescript
// tests/helpers/testHelpers.ts (NEW FILE)
export async function assertWCAGTest(
  result: TestResult,
  expectedCriterion: string,
  allowFailure: boolean = false
) {
  // Validate structure
  expect(result).toBeDefined();
  expect(result.criterionId).toBe(expectedCriterion);
  expect(result.criterionTitle).toBeTruthy();
  expect(result.timestamp).toBeTruthy();
  expect(result.url).toBeTruthy();

  // Validate status
  if (!allowFailure) {
    expect(result.status).toBe('pass');
    expect(result.issues).toHaveLength(0);
  } else {
    expect(['pass', 'fail', 'warning']).toContain(result.status);
  }

  // Validate issues structure if present
  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      expect(issue.description).toBeTruthy();
      expect(issue.severity).toMatch(/^(critical|serious|moderate|minor)$/);
      expect(issue.wcagTags).toBeDefined();
      expect(issue.wcagTags.length).toBeGreaterThan(0);
    }
  }
}

// Usage:
test('[1.1.1] Non-text Content', async ({ page }) => {
  const result = await AxeHelper.testAltText(page);
  await assertWCAGTest(result, '1.1.1', true); // allow failures
  reportGen.addResult(result);
});
```

---

### Issue #7: Debug Logging in Production
**Priority**: LOW
**Effort**: 30 minutes
**Files**: `axeHelper.ts`, `comprehensiveReportGenerator.ts`

**Problem**:
```typescript
// BEFORE (axeHelper.ts lines 45-69):
console.log('🔍 AXE NODE STRUCTURE:', JSON.stringify(debugInfo, null, 2));
fs.appendFileSync(logPath, JSON.stringify(debugInfo, null, 2) + '\n---\n');
// ^ Runs for EVERY violation! Creates huge logs!
```

**Impact**:
- Slow test execution (file I/O)
- Disk space waste (logs grow to MBs)
- Noisy console output

**Solution**:
```typescript
// Add environment variable check:
const DEBUG_MODE = process.env.DEBUG_WCAG === 'true';

if (DEBUG_MODE) {
  console.log('🔍 AXE NODE STRUCTURE:', JSON.stringify(debugInfo, null, 2));
  fs.appendFileSync(logPath, JSON.stringify(debugInfo, null, 2) + '\n---\n');
}

// Usage:
// DEBUG_WCAG=true npm test  (enables logging)
// npm test                  (no logging)
```

---

## Implementation Priority

| Order | Issue | Impact | Effort | ROI |
|-------|-------|--------|--------|-----|
| 1 | Selector duplication | Critical | 1h | ⭐⭐⭐⭐⭐ |
| 2 | Type safety (`any` types) | Critical | 2h | ⭐⭐⭐⭐⭐ |
| 3 | Error handling | High | 1.5h | ⭐⭐⭐⭐ |
| 4 | Test result duplication | High | 1.5h | ⭐⭐⭐⭐ |
| 5 | Performance | Medium | 1h | ⭐⭐⭐ |
| 6 | Test assertions | Medium | 1.5h | ⭐⭐⭐ |
| 7 | Debug logging | Low | 0.5h | ⭐⭐ |

**Recommended approach**: Fix issues 1-4 first (6.5 hours), then evaluate remaining improvements.

---

## Next Steps

1. **Review this plan** - Does the priority make sense for your project?
2. **Apply fixes incrementally** - One issue at a time to avoid breakage
3. **Run tests after each fix** - Ensure nothing breaks
4. **Commit between fixes** - Easy rollback if needed

Would you like me to implement any of these? I recommend starting with Issue #1 (selector duplication) as it has the highest ROI.
