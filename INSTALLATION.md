# Installation Instructions

## 📋 Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **Operating System**: Windows, macOS, or Linux
- **Disk Space**: ~500MB for browsers

## 🚀 Quick Installation

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@playwright/test` - Browser automation framework
- `@axe-core/playwright` - Accessibility testing engine
- `axe-core` - WCAG rules library
- `xlsx` - Excel file handling
- `typescript` - Type checking

**Time:** ~2 minutes

### Step 2: Install Browsers

```bash
npm run install:browsers
```

This downloads:
- Chromium (for Chrome testing)
- Firefox
- WebKit (for Safari testing)

**Time:** ~3-5 minutes  
**Size:** ~400MB

### Step 3: Verify Installation

```bash
npm run verify-setup
```

Expected output:
```
🔍 Verifying WCAG Framework Setup...

✅ Node.js version (16+)
✅ package.json exists
✅ Dependencies installed
✅ Playwright installed
✅ axe-core installed
✅ xlsx installed
✅ Playwright browsers installed
✅ Configuration files exist
... (more checks)

✅ Passed: 25
❌ Failed: 0

🎉 Setup verification complete! All checks passed.
```

### Step 4: Run First Test

```bash
npm run test:example
```

This tests the W3C WAI website (no configuration needed).

**Time:** ~1 minute

### Step 5: Check Reports

```bash
ls reports/
```

You should see:
- `wcag-assessment-report.xlsx`
- `wcag-assessment-report.json`

Open the Excel report to see results!

## ✅ Installation Complete!

**Next Steps:**
1. Read [START_HERE.md](START_HERE.md) for guidance
2. Configure for your app: Edit `config/wcagConfig.ts`
3. Run tests: `npm test`

## 🔧 Detailed Installation (Alternative)

If the quick installation doesn't work, try this step-by-step approach:

### 1. Check Node.js

```bash
node --version
# Should show v16.x.x or higher
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. Clone/Download Project

```bash
# If using git
git clone <repository-url>
cd wcag-automation

# Or extract downloaded zip file
```

### 3. Install Dependencies

```bash
# Clear any existing installations
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Verify installation
npm list --depth=0
```

Expected packages:
```
├── @axe-core/playwright@4.9.1
├── @playwright/test@1.45.0
├── @types/node@20.14.0
├── axe-core@4.9.1
├── typescript@5.5.0
└── xlsx@0.18.5
```

### 4. Install Browsers Manually

```bash
# Install all browsers
npx playwright install

# Or install specific browsers only
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### 5. Compile TypeScript (Optional)

```bash
npx tsc --noEmit
```

This checks for TypeScript errors without generating output.

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Linux/Mac
sudo npm install -g npm

# Windows (Run as Administrator)
npm install -g npm
```

### Issue: Browser installation fails

**Error:** `Failed to download browsers`

**Solution:**
```bash
# Set environment variable for custom path
export PLAYWRIGHT_BROWSERS_PATH=$HOME/.playwright

# Try installation again
npm run install:browsers

# Or use system proxy
export HTTPS_PROXY=http://proxy:port
npm run install:browsers
```

### Issue: TypeScript errors

**Error:** `Cannot find module '@playwright/test'`

**Solution:**
```bash
# Reinstall type definitions
npm install --save-dev @types/node

# Verify tsconfig.json includes playwright types
cat tsconfig.json | grep playwright
```

### Issue: Module not found errors

**Error:** `Cannot find module 'xlsx'`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Permission errors on scripts

**Error:** `Permission denied: scripts/quick-scan.js`

**Solution:**
```bash
# Linux/Mac - Make scripts executable
chmod +x scripts/*.js

# Windows - Run with node explicitly
node scripts/quick-scan.js <url>
```

## 🔍 Verify Each Component

### Check Playwright

```bash
npx playwright --version
# Should show: Version 1.45.0
```

### Check TypeScript

```bash
npx tsc --version
# Should show: Version 5.5.0
```

### Check Browsers

```bash
npx playwright install --help
# Lists available browsers
```

### Test Quick Scan

```bash
npm run quick-scan https://www.w3.org/WAI/
```

Expected: Reports generated in `reports/quick-scan/`

## 📦 What Gets Installed?

### npm packages (node_modules/)
- **@playwright/test**: Test framework
- **@axe-core/playwright**: Accessibility engine
- **axe-core**: WCAG rules
- **xlsx**: Excel handling
- **typescript**: Type checking
- **@types/node**: Node.js types

**Total Size:** ~150MB

### Playwright Browsers
- **Chromium**: ~130MB
- **Firefox**: ~80MB
- **WebKit**: ~60MB

**Total Size:** ~270MB

### Framework Files
- **Utils**: 7 TypeScript files (~2MB source)
- **Tests**: 2 test suites
- **Examples**: 2 example files
- **Config**: 3 configuration files
- **Docs**: 6 markdown files
- **Scripts**: 3 utility scripts

**Total Size:** ~5MB

## 🌍 Network Requirements

### During Installation
- Download speed: ~50-100MB
- Bandwidth: ~500MB total
- Time: 5-10 minutes on average connection

### During Testing
- Minimal bandwidth (only for page under test)
- No external API calls
- All processing done locally

## 💻 System Requirements

### Minimum
- **CPU**: Dual-core 2GHz
- **RAM**: 4GB
- **Disk**: 1GB free space
- **OS**: Windows 10, macOS 10.13+, Ubuntu 18.04+

### Recommended
- **CPU**: Quad-core 2.5GHz+
- **RAM**: 8GB+
- **Disk**: 2GB free space (SSD)
- **OS**: Latest stable version

## 🔐 Security Notes

- All dependencies from npm registry
- No telemetry or tracking
- Local execution only
- Reports stay on your machine
- No data sent to external services

## ✅ Installation Checklist

- [ ] Node.js 16+ installed
- [ ] `npm install` completed successfully
- [ ] `npm run install:browsers` completed
- [ ] `npm run verify-setup` passes all checks
- [ ] `npm run test:example` runs successfully
- [ ] Reports generated in `reports/` directory
- [ ] Able to open Excel reports
- [ ] No error messages in console

## 🎯 Next Steps After Installation

1. ✅ **Read START_HERE.md**
   ```bash
   cat START_HERE.md
   ```

2. ✅ **Configure for your app**
   ```bash
   vi config/wcagConfig.ts
   ```

3. ✅ **Run your first real test**
   ```bash
   npm run quick-scan https://your-app.com
   ```

4. ✅ **Review the reports**
   ```bash
   open reports/quick-scan/quick-scan-report.xlsx
   ```

5. ✅ **Read the testing guide**
   ```bash
   cat TESTING_GUIDE.md
   ```

## 🆘 Still Having Issues?

1. **Check Node.js version**: `node --version` (need 16+)
2. **Check npm version**: `npm --version` (need 7+)
3. **Clear everything and retry**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   npm run install:browsers
   ```
4. **Run verification**: `npm run verify-setup`
5. **Check documentation**: Review SETUP.md for details
6. **Review error messages**: Read them carefully for clues

## 📚 Additional Resources

- [Node.js Installation](https://nodejs.org/en/download/)
- [npm Documentation](https://docs.npmjs.com/)
- [Playwright Installation Guide](https://playwright.dev/docs/intro)
- [TypeScript Setup](https://www.typescriptlang.org/download)

---

**Installation Support:** Check SETUP.md and START_HERE.md for more help!

