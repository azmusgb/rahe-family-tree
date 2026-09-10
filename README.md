# Rahe Family Research Archive

Public, responsive research application generated from **Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx** (research state 10 September 2026).

## What this build provides

The site is no longer only a document browser. It now exposes a structured research model while preserving the source dossier as the controlling authority:

- **233 source sections**, **386 tables**, **70 Appendix F person/identity entries**, and **9 Part II legacy annexes**.
- Stable public IDs for people and structured IDs for relationships, claims, sources, timeline entries, and redactions.
- A connected, zoomable family research graph with supported/provisional/unresolved styling.
- Edward Ellery DeVine/DeVeine and William John Rahe Sr. remain **separate nodes** connected by an explicit **UNRESOLVED / strongly corroborated hypothesis** identity bridge.
- Rejected claims do not create active graph edges.
- Person dossiers include source locations, connected relatives/identity links, related claim-register items, and dossier references.
- Claim cards link evidence basis, source IDs, current state, and next action.
- Source detail views expose canonical IDs, class/type, weight/control, legacy IDs, and claim links.
- Timeline uses dated **source rows**, rather than treating a person's first year as an inferred event.
- Global search returns categorized people/claim/source results plus matching source excerpts with highlighting and deep links.
- Branch and evidence-state filters are URL-persisted for shareable filtered views.
- Research Queue is promoted into a usable priority-card workflow while preserving the full source tables.
- Export, print, public corpus download, coverage manifest, and redaction ledger are included.

## Fidelity and evidence controls

The source DOCX is not modified. Evidence states are transcribed from the dossier; the application does not recalculate or silently promote them.

The v10 **final certification (section 25)** is canonical/control content. The earlier build incorrectly inherited the Part II legacy flag into that final section; the upgrade step explicitly closes the legacy boundary before section 25.

Part II remains archival evidence. Its content is searchable and readable, but legacy material does not supersede the canonical/current interpretation controls.

## Public privacy

The public corpus intentionally withholds living-person birth details. The privacy pass recognizes both canonical full names and shortened legacy variants, including separate name/date columns in legacy tables.

`public/redactions.json` records every redaction **by source location and reason only**. It never republishes the removed value. The unredacted DOCX is never committed or deployed.

## Development

Requirements: Node.js 20+ and Python 3.12+.

```bash
python3 scripts/extract.py /path/to/Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx
npm test
npm run build
npm run dev
```

`npm test` and `npm run build` first run `scripts/upgrade-corpus.mjs`, so an older v10 public corpus is upgraded deterministically before validation or deployment.

Local site: `http://localhost:4173`

Netlify publishes `dist/`.

## Validation gates

Automated checks verify source section/table/person/annex counts, Appendix A–G presence, the corrected Part II/final-certification boundary, separate Edward/William identities, unresolved bridge state, structured relationship/claim/source/event data, rejected-edge exclusion, living-person public redaction, and the controlling source checksum.

Controlling source SHA-256:

`f5af06930f4753c46f77ec0edf52e97519a7a68e94682963b2858878b870a6e4`

## Deployment

Existing Netlify project: `rahe-family-tree`

Existing Netlify site ID: `1b3ef6d9-2b3a-47c4-8bc4-c3185ce94a87`

Production URL: `https://rahe-family-tree.netlify.app`
