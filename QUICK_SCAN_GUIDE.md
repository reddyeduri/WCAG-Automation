# Quick Scan Usage Guide

## 🚀 How to Run Quick Scan

The quick scan feature allows you to rapidly test any website for accessibility issues.

---

## ✅ **Method 1: Using Environment Variable (Recommended)**

Test any URL by setting the `BASE_URL` or `SCAN_URL` environment variable:

### Windows (PowerShell)
```powershell
$env:BASE_URL="https://www.winnipeg.ca/"
npm run quick-scan
```

### Windows (Command Prompt)
```cmd
set BASE_URL=https://www.winnipeg.ca/
npm run quick-scan
```

### Mac/Linux (Bash/Zsh)
```bash
BASE_URL=https://www.winnipeg.ca/ npm run quick-scan
```

Or use `SCAN_URL`:
```bash
SCAN_URL=https://www.winnipeg.ca/ npm run quick-scan
```

---

## ✅ **Method 2: One-Line Command**

### Windows (PowerShell)
```powershell
$env:BASE_URL="https://www.winnipeg.ca/"; npm run quick-scan
```

### Mac/Linux
```bash
BASE_URL=https://www.winnipeg.ca/ npm run quick-scan
```

---

## ✅ **Method 3: Direct Playwright Command**

```bash
# Windows PowerShell
$env:BASE_URL="https://www.winnipeg.ca/"
npx playwright test tests/quick-scan.spec.ts

# Mac/Linux
BASE_URL=https://www.winnipeg.ca/ npx playwright test tests/quick-scan.spec.ts
```

---

## ✅ **Method 4: Update Config File**

Edit `config/wcagConfig.ts`:

```typescript
export const defaultConfig: WCAGTestConfig = {
  baseUrl: 'https://www.winnipeg.ca/',  // ← Change this
  // ... rest of config
};
```

Then run:
```bash
npm run quick-scan
```

---

## 📊 **What Gets Tested**

The quick scan tests:

1. **Full axe-core WCAG AA scan** - All automated criteria
2. **Color contrast** (1.4.3) - Text readability
3. **Alt text** (1.1.1) - Image alternatives
4. **Form labels** (3.3.2) - Input accessibility
5. **Heading hierarchy** (1.3.1) - Proper structure

**Time:** 30-60 seconds per page

---

## 📁 **Where Are the Reports?**

After running, check:

```bash
reports/quick-scan/
├── quick-scan-report.xlsx    # Excel report
└── quick-scan-report.json    # JSON report
```

### Open Reports

**Windows:**
```powershell
start reports/quick-scan/quick-scan-report.xlsx
```

**Mac:**
```bash
open reports/quick-scan/quick-scan-report.xlsx
```

**Linux:**
```bash
xdg-open reports/quick-scan/quick-scan-report.xlsx
```

---

## 🎯 **Example: Test winnipeg.ca**

### Complete Workflow

**Windows PowerShell:**
```powershell
# Set URL
$env:BASE_URL="https://www.winnipeg.ca/"

# Run scan
npm run quick-scan

# Open report
start reports/quick-scan/quick-scan-report.xlsx
```

**Mac/Linux:**
```bash
# Run scan (one command)
BASE_URL=https://www.winnipeg.ca/ npm run quick-scan

# Open report
open reports/quick-scan/quick-scan-report.xlsx
```

---

## 🔍 **Expected Output**

```
🔍 Starting quick accessibility scan...
🌐 URL: https://www.winnipeg.ca/

📊 Running axe-core scan...
🎨 Testing color contrast...
🖼️  Testing alt text...
📝 Testing form labels...
🏗️  Testing heading hierarchy...

📄 Generating reports...

========== WCAG 2.1 Assessment Summary ==========
Total Tests: 15
✓ Passed: 12
✗ Failed: 3
Pass Rate: 80.00%
================================================

✅ Scan complete!
📊 Excel Report: reports/quick-scan/quick-scan-report.xlsx
📋 JSON Report: reports/quick-scan/quick-scan-report.json
```

