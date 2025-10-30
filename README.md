# WCAG 2.1 Accessibility Automation Framework

A comprehensive Playwright-based test framework for validating WCAG 2.1 accessibility criteria with automated testing, keyboard navigation validation, and NVDA-approximated screen reader output.

## 🎯 Features

### ✅ Automated Testing
- **axe-core Integration**: Automated WCAG scans for 30+ success criteria
- **Tagged Test Cases**: Each test maps to specific WCAG criteria (e.g., 1.1.1, 2.1.1)
- **Excel-Driven Tests**: Load test criteria from Excel assessment files
- **Comprehensive Coverage**: Tests across all 4 WCAG principles

### ⌨️ Keyboard Navigation Testing
- **2.1.1 Keyboard**: Verify all interactive elements are keyboard accessible
- **2.1.2 No Keyboard Trap**: Detect and report keyboard traps
- **2.4.7 Focus Visible**: Validate visible focus indicators
- **2.4.3 Focus Order**: Tab navigation sequence testing

### 🔊 NVDA Approximation
- **Accessibility Tree Analysis**: Snapshot-based screen reader simulation
- **Landmark Validation**: Ensure proper semantic structure (main, nav, footer)
- **Role/Name/Value Testing**: Verify ARIA attributes are properly exposed
- **Status Message Detection**: Check for live regions (4.1.3)

### 📊 Reporting
- **Excel Reports**: Detailed WCAG assessment results with pass/fail status
- **JSON Reports**: Machine-readable test results
- **Manual Test Flags**: Identifies criteria requiring human verification
- **Summary Statistics**: Pass rates by principle and severity

## 📁 Project Structure

```
.
├── config/
│   └── wcagConfig.ts          # WCAG test configuration
├── tests/
│   ├── wcag.spec.ts           # Main WCAG test suite
│   └── wcag-excel-driven.spec.ts  # Excel-driven tests
├── utils/
│   ├── axeHelper.ts           # axe-core integration
│   ├── keyboardHelper.ts      # Keyboard navigation tests
│   ├── accessibilityTreeHelper.ts  # A11y tree analysis
│   ├── manualTestFlags.ts     # Manual test flagging
│   ├── excelParser.ts         # Excel assessment parser
│   └── reportGenerator.ts     # Report generation
├── reports/                    # Generated test reports
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## 🚀 Getting Started

### Installation

1. **Clone or create the project directory**

2. **Install dependencies**:
```bash
npm install
```

3. **Install Playwright browsers**:
```bash
npm run install:browsers
```

### Configuration

Edit `config/wcagConfig.ts` to customize:

```typescript
export const defaultConfig: WCAGTestConfig = {
  baseUrl: 'http://localhost:3000',  // Your app URL
  wcagLevel: 'AA',                    // A, AA, or AAA
  runAxeTests: true,
  runKeyboardTests: true,
  runA11yTreeTests: true,
  includeManualFlags: true,
  excelAssessmentPath: './wcag-assessment.xlsx',
  outputDir: './reports'
};
```

### Excel Assessment Template

Generate a sample Excel template:

```bash
node -e "require('./utils/excelParser').ExcelParser.createTemplate('./wcag-assessment.xlsx')"
```

Or the template will be auto-generated on first run.

**Excel Format**:
| ID | Principle | Guideline | Level | Title | Description | Testable | RequiresManual |
|----|-----------|-----------|-------|-------|-------------|----------|----------------|
| 1.1.1 | Perceivable | Text Alternatives | A | Non-text Content | Alt text for images | Yes | No |
| 2.1.1 | Operable | Keyboard Accessible | A | Keyboard | All functionality via keyboard | Yes | Partial |

## 🧪 Running Tests

### Run all WCAG tests:
```bash
npm test
```

### Run tests in headed mode (see browser):
```bash
npm run test:headed
```

### Run specific test file:
```bash
npx playwright test tests/wcag.spec.ts
```

### Run Excel-driven tests:
```bash
npx playwright test tests/wcag-excel-driven.spec.ts
```

### Debug mode:
```bash
npm run test:debug
```

## 📋 Test Coverage

### 1️⃣ Perceivable (axe-core)

| Criterion | Title | Level | Automated |
|-----------|-------|-------|-----------|
| **1.1.1** | Non-text Content | A | ✅ |
| **1.3.1** | Info and Relationships | A | ✅ |
| **1.4.3** | Contrast (Minimum) | AA | ✅ |

### 2️⃣ Operable (Keyboard Testing)

| Criterion | Title | Level | Automated |
|-----------|-------|-------|-----------|
| **2.1.1** | Keyboard | A | ✅ |
| **2.1.2** | No Keyboard Trap | A | ✅ |
| **2.4.1** | Bypass Blocks | A | ✅ |
| **2.4.2** | Page Titled | A | ✅ |
| **2.4.7** | Focus Visible | AA | ✅ |

### 3️⃣ Understandable

| Criterion | Title | Level | Automated |
|-----------|-------|-------|-----------|
| **3.3.2** | Labels or Instructions | A | ✅ |

### 4️⃣ Robust (Accessibility Tree)

| Criterion | Title | Level | Automated |
|-----------|-------|-------|-----------|
| **4.1.2** | Name, Role, Value | A | ✅ |
| **4.1.3** | Status Messages | AA | ✅ (Detection) |

### 🔧 Manual Testing Flags

The framework automatically flags criteria that **cannot be fully automated**:

- **1.2.2** - Captions quality
- **1.2.3** - Audio description
- **2.2.1** - Timing adjustable
- **2.3.1** - Three flashes
- **2.4.4** - Link purpose in context
- **3.1.1** - Language of page (pronunciation)
- **3.1.5** - Reading level
- And more...

These appear in reports with `status: 'manual-required'`.

## 📊 Reports

After test execution, reports are generated in `./reports/`:

### Excel Report
- **Summary**: Pass/fail statistics by principle
- **Test Results**: Detailed results for each criterion
- **Issues**: All detected violations with severity

### JSON Report
```json
{
  "summary": {
    "Total Tests": 25,
    "Passed": 20,
    "Failed": 3,
    "Warnings": 2,
    "Pass Rate": "80.00%"
  },
  "results": [ /* detailed test results */ ]
}
```

## 🎯 Example Usage

### Test a specific page:

```typescript
import { test } from '@playwright/test';
import { AxeHelper } from './utils/axeHelper';
import { ReportGenerator } from './utils/reportGenerator';

