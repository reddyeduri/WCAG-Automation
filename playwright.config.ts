import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 600_000, // 10 minutes for comprehensive WCAG scans with full features

  reporter: [
    ['html'],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Load authentication state if it exists
    storageState: process.env.STORAGE_STATE || (require('fs').existsSync('auth-state.json') ? 'auth-state.json' : undefined),
  },

  projects: [
    // Setup project for authentication (runs once before tests)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use authentication state from setup if it exists
        storageState: 'auth-state.json'
      },
      dependencies: ['setup'], // Run setup before chromium tests
    },
    // Disabled Firefox and WebKit - Chrome only
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  outputDir: 'test-results/',
});

