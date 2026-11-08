---
uid: acceptance_criterion-e64f3cfb
id: AC-2406
type: acceptance_criterion
title: On a deployment with no browser, the drawing operations are still offered and
  refuse with a sentence naming the reason
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:55.246283+00:00'
updated_at: '2026-11-08T07:26:19.675608+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Where no browser is available, `measure_drawing`, `relate` and `solve` remain declared and granted to the consultant. Calling any of them returns a refusal whose message says that measuring needs a browser and this deployment has none. The session does not fail at start-up. A `write_image` carrying `assert` on such a deployment still writes the drawing, and reports each stated relation with a `why` naming that nothing could be checked.

## Verification
Build the surface with no browser. Assert the three operations are listed and each refuses with the no-browser reason. Assert `write_image` with `assert` stores the drawing and returns one `why` entry per relation.