test('Check homepage accessibility', async ({ page }) => {
  await page.goto('https://example.com');
  
  const reportGen = new ReportGenerator();
  
  // Run axe scan
  const axeResults = await AxeHelper.runAxeScan(page, { wcagLevel: 'AA' });
  reportGen.addResults(axeResults);
  
  // Generate reports
  reportGen.generateExcelReport('homepage-report.xlsx');
  reportGen.printSummary();
});
```

### Custom keyboard test:

```typescript
import { KeyboardHelper } from './utils/keyboardHelper';

test('Tab through all interactive elements', async ({ page }) => {
  await page.goto('https://example.com');
  
  const tabTest = await KeyboardHelper.performTabNavigationTest(page);
  console.log(`Found ${tabTest.totalFocusable} focusable elements`);
  console.log('Focus order:', tabTest.focusOrder);
});
```

### Generate NVDA-like output:

```typescript
import { AccessibilityTreeHelper } from './utils/accessibilityTreeHelper';

test('Get screen reader output', async ({ page }) => {
  await page.goto('https://example.com');
  
  const nvdaOutput = await AccessibilityTreeHelper.generateNVDAOutput(page);
  console.log('Screen reader would announce:');
  nvdaOutput.forEach(line => console.log(line));
});
```

## 🔍 WCAG Criteria Mapping

Tests are tagged with WCAG success criteria:

```typescript
test('[1.1.1] Non-text Content', async ({ page }) => {
  // Test automatically tagged with WCAG 1.1.1
  const result = await AxeHelper.testAltText(page);
  expect(result.criterionId).toBe('1.1.1');
});
```

## 🛠️ Advanced Configuration

### Custom axe-core rules:

```typescript
const results = await AxeHelper.runAxeScan(page, {
  wcagLevel: 'AAA',
  tags: ['wcag21aaa', 'best-practice'],
  rules: ['color-contrast', 'image-alt']
});
```

### Configure keyboard test depth:

```typescript
// In keyboardHelper.ts, adjust:
for (let i = 0; i < 100; i++) { // Change iteration limit
  // Tab navigation logic
}
```

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [NVDA Screen Reader](https://www.nvaccess.org/)

## 🤝 Contributing

1. Add new test helpers in `utils/`
2. Map criteria in `config/wcagConfig.ts`
3. Create tests in `tests/` with WCAG tags
4. Update documentation

## 📝 License

ISC

## ⚠️ Important Notes

1. **Automated testing covers ~40% of WCAG**: Always supplement with manual testing
2. **NVDA approximation**: Use real NVDA for production validation
3. **False positives**: Review axe-core violations manually
4. **Context matters**: Some criteria depend on content context

## 🎓 Best Practices

✅ **DO:**
- Run tests on every major feature
- Review manual test flags regularly
- Test with real assistive technology
- Keep Excel assessments updated
- Test across multiple browsers

❌ **DON'T:**
- Rely solely on automated tests
- Ignore manual-required flags
- Skip keyboard testing
- Forget to test dynamic content

---

**Built with**: Playwright + axe-core + TypeScript + Excel reporting

For questions or issues, please check the inline code documentation.

