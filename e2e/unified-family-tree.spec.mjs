import{test,expect}from'@playwright/test';

const HAZEL='P-HAZEL-EMMA-BERG-DENNEWITZ';
const LIVING='P-WILLIAM-JOHN-RAHE-III';

async function mockApis(page,{withPortraits=false}={}){
  await page.route('**/api/media**',async route=>{
    const url=new URL(route.request().url());
    if(url.searchParams.has('file'))return route.fulfill({status:200,contentType:'image/jpeg',body:''});
    const media=withPortraits?[
      {id:'hazel-public',visibility:'public',mime:'image/jpeg',personIds:[HAZEL],featured:true,title:'Hazel portrait'},
      {id:'living-public-should-not-render',visibility:'public',mime:'image/jpeg',personIds:[LIVING],featured:true,title:'Living portrait'}
    ]:[];
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media,authenticated:false,canUpload:false,canEdit:false,user:null})});
  });
  await page.route('**/api/auth**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false,user:null})}));
  await page.route('**/api/family-sync**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:false})}));
}

test.beforeEach(async({page})=>{await mockApis(page);});

test('Home stays compact while dedicated Tree retains branch navigation',async({page})=>{
  await page.goto('/#dashboard');
  const home=page.locator('[data-v17-native="home"]');
  await expect(home.locator('.v172-home-branches')).toHaveCount(0);
  await expect(home.locator('.v174-discovery')).toHaveCount(0);
  await expect(home.locator('.v17-home-tree')).toBeVisible();
  await expect(home.locator('.v17-featured-people .v17-home-person')).toHaveCount(3);
});

test('plain Tree opens the connected family network and offers branch shortcuts',async({page})=>{
  await page.goto('/#tree');
  const branchNav=page.locator('.v172-tree-branches');
  await expect(branchNav).toBeVisible();
  await expect(page.locator('.tree-mode-buttons [data-tree-scope="connected"]')).toHaveClass(/active/);
  const branchButtons=branchNav.locator('[data-v172-tree-branch]');
  expect(await branchButtons.count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator('.graph-node[data-person]').first()).toBeVisible();

  const first=branchButtons.first(),focus=await first.getAttribute('data-focus');
  expect(focus).toBeTruthy();
  await first.click();
  await expect.poll(()=>new URL(page.url()).searchParams.get('scope')).toBe('family');
  await expect.poll(()=>new URL(page.url()).searchParams.get('depth')).toBe('3');
  await expect(page.locator('[data-tree-person]')).toHaveValue(focus);
  await expect(page.locator('.v172-tree-branches')).toBeVisible();
});

test('public tree portraits never render for living people even if media metadata is wrong',async({page})=>{
  await page.unroute('**/api/media**');
  await page.route('**/api/media**',async route=>{
    const url=new URL(route.request().url());
    if(url.searchParams.has('file'))return route.fulfill({status:200,contentType:'image/jpeg',body:''});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,media:[
      {id:'hazel-public',visibility:'public',mime:'image/jpeg',personIds:[HAZEL],featured:true,title:'Hazel portrait'},
      {id:'living-public-should-not-render',visibility:'public',mime:'image/jpeg',personIds:[LIVING],featured:true,title:'Living portrait'}
    ],authenticated:false,canUpload:false,canEdit:false,user:null})});
  });
  await page.goto('/#tree');
  const hazel=page.locator(`.graph-node[data-person="${HAZEL}"]`),living=page.locator(`.graph-node[data-person="${LIVING}"]`);
  await expect(hazel).toBeVisible();
  await expect(living).toBeVisible();
  await expect(hazel.locator('.v172-node-photo')).toHaveCount(1);
  await expect(living.locator('.v172-node-photo')).toHaveCount(0);
});
