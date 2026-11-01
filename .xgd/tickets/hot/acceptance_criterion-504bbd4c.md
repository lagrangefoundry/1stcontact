---
uid: acceptance_criterion-504bbd4c
id: AC-2149
type: acceptance_criterion
title: An admitted customer without the fulfilment privilege who asks to add a business
  gets 404 and no business is created
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:04.738864+00:00'
updated_at: '2026-11-01T11:57:04.738864+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
A caller who is fully admitted (verified identity, live grant, current terms accepted) but whose admission does not carry the fulfilment privilege, and who submits an otherwise-valid add-a-business request (existing account email + business name), receives HTTP 404. The number of businesses their account can be admitted to is unchanged afterwards: the refusal happens before any write.

## Verification
Through the deployed worker entry point with a real verified identity: invite a customer (one business), submit an add-a-business request as them naming their own email and a new name, assert status 404, then assert admission for that email still lists exactly one business.
