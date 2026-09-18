import { runScripts } from '../run-stage.mjs';
runScripts('evidence', [
'scripts/compiler/transforms/evidence/context-relationships.mjs','scripts/compiler/transforms/evidence/normalized-events.mjs','scripts/compiler/transforms/evidence/research-state-schema.mjs','scripts/compiler/transforms/evidence/review-packets.mjs']);
