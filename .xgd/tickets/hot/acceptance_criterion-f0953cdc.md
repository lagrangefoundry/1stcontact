---
uid: acceptance_criterion-f0953cdc
id: AC-807
type: acceptance_criterion
title: The safety envelope survives the L1-wraps-module inversion
created_by: xgd
created_at: '2026-08-06T01:32:38.733902+00:00'
updated_at: '2026-08-09T05:40:46.812748+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Handing a module's element to the L1 emitter opens no route back to raw CSS, raw
markup, or script. Whoever declares the element:

- `class` and `style` attributes are **refused outright** — the class is L1's, and
  a style attribute would hand presentation back to the module, which is the whole
  point of the inversion;
- any `on*` handler attribute is refused, so an element cannot become a script
  sink;
- an attribute name that is not a plain HTML attribute name is refused rather than
  emitted;
- every emitted attribute value and every element's text content is HTML-escaped,
  so an injection payload arriving through a label, a placeholder or a button's
  words is inert;
- a control node itself remains inside the numeric/enum envelope like every other
  kind — unknown keys are rejected, so no freeform axis smuggles CSS in beside the
  typed ones.

The behavioural half of the guarantee stays where it was: the submission endpoint
still passes the URL-scheme allowlist, and the label↔control association is
module-authored and unaffected by anything the L1 subtree declares.

## Verification
Render controls whose declared attribute bundles include `class`, `style`, an
`on*` handler, a malformed attribute name, and values carrying `"`, `<` and a
`javascript:` payload; observe none of the refused attributes present in the
output, every surviving value escaped, and no live element or attribute breakout.
Assert the L1 control node rejects an unknown key at validation. Render a form
whose endpoint is an unsafe URL and observe it degrades as an unsafe endpoint
always has, with the label association still intact.