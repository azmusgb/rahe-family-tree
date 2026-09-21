const mq=matchMedia('(max-width:900px)');
let boundRoot=null,previousFocus=null;
const focusable='button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function init(){
  const root=document.querySelector('[data-source-inspector="C001"]');
  if(!root||root===boundRoot)return;boundRoot=root;
  const panel=root.querySelector('[data-source-inspector-panel]'),open=root.querySelector('[data-source-inspector-open]'),close=root.querySelector('[data-source-inspector-close]'),backdrop=root.querySelector('[data-source-inspector-backdrop]');
  panel.id='source-inspector-panel-mobile';
  const fields=[...root.querySelectorAll('[data-source-field]')],announcer=root.querySelector('[data-source-announcer]');
  const setField=button=>{
    const key=button.dataset.sourceField;
    fields.forEach(el=>el.setAttribute('aria-pressed',el.dataset.sourceField===key?'true':'false'));
    root.querySelectorAll('[data-active-field-label]').forEach(el=>el.textContent=button.textContent.trim());
    root.querySelectorAll('[data-active-field-value]').forEach(el=>el.textContent=button.dataset.fieldValue||'');
    root.querySelectorAll('[data-active-field-supports]').forEach(el=>el.textContent=button.dataset.fieldSupports||'');
    root.querySelectorAll('[data-active-field-notsupports]').forEach(el=>el.textContent=button.dataset.fieldNotsupports||'');
    if(announcer)announcer.textContent=`${button.textContent.trim()} selected. ${button.dataset.fieldValue||''}`;
  };
  fields.forEach(button=>button.addEventListener('click',()=>setField(button)));
  if(fields[0])setField(fields[0]);

  const tabs=[...panel.querySelectorAll('[role="tab"]')];
  const selectTab=(tab,focus=false)=>{
    tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',active?'true':'false');t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls'))?.toggleAttribute('hidden',!active);});
    if(focus)tab.focus();
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(tab));
    tab.addEventListener('keydown',event=>{
      let next=null;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
      if(next!==null){event.preventDefault();selectTab(tabs[next],true);}
    });
  });

  const inertTargets=()=>[document.querySelector('.site-header'),document.querySelector('.topbar'),root.querySelector('.source-inspector-main'),document.querySelector('#family-mobile-dock')].filter(Boolean);
  const setInert=value=>inertTargets().forEach(el=>{el.inert=value;});
  const syncMode=()=>{
    if(!mq.matches){panel.removeAttribute('role');panel.removeAttribute('aria-modal');panel.setAttribute('aria-hidden','false');backdrop.hidden=true;document.body.style.overflow='';setInert(false);open.setAttribute('aria-expanded','false');}
    else if(!panel.classList.contains('is-open'))panel.setAttribute('aria-hidden','true');
  };
  const openPanel=()=>{
    if(!mq.matches)return;previousFocus=document.activeElement;panel.classList.add('is-open');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-hidden','false');backdrop.hidden=false;open.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';setInert(true);panel.querySelector('h2')?.setAttribute('tabindex','-1');panel.querySelector('h2')?.focus({preventScroll:true});
  };
  const closePanel=()=>{
    if(!mq.matches)return;panel.classList.remove('is-open');panel.removeAttribute('aria-modal');panel.setAttribute('aria-hidden','true');backdrop.hidden=true;open.setAttribute('aria-expanded','false');document.body.style.overflow='';setInert(false);previousFocus?.focus?.({preventScroll:true});
  };
  open.addEventListener('click',openPanel);close.addEventListener('click',closePanel);backdrop.addEventListener('click',closePanel);
  panel.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&mq.matches){event.preventDefault();closePanel();return;}
    if(event.key!=='Tab'||!mq.matches)return;
    const xs=[...panel.querySelectorAll(focusable)].filter(el=>!el.hidden&&el.offsetParent!==null);if(!xs.length)return;
    const first=xs[0],last=xs[xs.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  mq.addEventListener?.('change',syncMode);syncMode();

  const viewport=root.querySelector('[data-source-viewport]'),stage=root.querySelector('[data-source-stage]'),image=root.querySelector('[data-source-artifact-image]');
  const controls=[...root.querySelectorAll('[data-source-viewer-action]')];
  if(!image){controls.forEach(b=>b.disabled=true);return;}
  const state={scale:1,x:0,y:0,rotation:0,drag:false,startX:0,startY:0,pointers:new Map()};
  const clamp=()=>{const limX=viewport.clientWidth*.85,limY=viewport.clientHeight*.85;state.x=Math.max(-limX,Math.min(limX,state.x));state.y=Math.max(-limY,Math.min(limY,state.y));};
  const render=()=>{clamp();stage.style.transform=`translate3d(${state.x}px,${state.y}px,0) scale(${state.scale}) rotate(${state.rotation}deg)`;};
  const zoomAt=(factor,clientX=viewport.getBoundingClientRect().left+viewport.clientWidth/2,clientY=viewport.getBoundingClientRect().top+viewport.clientHeight/2)=>{
    const rect=viewport.getBoundingClientRect(),px=clientX-rect.left-viewport.clientWidth/2,py=clientY-rect.top-viewport.clientHeight/2,old=state.scale,next=Math.max(.6,Math.min(4,old*factor));
    if(next===old)return;state.x=px-(px-state.x)*(next/old);state.y=py-(py-state.y)*(next/old);state.scale=next;render();
  };
  controls.forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.sourceViewerAction;
    if(action==='zoom-in')zoomAt(1.2);if(action==='zoom-out')zoomAt(.8);
    if(action==='reset'){state.scale=1;state.x=0;state.y=0;state.rotation=0;render();}
    if(action==='rotate'){state.rotation=(state.rotation+90)%360;render();}
  }));
  viewport.addEventListener('wheel',event=>{event.preventDefault();zoomAt(event.deltaY<0?1.1:.9,event.clientX,event.clientY);},{passive:false});
  viewport.addEventListener('keydown',event=>{
    const step=event.shiftKey?100:30;
    if(event.key==='ArrowLeft')state.x+=step;else if(event.key==='ArrowRight')state.x-=step;else if(event.key==='ArrowUp')state.y+=step;else if(event.key==='ArrowDown')state.y-=step;
    else if(event.key==='+'||event.key==='=')zoomAt(1.2);else if(event.key==='-')zoomAt(.8);else if(event.key==='0'){state.scale=1;state.x=0;state.y=0;state.rotation=0;}else if(event.key.toLowerCase()==='r')state.rotation=(state.rotation+90)%360;else return;
    event.preventDefault();render();
  });
  const distance=()=>{const pts=[...state.pointers.values()];if(pts.length<2)return 0;return Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);};
  let pinch=0;
  viewport.addEventListener('pointerdown',event=>{if(event.target.closest('[data-source-field]'))return;state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});viewport.setPointerCapture(event.pointerId);if(state.pointers.size===1){state.drag=true;state.startX=event.clientX-state.x;state.startY=event.clientY-state.y;}else{state.drag=false;pinch=distance();}});
  viewport.addEventListener('pointermove',event=>{if(!state.pointers.has(event.pointerId))return;state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(state.pointers.size===2){const now=distance();if(pinch)zoomAt(now/pinch);pinch=now;return;}if(state.drag){state.x=event.clientX-state.startX;state.y=event.clientY-state.startY;render();}});
  const end=event=>{state.pointers.delete(event.pointerId);state.drag=false;pinch=distance();try{viewport.releasePointerCapture(event.pointerId);}catch{}};
  viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);render();
}
window.addEventListener('family-view-rendered',()=>requestAnimationFrame(init));
window.addEventListener('family-route-capabilities-ready',()=>requestAnimationFrame(init));
init();
