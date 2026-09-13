import{test,expect}from'@playwright/test';

const media=[
  {id:'hazel-1944',mime:'image/jpeg',title:'Hazel family photograph',caption:'Hazel in the family archive',eventDate:'1944',location:'Chicago, Illinois',personIds:['P-HAZEL-EMMA-BERG-DENNEWITZ'],visibility:'public',featured:true,createdAt:'2026-09-10T00:00:00Z',evidenceAuthority:'MEDIA ATTACHMENT — DOES NOT PROMOTE GENEALOGY EVIDENCE'},
  {id:'george-1950',mime:'image/jpeg',title:'George family photograph',caption:'George in the family archive',eventDate:'1950',location:'Chicago, Illinois',personIds:['P-GEORGE-OTTO-DENNEWITZ-JR'],visibility:'public',featured:false,createdAt:'2026-09-09T00:00:00Z',evidenceAuthority:'MEDIA ATTACHMENT — DOES NOT PROMOTE GENEALOGY EVIDENCE'},
  {id:'hazel-document',mime:'application/pdf',title:'Hazel archive document',caption:'Historical document',eventDate:'1948',location:'Chicago, Illinois',personIds:['P-HAZEL-EMMA-BERG-DENNEWITZ'],visibility:'public',featured:false,createdAt:'2026-09-08T00:00:00Z',evidenceAuthority:'MEDIA ATTACHMENT — DOES NOT PROMOTE GENEALOGY EVIDENCE'},
  {id:'living-secret',mime:'image/jpeg',title:'Living private photograph that must not become an album cover',caption:'should be excluded by v17.4 defense in depth',eventDate:'1999',location:'Private location',personIds:['P-LINDA-KAY-DENNEWITZ'],visibility:'public',featured:true,createdAt:'2026-09-11T00:00:00Z'}
];

async function mockApis(page){
  await page.route('**/api/media**',async route=>{if(route.request().url().includes('?file=')){await route.fulfill({status:200,contentType:'image/jpeg',body:''});return;}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media,authenticated:false,canUpload:false,canEdit:false,user:null})});});
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('Family media route becomes an album-first archive without weakening the existing library',async({page})=>{
  await page.goto('/#media');
  const albums=page.locator('.v174-albums');
  await expect(albums).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-albums-release','17.4.0');
  await expect(page.locator('#crumb')).toHaveText('Albums');
  await expect(page.locator('#title')).toHaveText('Family Albums');
  await expect(albums.getByRole('heading',{name:'Browse the archive like a collection of family albums.'})).toBeVisible();
  await expect(albums.getByRole('heading',{name:'Branch albums'})).toBeVisible();
  await expect(albums.getByRole('heading',{name:'Decade albums'})).toBeVisible();
  await expect(page.locator('#media-library')).toBeVisible();
});

test('branch decade and format albums drive the existing media filters',async({page})=>{
  await page.goto('/#media');
  const albums=page.locator('.v174-albums');await expect(albums).toBeVisible();
  const branch=albums.locator('[data-v174-album-branch]').first();await expect(branch).toBeVisible();const branchName=await branch.getAttribute('data-v174-album-branch');await branch.click();await expect(page.locator('#branch')).toHaveValue(branchName);
  const decade=albums.locator('[data-v174-album-decade="1940"]');await expect(decade).toBeVisible();await decade.click();await expect(page.locator('#media-decade')).toHaveValue('1940');await expect(page.locator('#branch')).toHaveValue('');
  const documents=albums.locator('[data-v174-album-type="document"]');await expect(documents).toBeVisible();await documents.click();await expect(page.locator('#media-type')).toHaveValue('document');await expect(page.locator('#media-decade')).toHaveValue('all');
});

test('anonymous album composition excludes an erroneously public living-person item',async({page})=>{
  await page.goto('/#media');
  const albums=page.locator('.v174-albums');await expect(albums).toBeVisible();
  await expect(albums.locator('img[src*="living-secret"]')).toHaveCount(0);
  await expect(albums).not.toContainText('Living private photograph that must not become an album cover');
  await expect(albums.locator('[data-v174-album-decade="1990"]')).toHaveCount(0);
});

test('Albums navigation is family-facing and album controls remain mobile-safe',async({page},testInfo)=>{
  await page.goto('/#media');
  if(testInfo.project.name==='desktop-chromium')await expect(page.locator('#nav').getByRole('link',{name:'Albums',exact:true})).toBeVisible();
  if(testInfo.project.name==='mobile-chromium'){
    await expect(page.locator('#family-mobile-dock').getByRole('link',{name:'Albums',exact:true})).toBeVisible();
    const button=page.locator('.v174-album-card').first();await expect(button).toBeVisible();const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);const small=button.locator('small').first();const font=await small.evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize));expect(font).toBeGreaterThanOrEqual(11);
  }
});
