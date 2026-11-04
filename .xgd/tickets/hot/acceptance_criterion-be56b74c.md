---
uid: acceptance_criterion-be56b74c
id: AC-2157
type: acceptance_criterion
title: The businesses payload the browser reads carries exactly 'person' and 'businesses'
  and offers no self-serve creation contract
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:27.982694+00:00'
updated_at: '2026-11-04T17:10:26.931604+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
The businesses endpoint the builder chrome reads returns, to an admitted customer, a JSON object whose top-level keys are exactly `person` and `businesses`. `person` names the signed-in human (their current name and primary address). It is not presented as the account, because the account is a separate record: the payer that owns businesses (REQ-194). The object has no `account` key and no other keys: no creation link, action, or form contract through which a customer could add a business themselves.

## Verification
As an ordinary admitted customer, request the businesses endpoint through the worker entry point. Assert that the sorted top-level keys of the JSON body equal `["businesses", "person"]`, that `person.email` is the caller's primary address, and that no `account` key is present.
