---
uid: acceptance_criterion-5ab42ca8
id: AC-931
type: acceptance_criterion
title: References resolve once at the load boundary, so authoring form is invisible
  downstream
created_by: xgd
created_at: '2026-08-06T20:37:50.582708+00:00'
updated_at: '2026-08-06T20:37:50.582708+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
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

## Verification

Render a page authored with palette references and the same page with every reference
replaced by the literal it resolves to, and compare the emitted bytes. Separately,
validate and render a literal-only document with no palette declared and confirm it
is unchanged. Confirm the stored definition still carries references after a load and
render.