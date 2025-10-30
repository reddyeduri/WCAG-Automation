# WCAG 2.1 Accessibility Automation Framework - Project Overview

## 🎯 Project Summary

A comprehensive Playwright-based test framework for validating WCAG 2.1 accessibility criteria. The framework combines automated testing (axe-core), keyboard navigation validation, accessibility tree analysis (NVDA approximation), and structured reporting (Excel/JSON).

## 📦 What's Included

### Core Components

| Component | Purpose | File |
|-----------|---------|------|
| **axe-core Integration** | Automated WCAG scans | `utils/axeHelper.ts` |
| **Keyboard Testing** | Tab navigation, focus traps | `utils/keyboardHelper.ts` |
| **A11y Tree Analysis** | NVDA approximation | `utils/accessibilityTreeHelper.ts` |
| **Excel Parser** | Read assessment criteria | `utils/excelParser.ts` |
| **Report Generator** | Excel/JSON reports | `utils/reportGenerator.ts` |
| **Manual Flags** | Flag manual tests | `utils/manualTestFlags.ts` |

### Test Suites

| Suite | Description | File |
|-------|-------------|------|
| **Main WCAG Tests** | Comprehensive suite | `tests/wcag.spec.ts` |
| **Excel-Driven** | Tests from Excel file | `tests/wcag-excel-driven.spec.ts` |
| **Basic Example** | Demo test suite | `examples/basic-example.spec.ts` |
| **Custom Tests** | Example custom tests | `examples/custom-test-example.ts` |

### Configuration

| File | Purpose |
|------|---------|
| `config/wcagConfig.ts` | WCAG test configuration & criteria mapping |
| `playwright.config.ts` | Playwright test runner config |
| `tsconfig.json` | TypeScript configuration |

### Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `generate-template.js` | `npm run generate-template` | Create Excel template |
| `quick-scan.js` | `npm run quick-scan <url>` | Quick accessibility scan |

### Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Feature overview & getting started |
| `QUICK_START.md` | 5-minute quick start guide |
| `SETUP.md` | Detailed installation & setup |
| `TESTING_GUIDE.md` | Comprehensive testing guide |
| `PROJECT_OVERVIEW.md` | This file - project structure |

## 🔍 Test Coverage

### Automated Tests (axe-core)

**Perceivable:**
- ✅ 1.1.1 - Non-text Content (Alt text)
- ✅ 1.3.1 - Info and Relationships (Headings, landmarks)
- ✅ 1.4.3 - Contrast (Minimum)

**Operable:**
- ✅ 2.4.1 - Bypass Blocks (Skip links)
- ✅ 2.4.2 - Page Titled
- ✅ 2.4.6 - Headings and Labels

**Understandable:**
- ✅ 3.3.2 - Labels or Instructions (Form labels)
- ✅ 3.1.1 - Language of Page

**Robust:**
- ✅ 4.1.2 - Name, Role, Value (ARIA)
- ✅ 4.1.1 - Parsing

### Keyboard Tests

**Operable:**
- ✅ 2.1.1 - Keyboard (All elements reachable)
- ✅ 2.1.2 - No Keyboard Trap
- ✅ 2.4.3 - Focus Order (Tab sequence)
- ✅ 2.4.7 - Focus Visible

### Accessibility Tree Tests (NVDA Approximation)

**Perceivable:**
- ✅ 1.3.1 - Landmarks (main, nav, footer)
- ✅ 1.3.1 - Heading structure

**Understandable:**
- ✅ 3.3.2 - Form control labels

**Robust:**
- ✅ 4.1.2 - Accessible names
- ✅ 4.1.3 - Status Messages (Detection)

### Manual Test Flags

The framework automatically flags these criteria as requiring manual verification:

**Perceivable:**
- ⚑ 1.2.2 - Captions quality
- ⚑ 1.2.3 - Audio description
- ⚑ 1.2.5 - Audio description (prerecorded)
- ⚑ 1.4.13 - Content on hover/focus

**Operable:**
- ⚑ 2.2.1 - Timing adjustable
- ⚑ 2.3.1 - Three flashes
- ⚑ 2.4.4 - Link purpose (in context)

**Understandable:**
- ⚑ 3.1.1 - Language (pronunciation)
- ⚑ 3.1.2 - Language of parts
- ⚑ 3.1.5 - Reading level
- ⚑ 3.3.3 - Error suggestion quality

## 🏗️ Architecture

```
User Application
       ↓
  [Playwright]
       ↓
  ┌────────────────────────────────┐
  │   WCAG Testing Framework       │
  │                                │
  │  ┌─────────────────────────┐  │
  │  │   axe-core Engine       │  │
  │  │   (Automated Tests)     │  │
  │  └─────────────────────────┘  │
  │                                │
  │  ┌─────────────────────────┐  │
  │  │  Keyboard Navigator     │  │
  │  │  (Focus & Tab Tests)    │  │
  │  └─────────────────────────┘  │
  │                                │
  │  ┌─────────────────────────┐  │
  │  │  A11y Tree Analyzer     │  │
  │  │  (NVDA Approximation)   │  │
  │  └─────────────────────────┘  │
  │                                │
  │  ┌─────────────────────────┐  │
  │  │  Report Generator       │  │
  │  │  (Excel/JSON Output)    │  │
  │  └─────────────────────────┘  │
  └────────────────────────────────┘
       ↓
  Reports (Excel, JSON)
```

## 📊 Data Flow

