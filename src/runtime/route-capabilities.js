import{registerRouteCapability}from'./route-capability-loader.js';

// v20.2 first true route-level migrations. These modules are presentation-only
// and are intentionally absent from the startup presentation import set.
// Interaction-critical navigation, Tree, mobile shell/dock, and history remain eager.
registerRouteCapability({
  name:'stories-runtime',
  routes:['stories'],
  load:()=>import('./stories-runtime.js')
});

registerRouteCapability({
  name:'record-ingestion',
  routes:['research'],
  load:()=>import('./record-ingestion.js')
});
