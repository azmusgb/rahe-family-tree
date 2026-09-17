# Semantic CSS retirement contract

Version-prefixed classes are migration selectors, not the target component vocabulary.

Target semantic domains:

- .mobile-app-header
- .mobile-dock
- .mobile-discover
- .more-sheet
- .person-quick-actions
- .person-sections
- .tree-toolbar
- .tree-canvas
- .tree-focus
- .evidence-badge
- .research-command-center

Retirement sequence for each component: add semantic selector to existing markup, migrate CSS and tests to semantic selector, verify mobile/desktop restoration, remove version-prefixed selector, run unused-selector and duplicate-declaration gates. Do not introduce alias-only stylesheets or a final override layer.
