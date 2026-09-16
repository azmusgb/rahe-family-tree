# Phase 4 — Canonical Selector Migration

Phase 4 retires historical version-numbered CSS class contracts and replaces them with stable semantic component names. This work is intentionally staged because many `.vXX-*` classes are still emitted or queried by runtime code and tests.

## Stage A — establish a trustworthy migration inventory

The first repository-wide CSS scan found 241 versioned classes and 2,062 CSS occurrences. The non-style reference count from the first report was later found to be unreliable because the original matcher used `\b`, which treats hyphens as boundaries and can count a longer class name as a reference to a shorter hyphen-delimited prefix.

The audit was corrected to require complete class-name boundaries that exclude CSS identifier characters, including hyphens and underscores. Generated output, build artifacts, dependencies, and the generated report itself are excluded from the source corpus.

A first dead-selector retirement experiment was reverted after review showed that removing a selector arm containing a dead class could remove live selector arguments nested inside `:where(...)` / `:is(...)` groups. All production stylesheets were restored exactly to the verified Phase 3 versions before continuing. No visual behavior change from that experiment was carried forward.

## Stage B — first live semantic migration: `nav-menu`

A fresh exact-name inventory from the merged Stage A baseline reported 241 versioned classes, 2,062 CSS occurrences, 730 non-style source references, and 10 CSS-only candidates. Stage B deliberately did not delete those CSS-only candidates; it instead migrated one live, tightly coupled compatibility contract whose semantic replacement already existed throughout the navigation shell.

`v151-nav-menu` was migrated to the stable `nav-menu` class across static navigation markup, navigation-shell/page-architecture runtime producers and queries, the legacy v15.1 compatibility runtime, navigation-focused regression tests, and `composition.css`, `core.css`, and `interaction.css` selectors.

The migration removed the versioned class from the exact-name inventory. The regenerated inventory reported 240 versioned classes, 2,053 CSS occurrences, and 717 non-style source references. The 10 CSS-only candidates remain quarantined for a later parser-safe retirement slice.

## Stage C — primary navigation semantic migration

`v151-primary-nav` was migrated to the stable `primary-nav` contract across static navigation markup, `navigation-shell.js` producers/queries/class synchronization, the legacy v15.1 runtime, navigation regression coverage, and `core.css` / `interaction.css`.

The exact-name post-migration inventory reported 239 versioned classes, 2,039 CSS occurrences, and 709 non-style source references. `v151-primary-nav` is absent from the inventory. The migration passed the targeted navigation/CSS-sensitive regression set and the production build before commit. Temporary migration workflow/helper files were removed afterward.

## Stage D — navigation wrappers and popovers

The remaining v15.1 navigation-shell wrapper aliases were retired:

- `v151-nav-menus` → `nav-menus`
- `v151-nav-popover` → `nav-popover`

The migration used exact identifier boundaries across HTML, runtime code, tests, and CSS so longer versioned names were not accidentally rewritten. Semantic duplicates created by replacing paired compatibility aliases were collapsed locally.

The post-migration inventory reported 237 versioned classes, 2,033 CSS occurrences, and 696 non-style source references. Both v15.1 wrapper aliases are absent from the exact-name inventory. The targeted navigation/CSS-sensitive regression set and production build passed before commit. Temporary one-shot migration infrastructure was removed afterward.

## Stage E — mobile More and mobile search

The primary mobile navigation/search compatibility classes have now been migrated to stable semantic contracts:

- `v158-mobile-more` → `mobile-more`
- `v21-mobile-search` → `mobile-search`

The migration used the same exact-name boundary rules across markup, runtime producers/queries, mobile/browser regression tests, and all owning CSS bundles. Existing `data-v21-*` behavior attributes were intentionally preserved because this stage retires CSS class contracts, not runtime data contracts.

The post-migration inventory reports 235 versioned classes, 1,981 CSS occurrences, and 671 non-style source references. Both migrated class names are absent from the exact-name inventory. Targeted mobile/navigation/CSS-sensitive regressions and the production build passed before commit. Temporary one-shot migration infrastructure was removed afterward.

## Stage F — tree context

The tree-context compatibility class has now been migrated to its stable semantic contract:

- `v174-tree-context` → `tree-context`

The migration used exact class-name boundaries across runtime producers/queries, tree/navigation tests, and all owning CSS bundles. Semantic duplicates created by replacing compatibility aliases were collapsed locally.

The post-migration inventory reports 234 versioned classes, 1,971 CSS occurrences, and 660 non-style source references. `v174-tree-context` is absent from the exact-name inventory. Targeted tree/navigation/CSS-sensitive regressions and the production build passed before commit. Temporary one-shot migration infrastructure was removed afterward.

## Stage G — media filters

The media-filter compatibility class has now been migrated to its stable semantic contract:

- `v161-media-filters` → `media-filters`

The migration used exact class-name boundaries across media runtime producers/queries, media-focused tests, and all owning CSS bundles. Semantic duplicates created by replacing compatibility aliases were collapsed locally.

The post-migration inventory reports 233 versioned classes, 1,954 CSS occurrences, and 651 non-style source references. `v161-media-filters` is absent from the exact-name inventory. Targeted media/CSS-sensitive regressions and the production build passed before commit. Temporary one-shot migration infrastructure was removed afterward.

## Stage H — relationship dialog

The relationship-dialog compatibility class has now been migrated to its stable semantic contract:

- `v161-relationship-dialog` → `relationship-dialog`

The migration used exact class-name boundaries across platform/runtime producers and queries, mobile relationship-density behavior, platform regression coverage, and the owning `core.css` selectors. Semantic duplicates created by compatibility replacement were collapsed locally.

The post-migration inventory reports 232 versioned classes, 1,952 CSS occurrences, and 643 non-style source references. `v161-relationship-dialog` is absent from the exact-name inventory. Targeted relationship/media/CSS-sensitive regressions and the production build passed before commit. Temporary one-shot migration infrastructure was removed afterward.

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

High-impact remaining migration families now include person cards/profile surfaces, discovery components, and Home hero.

Phase 4 closes only when production CSS reaches zero `.vXX-*` classes without changing runtime, genealogy, evidence, privacy, routing, or browser behavior.
