import{registerRouteCapability}from'./route-capability-loader.js';

// v20.2 true route-level presentation migrations. These modules are intentionally
// absent from the startup presentation import set. Interaction-critical
// navigation, Tree, mobile shell/dock, and history remain eager.
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

registerRouteCapability({
  name:'person-experience-v17-3',
  routes:['person'],
  load:()=>import('./person-experience-v17-3.js')
});

registerRouteCapability({
  name:'mobile-home-polish',
  routes:['dashboard'],
  load:()=>import('./mobile-home-polish.js')
});

registerRouteCapability({
  name:'family-narrative',
  routes:['dashboard','people','person','media'],
  load:()=>import('./family-narrative.js')
});
