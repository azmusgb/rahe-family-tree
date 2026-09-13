import{defineConfig,devices}from'@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  timeout:45_000,
  globalTimeout:8*60_000,
  expect:{timeout:12_000},
  retries:1,
  workers:1,
  forbidOnly:!!process.env.CI,
  reporter:process.env.CI?[['line'],['html',{outputFolder:'playwright-report',open:'never'}]]:'line',
  outputDir:'test-results',
  use:{
    baseURL:'http://127.0.0.1:4173',
    actionTimeout:12_000,
    navigationTimeout:20_000,
    trace:'retain-on-failure',
    video:'retain-on-failure',
    screenshot:'only-on-failure'
  },
  projects:[
    {name:'mobile-chromium',use:{...devices['iPhone 14'],browserName:'chromium'}},
    {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1440,height:1000}}}
  ],
  webServer:{
    command:'python3 -m http.server 4173 --directory dist --bind 127.0.0.1',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:false,
    timeout:20_000,
    stdout:'pipe',
    stderr:'pipe'
  }
});
