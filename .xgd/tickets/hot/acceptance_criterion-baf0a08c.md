---
uid: acceptance_criterion-baf0a08c
id: AC-603
type: acceptance_criterion
title: Prose block is not narrowed unless contentWidth is set
created_by: xgd
created_at: '2026-07-13T20:31:57.573542+00:00'
updated_at: '2026-07-13T20:35:20.650214+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8a42499e
  kind: behavior
  regression_only: false
---

## Criterion
The narrower reading measure is opt-in and never the base: a prose text block that
does not set the `contentWidth` dial carries no width-constraint marker and applies
no content width cap. Absence of the dial yields the full-container default, never a
narrowed column.

## Verification
Render a `prose`-variant text block with no `contentWidth` dial and confirm it
reports no width-constraint marker and sets no content-width cap. Contrast with the
same block that sets the dial (which does report the marker), demonstrating the
narrow measure appears only when explicitly requested.