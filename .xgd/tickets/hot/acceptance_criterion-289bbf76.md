---
uid: acceptance_criterion-289bbf76
id: AC-986
type: acceptance_criterion
title: Any edit through this surface is validated over the whole resulting definition
  by the same validator every other structured edit runs
created_by: xgd
created_at: '2026-08-07T02:02:31.368889+00:00'
updated_at: '2026-08-07T19:40:41.439868+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Validation is not scoped to the field being edited, and does not vary with the
kind of region being edited: the complete resulting site definition is validated
before anything is written. Consequently a pre-existing violation in a part of
the page unrelated to the edit refuses **any** edit made through this surface —
a change of words or a change of which image a region shows — and refuses it
with the **same fault code, message and path** as a different structured-edit
operation on the same site. That could not be true if either kind of edit
validated only what it touched, or ran a validator of its own.

## Verification

Introduce a violation into a page region that the edit does not touch and that
only whole-definition validation detects. Attempt a copy edit, an image edit,
and an unrelated structured-edit operation on the same site; assert all fail,
and that their fault code, message and path agree. Assert the draft is unchanged.