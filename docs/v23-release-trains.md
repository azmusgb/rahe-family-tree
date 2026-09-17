# Five release trains: v22.9 → v23.0

This consolidation program is executed as five large, gated release trains rather than a long chain of micro-PRs. `v23-aggressive-platform-consolidation` is the integration line; each train must leave the repository in a releasable state and may not defer deletion of ownership it replaces.

## Train 1 — v22.9 Correctness

Scope:
- detail-aware route identity for Person, Branch and other detail routes
- bounded transient mobile Back state; no persisted transient navigation state
- one canonical navigation model for labels, peers, contextual destinations and route metadata
- remove the old route-key-only Back owner from the mobile shell
- same-route/different-entity navigation regressions
- rapid-navigation, deep-link, refresh and breakpoint restoration coverage

Exit criteria:
- Person A → Person B → Back returns Person A
- Branch A → Branch B → Back returns Branch A
- one Back owner and one contextual navigation source
- exact-head source tests and browser navigation regressions green

## Train 2 — v22.10 Speed

Scope:
- Tree navigation/data/first-paint/interactive/enhancement performance marks
- Tree render coordinator and explicit readiness lifecycle
- no mutation-driven application-state rendering
- one expensive graph calculation per meaningful root/scope/depth state
- traversal/layout caching where semantics are unchanged
- primary graph before lineage rail, relationship tools, portraits and secondary annotation
- performance baseline reducer and calibrated CI budgets

Exit criteria:
- measurable Tree startup contract exists
- lineage rail and relationship finder consume authoritative Tree readiness
- no broad subtree observer owns Tree application state
- performance budgets fail deterministically on material regression

## Train 3 — v22.11 Experience

Scope:
- one Person controller for section navigation, deep links, actions and mobile/desktop restoration
- Home reduced to hero → Tree → continuation → Discover
- unified search across people, alternate names, families, places, dates, sources, stories, claims and research work
- contextual navigation derived from the canonical navigation model
- evidence-aware Person/Tree entry points without promoting evidence state

Exit criteria:
- no duplicate Person navigation ownership
- no duplicate mobile contextual-destination table
- Search has keyboard, ranking, empty-state and deep-link contracts
- Home contains no competing duplicate launch surfaces

## Train 4 — v22.12 Consolidation

Scope:
- purge superseded versioned runtime ownership and selectors after replacements are proven
- semantic component naming for Person, Tree, navigation, More and evidence surfaces
- CSS ownership finalized as tokens/base/layout/components/navigation/tree/person/research/responsive/print
- specificity, `!important`, selector, duplicate declaration and stylesheet byte budgets
- remove compatibility layers instead of adding another final override sheet

Exit criteria:
- one owner per runtime/UI domain
- no known versioned compatibility arm retained without an explicit migration reason
- no new catch-all override stylesheet
- CSS/runtime retirement audits green

## Train 5 — v23.0 Platform

Scope:
- Research Command Center integration for unresolved, provisional, conflicting, rejected and missing-evidence work
- evidence-native Person and Tree surfaces using canonical controlling states
- accessibility certification across Home → Person → Tree → More → Search → Evidence
- production performance budgets across Home, People, Person, Tree, More, navigation and Search
- adversarial mobile testing: rapid taps, Back spam, modal churn, orientation/breakpoint changes, keyboard transitions, cold deep links and Tree Focus transitions
- exact-head production certification

Exit criteria:
- canonical genealogy/evidence/privacy gates green
- prepare + all four Playwright shards + aggregate validate green on the exact head
- accessibility/performance/adversarial contracts green
- zero known navigation races, duplicate modal owners, transient persistence or broad application-state mutation observers
- production build fingerprint matches the released GitHub SHA

## Release discipline

Every train follows the same gate: implementation → source contracts → production build → four Playwright shards → aggregate validation → exact-head PR re-read → merge. A later train may build on an earlier train only after that earlier state is green. No train may weaken genealogy, evidence, privacy or release gates to achieve green CI.
