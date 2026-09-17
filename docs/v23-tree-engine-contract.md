# Tree Engine 2.0 boundary

Target pipeline:

Canonical Graph -> Traversal -> Layout Model -> View Model -> Renderer

The presentation layer must not perform genealogy inference. Traversal output uses stable node/edge identity and deterministic generation/couple grouping. Root, scope and depth are explicit graph inputs. Unchanged traversal/layout results should be reusable. Primary canvas rendering precedes lineage rail, relationship finder, media and secondary annotations.

Scalability work should prefer viewport/progressive rendering over rendering the complete family universe. Center, Reset and Focus must operate against explicit graph state rather than DOM reconstruction side effects.
