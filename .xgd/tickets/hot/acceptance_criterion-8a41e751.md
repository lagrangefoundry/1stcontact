---
uid: acceptance_criterion-8a41e751
id: AC-2265
type: acceptance_criterion
title: A first invite records contact.created (via invite) and contact.invited; each
  repeat invite adds one contact.invited
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:32.824657+00:00'
updated_at: '2026-11-04T17:29:03.250789+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
Inviting someone who is not yet a contact records two events for the new contact: `contact.created` with detail `{via: "invite"}`, which becomes their provenance, and `contact.invited`. The newest-first history reads [contact.invited, contact.created]. Inviting the same address again records one more `contact.invited` and no second `contact.created`, giving [contact.invited, contact.invited, contact.created]. A re-invite still resolves to the same contact and leaves the contact's first-invited timestamp unchanged.

## Verification
Invite a new address. Assert the two kinds in order, that provenance kind is contact.created, and that the detail is {via: invite}. Invite the same address again. Assert that the same contact id is returned with an unchanged invited timestamp and that the history now holds three events in the stated order.