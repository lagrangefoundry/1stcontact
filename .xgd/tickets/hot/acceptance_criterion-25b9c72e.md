---
uid: acceptance_criterion-25b9c72e
id: AC-2381
type: acceptance_criterion
title: A deployment with no image credential has no image tool, and its sessions otherwise
  work normally
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:26.352523+00:00'
updated_at: '2026-11-08T07:13:47.863861+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
When no image credential is configured, a consultant session still opens. Image generation is missing from its tool surface and its manual, so the model is never told about the capability. Every other tool works as before. Absence is not reported as an error.

## Verification
Open a consultant session with no image credential. Assert that the session starts, that the tool list and the manual contain no image-generation tool or mention, and that a turn using another tool (e.g. reading the page) succeeds.