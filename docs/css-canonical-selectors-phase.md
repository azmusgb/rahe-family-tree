# Phase 4 — Canonical Selector Migration

Phase 4 retires historical version-numbered CSS class contracts and replaces them with stable semantic component names. This work is intentionally staged because many `.vXX-*` classes are still emitted or queried by runtime code and tests.

## Stage A — establish a trustworthy migration inventory

The first repository-wide CSS scan found 241 versioned classes and 2,062 CSS occurrences. The non-style reference count from the first report was later found to be unreliable because the original matcher used `\b`, which treats hyphens as boundaries and can count a longer class name as a reference to a shorter hyphen-delimited prefix.

The audit has now been corrected to require complete class-name boundaries that exclude CSS identifier characters, including hyphens and underscores. Generated output, build artifacts, dependencies, and the generated report itself are excluded from the source corpus.

A first dead-selector retirement experiment was also reverted after review showed that removing a selector arm containing a dead class could remove live selector arguments nested inside `:where(...)` / `:is(...)` groups. All production stylesheets were restored exactly to the verified Phase 3 `main` versions before continuing. No visual behavior change from that experiment is being carried forward.

Because the previous generated report was produced before both corrections, it has been removed rather than retained as misleading evidence. The persistent `scripts/css-versioned-selector-audit.mjs` script is the authoritative migration ledger and will regenerate a fresh report before any selector is retired in a later slice.

## Migration strategy

Live versioned classes require semantic migration in dependency-aware slices. For each class family:

1. introduce or confirm the stable semantic class;
2. update producers in HTML/runtime code;
3. update DOM queries and behavior hooks;
4. update tests;
5. migrate CSS selectors;
6. remove the versioned compatibility arm only when the semantic class is authoritative;
7. regenerate the exact-name inventory;
8. run exact-head regression, production-build, and browser validation.

Dead-selector cleanup follows the same standard: a class is removable only after the corrected exact-name audit shows no source producers/references, and selector parsing must preserve live arguments inside grouped selectors and functional pseudo-classes.

High-impact migration families include Home hero, person cards/profile surfaces, navigation, mobile More/search, tree context, media filters, and discovery components.

Phase 4 closes only when production CSS reaches zero `.vXX-*` classes without changing runtime, genealogy, evidence, privacy, routing, or browser behavior.
