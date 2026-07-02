import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  webServer: {
    command: 'PORT=5000 node ../server.js',
    port: 5000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
