---
uid: acceptance_criterion-6c4e16be
id: AC-2205
type: acceptance_criterion
title: A sent or provider-failed invite moves the contact to Invited and never to
  Member; a contact refused for having no address is not moved; re-inviting keeps
  the original invite time
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:11.091479+00:00'
updated_at: '2026-11-07T07:21:48.104853+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
When an operator invites a selection of existing contacts in their business, the
pipeline moves on the attempt, not on the provider's answer:
- a contact whose invite was handed to the mail provider — whether it reports
  `sent` or `failed` — has their pipeline stage become `invited` (label **Invited**)
  and their invite timestamp set;
- a contact refused for having no primary address is not moved: their stage and
  invite timestamp are unchanged, because nothing was attempted for them;
- the terms-accepted value is never touched, so a non-member stays **Not a member**
  with no Member badge, and a contact who is already a Member is invited
  successfully and stays a **Member**;
- inviting an already-invited contact again leaves the original invite timestamp
  unchanged, and the stage stays `invited`;
- adding a contact never moves the stage: a newly added contact is a Lead with no
  invite timestamp until they are invited.

## Verification
Through the add and invite endpoints as the business owner, with a mail port that
can be told to succeed or fail:
1. Add an address; assert stage `lead` and a null invite timestamp. Invite it with
   the port succeeding; assert result `sent`, `pipelineStage == "invited"`, a set
   invite timestamp and a null terms-accepted value, and that the tab row shows
   "Invited" and no Member badge.
2. Invite it again; assert the invite timestamp equals the first value.
3. Add another contact and invite it with the port failing; assert result `failed`
   and `pipelineStage == "invited"`.
4. Invite a contact holding no primary address alongside others; assert that
   contact's result is `refused` and its stage is still `lead` with no invite
   timestamp.
5. Invite an existing Lead who has accepted the terms; assert success,
   `pipelineStage == "invited"`, an unchanged terms-accepted value, and a row
   showing both "Invited" and the Member badge.
