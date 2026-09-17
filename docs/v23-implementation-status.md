# v22.9 → v23.0 implementation status

`v23-aggressive-platform-consolidation` is the integration line for five gated release trains.

## v22.9 — Correctness

Implemented:
- detail-aware transient mobile Back controller using normalized full-hash identity
- canonical navigation peer metadata in `navigation-model.js`
- same-route Person Back browser regression
- mobile adversarial route/navigation coverage

Remaining before train closure:
- remove the old route-key-only Back implementation from `mobile-ui-shell.js`
- prove Branch A → Branch B → Back returns Branch A
- keep one contextual navigation source and one Back owner

## v22.10 — Speed

Implemented:
- runtime route/Tree performance marks
- Tree timing contracts
- initial performance-budget registry
- deterministic baseline reducer
- Tree interactive telemetry browser regression

Remaining before train closure:
- split primary graph readiness from secondary enhancements
- align lineage rail and relationship finder on authoritative Tree readiness
- cache expensive traversal/layout work by semantic graph state where safe
- calibrate and enforce CI budgets from measured baselines

## v22.11 — Experience

Implemented/foundation:
- canonical contextual-peer metadata
- Home, Person and Search contracts
- Phase 7 contextual navigation consumes the canonical model

Remaining before train closure:
- consolidate Person section/navigation ownership into one controller
- implement the unified archive search contract
- finish Home hierarchy/duplicate-launch cleanup
- expose evidence-aware Person/Tree entry points without state promotion

## v22.12 — Consolidation

Implemented/foundation:
- CSS retirement plan and no-layering contract
- runtime retirement plan
- source-contract tests guarding ownership boundaries

Remaining before train closure:
- retire proven-obsolete versioned runtime/selectors
- finalize semantic CSS domain ownership
- enforce selector/specificity/`!important`/duplicate/byte budgets
- remove compatibility ownership in the same train that replaces it

## v23.0 — Platform

Implemented/foundation:
- research/evidence integration contract
- accessibility certification contract
- performance gate contract
- adversarial mobile Playwright suite
- production certification/definition-of-done contracts

Remaining before release:
- integrated Research Command Center/evidence-native surfaces
- full accessibility certification
- calibrated production performance certification
- exact-head production deployment certification

## Merge discipline

Every train must preserve canonical genealogy, evidence states, privacy rules and source data. Required gate: source contracts → production build → prepare success → browser shards 1/4 through 4/4 → aggregate validate → exact-head PR re-read → merge. No gate is weakened to advance a train.
