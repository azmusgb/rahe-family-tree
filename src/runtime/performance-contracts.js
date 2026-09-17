// Lightweight production telemetry for route and Tree responsiveness.
// No genealogy data is collected; only durations and DOM-size counters are emitted.
const marks=new Map();
const now=()=>performance.now();
const route=()=>location.hash.slice(1).split('/')[0]||document.body.dataset.route||'dashboard';

function emit(name,detail={}){
  window.dispatchEvent(new CustomEvent('family-performance',{detail:{name,route:route(),at:now(),...detail}}));
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

function treeSnapshot(){
  if(route()!=='tree')return;
  const graph=document.querySelector('.graph-shell,.tree-graph-shell');
  if(!graph)return;
  const svg=graph.querySelector('svg');
  emit('tree:interactive',{
    nodes:graph.querySelectorAll('[data-person-id],.person-node,.tree-node').length,
    svgNodes:svg?.querySelectorAll('*').length||0
  });
  end('tree:navigation-to-interactive');
}

function routeStart(){
  begin('route:navigation-to-ready');
  if(route()==='tree')begin('tree:navigation-to-interactive');
}

window.addEventListener('hashchange',routeStart);
window.addEventListener('popstate',routeStart);
window.addEventListener('family-route-committed',()=>end('route:navigation-to-ready'));
window.addEventListener('family-view-rendered',treeSnapshot);
window.addEventListener('family-native-rendered',treeSnapshot);

document.readyState==='loading'
  ?document.addEventListener('DOMContentLoaded',()=>{routeStart();treeSnapshot();},{once:true})
  :(()=>{routeStart();treeSnapshot();})();

export {begin as beginPerformanceMeasure,end as endPerformanceMeasure};
