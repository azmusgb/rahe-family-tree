# v23 implementation status

This branch is the active implementation line for the aggressive v23 platform consolidation.

## Implemented in this branch
- Detail-aware transient mobile Back controller using normalized full hash identity.
- Canonical navigation peer metadata in `navigation-model.js`.
- Runtime performance marks and route/Tree timing contracts.
- Initial performance budget definitions and baseline script.
- Mobile adversarial and navigation/performance Playwright coverage.
- v23 platform/runtime source-contract tests.
- Architecture, accessibility, CSS retirement, search, Person, Tree, research/evidence, CI, risk, sequencing, production, and definition-of-done contracts.

## Active consolidation work
- Remove the old route-key-only Back implementation from `mobile-ui-shell.js` so `mobile-route-state.js` is the sole Back owner.
- Replace Phase 7's hard-coded contextual destination table with `navigation-model.js` metadata.
- Fold remaining Person navigation ownership into one controller.
- Wire performance budgets into the release workflow after baseline data is collected.
- Retire historical versioned selectors only after runtime and browser coverage prove semantic replacements.

## Merge gate
No v23 slice merges until the exact PR head passes prepare, all four browser shards, aggregate validation, canonical genealogy/evidence/privacy gates, and the relevant new v23 contracts.
