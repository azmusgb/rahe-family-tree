import fs from'node:fs';

const mobilePath='src/runtime/mobile-ui-shell.js';
const contractPath='scripts/test-mobile-shell-v22.mjs';
const e2ePath='e2e/mobile-v20-app.spec.mjs';

let mobile=fs.readFileSync(mobilePath,'utf8');
const oldHeader=`function syncDedicatedHeader(){
  const header=document.getElementById('mobile-app-header');
  if(!header)return;
  if(!isMobile()){
    header.hidden=true;
    document.body.classList.remove('v21-actual-mobile-ui');
    return;
  }
  header.hidden=false;
  document.body.classList.add('v21-actual-mobile-ui');`;
const newHeader=`function syncDedicatedHeader(){
  const header=document.getElementById('mobile-app-header');
  const siteHeader=document.querySelector('.site-header.sidebar');
  if(!header)return;
  const mobileViewport=isMobile();
  header.hidden=!mobileViewport;
  if(siteHeader){
    siteHeader.hidden=mobileViewport;
    siteHeader.setAttribute('aria-hidden',String(mobileViewport));
  }
  if(!mobileViewport){
    document.body.classList.remove('v21-actual-mobile-ui');
    delete document.body.dataset.mobileHeaderOwner;
    return;
  }
  document.body.dataset.mobileHeaderOwner='dedicated';
  document.body.classList.add('v21-actual-mobile-ui');`;
if(!mobile.includes(oldHeader))throw new Error('Expected dedicated header function not found');
mobile=mobile.replace(oldHeader,newHeader);
fs.writeFileSync(mobilePath,mobile);

let contract=fs.readFileSync(contractPath,'utf8');
const contractTest=`\n\ntest('dedicated mobile header exclusively owns phone chrome',()=>{\n  assert.match(mobile,/siteHeader\\.hidden=mobileViewport/);\n  assert.match(mobile,/dataset\\.mobileHeaderOwner='dedicated'/);\n  assert.match(mobile,/header\\.hidden=!mobileViewport/);\n});\n`;
if(!contract.includes("dedicated mobile header exclusively owns phone chrome"))contract+=contractTest;
fs.writeFileSync(contractPath,contract);

let e2e=fs.readFileSync(e2ePath,'utf8');
const marker='\n});\n';
const insertion=`\n  test('dedicated mobile header is the sole phone header and desktop header returns above the breakpoint',async({page})=>{\n    await openMobile(page,'dashboard');\n    await expect(page.locator('#mobile-app-header')).toBeVisible();\n    await expect(page.locator('.site-header.sidebar')).toBeHidden();\n    await expect(page.locator('body')).toHaveAttribute('data-mobile-header-owner','dedicated');\n    await expect(page.locator('#mobile-app-header [data-mobile-app-title]')).toHaveText('Home');\n\n    await openMobile(page,'person/P-WILLIAM-JOHN-RAHE-III');\n    await page.waitForSelector('[data-v17-native=\"person\"]');\n    await expect(page.locator('#mobile-app-header')).toBeVisible();\n    await expect(page.locator('.site-header.sidebar')).toBeHidden();\n    await expect(page.locator('#mobile-app-header [data-mobile-app-back]')).toHaveAttribute('href','#people');\n\n    await page.setViewportSize({width:900,height:900});\n    await expect(page.locator('#mobile-app-header')).toBeHidden();\n    await expect(page.locator('.site-header.sidebar')).toBeVisible();\n    await expect(page.locator('body')).not.toHaveAttribute('data-mobile-header-owner','dedicated');\n  });\n`;
const last=e2e.lastIndexOf(marker);
if(last<0)throw new Error('Unable to locate mobile e2e suite terminator');
if(!e2e.includes('dedicated mobile header is the sole phone header'))e2e=e2e.slice(0,last)+insertion+e2e.slice(last);
fs.writeFileSync(e2ePath,e2e);

fs.rmSync('scripts/mobile-shell-v22-phase2-once.mjs');
fs.rmSync('.github/workflows/mobile-shell-v22-phase2-once.yml');
