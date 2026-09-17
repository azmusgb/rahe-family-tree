import { runWithFallback } from '../run-stage.mjs';

runWithFallback('platform', 'scripts/enrich-v13-platform.mjs', 'scripts/reconcile-v13-platform.mjs');
