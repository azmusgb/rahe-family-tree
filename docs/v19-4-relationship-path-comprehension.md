# v19.4 Relationship Path Comprehension

This tranche improves how an already-computed Family Graph relationship path is explained to the reader.

- Uses the existing canonical `findRelationshipPath` engine; no new genealogy inference.
- Adds a readable step-by-step path card using the engine's relationship labels and controlling evidence states.
- Distinguishes path start, intermediate, and end nodes.
- Styles overlay segments by controlling evidence state using existing evidence tokens.
- Keeps narration privacy-minimal: names and already-rendered relationships only; no dates, locations, addresses, or hidden living-person details.
- Adds responsive/mobile composition, reduced-motion handling, static semantic gates, and browser coverage.
