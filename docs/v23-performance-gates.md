# Performance gate calibration

Collect repeated deterministic Chromium samples for route:navigation-to-ready and tree:navigation-to-interactive on the production build artifact. Record p50, p95 and max with scripts/performance-baseline.mjs.

Calibrate the initial CI threshold from the stable p95 plus a documented variance allowance. Store the resulting threshold in performance-budget.js. Tighten budgets only after optimization evidence; never relax them to make a failing release green without a documented baseline change.

Also monitor Tree SVG node count and long tasks so a faster timer cannot hide uncontrolled DOM growth or main-thread blocking.
