# Rahe Family Tree

Public-safe family history and genealogy research platform for the Rahe / DeVine / Ferry / Racky / Berg / Kinsman branches.

The application currently ships a **v13.0 canonical research model** under the newer **v15.4 family experience**. The controlling genealogy source remains:

`Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx`

The unredacted DOCX is intentionally **not** committed or deployed.

## Architecture

The repository separates the controlling archival source, canonical/public-safe data, normalized research model, presentation layers, and user-contributed overlays:

```text
controlling v10 DOCX
        ↓
scripts/upgrade-corpus.mjs
        ↓
public/corpus.json                    canonical/public-safe transcription
        ↓
scripts/canonical-integrity.mjs      deterministic completeness + integrity gate
        ↓
public/canonical-completeness.json    machine-readable canonical audit
        ↓
scripts/build-research-model.mjs
        ↓
public/research-model.json            normalized interactive research model
public/semantic-audit.json            deterministic semantic checks
        ↓
v13 research capabilities + v15.4 family experience
        ↓
family/editor/media overlays          non-canonical; review/privacy constrained
```

The interactive model does **not** replace the controlling dossier. Canonical genealogy remains source-derived and evidence-state aware.

## Canonical evidence controls

The build and regression suite enforce the following invariants:

- Controlling evidence states remain distinct: `SUPPORTED`, `PROVISIONAL`, `UNRESOLVED`, and `REJECTED`.
- Strength qualifiers are stored separately from controlling evidence state.
- Rejected relationships cannot become active pedigree edges.
- Edward Ellery DeVine/DeVeine and William John Rahe Sr. remain separate identity nodes.
- Their identity connection remains explicitly unresolved; the application does not infer adoption, legal name change, guardianship, or stepfather mechanism without direct evidence.
- Same-name people are resolved deterministically rather than by nearest/fuzzy name matching.
- Derivative spouse leads and contextual associates cannot silently become supported pedigree relationships.
- Living-person birth details are withheld from public payloads.
- User edits, research intelligence, media metadata, and presentation features cannot promote or mutate canonical evidence state.

## Canonical completeness

`npm test` and `npm run build` regenerate and validate the canonical model before the site is considered releasable.

Current deterministic gate coverage includes:

- complete Appendix F person inventory
- relationship integrity and cycle guards
- complete claim register linkage
- complete source registry / source-ID crosswalk
- conflicts, rejections, and quarantines
- negative-search controls
- research/acquisition queue
- Appendix A-G presence
- Part II / legacy annex preservation
- living-person privacy controls
- unresolved identity-bridge safeguards

The generated `canonical-completeness.json` is included in production builds and must report `pass: true` with an empty `failed` array.

## Product capabilities

The current application includes:

- family-first dashboard and navigation
- evidence-aware interactive family tree
- connected-component and ancestor/descendant traversal
- spouse/couple grouping and generation lanes
- person profiles with immediate-family context
- source, claim, evidence, and archive views
- research command center and acquisition queue
- timeline and geography/migration views
- global search and branch/evidence filters
- media library, featured portraits, multi-person tagging, and galleries
- responsive/mobile tree navigation
- print/export support
- relationship and genealogy audit tooling
- advisory research intelligence that remains non-canonical until explicit review/promotion

## Privacy and media security

Living-person and unresolved/private media are protected server-side. Production release smoke tests verify that:

- anonymous media enumeration exposes only public media
- living-person uploads requested as public are forced private
- private direct media access is rejected anonymously
- authenticated access follows role permissions
- media operations do not change `corpus.json`, `research-model.json`, or `semantic-audit.json`

`public/redactions.json` records public-redaction locations and reasons without republishing removed values.

## Development

Requirements: **Node.js 24** and **Python 3.12+** when re-extracting the controlling DOCX.

```bash
python3 scripts/extract.py /path/to/Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx
npm install
npm test
npm run build
npm run dev
```

`npm run dev` uses Netlify Dev. The site is published from `dist/` and serverless functions live under `netlify/functions/`.

## Validation and CI/CD

Pull requests run:

1. dependency installation
2. canonical + experience regression suite
3. production build
4. Chromium installation
5. browser interaction smoke tests

Main-branch canonical audit runs the same canonical/build validation and verifies generated tracked artifacts remain deterministic; it does not create an extra post-release bot commit.

Production deployment is serialized and gated. The deployment workflow:

1. validates the canonical model/application
2. builds an exact Git SHA fingerprint
3. provisions a temporary smoke credential
4. deploys and verifies the candidate production fingerprint
5. performs authenticated/anonymous privacy and genealogy-immutability smoke tests
6. removes the temporary credential even on failure
7. performs the final credential-clean redeploy only after all prior release gates succeed
8. verifies `/build-info.json`, `canonical-completeness.json`, and anonymous private-media exclusion

## Deployment

- Repository: `azmusgb/rahe-family-tree`
- Netlify project: `rahe-family-tree`
- Site ID: `1b3ef6d9-2b3a-47c4-8bc4-c3185ce94a87`
- Production: `https://rahe-family-tree.netlify.app`

A production release is considered valid only when the deployed `/build-info.json` Git SHA matches the intended GitHub commit and the canonical/privacy gates pass.
