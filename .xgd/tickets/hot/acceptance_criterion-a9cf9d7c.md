---
uid: acceptance_criterion-a9cf9d7c
id: AC-2386
type: acceptance_criterion
title: Image generation is capped at ten attempts per session; exceeding the cap refuses
  only image generation
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:29.989571+00:00'
updated_at: '2026-11-08T06:42:29.989571+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
One session may attempt at most ten generations (the framework's default). An attempt counts even if it fails. The eleventh request in the same session is refused with an error the model can act on, saying the session's image budget is used up. No provider call is made for it, and every other tool in that session keeps working.

## Verification
In one session, make ten generation attempts (some may be provider failures), then an eleventh. Assert that the eleventh returns the budget-exhausted error, that the provider endpoint received exactly ten requests, and that a later non-image tool call in the same session succeeds.