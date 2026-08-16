---
uid: acceptance_criterion-5ab42ca8
id: AC-931
type: acceptance_criterion
title: References resolve once at the load boundary, so authoring form is invisible
  downstream
created_by: xgd
created_at: '2026-08-06T20:37:50.582708+00:00'
updated_at: '2026-08-16T22:15:01.526175+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Colour references are resolved to their literals in a single pass when a site is
loaded, before any consumer sees it. That pass applies **both** reference axes — the
shade mix and the alpha byte — so **no reference of any form survives resolution**:
a resolved document carries hex literals only, whatever mix of shaded, translucent
and plain references it was authored with. Everything downstream — the renderer, the
analytic evaluator, the round-trip gate, values-diff — therefore reads exactly the
document it would have read had the colours been authored as literals.

The observable consequences:

- A document authored with references renders **byte-identically** to the same
  document authored with the literals those references resolve to. A reference
  carrying no shade resolves to its entry's own hex verbatim — not a round trip
  through the colour maths that happens to come back — so converting such a literal
  to a reference moves no pixel by construction.
- A literal-only document is entirely unaffected by the widening: it needs no
  palette, validates and renders exactly as before.
- The on-disk definition keeps its references — resolution is a read-time overlay,
  not a rewrite — so a palette entry stays the single place a colour is changed, and
  changing it moves every shade of it too.

**The precondition this places on the render entry point.** Resolution happens
once, at the boundary — which means the palette is an *input* to rendering, not
something the renderer can recover. A caller entering below the load boundary and
handing the renderer a document directly must supply that document's palette
alongside it. Rendering a document that carries a reference without its palette
**throws**, and does so by the same rule that makes a dangling reference a
validation failure: there is no render-time fallback and no silent default, so a
missing palette surfaces as a loud, located failure rather than a page painted in
some substitute colour. This is a real requirement on a published seam, and it is
stated here rather than left to be discovered: the guarantee that authoring form
is invisible downstream holds *for consumers that enter through the load
boundary*, which is what supplies the palette in the first place.

## Verification

Render a page authored with palette references and the same page with every reference
replaced by the literal it resolves to, and compare the emitted bytes. Take a stored
site that actually uses shades, resolve each of its pages against its palette, and
assert not one reference remains anywhere in the result. Separately, validate and
render a literal-only document with no palette declared and confirm it is unchanged.
Confirm the stored definition still carries references after a load and render.
Confirm that handing the render entry point a referencing document with no palette
raises rather than falling back, and that supplying the owning site's palette renders
it correctly.
