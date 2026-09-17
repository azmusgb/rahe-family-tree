import { runScripts } from '../run-stage.mjs';

runScripts('family', [
  'scripts/enrich-v11-5.mjs',
  'scripts/enrich-v11-6.mjs',
  'scripts/enrich-v12-0.mjs',
  'scripts/enrich-v12-1.mjs',
  'scripts/enrich-v12-2.mjs',
  'scripts/enrich-v12-3.mjs',
  'scripts/enrich-v12-4.mjs',
  'scripts/enrich-v12-5.mjs',
  'scripts/enrich-v12-6.mjs',
  'scripts/enrich-v12-6-1.mjs',
  'scripts/enrich-v12-6-2.mjs',
  'scripts/enrich-v12-7.mjs',
  'scripts/enrich-v12-8.mjs',
]);
