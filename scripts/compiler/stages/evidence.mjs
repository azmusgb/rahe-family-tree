import { runScripts } from '../run-stage.mjs';

runScripts('evidence', [
  'scripts/enrich-v11-1.mjs',
  'scripts/enrich-v11-2.mjs',
  'scripts/enrich-v11-3.mjs',
  'scripts/enrich-v11-4.mjs',
]);
