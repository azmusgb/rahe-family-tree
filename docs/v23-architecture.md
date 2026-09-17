# v23 durable architecture

## Runtime ownership

- navigation-model.js: route taxonomy, labels, owning sections, contextual peers, normalized detail identity.
- mobile-route-state.js: bounded transient mobile Back semantics during migration from routeKey-only shell history.
- tree-controller.js / tree engine: graph state and rendering.
- performance-contracts.js: metadata-only lifecycle telemetry.
- mobile-ui-transient.js: More modal interaction state.
- mobile UI composition: presentation only; it must not invent route taxonomy or graph state.

## Migration rule

A new durable owner may temporarily precede a legacy owner only when it blocks the legacy interaction deterministically and the legacy code is scheduled for removal in the same release train. Compatibility layers must not become permanent architecture.

## Tree lifecycle

Graph computation and primary canvas readiness are critical. Lineage rail, relationship finder, media and secondary annotations are enhancements and must not define primary Tree readiness.

## Versioned naming

Version-prefixed selectors remain supported only while required by existing markup/tests. New durable APIs use semantic/domain names. Retirement is performed with regression coverage rather than aliases.
