---
uid: acceptance_criterion-ba99c972
id: AC-2385
type: acceptance_criterion
title: A generated picture can be found by its prompt as soon as generation completes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:29.243082+00:00'
updated_at: '2026-11-08T06:42:29.243082+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
As soon as the generation tool returns, the new material is in the knowledge index, with its prompt as its description. A knowledge search using words from the prompt returns it, without any vision-describe call being made.

## Verification
Generate a picture with a distinctive prompt. Right after the tool returns, run a knowledge search for those words and assert that the generated material is in the results. Assert that no describer call was recorded.