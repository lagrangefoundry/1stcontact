---
uid: acceptance_criterion-43e5a016
id: AC-1000
type: acceptance_criterion
title: Closing a form in which nothing was changed writes nothing and re-renders nothing
created_by: xgd
created_at: '2026-08-07T02:16:47.041598+00:00'
updated_at: '2026-08-07T02:16:47.041598+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

An operator who opens a form and changes nothing can confirm or cancel it and
the result is the same: the form closes, no change is sent, the draft is
untouched and the page is not re-rendered. Opening a form to look is not an
edit.

## Verification

Open a form over a region, alter nothing, confirm it. Assert no change request
was issued, the draft's modification state is unchanged, and the displayed page
was not reloaded.
