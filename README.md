# Rahe Family Research Workbench

Version 11 evolves the public research archive into an evidence-first genealogy workbench while keeping the controlling source unchanged: `Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx`.

## Architecture

The application deliberately separates the lossless archival layer from the interactive research model:

```text
controlling v10 DOCX
        ↓
public/corpus.json              canonical/public-safe transcription
        ↓
scripts/build-research-model.mjs
        ↓
public/research-model.json      normalized interactive model
public/semantic-audit.json      deterministic integrity checks
        ↓
v11.js / v11.css               research workbench UI
```

The normalized layer does **not** replace the dossier. It provides stable navigation across people, relationships, claims, sources, events, research tasks, negative searches, stop rules, and completeness gates.

## Evidence controls

- Evidence-state strings are carried forward rather than recalculated.
- Rejected relationships are excluded from the active graph.
- Edward Ellery DeVine/DeVeine and William John Rahe Sr. remain separate stable person/identity nodes.
- Their connection is an explicit `identity-bridge` whose state remains `UNRESOLVED / strongly corroborated hypothesis`.
- Timeline event types are marked as derived display classifications only; they do not promote evidence.
- Completeness gates are displayed as source-defined pass conditions and are intentionally **not automatically scored**.
- Part II remains a legacy evidence layer. Section 25 remains canonical v10 final certification.

## Workbench features

- Dashboard with research-state metrics, critical acquisitions, completeness controls, and semantic-audit status.
- Connected SVG family graph with zoom, fit, keyboard-openable nodes, source-state styling, and an accessible relationship index.
- Dedicated person dossier routes with facts, relatives, claims, source-dated timeline rows, sources, research tasks, canonical references, and legacy-annex mentions.
- Dedicated claim, source, and research-task routes.
- Global search across people, claims, sources, tasks, and canonical/legacy sections.
- URL-persisted branch and evidence-state filters for shareable research views.
- Structured Research Queue, branch acquisition sequences, stop rules, and negative-search log.
- Complete public-safe archive, JSON export, print support, research-model download, semantic-audit download, and redaction ledger.
- Responsive layout, keyboard focus handling, semantic landmarks, reduced-motion handling, and print styles.

## Public privacy

Living-person birth details remain withheld in the public corpus before the v11 model is generated. `public/redactions.json` stores source locations and reasons without republishing removed values. The unredacted DOCX is not committed or deployed.

## Development

Requirements: Node.js 20+ and Python 3.12+.

```bash
python3 scripts/extract.py /path/to/Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx
npm test
npm run build
npm run dev
```

The local site opens at `http://localhost:4173` and Netlify publishes `dist/`.

## Validation

`npm test` runs the legacy v10 coverage/identity/privacy checks, rebuilds the v11 research model, runs v11 semantic invariants, and syntax-checks the browser module. The GitHub workflow also executes a production build and commits generated public research artifacts when they change.

Key v11 gates include resolved relationship endpoints, rejected-edge exclusion, living-person date suppression, source-location-backed research tasks, canonical section-25 treatment, and preservation of the separate unresolved DeVine/Rahe identity bridge.

## Deployment

Repository: `azmusgb/rahe-family-tree`

Netlify project: `rahe-family-tree`

Site ID: `1b3ef6d9-2b3a-47c4-8bc4-c3185ce94a87`

Production: `https://rahe-family-tree.netlify.app`
