# Quick Start Guide

Get started with WCAG accessibility testing in 5 minutes! ⏱️

## 🚀 Installation (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Install browsers
npm run install:browsers
```

## ✅ Run Your First Test (1 minute)

```bash
# Test W3C WAI website (no setup required)
npm run test:example
```

Expected output:
```
✓ [1.1.1] Non-text Content - Alt Text (5s)
✓ [1.4.3] Contrast (Minimum) (3s)
✓ [2.1.1] Keyboard - All Elements Reachable (4s)
...

📊 Reports generated:
   Excel: ./reports/wcag-assessment-report.xlsx
   JSON: ./reports/wcag-assessment-report.json
```

## 🎯 Test Your Own Site (2 minutes)

### Option 1: Quick Scan (Fastest)

```bash
npm run quick-scan https://your-website.com
```

### Option 2: Full Test Suite

1. **Update configuration:**

Edit `config/wcagConfig.ts`:
```typescript
baseUrl: 'https://your-website.com'
```

2. **Run tests:**
```bash
npm test
```

3. **Check results:**
```bash
open reports/wcag-assessment-report.xlsx
```

## 📊 Understanding Results

### Console Output
```
========== WCAG 2.1 Assessment Summary ==========
Total Tests: 25
✓ Passed: 20
✗ Failed: 3
⚠ Warnings: 2
⚑ Manual Review Required: 12
Pass Rate: 80.00%
```

### Excel Report

Open `reports/wcag-assessment-report.xlsx`:

- **Summary Tab**: Overall pass/fail statistics
- **Test Results Tab**: Detailed results per criterion
- **Issues Tab**: All violations with fix instructions

## 🔍 What Gets Tested?

### ✅ Automated (No manual work)
- Alt text for images (1.1.1)
- Color contrast (1.4.3)
- Form labels (3.3.2)
- ARIA attributes (4.1.2)
- Heading hierarchy (1.3.1)
- Page titles (2.4.2)

### ⌨️ Keyboard (Semi-automated)
- Tab navigation (2.1.1)
- Keyboard traps (2.1.2)
- Focus visibility (2.4.7)

### 🔊 NVDA Approximation
- Accessibility tree analysis
- Landmark structure
- Screen reader announcements

### ⚑ Manual Flags
- Video captions quality
- Audio descriptions
- Reading level
- Link purpose clarity

## 💡 Common Commands

```bash
# Run all tests
npm test

# Run with visible browser
npm run test:headed

# Test specific suite
npm run test:wcag          # Main WCAG tests
npm run test:excel         # Excel-driven tests

# Quick scan any URL
npm run quick-scan https://example.com

# Generate Excel template
npm run generate-template

# View Playwright HTML report
npm run test:report
```

## 🐛 Troubleshooting

### Tests fail to connect

**Problem:** Cannot navigate to page  
**Solution:** Ensure your app is running or URL is correct

```bash
# Check if site is accessible
curl https://your-website.com

# Update config
vi config/wcagConfig.ts
```

### No reports generated

**Problem:** Reports directory is empty  
**Solution:** Check test completion

```bash
# Ensure tests completed
npm test

# Check reports directory
ls -la reports/
```

### Browser errors

**Problem:** Browser not found  
**Solution:** Reinstall browsers

```bash
npm run install:browsers
```

## 📚 Next Steps

1. ✅ **You just ran your first test!**
2. 📖 Read [README.md](README.md) for full features
3. 📘 Read [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing workflows
4. 🔧 Check [SETUP.md](SETUP.md) for detailed configuration
5. 💻 Review `examples/` for code samples

## 🎓 Understanding WCAG Levels

| Level | Description | Coverage |
|-------|-------------|----------|
| **A** | Minimum compliance | Essential basics |
| **AA** | Standard compliance | Legal requirement (most jurisdictions) |
| **AAA** | Enhanced compliance | Beyond legal requirement |

**Recommendation:** Start with Level AA (default in this framework)

## 🎯 Quick Testing Checklist

For any new feature:

- [ ] Run automated tests (`npm test`)
- [ ] Check pass rate (aim for 100%)
- [ ] Review failed tests in Excel report
- [ ] Fix critical issues (severity: critical/serious)
- [ ] Verify keyboard navigation manually
- [ ] Test with real NVDA if possible
- [ ] Document manual test results

## 💬 Example Test Output

```bash
$ npm run quick-scan https://www.w3.org/WAI/

🔍 Starting quick accessibility scan...
🌐 URL: https://www.w3.org/WAI/

📊 Running axe-core scan...
🎨 Testing color contrast...
🖼️  Testing alt text...
📝 Testing form labels...
🏗️  Testing heading hierarchy...

========== WCAG 2.1 Assessment Summary ==========
Total Tests: 15
✓ Passed: 14
✗ Failed: 1
Pass Rate: 93.33%

Total Issues: 2
Critical Issues: 0

By Principle:
  Perceivable: 6
  Operable: 4
  Understandable: 3
  Robust: 2

✅ Scan complete!
📊 Excel Report: ./reports/quick-scan/quick-scan-report.xlsx
```

## 🔗 Useful Resources

- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) - Official guidelines
- [WebAIM](https://webaim.org/) - Accessibility tutorials
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [NVDA Download](https://www.nvaccess.org/download/) - Free screen reader

## ❓ FAQ

**Q: How long does a test take?**  
A: 2-5 minutes for a typical page, 10-20 minutes for full site

**Q: Can I test multiple pages?**  
A: Yes! Add tests in `tests/` directory for different pages

**Q: Is this enough for WCAG compliance?**  
A: No. This covers ~40% automated + flags for manual testing. Use real NVDA too.

**Q: Can I use this in CI/CD?**  
A: Yes! See README for GitHub Actions example

**Q: What if I get false positives?**  
A: Review each issue manually. Update config to exclude specific rules if needed.

---

**Ready to go deeper?** Check out [README.md](README.md) for complete documentation! 🚀

