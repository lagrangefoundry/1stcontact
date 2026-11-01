---
uid: acceptance_criterion-504bbd4c
id: AC-2149
type: acceptance_criterion
title: A caller who is not an owner of the 1st Contact business who asks to add a
  business gets 404 and no business is created
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:04.738864+00:00'
updated_at: '2026-11-01T17:58:32.441860+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
A caller who is not an owner of the 1st Contact business, and who submits an otherwise-valid add-a-business request (existing account email + business name), receives HTTP 404 and no business is created. An owner of the 1st Contact business holds an active `owner` membership on the business whose product is businesses. This applies to:
- a fully admitted customer (verified identity, live grant, current terms accepted) who owns only their own business
- a caller carrying `platform_operator` who holds no `owner` membership on the 1st Contact business. The hosting capability does not open this gate.

The refusal happens before any write. The number of businesses the named account can be admitted to is unchanged afterwards.

## Verification
Through the deployed worker entry point with a real verified identity: invite a customer (one business), submit an add-a-business request as them naming their own email and a new name, and assert status 404. Then assert that admission for that email still lists exactly one business. Repeat as a user with `platform_operator` set and no membership on the 1st Contact business, and assert 404 and no new business.
