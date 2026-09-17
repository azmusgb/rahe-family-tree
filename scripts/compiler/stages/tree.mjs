import { runScripts } from '../run-stage.mjs';

runScripts('tree', [
  'scripts/enrich-v12-9.mjs',
  'scripts/enrich-v12-9-1.mjs',
]);
