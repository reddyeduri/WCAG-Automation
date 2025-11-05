import { test as setup } from '@playwright/test';
import { AuthHelper, AuthConfig } from '../utils/authHelper';
import * as fs from 'fs';

const authFile = 'auth-state.json';

/**
 * Authentication Setup for WCAG Tests
 *
 * This runs ONCE before all tests to handle authentication.
 * Saves authentication state to auth-state.json for reuse.
 *
 * USAGE:
 *
 * 1. For Microsoft SSO (Office 365, Azure AD):
 *    set AUTH_TYPE=microsoft
 *    set AUTH_USERNAME=your.email@company.com
 *    set AUTH_PASSWORD=your-password
 *    set BASE_URL=https://your-dev-environment.com
 *    npm test
 *
 * 2. For Basic HTTP Auth:
 *    set AUTH_TYPE=basic
 *    set AUTH_USERNAME=admin
 *    set AUTH_PASSWORD=password
 *    npm test
 *
 * 3. For No Authentication (public sites):
 *    set AUTH_TYPE=none
 *    npm test
 *
 * 4. To clear saved authentication:
 *    del auth-state.json  (Windows)
 *    rm auth-state.json   (Mac/Linux)
 */

setup('authenticate', async ({ page }) => {
  const authType = (process.env.AUTH_TYPE || 'none') as 'microsoft' | 'basic' | 'custom' | 'none';

  // Skip authentication if type is 'none' or credentials not provided
  if (authType === 'none' || !process.env.AUTH_USERNAME || !process.env.AUTH_PASSWORD) {
    console.log('ℹ️  No authentication configured (AUTH_TYPE=none or no credentials)');
    console.log('   Tests will run on public pages or already-authenticated sessions');

    // Create empty auth state file to satisfy dependency
    if (!fs.existsSync(authFile)) {
      fs.writeFileSync(authFile, '{}');
    }
    return;
  }

  // Check if we already have valid auth state
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

    // Reuse auth state if less than 24 hours old
    if (ageHours < 24) {
      console.log(`✅ Using existing authentication state (${ageHours.toFixed(1)} hours old)`);
      return;
    } else {
      console.log(`⚠️  Auth state is ${ageHours.toFixed(1)} hours old, re-authenticating...`);
      fs.unlinkSync(authFile);
    }
  }

  // Build auth configuration
  const authConfig: AuthConfig = {
    type: authType,
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD,
    loginUrl: process.env.AUTH_LOGIN_URL || process.env.BASE_URL,
    storageStatePath: authFile
  };

  console.log(`🔐 Authenticating with ${authType} for ${authConfig.loginUrl}...`);

  try {
    await AuthHelper.authenticate(page, authConfig);
    console.log('✅ Authentication successful! State saved for reuse.');
  } catch (error) {
    console.error('❌ Authentication failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
});

/**
 * Environment Variables Reference:
 *
 * AUTH_TYPE          - Authentication type: 'microsoft', 'basic', 'none' (default: 'none')
 * AUTH_USERNAME      - Login username/email
 * AUTH_PASSWORD      - Login password
 * AUTH_LOGIN_URL     - URL of login page (optional, defaults to BASE_URL)
 * BASE_URL           - URL of application to test
 * STAY_SIGNED_IN     - For Microsoft: 'true' to stay signed in (default: 'true')
 *
 * Example .env file:
 *
 * AUTH_TYPE=microsoft
 * AUTH_USERNAME=john.doe@company.com
 * AUTH_PASSWORD=SecurePassword123!
 * BASE_URL=https://dev.myapp.company.com
 * STAY_SIGNED_IN=true
 */
