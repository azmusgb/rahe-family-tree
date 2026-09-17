# v23 production certification

Required before release:

- exact-head canonical/evidence/privacy regression suite green
- production build green
- browser shards 1/4, 2/4, 3/4, 4/4 green
- aggregate validate green
- no unresolved review threads
- PR head re-read after validation and still identical to tested SHA
- mergeability re-read immediately before merge
- exact-head protected squash merge
- resulting main SHA captured
- production deployment verified against that SHA
- mobile and desktop critical journeys smoke-tested
- performance budgets calibrated from deterministic baseline and green
- accessibility certification complete

No failed data-integrity, privacy, security, accessibility, or performance gate may be silently waived.
