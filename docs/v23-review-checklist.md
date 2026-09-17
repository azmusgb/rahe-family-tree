# v23 review checklist

For every implementation PR: identify the durable owner; identify and delete superseded ownership; verify no transient storage; verify canonical/evidence/privacy semantics unchanged; verify desktop restoration; verify keyboard/focus behavior; verify Tree work is lifecycle/event driven rather than mutation driven; verify navigation metadata comes from navigation-model.js; run exact-head canonical and four-shard browser gates.
