# Archive UX review — 15 September 2026

Baseline: main da50ce7369bf3711d647a2050c1fc1c87604a3c4.

## Assessment

The warm archive palette is a useful foundation. The largest problems are competing runtime and CSS owners, repeated sections, and controls that do not fully implement their advertised interaction. More styling layers would compound these problems.

Live desktop inspection covered Home, People, a historical person, Photos, and Research Queue. Source review covered shared navigation, mobile sheet, search, branch browsing, person media, responsive composition, focus, and reduced motion. Automated browser coverage has been added for the main family and research routes; it is not equivalent to a completed manual review of every state.

## Findings and changes

| Priority | Finding and evidence | Change |
| --- | --- | --- |
| P1 | Live Home description is dark on a dark hero. Historical `home.css` paragraph selector outranks the composition selector. | Correct selector specificity in the Home owner; readable inverse copy and distinct tree action. |
| P1 | Mobile More declares a modal dialog but leaves the background interactive. | Inert background branches while open; restore prior state, focus, Escape, and keyboard wrapping on close. |
| P2 | `/` focuses a hidden Home search input. | Reuse the visible global-search navigation action. |
| P2 | Search initialization failures are only logged; a rejected promise remains cached. | Visible failure/retry state and reset rejected load promise. |
| P2 | Shell branding changes back to a surname after navigation. Confirmed in live DOM. | Align competing writers with existing neutral archive branding. |
| P2 | All 21 Home branches precede discovery content. | Six initial branches with a native expandable remainder and direct Families link. Every branch remains available. |
| P2 | Person has both Family archive and Family media sections, with repeated empty states. | Mount the existing authenticated gallery inside the Photos section. Preserve API access checks and upload capabilities. |
| P2 | Empty media collection tells visitors to clear filters despite no available items. | Separate empty collection from zero search results; provide a relevant next action. |
| P2 | Branch card rules suppress focus outline; long identities are truncated. | Authoritative focus contract, wrapping identities, larger supporting text and branch controls. |

| P2 | Research intake precedes the entire queue; research header picks up legacy Media navigation. | Collapsible intake, shared shell composition, and stop the legacy nav injection. |

## Remaining product work

- Story and timeline cards expose pipe-delimited source excerpts. A future presentation change should use explicit structured event fields and retain qualifications, source links, and the full original excerpt. Do not shorten these mechanically: the text includes evidence qualifications.
- People has both route-level and directory-level framing. Simplify that hierarchy only alongside its route title, search, count, and screen-reader heading contracts.
- Research and graph workspaces need a dedicated hands-on review of populated, private, failed, and export states. Existing regression checks remain required; this change does not establish full accessibility conformance.
- Contrast PR #82 and CI PR #83 remain independent. The hero specificity fix is necessary even with darker shared foreground tokens.

## Validation

- Main regression suite: 275 passed.
- Additional shell, tree, research, graph and relationship domain checks: 58 passed.
- Production build and canonical gates: passed locally.
- New browser tests cover inverse hero colors, branch disclosure, keyboard search, stable branding, a single profile gallery, mobile modality, and route overflow.
- Local browser execution blocked: Chromium download timed out and connected Browser rejected localhost. GitHub browser validation must pass before release.
- No canonical genealogy files or evidence states changed. Authenticated media operations and production deployment have not been exercised in this review.
