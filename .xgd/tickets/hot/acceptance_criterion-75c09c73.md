---
uid: acceptance_criterion-75c09c73
id: AC-999
type: acceptance_criterion
title: A refused edit keeps the form open holding what the operator typed, showing
  the reason, with page and draft unchanged
created_by: xgd
created_at: '2026-08-07T02:16:42.391808+00:00'
updated_at: '2026-08-10T08:50:09.926744+00:00'
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

When a confirmed change is refused, the form stays open, still holding exactly
the text the operator typed, and shows the refusal's own explanation — the
message and, where one is offered, the hint naming what to do — rather than a
generic failure. The operator can correct the text and confirm again from the
same form.

Nothing lands: the draft is unchanged and the page on screen still shows the
pre-edit content.

## Verification

Confirm a change the write path refuses. Assert the form is still present, its
field still holds the entered text, and the refusal's own message text is
displayed. Assert the draft and the displayed page are unchanged from before the
attempt, and that confirming a corrected value from the same open form succeeds.