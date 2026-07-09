---
uid: acceptance_criterion-c0f7dd88
id: AC-505
type: acceptance_criterion
title: Footer exposes a layout dial justifying copyright and links to opposite ends
created_by: xgd
created_at: '2026-07-09T21:57:33.397881+00:00'
updated_at: '2026-07-09T21:57:33.397881+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `footer` module exposes a `layout` dial (`center` | `spread`, default `center`). `center` stacks the copyright and optional link row centred; `spread` justifies the copyright and links to opposite ends of a single row (space-between), with the copyright ordered to the leading end.

## Verification
Render a footer with `layout: spread` and assert the copyright and links sit on opposite ends of one justified row, and with `layout: center` (or omitted) assert they stack centred.
