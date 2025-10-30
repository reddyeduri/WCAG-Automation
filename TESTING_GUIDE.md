# WCAG 2.1 Testing Guide

## 📖 Overview

This guide explains how to use the WCAG 2.1 Accessibility Automation Framework to test your web applications for accessibility compliance.

## 🎯 WCAG 2.1 Principles

### 1. Perceivable
Information and user interface components must be presentable to users in ways they can perceive.

**What we test:**
- Alt text for images (1.1.1)
- Color contrast (1.4.3)
- Heading hierarchy (1.3.1)
- Semantic structure

### 2. Operable
User interface components and navigation must be operable.

**What we test:**
- Keyboard accessibility (2.1.1)
- No keyboard traps (2.1.2)
- Focus visibility (2.4.7)
- Page titles (2.4.2)
- Skip links (2.4.1)

### 3. Understandable
Information and the operation of the user interface must be understandable.

**What we test:**
- Form labels (3.3.2)
- Consistent navigation
- Error messages

### 4. Robust
Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

**What we test:**
- ARIA roles/names/values (4.1.2)
- Status messages (4.1.3)
- Valid HTML

## 🔍 Test Categories

### Automated Tests (40-50% Coverage)

These tests run automatically via axe-core:

```typescript
// Full WCAG 2.1 AA scan
const results = await AxeHelper.runAxeScan(page, {
  wcagLevel: 'AA',
  tags: ['wcag21aa', 'wcag2aa']
});
```

**Coverage includes:**
- ✅ Image alt text
- ✅ Color contrast ratios
- ✅ Form labels
- ✅ ARIA attributes
- ✅ Heading structure
- ✅ Landmarks
- ✅ Page titles

### Keyboard Tests (Semi-Automated)

These test keyboard navigation programmatically:

```typescript
// Test keyboard accessibility
const result = await KeyboardHelper.testKeyboardAccessibility(page);

// Detect keyboard traps
const trapResult = await KeyboardHelper.testNoKeyboardTrap(page);

// Check focus visibility
const focusResult = await KeyboardHelper.testFocusVisible(page);
```

### Accessibility Tree Tests (NVDA Approximation)

These analyze the accessibility tree to approximate screen reader output:

```typescript
// Check landmarks
const landmarks = await AccessibilityTreeHelper.testLandmarks(page);

// Verify accessible names
const names = await AccessibilityTreeHelper.testAccessibleNames(page);

// Generate NVDA-like output
const nvdaOutput = await AccessibilityTreeHelper.generateNVDAOutput(page);
```

### Manual Tests (50-60% Coverage)

These **cannot** be fully automated and require human judgment:

- 📹 Caption quality (1.2.2)
- 🎤 Audio descriptions (1.2.3, 1.2.5)
- ⏱️ Timing adjustments (2.2.1)
- ⚡ Flashing content (2.3.1)
- 🔗 Link purpose clarity (2.4.4)
- 📚 Reading level (3.1.5)
- ❌ Error suggestions quality (3.3.3)

The framework **flags** these for manual review.

## 📊 Understanding Reports

### Excel Report Structure

#### Sheet 1: Summary
| Metric | Value |
|--------|-------|
| Total Tests | 25 |
| Passed | 20 |
| Failed | 3 |
| Warnings | 2 |
| Manual Required | 12 |
| Pass Rate | 80% |

#### Sheet 2: Test Results
| Criterion ID | Title | Principle | Level | Test Type | Status | Issues Count |
|--------------|-------|-----------|-------|-----------|--------|--------------|
| 1.1.1 | Non-text Content | Perceivable | A | automated | fail | 5 |
| 2.1.1 | Keyboard | Operable | A | keyboard | pass | 0 |

#### Sheet 3: Issues
| Criterion ID | Severity | Description | Element | Help |
|--------------|----------|-------------|---------|------|
| 1.1.1 | critical | Image missing alt text | img.logo | Add alt attribute |

### JSON Report Structure

```json
{
  "summary": {
    "Total Tests": 25,
    "Passed": 20,
    "Failed": 3,
    "Pass Rate": "80.00%"
  },
  "results": [
    {
      "criterionId": "1.1.1",
      "criterionTitle": "Non-text Content",
      "principle": "Perceivable",
      "level": "A",
      "testType": "automated",
      "status": "fail",
      "issues": [
        {
          "description": "Image missing alt text",
          "severity": "critical",
          "element": "img.logo",
          "help": "Add alt attribute",
          "wcagTags": ["wcag2a", "wcag111"]
        }
      ]
    }
  ]
}
```

## 🚀 Testing Workflows

### Workflow 1: Quick Scan

For rapid accessibility checks:

```bash
# Run all automated tests
npm test -- tests/wcag.spec.ts

# Review summary in console
# Check reports/wcag-assessment-report.xlsx
```

**Time:** ~2-5 minutes  
**Coverage:** Automated + Keyboard + A11y Tree

### Workflow 2: Excel-Driven Testing

For comprehensive assessment based on your criteria:

1. **Prepare Excel file** with your WCAG criteria
2. **Run Excel-driven tests:**
```bash
npm test -- tests/wcag-excel-driven.spec.ts
```
3. **Review generated reports**

