---
uid: acceptance_criterion-0fbe6d15
id: AC-2154
type: acceptance_criterion
title: Creating an account provisions its first business through the same operation,
  so the new account is admitted with exactly one business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:20.505394+00:00'
updated_at: '2026-11-01T12:03:13.598376+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
Inviting a new account (email + account name) creates that account's first business at the same time. It is named after the account and has the same shape as a business added by the operator. Immediately after the invite, admission for that email lists exactly one business. An invited account never exists in a no-business state.

## Verification
Invite an account with name "Salon". Assert the invite result carries a business id. Assert the business record for that id is named "Salon". Assert admission for that email lists exactly one business.