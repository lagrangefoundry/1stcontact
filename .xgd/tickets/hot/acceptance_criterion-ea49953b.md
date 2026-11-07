---
uid: acceptance_criterion-ea49953b
id: AC-2346
type: acceptance_criterion
title: A sign-in request resolves the address only within the business the request
  host belongs to
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:12.221083+00:00'
updated_at: '2026-11-07T08:23:12.221083+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
An address that is held by a contact in a different business, and not by anyone in the business the request host resolves to, is treated as unknown. No message is sent to it and no token is created for it. A request that carries no host resolves no business and sends nothing.

## Verification
Seed the same address as a contact in a second business only. POST it to the platform host's sign-in route and assert no mail and no token. Seed the address in the platform business too, and assert that the request then sends one link to that contact.
