---
uid: acceptance_criterion-85fb0d8a
id: AC-2405
type: acceptance_criterion
title: write_image without an assert block performs no render
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:54.513632+00:00'
updated_at: '2026-11-08T07:26:19.911669+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
A `write_image` call with no `assert` (absent or empty) writes the drawing and returns without rendering or measuring anything. It needs no browser and behaves the same on a deployment that has none.

## Verification
With a measurer that records each invocation, call `write_image` without `assert` and assert the measurer was never invoked and the write succeeded.