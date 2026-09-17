# v23 aggressive platform consolidation

## Objective

Finish Mobile Shell v22 as durable platform architecture rather than layering another versioned shell. Preserve canonical genealogy, evidence states, privacy, source identity, and desktop restoration while removing interaction and performance debt.

## Release trains

1. Correctness: detail-aware route identity, deterministic bounded Back, canonical navigation metadata, adversarial navigation tests.
2. Speed: Tree lifecycle instrumentation, one authoritative render lifecycle, primary-canvas-first readiness, deferred secondary enhancement, performance budgets.
3. Experience: consolidate Person navigation, Home hierarchy, archive-wide search, contextual navigation.
4. Consolidation: retire versioned compatibility ownership, semantic component names, CSS domain ownership and budgets.
5. Certification: evidence-native exploration, research integration, accessibility, performance and adversarial production gates.

## Non-negotiable contracts

- No blind history.back() for mobile application Back.
- No persistence of transient route, modal, focus, or search state.
- Person/branch detail identity must survive same-route transitions.
- No document-wide MutationObserver for application state.
- Navigation relationships are declared in navigation-model.js, not copied into shell controllers.
- Tree primary canvas must become usable before noncritical enhancements are required.
- Performance telemetry contains timing/counter metadata only; no genealogy payload.
- Mobile changes restore cleanly above the phone breakpoint.
- No genealogy/evidence/privacy/source-state promotion as part of UX work.
- Exact-head prepare + four browser shards + aggregate validate are required before merge.

## Performance lifecycle

navigation -> route committed -> graph ready -> primary canvas interactive -> secondary enhancements ready

The initial instrumentation emits family-performance events for route readiness and Tree interactive readiness. CI budgets are introduced only after baseline measurements are collected from deterministic browser runs; budgets must not be guessed.

## Completion definition

v23 is complete when navigation has one durable model, Tree has one measurable render lifecycle, Person has one section controller per viewport, contextual More derives from the navigation model, versioned compatibility ownership is retired where no longer required, accessibility and performance contracts are automated, all canonical/privacy gates remain green, and production is certified from the exact merged SHA.
