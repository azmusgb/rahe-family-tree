import{defineConfig,devices}from'@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  timeout:30_000,
  expect:{timeout:8_000},
  retries:1,
  workers:2,
  reporter:'line',
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    video:'off',
    screenshot:'only-on-failure'
  },
  projects:[
    {name:'mobile-chromium',use:{...devices['iPhone 14'],browserName:'chromium'}},
    {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1440,height:1000}}}
  ],
  webServer:{
    command:'python3 -m http.server 4173 --directory dist',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:true,
    timeout:20_000
  }
});
