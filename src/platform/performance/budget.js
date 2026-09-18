// Budget registry. Thresholds are null until deterministic CI baselines are
// collected; this prevents arbitrary limits from masquerading as engineering data.
export const PERFORMANCE_BUDGETS=Object.freeze({
  routeReadyMs:null,
  treeInteractiveMs:null,
  treeSvgNodes:null,
  longTaskMs:null
});

export function evaluatePerformanceBudget(metric,value){
  const limit=PERFORMANCE_BUDGETS[metric];
  return{metric,value,limit,calibrated:Number.isFinite(limit),pass:!Number.isFinite(limit)||value<=limit};
}
