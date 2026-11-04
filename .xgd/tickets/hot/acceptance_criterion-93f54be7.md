---
uid: acceptance_criterion-93f54be7
id: AC-2270
type: acceptance_criterion
title: The detail pane's History section lists events newest first with labels, unknown
  kinds shown verbatim
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:36.484032+00:00'
updated_at: '2026-11-04T21:14:38.810220+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
The Contacts tab detail pane has a section headed "History" that lists the contact's events as one list, in the newest-first order the server returns, with different kinds interleaved rather than grouped. Each row shows the event's label and its occurred time formatted `YYYY-MM-DD HH:MM`. Known kinds show their label: contact.created "Added as a contact", contact.invited "Invited", member.signed_up "Signed up", email.sent "Email sent", email.delivered "Email delivered", email.bounced "Email bounced", email.received "Email received". A kind with no label is shown as its dotted string verbatim (e.g. "consultation.booked"), never as a blank or a placeholder.

The History section is placed directly after the Businesses section, below the record sections.

## Verification
Open the detail pane for a contact whose history mixes known and unknown kinds. Assert that a "History" heading is present, that row labels appear in the server's order (e.g. [Email bounced, Email sent, consultation.booked, list.joined]), and that the unknown-kind row shows its raw kind and a `YYYY-MM-DD HH:MM` time. Assert that the History heading immediately follows the Businesses heading, and that Businesses comes after Who they are.
