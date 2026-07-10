---
uid: acceptance_criterion-926f28e4
id: AC-446
type: acceptance_criterion
title: text-block content-frame width is set by its variant; contentWidth dial caps
  the column within it
created_by: xgd
created_at: '2026-07-08T19:28:52.017183+00:00'
updated_at: '2026-07-10T01:12:31.244035+00:00'
completed_at: null
last_field_updated: title
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The base width of a text-block's content frame is determined by its variant: the `prose` variant binds the frame to the narrow container width, and the `landing` variant binds it to the default container width. Within that frame the optional `contentWidth` dial can cap the content column narrower still; when `contentWidth` is absent (`default`) the content fills the variant frame, so the variant alone governs the width.

## Verification
Render the same content under each variant with `contentWidth` omitted and observe, via the published markup/stylesheet, that `prose` binds the frame to the narrow container width and `landing` to the default container width, with the content filling the frame.