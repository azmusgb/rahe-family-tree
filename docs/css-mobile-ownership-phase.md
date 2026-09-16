# Mobile CSS Ownership Reconciliation

This phase follows the hardened `core.css` forensic cleanup.

## Baseline

Across `experience.css`, `home-responsive.css`, `interaction.css`, and `mobile.css`, the first rule-level ownership audit measured:

- 905 parsed rule blocks
- 23 cross-file whole-selector overlaps
- 16 overlaps between `interaction.css` and `mobile.css`
- 7 overlaps between `experience.css` and `mobile.css`
- 0 direct overlaps involving `home-responsive.css`

## Reconciliation

The first pass moved visual mobile-shell rules duplicated between `interaction.css` and `mobile.css` into `mobile.css`, keeping `interaction.css` focused on hidden state, focus, disclosure, touch, and reduced-motion contracts. Existing mobile declarations remained later in the cascade and retained precedence.

The second pass resolved the remaining `experience.css` / `mobile.css` overlaps by domain:

- Mobile More sheet geometry is owned by `mobile.css`.
- Family Graph person-preview presentation is owned by `experience.css`.
- mobile Tree workspace and toolbar presentation are owned by `experience.css`.
- `home-responsive.css` remains the Home/dashboard responsive owner.

Review then exposed an audit blind spot: a selector appearing alone in one file and as one arm of a comma-separated selector list in another was not compared. The audit now splits selector lists on top-level commas while preserving commas inside functional pseudo-classes, attribute selectors, strings, and nested syntax.

That stricter selector-arm audit exposed 9 remaining ownership collisions. The final pass reconciled those arms without discarding unrelated arms from their original selector lists, including shell/header controls, Mobile More controls, safe-area behavior, generic mobile overflow behavior, and redundant reduced-motion arms.

## Result

The final generated audit reports:

- 1,026 parsed selector arms
- **0 cross-file selector overlaps** among the four mobile-related owners
- empty cross-file pair counts

The reconciliation passed the CSS-sensitive regression suite and a full production build after the selector-arm correction. The temporary migration helpers were retired; the persistent audit script and deterministic report remain available for CI enforcement.
