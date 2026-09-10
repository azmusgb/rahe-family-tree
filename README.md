# Rahe family research archive

Responsive, accessible public research edition of the controlling v10 dossier, dated 10 September 2026. Replaces the original preview with ten research sections, global corpus search, branch and evidence filters, person dialogs, direct-line pathway, relationship context, timeline, complete dossier tables, source-ID links, JSON exports, and printing.

## Source coverage

- 233 sections, 386 tables, 70 Appendix F person/identity entries, nine legacy source annexes.
- Part I, Appendices A–G, and Part II retained in source order. Legacy headings retain the source filename and an explicit precedence warning.
- Source SHA-256: `f5af06930f4753c46f77ec0edf52e97519a7a68e94682963b2858878b870a6e4`.
- The source document contains no embedded media. Paragraph and table text is extracted directly from OOXML; document apparatus is retained separately.
- The source's evidence-state strings are transcribed, not recalculated. Mixed identity/parentage states remain mixed. Edward Ellery DeVine/DeVeine and William John Rahe Sr. remain distinct.

## Public privacy policy

Seven living-person/descendant entries retain family names and relationships, with birth details withheld. Their known full birth dates and descendant birth range are redacted in the corpus before publishing, including legacy text. Marked redactions are intentional exceptions to textual losslessness. No unredacted DOCX is committed or deployed. The source stays read-only in the project references. The app does not provide an insecure client-side privacy toggle.

## Development

No runtime dependencies or external services are required.

```
npm test
npm run build
npm run dev
```

The server opens at http://localhost:4173. Netlify publishes only `dist/`.

To regenerate from the controlling source (outside the repository):

```
python3 scripts/extract.py /path/to/Rahe_Family_Tree_Canonical_Single_Source_v10_FULL_LOSSLESS_2026-09-10.docx
npm test
npm run build
```

`public/coverage.json` records provenance and coverage. The full public text is in `public/corpus.json`. The timeline orders dated person leads and links to the full identity/marriage chronology; it does not infer verified events. Direct-line generations follow section 3; relationship contexts follow section 21. Other collateral roles remain verbatim in Appendix F instead of inventing graph edges.

## Validation

- Four automated coverage, identity/state, legacy precedence, and public privacy checks.
- Source-to-output table structure comparison: all 386 tables and every row/cell preserved in order.
- Browser checks of ten sections, global search, empty results, branch filter, person dialog, and Escape dismissal.
- Desktop and 390px mobile inspection; no page overflow at the inspected mobile view.

## Deployment

Existing Netlify site: rahe-family-tree.netlify.app. Existing site ID: `1b3ef6d9-2b3a-47c4-8bc4-c3185ce94a87`. Build with `npm run build`; deploy with `npx netlify-cli deploy --prod --dir=dist --no-build` after tests. No credentials belong in the repository.
