# v23 migration risk register

- Dual Back ownership during migration: mitigate by capture-phase v23 owner, regression test, then delete legacy trail in same release train.
- Performance instrumentation skew: collect multiple deterministic CI samples; do not set budgets from one run.
- Tree secondary readiness coupled to primary canvas: split lifecycle before optimizing.
- Semantic class migration causing visual drift: migrate one component at a time with desktop/mobile screenshots and browser contracts.
- Person navigation deep-link regression: preserve anchors and test direct cold loads.
- Search replacement losing People parity: keep existing People path until unified index passes parity tests.
- Evidence-state presentation accidentally promoting claims: canonical integrity/evidence gates remain mandatory.
