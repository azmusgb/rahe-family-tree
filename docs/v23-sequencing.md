# Five-train implementation sequence

The aggressive consolidation is executed as five release trains, not as a sequence of small independent feature PRs.

1. **v22.9 — Correctness**
   - detail-aware route identity
   - one transient mobile Back controller
   - canonical navigation metadata and contextual peers
   - same-route entity navigation regressions

2. **v22.10 — Speed**
   - Tree render/readiness coordinator
   - startup and interaction telemetry
   - traversal/layout caching where semantics are unchanged
   - progressive secondary enhancement
   - calibrated performance budgets

3. **v22.11 — Experience**
   - one Person controller
   - Home hierarchy consolidation
   - unified search
   - contextual navigation from the canonical model
   - evidence-aware Person/Tree entry points

4. **v22.12 — Consolidation**
   - CSS/domain ownership finalization
   - semantic selector migration
   - runtime ownership purge
   - specificity/important/selector/byte budgets

5. **v23.0 — Platform**
   - Research Command Center and evidence-native UI
   - accessibility certification
   - performance certification
   - adversarial mobile regression suite
   - exact-head production certification

Each train must finish with canonical genealogy/evidence/privacy gates intact, a production build, all four browser shards, aggregate validation, and an exact-head re-read before merge. Superseded ownership must be deleted in the same train that replaces it; no compatibility layer is allowed to accumulate behind the train.
