---
uid: acceptance_criterion-d3f5071d
id: AC-2504
type: acceptance_criterion
title: The tenant comes only from the URL; a body field naming another tenant writes
  nothing there
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:17.577690+00:00'
updated_at: '2026-11-09T00:54:15.945620+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
The tenant a submission is written into is decided only by the request URL. A body field naming another site key, tenant or business does not change where the contact lands: nothing is written into the other tenant. The field is kept as one more answer the visitor typed.

## Verification
With two published sites A and B, POST to site A's endpoint with body fields claiming site B's key or B's business id. Assert that A's business gains the contact, B's business gains nothing, and the claimed value appears among the event's recorded answers.