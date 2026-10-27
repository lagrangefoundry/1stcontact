---
uid: acceptance_criterion-26d0ac51
id: AC-2050
type: acceptance_criterion
title: In both hosts a capture over 32 MiB or 60 seconds is abandoned and refused,
  sends no further request and offers no reference
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:41.555274+00:00'
updated_at: '2026-10-27T21:19:41.555274+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
In both the Worker and the Node host, a capture whose responses together exceed 32 MiB is abandoned and refused under `REFUSED`, with a refusal of reason `response-cap`. A capture that runs longer than 60 seconds wall-clock is abandoned and reported as failed, naming the time limit. Either way, once a budget is exhausted no further request is sent, and no reference is offered as the capture: `capture_site` returns no bundle name, and nothing new appears in `list_references` as a usable capture of that address.

## Verification
For each host's guarded driver with a doubled network: serve a page whose resources total more than 32 MiB and assert `REFUSED` with `response-cap`, that no later request was forwarded, and that `list_references` is unchanged. Serve a page that never reaches network idle and assert the capture ends within the time limit with an error naming it. (This fails against the code as landed: see *Code issues* items 2–4 in the story.)
