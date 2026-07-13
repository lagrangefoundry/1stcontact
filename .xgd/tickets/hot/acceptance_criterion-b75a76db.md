---
uid: acceptance_criterion-b75a76db
id: AC-606
type: acceptance_criterion
title: bleed or absent contentWidth leaves the content column uncapped
created_by: xgd
created_at: '2026-07-13T20:38:05.910127+00:00'
updated_at: '2026-07-13T20:44:28.636866+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d555b990
  kind: behavior
  regression_only: false
---

## Criterion
When `contentWidth` is `bleed`, or the dial is absent entirely, the content column is not capped — it fills the section's full-width frame. No max-width measure is imposed and no content-width marker is present on the rendered section.

## Verification
Render a module with `contentWidth: "bleed"` and one with no `contentWidth` dial; confirm neither output imposes a content-width cap on the column (the column fills the frame) and neither carries the content-width marker.