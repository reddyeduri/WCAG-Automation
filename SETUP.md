# Setup Guide

## 📦 Installation

### 1. Install Node.js
Ensure you have Node.js 16+ installed:
```bash
node --version
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- Playwright (browser automation)
- @axe-core/playwright (accessibility testing)
- xlsx (Excel file handling)
- TypeScript

### 3. Install Playwright Browsers
```bash
npm run install:browsers
```

This downloads Chromium, Firefox, and WebKit browsers.

## ⚙️ Configuration

### 1. Set Your Base URL

Edit `config/wcagConfig.ts`:

```typescript
export const defaultConfig: WCAGTestConfig = {
  baseUrl: 'http://localhost:3000', // Change this to your app URL
  wcagLevel: 'AA',
  // ... other settings
};
```

Or set environment variable:
```bash
export BASE_URL=https://your-app.com
npm test
```

### 2. Create Excel Assessment (Optional)

If using Excel-driven tests:

```bash
npm run generate-template
```

This creates `wcag-assessment-template.xlsx`. Fill it with your criteria and save as `wcag-assessment.xlsx`.

## 🧪 Verify Installation

### Test 1: Run Example Tests

```bash
npm run test:example
```

This tests the W3C WAI website (no local server needed).

### Test 2: Quick Scan

```bash
npm run quick-scan https://www.w3.org/WAI/
```

Should generate reports in `reports/quick-scan/`.

### Test 3: Check Reports Generated

After running tests, check:
```bash
ls reports/
```

You should see:
- `wcag-assessment-report.xlsx`
- `wcag-assessment-report.json`

## 🚀 Testing Your Own Application

### Option 1: Local Development

1. Start your app:
```bash
# Your app startup command
npm start
# or
yarn dev
```

2. Update config with your local URL:
```typescript
baseUrl: 'http://localhost:3000'
```

3. Run tests:
```bash
npm test
```

### Option 2: Production/Staging

1. Set environment variable:
```bash
export BASE_URL=https://staging.yourapp.com
```

2. Run tests:
```bash
npm test
```

### Option 3: Quick Scan Any URL

```bash
npm run quick-scan https://your-app.com
```

## 📁 Project Structure

```
wcag-automation/
├── config/              # Configuration files
│   └── wcagConfig.ts
├── tests/               # Test suites
│   ├── wcag.spec.ts
│   └── wcag-excel-driven.spec.ts
├── examples/            # Example tests
│   ├── basic-example.spec.ts
│   └── custom-test-example.ts
├── utils/               # Helper modules
│   ├── axeHelper.ts
│   ├── keyboardHelper.ts
│   ├── accessibilityTreeHelper.ts
│   ├── manualTestFlags.ts
│   ├── excelParser.ts
│   └── reportGenerator.ts
├── scripts/             # Utility scripts
│   ├── generate-template.js
│   └── quick-scan.js
├── reports/             # Generated reports (created after first run)
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── README.md
├── SETUP.md             # This file
└── TESTING_GUIDE.md
```

## 🔧 Troubleshooting

### Issue: Browsers not installed

```bash
npm run install:browsers
```

### Issue: Module not found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

```bash
npx tsc --noEmit
```

Fix any type errors in your configuration.

### Issue: Tests timeout

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  timeout: 60000, // 60 seconds
}
```

### Issue: Cannot connect to app

Ensure your app is running:
```bash
curl http://localhost:3000
```

Or change `baseUrl` in config.

### Issue: Excel file errors

Install required dependency:
```bash
npm install xlsx
```

### Issue: Permission denied on scripts

```bash
chmod +x scripts/*.js
```

## 🎯 Next Steps

1. **Read the README**: `README.md` for feature overview
2. **Read the Testing Guide**: `TESTING_GUIDE.md` for detailed testing instructions
3. **Run example tests**: `npm run test:example`
4. **Configure for your app**: Update `config/wcagConfig.ts`
5. **Run your first test**: `npm test`
6. **Review reports**: Check `reports/` directory

## 💡 Quick Commands Reference

```bash
# Installation
npm install
npm run install:browsers

# Testing
npm test                    # Run all tests
npm run test:headed         # Run with visible browser
npm run test:wcag           # Run main WCAG suite
npm run test:excel          # Run Excel-driven tests
npm run test:example        # Run examples

# Utilities
npm run quick-scan <url>    # Quick scan any URL
npm run generate-template   # Create Excel template

# Reports
npm run test:report         # View Playwright HTML report
ls reports/                 # List generated reports
```

## 📚 Learning Resources

- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

## ✅ Checklist

- [ ] Node.js 16+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Browsers installed (`npm run install:browsers`)
- [ ] Configuration updated (`config/wcagConfig.ts`)
- [ ] Example test runs successfully
- [ ] Reports generated in `reports/` directory
- [ ] Ready to test your own application!

## 🆘 Getting Help

1. Check the [README](README.md) and [TESTING_GUIDE](TESTING_GUIDE.md)
2. Review example tests in `examples/`
3. Check Playwright documentation
4. Review inline code comments

---

**Ready to start testing?** Run `npm test` and check the generated reports! 🚀

