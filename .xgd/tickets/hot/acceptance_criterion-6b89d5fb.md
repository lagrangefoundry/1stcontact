---
uid: acceptance_criterion-6b89d5fb
id: AC-934
type: acceptance_criterion
title: Page background and inherited text colour are L1 document fields, validated
  as colour axes
created_by: xgd
created_at: '2026-08-06T20:50:57.387504+00:00'
updated_at: '2026-08-09T05:41:43.987907+00:00'
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
A page's **background** and its **inherited text colour** are fields of the L1
document itself, not of a token surface. Both are optional, both are validated as
ordinary colour axes — the identical typed form, the identical strictness and the
identical envelope bounds as any node's colour axis — and both are emitted by the
sole safe emitter as body-level rules in the document's own stylesheet.

Text colour is a **floor, not an override**: every text leaf paints its own
colour when it declares one, and a leaf that declares none emits no colour
declaration at all and therefore inherits the document's. A document declaring
neither field emits neither rule, and the page renders exactly as it did before
the fields existed.

The page's colour is therefore reachable by editing the definition that produced
the page, on the same path and under the same validation as every other colour in
it — rather than by a stylesheet rule outside the document binding the body to a
theme token.

## Verification
Validate a document declaring a background and a text colour and observe
acceptance; render it and observe exactly one body background-colour rule and one
body colour rule carrying those values. Render a text leaf declaring its own
colour and observe that colour on the leaf's rule; render one declaring none and
observe no colour declaration on it, so the document's value is what paints.
Render a document declaring neither field and observe neither body rule emitted.
Submit each field with a value outside the colour axis form and observe rejection
naming that field's path.