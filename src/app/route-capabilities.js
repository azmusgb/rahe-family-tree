import{registerRouteCapability}from'./route-capability-loader.js';

// v20.2 true route-level presentation migrations. These modules are intentionally
// absent from the startup presentation import set. Interaction-critical
// navigation, Tree, mobile shell/dock, and history remain eager.
registerRouteCapability({
  name:'stories-runtime',
  routes:['stories'],
  load:()=>import('../features/stories/runtime.js')
});

registerRouteCapability({
  name:'record-ingestion',
  routes:['research'],
  load:()=>import('../platform/ingestion/record-ingestion.js')
});

registerRouteCapability({
  name:'source-inspector',
  routes:['source'],
  load:()=>import('../features/research/source-inspector.js')
});

registerRouteCapability({
  name:'person-experience-v17-3',
  routes:['person'],
  load:()=>import('../features/person/experience.js')
});

registerRouteCapability({
  name:'mobile-home-polish',
  routes:['dashboard'],
  load:()=>import('../features/home/mobile-polish.js')
});

registerRouteCapability({
  name:'family-narrative',
  routes:['dashboard','people','person','media'],
  load:()=>import('../features/family/narrative.js')
});

registerRouteCapability({
  name:'experience-elevation-v17-4',
  routes:['dashboard','person','tree'],
  load:()=>import('../features/family/experience-elevation.js')
});

registerRouteCapability({
  name:'unified-family-experience',
  routes:['dashboard','tree'],
  load:()=>import('../features/family/unified-experience.js')
});
