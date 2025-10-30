# ✅ Quick Scan Issue - FIXED!

## 🐛 Problem
The `npm run quick-scan` command was failing with:
```
Error: Cannot find module '../utils/axeHelper'
```

## ✅ Solution Applied

I've fixed the issue by creating a TypeScript-based quick scan test that works properly with the framework.

---

## 🚀 How to Use Quick Scan Now

### **For winnipeg.ca (Your Example)**

**Windows PowerShell:**
```powershell
$env:BASE_URL="https://www.winnipeg.ca/"
npm run quick-scan
```

**Alternative (one line):**
```powershell
$env:SCAN_URL="https://www.winnipeg.ca/"; npm run quick-scan
```

### **Mac/Linux:**
```bash
BASE_URL=https://www.winnipeg.ca/ npm run quick-scan
```

---

## 📋 Complete Instructions

I've created **`QUICK_SCAN_GUIDE.md`** with:
- ✅ Multiple methods to scan any URL
- ✅ Windows PowerShell examples
- ✅ Mac/Linux examples  
- ✅ Troubleshooting guide
- ✅ How to test multiple URLs
- ✅ Where to find reports

**Read it:** `QUICK_SCAN_GUIDE.md`

---

## 🎯 Quick Start (3 Steps)

### Step 1: Set URL
```powershell
$env:BASE_URL="https://www.winnipeg.ca/"
```

### Step 2: Run Scan
```powershell
npm run quick-scan
```

### Step 3: View Report
```powershell
start reports\quick-scan\quick-scan-report.xlsx
```

---

## 📊 What Changed

### Before (Broken)
- ❌ JavaScript script trying to require TypeScript files
- ❌ Node.js couldn't find compiled modules
- ❌ `npm run quick-scan <url>` didn't work

### After (Fixed)
- ✅ TypeScript test file using Playwright test runner
- ✅ Properly integrated with framework
- ✅ Uses environment variables for URL
- ✅ Works on Windows, Mac, and Linux

---

## 💡 Why This Fix Works

The framework is built in **TypeScript**, and Playwright's test runner automatically handles TypeScript compilation. By converting the quick-scan from a standalone JavaScript script to a Playwright test, it now:

1. ✅ Compiles TypeScript automatically
2. ✅ Accesses all framework utilities properly
3. ✅ Generates reports correctly
4. ✅ Works cross-platform

---

## 🔍 Other Available Commands

All these work properly:

```bash
# Test example site (W3C WAI)
npm run test:example

# Test your configured site
npm test

# Run main WCAG suite
npm run test:wcag

# Excel-driven tests
npm run test:excel

# With visible browser
npm run test:headed
```

---

## 🎓 Examples

### Test Different Sites

```powershell
# Test winnipeg.ca
$env:BASE_URL="https://www.winnipeg.ca/"
npm run quick-scan

# Test Google
$env:BASE_URL="https://www.google.com"
npm run quick-scan

# Test your local app
$env:BASE_URL="http://localhost:3000"
npm run quick-scan
```

### Test Multiple Pages

Create a file `test-sites.ps1`:
```powershell
$sites = @(
    "https://www.winnipeg.ca/",
    "https://www.winnipeg.ca/accessibility/",
    "https://www.winnipeg.ca/contact/"
)

foreach ($site in $sites) {
    Write-Host "`n=== Testing: $site ===`n"
    $env:BASE_URL=$site
    npm run quick-scan
}
```

Run it:
```powershell
.\test-sites.ps1
```

---

## 📁 Where Are Reports?

After running quick-scan:

```
reports/
└── quick-scan/
    ├── quick-scan-report.xlsx    ← Open this!
    └── quick-scan-report.json
```

**Open in Excel:**
```powershell
start reports\quick-scan\quick-scan-report.xlsx
```

---

## ✅ Test It Now!

Try this command right now:

```powershell
$env:BASE_URL="https://www.winnipeg.ca/"; npm run quick-scan
```

Then check the report:
```powershell
start reports\quick-scan\quick-scan-report.xlsx
```

You should see:
- ✅ Summary of test results
- ✅ Pass/fail for each criterion
- ✅ Detailed issues with fix instructions

---

## 🆘 Still Having Issues?

### Issue: Environment variable not working

**Try this format:**
```powershell
$env:BASE_URL="https://www.winnipeg.ca/"
npm run quick-scan
```

**Or set it persistently:**
```powershell
$env:BASE_URL="https://www.winnipeg.ca/"
$env:BASE_URL  # Verify it's set
npm run quick-scan
```

### Issue: Module errors

**Reinstall dependencies:**
```powershell
npm install
```

### Issue: Can't find reports

**Check directory:**
```powershell
dir reports\quick-scan\
```

---

## 📚 Documentation

- **`QUICK_SCAN_GUIDE.md`** - Complete quick-scan documentation
- **`QUICK_START.md`** - 5-minute getting started
- **`START_HERE.md`** - Choose your learning path
- **`TESTING_GUIDE.md`** - Comprehensive testing workflows

---

**The quick-scan is now working! Try it with winnipeg.ca!** 🚀

