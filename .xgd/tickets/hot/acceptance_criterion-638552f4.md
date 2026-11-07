---
uid: acceptance_criterion-638552f4
id: AC-2336
type: acceptance_criterion
title: Adding a contact creates a Lead and sends nothing; there is no flag on either
  route selecting the other's behaviour
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T07:22:56.022099+00:00'
updated_at: '2026-11-07T07:22:56.022099+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Adding a contact and inviting one are two acts on two routes, and neither route
takes a flag selecting the other's behaviour. The Contacts tab's `+` control opens
an add dialog taking an address and an optional name; it states in words that
nothing is sent and that the contact is recorded as a lead. Adding a contact the
business does not yet hold (`POST /api/people/add`) creates one row whose pipeline
stage is **Lead**, sets no invitation timestamp, and hands nothing to the mail
port. The `+` control is shown only when the people list reports the caller may
invite, on the same condition as the Invite control. After an add the dialog stays
open with its fields cleared and reports the outcome, saying whether the contact
was newly added or already there; a refused add (such as an empty address) is
reported in the dialog rather than closing it.

## Verification

Render the Contacts tab for a caller who may invite and assert the `+` control is
visible; for one who may not, assert it is hidden. Open the add dialog and assert
it carries the sentence that nothing is sent. As an owner, add a fresh address
through the add route with a recording mail port: assert the response reports
`created` true, the stored contact's pipeline stage is `lead`, its invitation
timestamp is null, and the mail port recorded no message. Add the same address
again through the dialog and assert it reports the contact as already there.
Post the add with an `alsoInvite`-style flag set and assert the outcome is
identical (still a Lead, nothing sent). Submit an empty address and assert the
error is shown in the dialog and the dialog is still open.
