# Phase 4 — Canonical Selector Migration

Phase 4 retires historical version-numbered CSS class contracts and replaces them with stable semantic component names. This work is intentionally staged because many `.vXX-*` classes are still emitted or queried by runtime code and tests.

## Inventory baseline

The first repository-wide inventory found:

- 241 versioned classes in production styles;
- 2,062 CSS occurrences;
- 1,074 non-style source references;
- 9 classes with no non-style source references.

The audit excludes generated output, build artifacts, dependencies, and the generated inventory report itself so the report cannot make dead selectors appear live.

## Stage A — retire provably CSS-only selector arms

The first cleanup pass removed selector arms containing the audited CSS-only classes:

- `v17-family-summary`
- `v17-home-branches`
- `v17-home-places`
- `v17-home-research`
- `v17-home-section`
- `v17-home-stat`
- `v17-home-stories`
- `v17-research-hero`
- `v17-section-heading`

Selectors were removed at selector-arm granularity, including within nested at-rules. Other arms in grouped selectors were preserved. A selector arm containing one of these absent classes can never match, even if that arm also contains another live class.

After this pass the inventory reports:

- 231 versioned classes in production styles;
- 2,037 CSS occurrences;
- 1,072 non-style source references;
- 0 CSS-only versioned classes.

CSS-sensitive regression tests and the production build passed before the transformation was committed.

## Remaining migration strategy

The remaining 231 classes are not deletion candidates: they are referenced by runtime, markup, tests, or other source assets. They require semantic migration in dependency-aware slices. For each class family:

1. introduce or confirm the stable semantic class;
2. update producers in HTML/runtime code;
3. update DOM queries and behavior hooks;
4. update tests;
5. migrate CSS selectors;
6. remove the versioned compatibility arm;
7. run exact-head regression and browser validation.

High-impact families include Home hero, person cards/profile surfaces, navigation, mobile More/search, tree context, media filters, and discovery components.

The persistent `scripts/css-versioned-selector-audit.mjs` report is retained as the migration ledger. Phase 4 closes only when the production CSS inventory reaches zero `.vXX-*` classes without breaking runtime or browser behavior.
