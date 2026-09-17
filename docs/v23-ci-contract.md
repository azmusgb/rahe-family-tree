# v23 CI contract

Playwright discovery must include v23-navigation-performance.spec.mjs and v23-adversarial-mobile.spec.mjs in the existing four-shard browser run. Static v23 runtime tests must be added to the canonical source test command before release certification.

No new standalone workflow is required: the existing Validate change workflow remains the authoritative exact-head gate and already provides concurrency cancellation and four browser shards.
