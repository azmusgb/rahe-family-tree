# CSS Architecture

The application uses eight live stylesheet bundles plus a single composition root. This structure intentionally replaces the former release-era and one-off override file stack.

## Composition root

`src/styles/index.css` imports the live bundles in this order:

1. `tokens.css` — design tokens and shared variables.
2. `core.css` — base, shell, navigation, route/page, tree, research, branch, and archive-shell styles.
3. `composition.css` — cross-route composition/layout refinements.
4. `experience.css` — mobile experience, Family Graph, navigation/layout, and relationship-path presentation.
5. `home-responsive.css` — Home editorial layout and Home-specific responsive polish.
6. `interaction.css` — interaction/accessibility contracts and Family Explorer navigation.
7. `mobile.css` — current mobile application shell and route-specific mobile behavior.
8. `print.css` — authoritative print/export presentation rules.

## Ownership rules

- Add new rules to the bundle that owns the affected route or interaction.
- Do not create version-numbered CSS files such as `mobile-v22.css`.
- Do not add `*-fix.css`, `*-polish.css`, or compatibility override files for isolated corrections.
- Prefer changing the existing owning selector over adding a later selector solely to win the cascade.
- Keep responsive rules with the component they control unless they are genuinely cross-route; cross-route responsive safeguards belong in the appropriate consolidated bundle.
- Preserve keyboard focus, reduced-motion, safe-area, print, and privacy-state behavior when changing presentation.

## Source markers

The consolidated bundles retain `Source: <former-file>.css` section markers. These are migration-era traceability boundaries, not new stylesheet entrypoints. They allow regression tests and future cleanup to identify where a rule came from without restoring the old file topology.

When a section is substantially refactored, it may be renamed or merged within its owning bundle once the related regression tests no longer depend on the historical marker.
