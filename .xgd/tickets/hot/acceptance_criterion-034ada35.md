---
uid: acceptance_criterion-034ada35
id: AC-601
type: acceptance_criterion
title: Default prose block renders at full content-container width, centred
created_by: xgd
created_at: '2026-07-13T20:31:48.710379+00:00'
updated_at: '2026-07-13T20:35:20.845014+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8a42499e
  kind: behavior
  regression_only: false
---

## Criterion
A prose text block rendered with no width dial set lays out its content column at
the standard content-container width — the full container width, horizontally
centred (margin auto) so it pins to the page gutter on a wide viewport. This is
the same column geometry a services-grid section produces, NOT a narrow
off-centre column.

## Verification
Render a `prose`-variant text block with no `contentWidth` dial. Observe that the
content column's maximum width is the standard full content-container width (the
default step, not a narrow one) and that it is horizontally centred. Confirm the
resulting geometry matches that of a services-grid section rendered in the same
container, and that no narrow-column cap is applied.