---
uid: acceptance_criterion-7aa9c036
id: AC-1577
type: acceptance_criterion
title: 'The question can be declined: dismissing it creates nothing and the next drag
  raises it clean'
created_by: xgd
created_at: '2026-09-04T04:51:52.556053+00:00'
updated_at: '2026-09-04T05:01:59.788899+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

The question can be declined. Dismissing it — by the dismissal control or by the conventional
keyboard escape — closes it, creates nothing, and leaves no record or stored bytes behind. A
subsequent drag raises it again in a clean state: no answer marked, and no message left over from a
previous attempt.

## Verification

Raise the question, dismiss it by the control, and confirm nothing was created. Raise it again,
release a file outside both answers so it is marked and carries its message, dismiss it by the
keyboard escape, raise it once more and confirm the marking and message are gone.