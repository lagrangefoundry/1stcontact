---
uid: acceptance_criterion-6c4e16be
id: AC-2205
type: acceptance_criterion
title: Inviting a contact moves them to Invited and never to Member; re-inviting keeps
  the original invite time
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:11.091479+00:00'
updated_at: '2026-11-01T20:05:11.091479+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
When an operator invites an address in their business:
- whether the address is a new contact or an existing one, the contact's pipeline stage becomes `invited` (label **Invited**) and the invite timestamp is set;
- the terms-accepted value is not touched, so a non-member stays **Not a member** and gets no Member badge;
- inviting an already-invited contact again leaves the original invite timestamp unchanged, and the stage stays `invited`;
- inviting a contact who is already a Member succeeds (not an error). That contact's stage becomes `invited` and they remain a **Member** with their terms-accepted value unchanged.

## Verification
Through the invite endpoint as the business owner:
1. Invite a new address. Assert that the returned and read-back person has `pipelineStage == "invited"`, a set invite timestamp and a null terms-accepted value, and that the tab row shows "Invited" and no Member badge.
2. Invite the same address again. Assert the invite timestamp equals the first value.
3. Invite an existing Lead who has accepted the terms. Assert a success response, `pipelineStage == "invited"`, an unchanged terms-accepted value, and a row showing both "Invited" and the Member badge.