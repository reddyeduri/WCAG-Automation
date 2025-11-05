# Quick Install Guide - New System Setup

**Time Required**: 10-15 minutes
**Tested On**: Windows 10/11, macOS, Linux (Ubuntu/Debian)

---

## ✅ Prerequisites (Install These First)

### 1. Node.js (Required)

**Check if installed**:
```bash
node --version
```

**If not installed or version < 16**:
- **Windows**: Download from [nodejs.org](https://nodejs.org/) (use LTS version)
- **macOS**: `brew install node` or download from [nodejs.org](https://nodejs.org/)
- **Linux**:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

**Verify**: `node --version` should show v16.x.x or higher

### 2. Git (Optional, but recommended)

```bash
git --version
```

If not installed:
- **Windows**: Download from [git-scm.com](https://git-scm.com/)
- **macOS**: `brew install git`
- **Linux**: `sudo apt-get install git`

---

## 🚀 Installation Steps

### Step 1: Get the Project

**Option A: Using Git (Recommended)**
```bash
# Clone the repository
git clone <your-repo-url>
cd "Assessbility Automation"

# Or if already cloned, just navigate:
cd "path/to/Assessbility Automation"
```

**Option B: Download ZIP**
1. Download ZIP file from repository
2. Extract to a folder
3. Open terminal/command prompt
4. Navigate to folder:
   ```bash
   cd "path/to/Assessbility Automation"
   ```

---

### Step 2: Install Dependencies

```bash
npm install
```

**What this installs**:
- Playwright test framework
- Axe-core accessibility engine
- TypeScript compiler
- Excel file handler
- All required dependencies

**Expected time**: 2-3 minutes
**If errors occur**, see Troubleshooting section below

---

### Step 3: Install Browsers

```bash
npm run install:browsers
```

**OR**:
```bash
npx playwright install
```

**What this does**:
- Downloads Chromium browser (~130MB)
- Downloads Firefox (~80MB) - optional
- Downloads WebKit (~60MB) - optional

**Expected time**: 3-5 minutes
**Total download**: ~270MB

**For Chromium only** (faster):
```bash
npx playwright install chromium
```

---

### Step 4: Verify Installation

```bash
npm run verify-setup
```

**Expected output**:
```
✅ Node.js version (16+)
✅ Dependencies installed
✅ Playwright installed
✅ Browsers installed
✅ TypeScript compiler ready
...
✅ Passed: 25
❌ Failed: 0

🎉 Setup verification complete!
```

---

### Step 5: Run Test Example

```bash
npm run test:example
```

**What this does**:
- Tests the W3C WAI website
- Generates Excel and JSON reports
- Creates HTML report

**Expected time**: 1-2 minutes

---

### Step 6: Check Results

```bash
# Windows
dir reports

# macOS/Linux
ls reports/
```

**You should see**:
- `wcag-assessment-report.xlsx` - Excel report
- `wcag-assessment-report.json` - JSON data
- `playwright-report/` - HTML test report

**Open the Excel report**:
- Windows: `start reports\wcag-assessment-report.xlsx`
- macOS: `open reports/wcag-assessment-report.xlsx`
- Linux: `xdg-open reports/wcag-assessment-report.xlsx`

---

## 🎯 Your First Real Test

### Test a URL:

```bash
# Set the URL to test
set BASE_URL=https://your-website.com    # Windows
export BASE_URL=https://your-website.com  # macOS/Linux

# Run comprehensive test
npm test tests/wcag-complete-coverage.spec.ts -- --workers=1
```

### Test with Quick Scan:

```bash
npm run quick-scan https://your-website.com
```

---

## 📝 Common Commands

| Command | What it does |
|---------|--------------|
| `npm test` | Run all tests |
| `npm run test:wcag` | Run WCAG tests only |
| `npm run test:headed` | Run with browser visible |
| `npm run test:debug` | Run in debug mode |
| `npm run test:report` | Show HTML report |
| `npm run quick-scan <url>` | Quick accessibility scan |
| `npm run ui` | Start web interface |

---

## 🐛 Troubleshooting

### Issue #1: "npm: command not found"

**Problem**: Node.js/npm not installed or not in PATH

**Solution**:
```bash
# Verify Node.js installation
node --version

# If not found, reinstall Node.js from nodejs.org
```

---

### Issue #2: "EACCES: permission denied"

**Problem**: Permission issues during installation

**Solution (Windows)**:
```bash
# Run Command Prompt as Administrator
# Then run: npm install
```

**Solution (macOS/Linux)**:
```bash
# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.config
sudo chown -R $USER:$(id -gn $USER) ~/.npm

# Then run: npm install
```

---

### Issue #3: "Cannot find module '@playwright/test'"

**Problem**: Incomplete installation

**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json   # macOS/Linux
# OR
rmdir /s node_modules & del package-lock.json  # Windows

npm cache clean --force
npm install
```

---

### Issue #4: "Playwright browsers not found"

**Problem**: Browsers not installed

**Solution**:
```bash
# Install all browsers
npx playwright install

# Or just Chromium
npx playwright install chromium

# Check browser location
npx playwright install --help
```

---

### Issue #5: "Port 3000 already in use"

**Problem**: Another application using port 3000

**Solution**:
```bash
# Use different BASE_URL or kill process on port 3000

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

---

### Issue #6: Tests taking too long

**Problem**: Default timeout too short or parallel execution

**Solution**:
```bash
# Run with single worker (slower but more stable)
npm test -- --workers=1

# Increase timeout in playwright.config.ts
# Change: timeout: 600_000 (10 minutes)
```

---

### Issue #7: "Cannot read property of undefined"

**Problem**: TypeScript compilation issue

**Solution**:
```bash
# Compile TypeScript
npx tsc

# Check for errors
npx tsc --noEmit

# If errors, install types
npm install --save-dev @types/node
```

---

## 📂 Project Structure

```
Assessbility Automation/
├── tests/                          # Test files
│   ├── wcag.spec.ts               # Basic WCAG tests
│   ├── wcag-complete-coverage.spec.ts  # Full WCAG suite
│   └── quick-scan.spec.ts         # Quick scan
├── utils/                          # Helper functions
│   ├── axeHelper.ts               # Axe-core integration
│   ├── reportGenerator.ts         # Report creation
│   ├── keyboardHelper.ts          # Keyboard tests
│   └── ... (more helpers)
├── reports/                        # Generated reports
│   ├── wcag-assessment-report.xlsx
│   ├── complete-coverage/         # Comprehensive reports
│   └── quick-scan/                # Quick scan reports
├── config/                         # Configuration
│   └── wcagConfig.ts              # WCAG settings
├── package.json                    # Dependencies
├── playwright.config.ts            # Playwright config
└── tsconfig.json                  # TypeScript config
```

---

## 🔧 Configuration

### Change Test URL

**Option 1: Environment Variable**
```bash
# Windows
set BASE_URL=https://your-site.com
npm test

# macOS/Linux
BASE_URL=https://your-site.com npm test
```

**Option 2: Edit playwright.config.ts**
```typescript
// Line 18
baseURL: process.env.BASE_URL || 'https://your-default-site.com',
```

### Change Timeout

Edit `playwright.config.ts`:
```typescript
// Line 9
timeout: 600_000, // 10 minutes (increase if needed)
```

### Enable More Browsers

Edit `playwright.config.ts`, uncomment:
```typescript
// Lines 30-37
{
  name: 'firefox',
  use: { ...devices['Desktop Firefox'] },
},
```

---

## 🎓 Next Steps After Installation

1. ✅ **Read the guide**: `START_HERE.md`
2. ✅ **Test a real site**: Run quick scan on your website
3. ✅ **Review reports**: Check Excel and HTML reports
4. ✅ **Customize tests**: Edit `config/wcagConfig.ts`
5. ✅ **Learn more**: Read `TESTING_GUIDE.md`

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `START_HERE.md` | Overview and getting started |
| `INSTALLATION.md` | Detailed installation guide |
| `TESTING_GUIDE.md` | How to run tests |
| `QUICK_START.md` | Quick reference |
| `PROJECT_OVERVIEW.md` | Architecture and design |
| `WCAG_COVERAGE_REPORT.md` | Test coverage details |

---

## ✅ Installation Checklist

- [ ] Node.js 16+ installed (`node --version`)
- [ ] Project downloaded/cloned
- [ ] `npm install` completed (no errors)
- [ ] `npm run install:browsers` completed
- [ ] `npm run verify-setup` passes all checks
- [ ] `npm run test:example` runs successfully
- [ ] Reports generated in `reports/` folder
- [ ] Can open and view Excel reports

**If all checked**, you're ready to go! 🎉

---

## 🆘 Still Having Problems?

### Quick Fix Sequence:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json    # macOS/Linux
# OR rmdir /s node_modules & del package-lock.json  # Windows

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall everything
npm install

# 4. Install browsers
npm run install:browsers

# 5. Verify
npm run verify-setup

# 6. Test
npm run test:example
```

### If still failing:

1. Check Node.js version: `node --version` (need 16+)
2. Check npm version: `npm --version` (need 7+)
3. Check disk space: Need at least 1GB free
4. Check internet connection: Downloads ~500MB
5. Check antivirus: May block browser installations
6. Try running as Administrator (Windows)

---

## 🌐 System Requirements

### Minimum:
- **OS**: Windows 10, macOS 10.13+, Ubuntu 18.04+
- **CPU**: Dual-core 2GHz
- **RAM**: 4GB
- **Disk**: 1GB free
- **Internet**: For initial installation

### Recommended:
- **OS**: Latest Windows 11, macOS, or Ubuntu
- **CPU**: Quad-core 2.5GHz+
- **RAM**: 8GB+
- **Disk**: 2GB free (SSD preferred)
- **Internet**: 10+ Mbps

---

## 🔐 Security & Privacy

✅ All dependencies from official npm registry
✅ No telemetry or tracking
✅ All testing runs locally
✅ Reports stay on your machine
✅ No data sent to external services
✅ Open source dependencies

---

## 📞 Support

- **Documentation**: Check all `.md` files in project root
- **Playwright Docs**: [playwright.dev/docs](https://playwright.dev/docs)
- **Axe-core Docs**: [github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core)
- **WCAG Guidelines**: [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Installation Time**: ~10-15 minutes
**First Test**: ~2 minutes
**Learning Curve**: 30 minutes to first productive use

**You're ready to start testing accessibility!** 🚀
