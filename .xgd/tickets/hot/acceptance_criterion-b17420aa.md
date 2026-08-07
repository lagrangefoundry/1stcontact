---
uid: acceptance_criterion-b17420aa
id: AC-871
type: acceptance_criterion
title: A freshly created site screenshots with no editing, so the render-and-look
  loop works from the first command
created_by: xgd
created_at: '2026-08-06T03:42:36.348720+00:00'
updated_at: '2026-08-07T18:44:40.121236+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Taking a screenshot of a site immediately after creating it succeeds with no
intervening edit: the command renders, serves and captures the fresh site and
writes an image file at the requested path, whose bytes are a well-formed PNG.

## Verification
Create a site, request a screenshot to a temporary path, and assert the reported
output file exists and its leading bytes are the PNG signature. (Requires a
headless browser; the check is gated on browser availability.)