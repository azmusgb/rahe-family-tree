// Lightweight production telemetry for route and Tree responsiveness.
// No genealogy data is collected; only durations and DOM-size counters are emitted.
const marks=new Map();
const now=()=>performance.now();
const route=()=>location.hash.slice(1).split('/')[0]||document.body.dataset.route||'dashboard';
let pendingRoute='';

function emit(name,detail={}){
  window.dispatchEvent(new CustomEvent('family-performance',{detail:{name,route:detail.route||route(),at:now(),...detail}}));
}

function begin(name){marks.set(name,now());}
function end(name,detail={}){
  const start=marks.get(name);
  if(start==null)return;
  marks.delete(name);
  const duration=Math.max(0,now()-start);
  emit(name,{duration,...detail});
  return duration;
}

function startForRoute(target=route()){
  pendingRoute=target;
  begin('route:navigation-to-ready');
  if(target==='tree')begin('tree:navigation-to-interactive');
  else marks.delete('tree:navigation-to-interactive');
}

function treeSnapshot(){
  if(route()!=='tree')return;
  const graph=document.querySelector('.graph-shell,.tree-graph-shell');
  if(!graph)return;
  const svg=graph.querySelector('svg');
  emit('tree:interactive',{
    route:'tree',
    nodes:graph.querySelectorAll('[data-person-id],.person-node,.tree-node').length,
    svgNodes:svg?.querySelectorAll('*').length||0
  });
  end('tree:navigation-to-interactive',{route:'tree'});
}

// family-route-intent is emitted from the capture-phase navigation controller,
// before deferred hash mutation and before route rendering begins. This is the
// authoritative start for user-initiated in-app navigation.
window.addEventListener('family-route-intent',event=>startForRoute(event.detail?.route||route()));

// Programmatic/hash/history transitions may not have an intent event. Start a
// fallback measure at commit only when no matching navigation is already open.
window.addEventListener('family-route-committed',event=>{
  const target=event.detail?.route||route();
  if(!marks.has('route:navigation-to-ready')||pendingRoute!==target)startForRoute(target);
});

// Navigation runtime emits content-ready only after the committed route has
// rendered. Keep the target route attached to the duration so later navigation
// cannot misattribute the measurement.
window.addEventListener('family-route-content-ready',event=>{
  const target=event.detail?.route||pendingRoute||route();
  end('route:navigation-to-ready',{route:target});
  pendingRoute='';
});
window.addEventListener('family-view-rendered',treeSnapshot);
window.addEventListener('family-native-rendered',treeSnapshot);

const start=()=>{startForRoute(route());treeSnapshot();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();

export {begin as beginPerformanceMeasure,end as endPerformanceMeasure};
