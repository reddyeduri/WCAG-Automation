import { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authentication Helper - Handles Microsoft SSO and other authentication flows
 *
 * PROBLEM SOLVED: Tests were running against Microsoft login page instead of actual application
 *
 * SOLUTIONS PROVIDED:
 * 1. Microsoft SSO authentication
 * 2. Session state storage/reuse
 * 3. Basic authentication
 * 4. Custom login flows
 */

export interface AuthConfig {
  type: 'microsoft' | 'basic' | 'custom' | 'none';
  username?: string;
  password?: string;
  storageStatePath?: string;
  loginUrl?: string;
  customLoginFn?: (page: Page) => Promise<void>;
}

export class AuthHelper {
  private static readonly DEFAULT_STORAGE_PATH = 'auth-state.json';

  /**
   * Authenticate and save session state
   * This should be run ONCE before your test suite to save authentication state
   */
  static async authenticate(page: Page, config: AuthConfig): Promise<void> {
    const storagePath = config.storageStatePath || this.DEFAULT_STORAGE_PATH;

    // Check if we already have valid authentication state
    if (fs.existsSync(storagePath)) {
      console.log('✅ Found existing authentication state, loading...');
      await page.context().storageState({ path: storagePath });
      return;
    }

    console.log(`🔐 Authenticating with ${config.type}...`);

    switch (config.type) {
      case 'microsoft':
        await this.authenticateMicrosoft(page, config);
        break;
      case 'basic':
        await this.authenticateBasic(page, config);
        break;
      case 'custom':
        if (config.customLoginFn) {
          await config.customLoginFn(page);
        }
        break;
      case 'none':
        // No authentication needed
        return;
    }

    // Save the authentication state for reuse
    await page.context().storageState({ path: storagePath });
    console.log(`✅ Authentication complete, state saved to ${storagePath}`);
  }

  /**
   * Handle Microsoft SSO login
   */
  private static async authenticateMicrosoft(page: Page, config: AuthConfig): Promise<void> {
    if (!config.username || !config.password) {
      throw new Error('Username and password required for Microsoft authentication');
    }

    const loginUrl = config.loginUrl || page.url();
    await page.goto(loginUrl);

    try {
      // Wait for Microsoft login form
      console.log('⏳ Waiting for Microsoft login page...');

      // Enter email
      const emailInput = page.locator('input[type="email"], input[name="loginfmt"], input[name="username"]').first();
      await emailInput.waitFor({ timeout: 10000 });
      await emailInput.fill(config.username);
      await emailInput.press('Enter');

      // Wait for password page
      await page.waitForTimeout(2000); // Microsoft redirects take time

      // Enter password
      const passwordInput = page.locator('input[type="password"], input[name="passwd"], input[name="password"]').first();
      await passwordInput.waitFor({ timeout: 10000 });
      await passwordInput.fill(config.password);
      await passwordInput.press('Enter');

      // Handle "Stay signed in?" prompt
      await page.waitForTimeout(2000);

      // Click "Yes" or "No" button (configurable via env var)
      const staySignedIn = process.env.STAY_SIGNED_IN !== 'false';
      if (staySignedIn) {
        const yesButton = page.locator('input[type="submit"][value="Yes"], button:has-text("Yes")').first();
        if (await yesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await yesButton.click();
        }
      } else {
        const noButton = page.locator('input[type="submit"][value="No"], button:has-text("No")').first();
        if (await noButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await noButton.click();
        }
      }

      // Wait for redirect to actual application
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      console.log('✅ Microsoft login successful');
    } catch (error) {
      throw new Error(`Microsoft authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle basic HTTP authentication
   */
  private static async authenticateBasic(page: Page, config: AuthConfig): Promise<void> {
    if (!config.username || !config.password) {
      throw new Error('Username and password required for basic authentication');
    }

    // Set basic auth credentials
    await page.context().setHTTPCredentials({
      username: config.username,
      password: config.password
    });

    console.log('✅ Basic authentication configured');
  }

  /**
   * Load saved authentication state into a new context
   */
  static async loadAuthState(context: BrowserContext, storagePath?: string): Promise<boolean> {
    const authStatePath = storagePath || this.DEFAULT_STORAGE_PATH;

    if (fs.existsSync(authStatePath)) {
      await context.storageState({ path: authStatePath });
      console.log('✅ Loaded authentication state');
      return true;
    }

    console.log('⚠️  No authentication state found');
    return false;
  }

  /**
   * Clear saved authentication state
   */
  static clearAuthState(storagePath?: string): void {
    const authStatePath = storagePath || this.DEFAULT_STORAGE_PATH;

    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('✅ Authentication state cleared');
    }
  }

  /**
   * Check if we're on a login page (Microsoft, generic, etc.)
   */
  static async isLoginPage(page: Page): Promise<boolean> {
    const url = page.url();

    // Microsoft login URLs
    if (url.includes('login.microsoftonline.com') ||
        url.includes('login.live.com') ||
        url.includes('login.windows.net')) {
      return true;
    }

    // Generic login page detection
    const loginIndicators = [
      'input[type="password"]',
      'input[name="username"]',
      'input[name="password"]',
      'button[type="submit"]:has-text("Sign in")',
      'button[type="submit"]:has-text("Log in")'
    ];

    for (const selector of loginIndicators) {
      if (await page.locator(selector).count() > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Wait for authentication to complete and redirect to actual page
   */
  static async waitForAuthComplete(page: Page, expectedUrlPattern?: string | RegExp): Promise<void> {
    console.log('⏳ Waiting for authentication to complete...');

    if (expectedUrlPattern) {
      await page.waitForURL(expectedUrlPattern, { timeout: 60000 });
    } else {
      // Wait until we're no longer on a login page
      await page.waitForFunction(async () => {
        const url = window.location.href;
        return !url.includes('login.microsoftonline.com') &&
               !url.includes('login.live.com') &&
               !url.includes('login.windows.net');
      }, { timeout: 60000 });
    }

    await page.waitForLoadState('networkidle');
    console.log('✅ Authentication complete, on application page');
  }

  /**
   * Skip authentication if already logged in
   * Returns true if already authenticated, false if login needed
   */
  static async skipIfAuthenticated(page: Page, testUrl: string): Promise<boolean> {
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');

    const isLogin = await this.isLoginPage(page);

    if (!isLogin) {
      console.log('✅ Already authenticated, skipping login');
      return true;
    }

    console.log('⚠️  Not authenticated, login required');
    return false;
  }
}

/**
 * Example usage in tests:
 *
 * // Option 1: Use environment variables (RECOMMENDED)
 * const authConfig: AuthConfig = {
 *   type: process.env.AUTH_TYPE as 'microsoft' | 'basic' | 'none' || 'none',
 *   username: process.env.AUTH_USERNAME,
 *   password: process.env.AUTH_PASSWORD,
 *   loginUrl: process.env.AUTH_LOGIN_URL
 * };
 *
 * // Option 2: Run authentication setup once before all tests
 * test.beforeAll(async ({ page }) => {
 *   if (process.env.AUTH_TYPE === 'microsoft') {
 *     await AuthHelper.authenticate(page, authConfig);
 *   }
 * });
 *
 * // Option 3: Check and skip login in each test
 * test('accessibility test', async ({ page }) => {
 *   const alreadyAuth = await AuthHelper.skipIfAuthenticated(page, process.env.BASE_URL!);
 *
 *   if (!alreadyAuth) {
 *     await AuthHelper.authenticate(page, authConfig);
 *     await AuthHelper.waitForAuthComplete(page);
 *   }
 *
 *   // Now run your accessibility tests
 * });
 */
