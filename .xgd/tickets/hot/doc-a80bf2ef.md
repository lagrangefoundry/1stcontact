---
uid: doc-a80bf2ef
id: DOC-27
type: doc
title: L1 Reproduction Vocabulary (living draft)
created_by: xgd
created_at: '2026-07-23T01:29:19.345635+00:00'
updated_at: '2026-07-23T01:29:19.345635+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  doc_kind: architecture
---

**Status: provisional.** Terms are still being refined in discussion. The
"Settled" section is stable enough to use in code/comments/commands; the "Open"
section is not yet locked. Update this ticket as terms firm up — do not treat it
as authoritative until the Open section is empty.

Related: [[DOC-23]] (L1 substrate), [[DOC-24]] (framework purpose), [[DOC-19]]
(reproduction runbook), [[DOC-2]] (security policy).

## Settled terms

### Sides
- **Target** — the original site being reproduced.
- **Local** — our 1c-framework reproduction of the target.

Every noun below comes in a `target` / `local` pair.

### The two renders (do not use "render" bare)
- **value-render** (verb) — spec/site + width → a **value set** (numbers:
  geometry + flat axes). On the target side this is `capture`; on the local side
  it is analytic evaluation (`evaluateLayout`). Both are value-renders.
- **pixel-render** (verb) — spec/site + width → the actual coloured dots (the
  browser's paint).
- **value set** (noun) — the output of a value-render. (Replaces the old term
  "rendered value set"; and the old test-jargon "oracle" = the *target* value set.)

### Capture
- **capture** (verb) — grab the target: "we capture the target."
- **capture** / **target capture** (noun) — the raw assets + html files picked up.
  (Narrower than the current `capture/` code module, which also extracts value
  sets; that extraction is a value-render, not part of the capture noun.)

### Fold
- **fold** (verb) — collapse a value set sampled across N widths into one keyframed
  document: one node per element with a per-width geometry track +
  `interpolate|snap` segments + a visibility rule.
- **folded values** / **Fold** (noun) — the folded document. Use "Fold" short only
  where unambiguous with the browser page-fold.
- Direction note: **target** goes value-set → fold (collapse widths → keyframes);
  **local** *starts* folded (the L1 doc) and *un*folds via evaluation to a value set.

### Property families (three families + one cross-cutting axis)
- **Structural** — the tree: containment / flow / which node is inside which.
- **Geometric** — box position & size (x, y, width, height). What `fold` keyframes
  and what l1-gate measures.
- **Flat** — leaf appearance scalars: font-family, colour, weight, background,
  `src`, fill.
- **Responsive behaviour** (cross-cutting axis) — how *any* of the above varies
  with width. Realized as keyframes + `interpolate|snap` + visibility rules. NOT a
  fourth sibling family; it modifies the other three (mostly geometric).

### The identities (value-space; no pixels)
- **Idempotence (engine self-consistency):** `value-render(X) ==
  value-render(value-render(X))`. Holds by design on L1's image — a value set is a
  valid engine input, so re-rendering it is identity. A property of the *engine*,
  not of fidelity.
- **Fold defines local:** `local := value-render(target)` (this is what `fold`
  does).
- **Fidelity is then a theorem:** `value-render(local) == value-render(target)`,
  by idempotence. Reproduction fidelity is *free once you fold* — the work is
  elsewhere.
- **Sufficient statistic (the pixel bridge):** `pixel-render = paint ∘
  value-render`. Value-set equality ⇒ pixel equality **iff** value-render captures
  everything that determines a pixel. Where it doesn't, pixels are `~~`, not `==`.
- **Design rule for L1 axes:** an axis belongs in L1 **iff it moves a pixel** (iff
  it is part of the sufficient statistic). No inert aesthetic dials; no pixel-mover
  left out.

### The three qualifiers (where the identities hold today)
The free-fidelity theorem holds only on:
1. **Expressible axes** — properties L1 has a typed axis/node for.
2. **Sampled widths** — the captured widths; between them geometry is a *model*.
3. **Captured content** — the exact captured text/media; structure recovery
   (`promoteToFlow`) is what extends this to changed content.

Plus a precondition: **idempotence must actually hold** (no serializer/pairing
bugs). All remaining framework work is pushing these qualifiers toward "all".

## Open / unsettled
- Best short noun for the value-render output — "value set" vs "computed value
  set" vs other.
- Whether "responsive behaviour" is the right label for the cross-cutting axis.
- A crisp name for the target value set now that "oracle" is retired ("target
  value set" is literal but long).
- **Handle vs substance:** the value set holds a *handle* (`fontFamily`, image
  `src`) while the pixel-determining *substance* (glyph outlines in a `.woff2`,
  image bytes) lives in a separate asset. Completeness of value-render turns on
  this pair — do we want a standing term for handle-vs-substance?
