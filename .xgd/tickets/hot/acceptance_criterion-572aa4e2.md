---
uid: acceptance_criterion-572aa4e2
id: AC-590
type: acceptance_criterion
title: 'Fully transparent or unpaintable colour falls back to the #000000 sentinel
  and is flagged inferred'
created_by: xgd
created_at: '2026-07-13T20:13:21.539907+00:00'
updated_at: '2026-07-13T20:13:21.539907+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-79e068e5
  kind: behavior
  regression_only: false
---

## Criterion
When an element's computed colour is fully transparent or otherwise cannot be
resolved to an opaque colour value, the captured colour is the `#000000`
sentinel and the element is marked colour-inferred (low-confidence). This
preserves the prior "transparent → inferred" contract so genuinely
unresolvable colours remain distinguishable from resolved ones.

## Verification
Capture an element whose computed colour is fully transparent (zero alpha).
Assert the captured colour equals the `#000000` sentinel and the
colour-inferred flag is true; contrast with a resolvable element whose flag is
false.
