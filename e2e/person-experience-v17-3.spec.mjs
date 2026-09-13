import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
const LIVING='P-WILLIAM-JOHN-RAHE-III';

async function mockApis(page){
  await page.route('**/api/media**',async route=>{
    const url=new URL(route.request().url());
    if(url.searchParams.has('file'))return route.fulfill({status:404,contentType:'text/plain',body:'not found'});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[],authenticated:false,canUpload:false,canEdit:false,user:null})});
  });
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('historical Person opens as a biography-first family profile',async({page})=>{
  await page.goto(`/#person/${HAZEL}`);
  const profile=page.locator(`[data-v17-native="person"][data-person-id="${HAZEL}"]`);
  await expect(profile).toBeVisible();
  await expect(profile.locator('.v17-person-header')).toBeVisible();
  const storyLink=profile.locator('.v17-person-nav a[href="#v17-story"]');
  await expect(storyLink).toHaveText('Story');
  const story=profile.locator('#v17-story');
  await expect(story).toBeVisible();
  await expect(story.getByRole('heading',{name:/A life in the family record|A place in the family story/})).toBeVisible();
  await storyLink.click();
  await expect(page).toHaveURL(new RegExp(`#person/${HAZEL}$`));
  await expect(story).toBeVisible();
  await expect(profile.getByRole('heading',{name:'Immediate family'})).toBeVisible();
  await expect(profile.getByRole('heading',{name:'Life through the years'})).toBeVisible();
});

test('research detail is progressive disclosure on Family profiles',async({page})=>{
  await page.goto(`/#person/${HAZEL}`);
  const details=page.locator('.v173-research-details');
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute('open','');
  await expect(details.getByText('See the records behind this person')).toBeVisible();
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  await expect(details.getByRole('link',{name:/Open Research Center/})).toBeVisible();
});

test('living Person keeps biography framing while suppressing private chronology, places, and media',async({page})=>{
  await page.goto(`/#person/${LIVING}`);
  const profile=page.locator(`[data-v17-native="person"][data-person-id="${LIVING}"]`);
  await expect(profile).toBeVisible();
  const story=profile.locator('#v17-story');
  await expect(story.getByRole('heading',{name:'Part of the living family'})).toBeVisible();
  await expect(story.locator('.v173-story-moment')).toHaveCount(0);
  await expect(profile.getByText('Detailed chronology and location records are protected for living family members.')).toBeVisible();
  await expect(profile.getByText('Living-person media remains private in the public family archive.')).toBeVisible();
  await expect(profile.locator('.v17-person-places')).toHaveCount(0);
  await expect(profile.locator('[data-v17-person-gallery]')).toHaveCount(0);
});

test('v17.3 production shell reports the new Family experience fingerprint',async({page})=>{
  await page.goto('/#dashboard');
  await expect(page.locator('html')).toHaveAttribute('data-ui-release','17.3.0');
  await expect(page.locator('.version')).toContainText('v17.3.0');
});
