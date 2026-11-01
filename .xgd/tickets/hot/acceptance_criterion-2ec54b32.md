---
uid: acceptance_criterion-2ec54b32
id: AC-2155
type: acceptance_criterion
title: Operator adding a business for an unknown email gets 404 with 'No account with
  that email address.'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:23.157588+00:00'
updated_at: '2026-11-01T12:03:13.364205+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
When a caller holding the fulfilment privilege submits an add-a-business request that names an email with no account, the response is HTTP 404. The JSON body is exactly `{"error": "No account with that email address."}`. No business is created. The operator is told plainly that the account doesn't exist, which is different from the opaque refusal unprivileged callers get.

## Verification
As a privileged operator, submit add-a-business with `accountEmail` set to an email that was never invited. Assert status 404 and assert the JSON body equals `{ error: "No account with that email address." }`.