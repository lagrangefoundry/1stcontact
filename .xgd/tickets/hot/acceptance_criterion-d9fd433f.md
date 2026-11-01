---
uid: acceptance_criterion-d9fd433f
id: AC-2156
type: acceptance_criterion
title: Operator add-a-business with a missing or blank account email or name is rejected
  with 400
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:25.431166+00:00'
updated_at: '2026-11-01T11:57:25.431166+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
When a caller holding the fulfilment privilege submits an add-a-business request where the account email is missing, the business name is missing, or either is blank or whitespace-only, the response is HTTP 400. The JSON error states that `accountEmail and name are required`. Nothing is provisioned.

## Verification
As a privileged operator, submit three requests: one with no name, one with no account email, and one whose name is whitespace only. Assert each returns status 400.
