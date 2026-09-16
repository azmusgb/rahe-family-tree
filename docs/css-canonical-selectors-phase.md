# Phase 4 — Canonical Selector Migration

Phase 4 retires historical version-numbered CSS class contracts and replaces them with stable semantic component names. This work is intentionally staged because many `.vXX-*` classes are still emitted or queried by runtime code and tests.

## Stage A — establish a trustworthy migration inventory

The first repository-wide CSS scan found 241 versioned classes and 2,062 CSS occurrences. The non-style reference count from the first report was later found to be unreliable because the original matcher used `\b`, which treats hyphens as boundaries and can count a longer class name as a reference to a shorter hyphen-delimited prefix.

The audit was corrected to require complete class-name boundaries that exclude CSS identifier characters, including hyphens and underscores. Generated output, build artifacts, dependencies, and the generated report itself are excluded from the source corpus.

A first dead-selector retirement experiment was reverted after review showed that removing a selector arm containing a dead class could remove live selector arguments nested inside `:where(...)` / `:is(...)` groups. All production stylesheets were restored exactly to the verified Phase 3 versions before continuing. No visual behavior change from that experiment was carried forward.

## Stage B — first live semantic migration: `nav-menu`

A fresh exact-name inventory from the merged Stage A baseline reported 241 versioned classes, 2,062 CSS occurrences, 730 non-style source references, and 10 CSS-only candidates. Stage B deliberately did not delete those CSS-only candidates; it instead migrated one live, tightly coupled compatibility contract whose semantic replacement already existed throughout the navigation shell.

`v151-nav-menu` was migrated to the stable `nav-menu` class across:

- static navigation markup;
- navigation-shell and page-architecture runtime producers/queries;
- the legacy v15.1 compatibility runtime;
- navigation-focused regression tests;
- `composition.css`, `core.css`, and `interaction.css` selectors.

The migration replaced 22 production/test/runtime/CSS references and removed the versioned class from the exact-name inventory. The regenerated inventory now reports 240 versioned classes, 2,053 CSS occurrences, and 717 non-style source references. The 10 CSS-only candidates remain quarantined for a later parser-safe retirement slice.

Before commit, the migration passed the navigation/CSS-sensitive regression set and the production build. Temporary migration workflow/helper files were removed afterward.

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

High-impact remaining migration families include Home hero, person cards/profile surfaces, mobile More/search, tree context, media filters, discovery components, and the remaining legacy navigation wrapper/popover aliases.

Phase 4 closes only when production CSS reaches zero `.vXX-*` classes without changing runtime, genealogy, evidence, privacy, routing, or browser behavior.
