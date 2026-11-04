---
uid: acceptance_criterion-711fa352
id: AC-2297
type: acceptance_criterion
title: A correctly signed webhook body that is not valid JSON, or names no message
  id, is refused with 400 and writes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:30.687567+00:00'
updated_at: '2026-11-04T18:14:36.780493+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
After signature and timestamp checks pass, a body that does not parse as JSON, or a delivery/bounce event without a message id in its data, gets HTTP 400 "Refused." and no record is changed. Signature verification happens before the body is parsed: the same malformed body with a bad signature gets 401, not 400.

## Verification
Sign and post a non-JSON body and assert 400 with no record change. Sign and post an `email.bounced` event with no message id and assert 400. Post the non-JSON body with a wrong signature and assert 401.