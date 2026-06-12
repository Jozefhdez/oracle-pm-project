import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './support/constants';

export default defineConfig({
  testDir: './e2e',
  outputDir: '../test-results/e2e',
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { outputFolder: '../playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'BROWSER=none npm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
