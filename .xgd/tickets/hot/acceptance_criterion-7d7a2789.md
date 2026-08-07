---
uid: acceptance_criterion-7d7a2789
id: AC-1002
type: acceptance_criterion
title: The nothing-to-edit message is dismissible by its button, by Escape and by
  clicking the backdrop, leaving nothing behind
created_by: xgd
created_at: '2026-08-07T02:16:56.041410+00:00'
updated_at: '2026-08-07T18:00:33.379534+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The nothing-to-edit message closes and is removed from the page by each of the
three routes independently: pressing its close button, pressing Escape, and
clicking outside it on the backdrop. After it is dismissed by any route, no
residual keyboard handling remains — a further Escape press with nothing open is
inert and raises no error.

## Verification

Open the message three times and dismiss it once by each route, asserting each
time that it is removed from the page. After a dismissal, press Escape again and
assert nothing throws and nothing else is affected.