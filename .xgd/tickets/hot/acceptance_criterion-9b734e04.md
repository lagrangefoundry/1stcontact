---
uid: acceptance_criterion-9b734e04
id: AC-2321
type: acceptance_criterion
title: The simulator's /login still offers a way in when the local store is missing
  or empty
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:24.247584+00:00'
updated_at: '2026-11-04T18:28:55.015783+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
If the local store cannot be read or holds no addresses, `GET /login` still returns 200. The page tells the user that no seeded people were found, says to run the seed, and offers the manual `/login?email=<address>` path. The page is never an error.

## Verification
Start the simulator with no local store and fetch `/login`. Assert status 200 and that the page contains the 'No seeded people found' guidance and the manual `?email=` path.