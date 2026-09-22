import{defineConfig,devices}from'@playwright/test';

const baseURL=process.env.PLAYWRIGHT_BASE_URL;
if(!baseURL)throw new Error('PLAYWRIGHT_BASE_URL is required for production QA');

export default defineConfig({
  testDir:'./e2e',
  timeout:45_000,
  expect:{timeout:12_000},
  retries:1,
  workers:1,
  reporter:'line',
  outputDir:'test-results-production',
  use:{
    ...devices['iPhone 14'],
    browserName:'chromium',
    baseURL,
    actionTimeout:12_000,
    navigationTimeout:20_000,
    trace:'retain-on-failure',
    screenshot:'only-on-failure'
  }
});