**Time:** ~5-10 minutes  
**Coverage:** Custom criteria from Excel

### Workflow 3: CI/CD Integration

For continuous testing:

```yaml
# .github/workflows/a11y.yml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run install:browsers
      - run: npm test
      - uses: actions/upload-artifact@v2
        with:
          name: accessibility-reports
          path: reports/
```

**Time:** Automated  
**Coverage:** Full automated suite

### Workflow 4: Manual + Automated

For production releases:

1. **Run automated tests** (Workflow 1)
2. **Review manual flags** in report
3. **Test with real NVDA:**
   - Open page
   - Press NVDA+Space to focus mode
   - Tab through page
   - Verify announcements
4. **Test keyboard navigation manually:**
   - Tab through all elements
   - Check focus indicators
   - Try Shift+Tab reverse
   - Test Escape key
5. **Document findings** in Excel

**Time:** ~30-60 minutes  
**Coverage:** ~90% of WCAG 2.1 AA

## 🎓 Common Issues & Solutions

### Issue: Alt Text Violations

```
[1.1.1] Image missing alt text: <img src="logo.png">
```

**Solution:**
```html
<!-- ❌ Bad -->
<img src="logo.png">

<!-- ✅ Good -->
<img src="logo.png" alt="Company Logo">

<!-- ✅ Decorative -->
<img src="decoration.png" alt="">
```

### Issue: Color Contrast

```
[1.4.3] Text color contrast too low: 3.2:1
```

**Solution:**
- Text must have 4.5:1 contrast (AA)
- Large text (18pt+) needs 3:1 (AA)
- Use contrast checker tools
- Adjust colors or add background

### Issue: Missing Form Labels

```
[3.3.2] Input missing label: <input type="email">
```

**Solution:**
```html
<!-- ❌ Bad -->
<input type="email" placeholder="Email">

<!-- ✅ Good -->
<label for="email">Email</label>
<input type="email" id="email">

<!-- ✅ Alternative -->
<input type="email" aria-label="Email address">
```

### Issue: Keyboard Trap

```
[2.1.2] Keyboard trap detected in modal
```

**Solution:**
```javascript
// Trap focus within modal
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
  
  if (e.key === 'Tab') {
    const focusable = modal.querySelectorAll('button, input, a');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
```

### Issue: Missing Focus Indicator

```
[2.4.7] Element lacks visible focus indicator
```

**Solution:**
```css
/* ❌ Bad - removes outline */
button:focus {
  outline: none;
}

/* ✅ Good - custom focus style */
button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* ✅ Better - visible ring */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
}
```

## 📋 Checklist for New Features

Before launching a new feature:

- [ ] Run automated tests (`npm test`)
- [ ] Check all interactive elements with keyboard
- [ ] Verify focus indicators are visible
- [ ] Test with zoom at 200%
- [ ] Check color contrast for all text
- [ ] Ensure all images have alt text
- [ ] Verify form labels exist
- [ ] Test with NVDA (manual)
- [ ] Review manual test flags
- [ ] Document any exceptions

## 🔧 Customizing Tests

### Add New Test for Custom WCAG Criterion

```typescript
// utils/customHelper.ts
export async function testMyCustomCriterion(page: Page): Promise<TestResult> {
  const issues: Issue[] = [];
  
  // Your test logic here
  const elements = await page.$$('selector');
  
  for (const el of elements) {
    // Check condition
    if (/* fails condition */) {
      issues.push({
        description: 'Description of issue',
        severity: 'serious',
        element: 'selector',
        help: 'How to fix',
        wcagTags: ['wcag2aa', 'wcag321']
      });
    }
  }
  
  return {
    criterionId: '3.2.1',
    criterionTitle: 'My Custom Test',
    principle: 'Understandable',
    level: 'AA',
    testType: 'automated',
    status: issues.length > 0 ? 'fail' : 'pass',
    issues,
    timestamp: new Date().toISOString(),
    url: page.url()
  };
}
```

### Use in Test Suite

```typescript
import { testMyCustomCriterion } from '../utils/customHelper';

test('[3.2.1] My Custom Test', async ({ page }) => {
  const result = await testMyCustomCriterion(page);
  reportGen.addResult(result);
  expect(result.status).toBe('pass');
});
```

## 📚 Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/download/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Playwright Docs](https://playwright.dev/docs/accessibility-testing)

## 💡 Tips

1. **Test early and often** - Don't wait until the end
2. **Fix critical issues first** - Prioritize by severity
3. **Use real assistive technology** - Automated tests aren't perfect
4. **Document decisions** - Keep track of why exceptions were made
5. **Educate the team** - Share accessibility knowledge

## ❓ FAQ

**Q: Can I rely solely on automated tests?**  
A: No. Automated tests cover ~40% of WCAG. Manual testing is essential.

**Q: How often should I run tests?**  
A: On every PR and before each release minimum. Daily in CI is ideal.

**Q: What if I get false positives?**  
A: Review each violation manually. Some axe rules may need configuration.

**Q: Which WCAG level should I target?**  
A: AA is the legal standard in most jurisdictions. Start there.

**Q: How do I test video captions?**  
A: Manually. Watch the video with captions on and verify accuracy.

---

**Need help?** Check the inline code documentation or review the examples in `examples/`.

