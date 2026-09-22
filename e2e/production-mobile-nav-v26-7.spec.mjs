import{test,expect}from'@playwright/test';

const routes=['dashboard','families','tree','people'];

async function ready(page,route){
  await page.goto('/#'+route,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>document.body.dataset.route===expected,route);
  await page.waitForFunction(()=>document.body.dataset.routeCapabilityState==='ready');
}

async function dockGeometry(page){
  return page.locator('#family-mobile-dock').evaluate(dock=>{
    const rect=dock.getBoundingClientRect();
    const items=[...dock.children].filter(el=>el.matches('a,details')).map(el=>{
      const r=el.matches('details')?el.querySelector('summary').getBoundingClientRect():el.getBoundingClientRect();
      const current=el.matches('a')&&(el.getAttribute('aria-current')==='page'||el.classList.contains('active'));
      return{left:r.left,top:r.top,width:r.width,height:r.height,current};
    });
    return{rect:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height},items,viewport:{width:innerWidth,height:innerHeight}};
  });
}

test.describe('v26.7 production mobile navigation',()=>{
  test.skip(({isMobile})=>!isMobile,'mobile-only production navigation contract');

test('production mobile dock stays equal-weight, contained, and route-correct',async({page})=>{
  for(const route of routes){
    await ready(page,route);
    const dock=page.locator('#family-mobile-dock');
    await expect(dock).toBeVisible();
    const g=await dockGeometry(page);
    expect(g.items).toHaveLength(5);
    expect(g.rect.left).toBeGreaterThanOrEqual(0);
    expect(g.rect.right).toBeLessThanOrEqual(g.viewport.width);
    expect(g.rect.bottom).toBeLessThanOrEqual(g.viewport.height+1);
    expect(Math.min(...g.items.map(x=>x.height))).toBeGreaterThanOrEqual(44);
    expect(Math.max(...g.items.map(x=>x.height))-Math.min(...g.items.map(x=>x.height))).toBeLessThanOrEqual(4);
    expect(Math.max(...g.items.map(x=>x.top))-Math.min(...g.items.map(x=>x.top))).toBeLessThanOrEqual(4);
    const widths=g.items.map(x=>x.width);
    expect(Math.max(...widths)-Math.min(...widths)).toBeLessThanOrEqual(8);
    expect(g.items.filter(x=>x.current)).toHaveLength(1);
  }
});

test('production Tree no longer floats above sibling mobile nav items',async({page})=>{
  await ready(page,'dashboard');
  const data=await page.locator('#family-mobile-dock').evaluate(dock=>{
    const link=route=>dock.querySelector(`[data-dock-route="${route}"]`);
    const rect=el=>{const r=el.getBoundingClientRect();return{top:r.top,height:r.height,width:r.width}};
    return{home:rect(link('dashboard')),families:rect(link('families')),tree:rect(link('tree')),people:rect(link('people'))};
  });
  const tops=Object.values(data).map(x=>x.top);
  const heights=Object.values(data).map(x=>x.height);
  expect(Math.max(...tops)-Math.min(...tops)).toBeLessThanOrEqual(4);
  expect(Math.max(...heights)-Math.min(...heights)).toBeLessThanOrEqual(4);
});

test('production More sheet stays above dock and inside the phone viewport',async({page})=>{
  await ready(page,'people');
  const more=page.locator('#family-mobile-dock details.mobile-more');
  await more.locator('summary').click();
  const sheet=more.locator(':scope>div');
  await expect(sheet).toBeVisible();
  const g=await sheet.evaluate(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,vw:innerWidth,vh:innerHeight};});
  expect(g.left).toBeGreaterThanOrEqual(0);
  expect(g.right).toBeLessThanOrEqual(g.vw);
  expect(g.top).toBeGreaterThanOrEqual(0);
  expect(g.bottom).toBeLessThanOrEqual(g.vh+1);
  const targets=await sheet.locator('a,button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect().height));
  expect(Math.min(...targets)).toBeGreaterThanOrEqual(44);
});
});
