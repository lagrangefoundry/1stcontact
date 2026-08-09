---
uid: acceptance_criterion-5ab42ca8
id: AC-931
type: acceptance_criterion
title: References resolve once at the load boundary, so authoring form is invisible
  downstream
created_by: xgd
created_at: '2026-08-06T20:37:50.582708+00:00'
updated_at: '2026-08-09T05:41:41.158034+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Colour references are resolved to their literals in a single pass when a site is
loaded, before any consumer sees it. Everything downstream — the renderer, the
analytic evaluator, the round-trip gate, values-diff — therefore reads exactly the
document it would have read had the colours been authored as literals.

The observable consequences:

- A document authored with references renders **byte-identically** to the same
  document authored with the literals those references resolve to. Converting a
  site's literals to references moves no pixel.
- A literal-only document is entirely unaffected by the widening: it needs no
  palette, validates and renders exactly as before.
- The on-disk definition keeps its references — resolution is a read-time overlay,
  not a rewrite — so a palette entry stays the single place a colour is changed.

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
replaced by the literal it resolves to, and compare the emitted bytes. Separately,
validate and render a literal-only document with no palette declared and confirm it
is unchanged. Confirm the stored definition still carries references after a load and
render. Confirm that handing the render entry point a referencing document with no
palette raises rather than falling back, and that supplying the owning site's
palette renders it correctly.