```
1. Test Execution
   ├─ Load Configuration
   ├─ Parse Excel Assessment (optional)
   └─ Navigate to Page

2. Testing Phase
   ├─ Run axe-core scans
   │  └─ Extract WCAG violations
   ├─ Execute keyboard tests
   │  └─ Check focus/traps/visibility
   └─ Analyze accessibility tree
      └─ Validate structure/names

3. Result Collection
   ├─ Convert to TestResult format
   ├─ Tag with WCAG criteria
   └─ Add to Report Generator

4. Report Generation
   ├─ Generate Excel report
   │  ├─ Summary sheet
   │  ├─ Detailed results
   │  └─ Issues breakdown
   └─ Generate JSON report
      └─ Machine-readable output
```

## 🔧 Extension Points

### Adding New Tests

1. **Create test function** in appropriate helper:
```typescript
// utils/customHelper.ts
export async function testNewCriterion(page: Page): Promise<TestResult> {
  // Implementation
}
```

2. **Add to test suite:**
```typescript
// tests/wcag.spec.ts
test('[X.X.X] New Criterion', async ({ page }) => {
  const result = await testNewCriterion(page);
  reportGen.addResult(result);
  expect(result.status).toBe('pass');
});
```

3. **Map in configuration:**
```typescript
// config/wcagConfig.ts
export const WCAG_CRITERIA = {
  'X.X.X': {
    title: 'New Criterion',
    level: 'AA',
    principle: 'Perceivable',
    automated: true
  }
};
```

### Custom Reporters

Implement custom reporter by extending `ReportGenerator`:

```typescript
class CustomReporter extends ReportGenerator {
  generatePdfReport() {
    // PDF generation logic
  }
}
```

### Custom Excel Formats

Modify `ExcelParser` to support custom column structures:

```typescript
ExcelParser.parseAssessment(filePath, {
  columnMapping: {
    id: 'Criterion_ID',
    title: 'Test_Name'
  }
});
```

## 📈 Metrics & Reporting

### Generated Metrics

- **Total Tests**: Count of all tests executed
- **Pass Rate**: Percentage of passing tests
- **Issues by Severity**: Critical, Serious, Moderate, Minor
- **Coverage by Principle**: Tests per WCAG principle
- **Manual Review Flags**: Count of manual tests needed

### Report Formats

**Excel Report:**
- Business-friendly format
- Visual summary dashboard
- Filterable/sortable results
- Issue details with remediation

**JSON Report:**
- Machine-readable
- CI/CD integration ready
- Programmatic analysis
- API consumption

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  a11y-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run install:browsers
      - run: npm test
      - uses: actions/upload-artifact@v2
        with:
          name: a11y-reports
          path: reports/
```

### Fail Conditions

Configure test to fail on:
- Critical issues detected
- Pass rate below threshold
- Specific WCAG criteria failures

```typescript
const results = await AxeHelper.runAxeScan(page);
const criticalIssues = results.filter(r => 
  r.issues.some(i => i.severity === 'critical')
);
expect(criticalIssues.length).toBe(0);
```

## 🎓 Best Practices

### Testing Strategy

1. **Automated First**: Run automated tests on every build
2. **Keyboard Second**: Test keyboard navigation programmatically
3. **Manual Third**: Review flagged criteria with real AT
4. **Document Everything**: Keep Excel assessment updated

### Reporting Strategy

1. **Track Over Time**: Compare reports across releases
2. **Prioritize Fixes**: Critical > Serious > Moderate > Minor
3. **Set Targets**: Aim for 100% pass rate on Level AA
4. **Review Regularly**: Weekly accessibility reviews

### Development Workflow

```
Feature Development
  ↓
Run Automated Tests
  ↓
Fix Critical Issues
  ↓
Test Keyboard Navigation
  ↓
Manual NVDA Verification
  ↓
Update Excel Assessment
  ↓
Generate Final Report
  ↓
Code Review & Merge
```

## 📚 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@playwright/test` | ^1.45.0 | Browser automation |
| `@axe-core/playwright` | ^4.9.1 | Accessibility scanning |
| `axe-core` | ^4.9.1 | WCAG rules engine |
| `xlsx` | ^0.18.5 | Excel file handling |
| `typescript` | ^5.5.0 | Type safety |

## 🔐 Security Considerations

- Framework runs in test environment only
- No production data collection
- Reports contain page content snapshots
- Secure Excel file handling
- No external API calls

## 🚀 Performance

| Operation | Typical Time |
|-----------|-------------|
| Single page scan | 2-5 seconds |
| Full test suite | 2-5 minutes |
| Excel parsing | < 1 second |
| Report generation | < 2 seconds |
| Keyboard tests | 5-10 seconds |

## 📝 License

ISC

## 🤝 Contributing

To extend this framework:

1. Add new helpers in `utils/`
2. Create tests in `tests/`
3. Update configuration in `config/`
4. Document in markdown files
5. Add examples in `examples/`

## 🎯 Project Goals

- ✅ Automate WCAG 2.1 testing
- ✅ Provide clear, actionable reports
- ✅ Integrate with CI/CD pipelines
- ✅ Approximate screen reader output
- ✅ Flag manual testing needs
- ✅ Support Excel-driven workflows
- ✅ Enable custom test creation

## 📖 Documentation Index

Start here based on your needs:

| Need | Document |
|------|----------|
| "Just get started quickly" | `QUICK_START.md` |
| "Install and configure" | `SETUP.md` |
| "Learn how to test" | `TESTING_GUIDE.md` |
| "Understand features" | `README.md` |
| "See the big picture" | `PROJECT_OVERVIEW.md` (this) |

---

**Framework Version**: 1.0.0  
**Last Updated**: 2025-10-29  
**WCAG Version**: 2.1 (Level AA focus)

