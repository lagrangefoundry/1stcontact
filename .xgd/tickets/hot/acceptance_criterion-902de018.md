---
uid: acceptance_criterion-902de018
id: AC-2300
type: acceptance_criterion
title: The delivery webhook is reachable by a POST with no Access identity, while
  every other route, and any other method on that path, stays behind the Access gate
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:33.013740+00:00'
updated_at: '2026-11-04T18:03:33.013740+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
Through the control app's full request entry point:
- a signed POST to the delivery webhook path with no Access token reaches the webhook and is applied (200);
- a GET to the same path with no Access token is not served by the webhook and is refused by the gate;
- any other path, including other paths under the same `/api/email/` prefix, without an Access token is refused by the gate exactly as before.

## Verification
Through the worker's top-level fetch handler with no Access headers: post a signed delivery event to the webhook path and assert 200 and an updated record. Send a GET to the same path, and a POST to a sibling path under `/api/email/`, and assert both get the gate's unauthenticated refusal.
