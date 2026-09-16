const normalizeRoutes=routes=>new Set((Array.isArray(routes)?routes:[routes]).filter(Boolean).map(String));

export function createRouteCapabilityLoader(){
  const registry=new Map();
  const loaded=new Map();
  const loading=new Map();

  function register({name,routes,load}){
    if(!name||typeof name!=='string')throw new TypeError('Route capability requires a string name');
    if(typeof load!=='function')throw new TypeError(`Route capability ${name} requires a load function`);
    const routeSet=normalizeRoutes(routes);
    if(routeSet.size===0)throw new TypeError(`Route capability ${name} requires at least one route`);
    const capability={name,routes:routeSet,load};
    const previous=registry.get(name);
    registry.set(name,capability);
    if(previous&&previous!==capability){
      loaded.delete(name);
      if(loading.get(name)?.capability===previous)loading.delete(name);
    }
    return()=>{
      if(registry.get(name)===capability)registry.delete(name);
      if(loaded.get(name)===capability)loaded.delete(name);
      if(loading.get(name)?.capability===capability)loading.delete(name);
    };
  }

  function matching(route){return[...registry.values()].filter(capability=>capability.routes.has(route));}

  function loadOnce(capability){
    if(loaded.get(capability.name)===capability)return Promise.resolve(capability.name);
    const active=loading.get(capability.name);
    if(active?.capability===capability)return active.promise;
    let pending;
    pending=Promise.resolve().then(()=>capability.load()).then(()=>{
      if(loading.get(capability.name)?.promise===pending)loading.delete(capability.name);
      if(registry.get(capability.name)!==capability)throw new Error(`Route capability ${capability.name} registration changed during load`);
      loaded.set(capability.name,capability);
      return capability.name;
    },error=>{
      if(loading.get(capability.name)?.promise===pending)loading.delete(capability.name);
      throw error;
    });
    loading.set(capability.name,{capability,promise:pending});
    return pending;
  }

  async function ensure(route,{sequence=0}={}){
    const capabilities=matching(route);
    const settled=await Promise.allSettled(capabilities.map(loadOnce));
    const failures=settled.flatMap((result,index)=>result.status==='rejected'?[{name:capabilities[index].name,error:result.reason}]:[]);
    return{route,sequence,status:failures.length?'failed':'ready',capabilities:capabilities.map(capability=>capability.name),failures};
  }

  function snapshot(route){return{registered:[...registry.keys()],loaded:[...loaded.keys()],loading:[...loading.keys()],matched:route?matching(route).map(capability=>capability.name):[]};}

  return{register,ensure,snapshot};
}

export const routeCapabilityLoader=createRouteCapabilityLoader();
export const registerRouteCapability=capability=>routeCapabilityLoader.register(capability);
export const ensureRouteCapabilities=(route,context)=>routeCapabilityLoader.ensure(route,context);
export const routeCapabilitySnapshot=route=>routeCapabilityLoader.snapshot(route);

if(typeof window!=='undefined'){
  let activeSequence=0;
  window.addEventListener('family-route-committed',event=>{
    const route=event.detail?.route||location.hash.slice(1).split('/')[0]||'dashboard';
    const sequence=Number(event.detail?.sequence||0);
    activeSequence=sequence;
    document.body.dataset.routeCapabilityState='loading';
    void ensureRouteCapabilities(route,{sequence}).then(result=>{
      if(sequence!==activeSequence)return;
      document.body.dataset.routeCapabilityState=result.status;
      window.dispatchEvent(new CustomEvent(result.status==='ready'?'family-route-capabilities-ready':'family-route-capabilities-failed',{detail:result}));
    });
  });
}