---

## 🔧 **Advanced Options**

### Test with Visible Browser

```bash
# Windows
$env:BASE_URL="https://www.winnipeg.ca/"
npx playwright test tests/quick-scan.spec.ts --headed

# Mac/Linux
BASE_URL=https://www.winnipeg.ca/ npx playwright test tests/quick-scan.spec.ts --headed
```

### Test Specific Browser

```bash
# Chrome only
BASE_URL=https://www.winnipeg.ca/ npx playwright test tests/quick-scan.spec.ts --project=chromium

# Firefox only
BASE_URL=https://www.winnipeg.ca/ npx playwright test tests/quick-scan.spec.ts --project=firefox
```

### Debug Mode

```bash
BASE_URL=https://www.winnipeg.ca/ npx playwright test tests/quick-scan.spec.ts --debug
```

---

## 🐛 **Troubleshooting**

### Issue: URL not recognized

**Windows PowerShell:**
```powershell
# Use quotes around URL
$env:BASE_URL="https://www.winnipeg.ca/"
npm run quick-scan
```

### Issue: Site not loading

**Check if site is accessible:**
```bash
curl https://www.winnipeg.ca/
```

**Increase timeout in test:**
Edit `tests/quick-scan.spec.ts`:
```typescript
await page.goto(targetUrl, { timeout: 60000 }); // 60 seconds
```

### Issue: Permission denied

**Windows:** Run PowerShell as Administrator

**Mac/Linux:**
```bash
sudo npm run quick-scan
```

---

## 💡 **Quick Scan vs Full Test Suite**

| Feature | Quick Scan | Full Suite |
|---------|------------|------------|
| **Time** | 30-60 sec | 2-5 min |
| **Tests** | 5 critical | 25+ comprehensive |
| **Use Case** | Rapid check | Detailed audit |
| **Command** | `npm run quick-scan` | `npm test` |

---

## 📚 **Multiple URL Testing**

To test multiple URLs, create a script:

**Windows PowerShell** (`test-multiple.ps1`):
```powershell
$urls = @(
    "https://www.winnipeg.ca/",
    "https://www.winnipeg.ca/accessibility/",
    "https://www.winnipeg.ca/contact/"
)

foreach ($url in $urls) {
    Write-Host "Testing: $url"
    $env:BASE_URL=$url
    npm run quick-scan
}
```

Run it:
```powershell
.\test-multiple.ps1
```

**Mac/Linux** (`test-multiple.sh`):
```bash
#!/bin/bash

urls=(
    "https://www.winnipeg.ca/"
    "https://www.winnipeg.ca/accessibility/"
    "https://www.winnipeg.ca/contact/"
)

for url in "${urls[@]}"; do
    echo "Testing: $url"
    BASE_URL=$url npm run quick-scan
done
```

Run it:
```bash
chmod +x test-multiple.sh
./test-multiple.sh
```

---

## 🎯 **Best Practices**

1. **Test homepage first** - Get a baseline
2. **Test key pages** - Contact, forms, content pages
3. **Check reports immediately** - Fix critical issues first
4. **Re-test after fixes** - Verify improvements
5. **Use full suite for releases** - More comprehensive

---

## ✅ **Quick Reference**

```bash
# Windows PowerShell - Quick Scan
$env:BASE_URL="https://www.winnipeg.ca/"; npm run quick-scan

# Mac/Linux - Quick Scan  
BASE_URL=https://www.winnipeg.ca/ npm run quick-scan

# View Report (Windows)
start reports/quick-scan/quick-scan-report.xlsx

# View Report (Mac)
open reports/quick-scan/quick-scan-report.xlsx
```

---

**Ready to scan?** Try it now:

```powershell
# Windows PowerShell
$env:BASE_URL="https://www.winnipeg.ca/"
npm run quick-scan
```

The report will be in `reports/quick-scan/quick-scan-report.xlsx`! 📊

