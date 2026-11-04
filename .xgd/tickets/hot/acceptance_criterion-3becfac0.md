---
uid: acceptance_criterion-3becfac0
id: AC-2269
type: acceptance_criterion
title: The contact detail carries the newest-first history and provenance; another
  business's contact detail is not found
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:35.755264+00:00'
updated_at: '2026-11-04T17:29:02.166088+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
The contact detail that the Contacts tab loads carries the contact's history in the same response as the contact record. The history is a newest-first list of events, each with kind, occurred time, recorded time, ref and detail, together with the contact's provenance event (or none). An event recorded with a message reference, such as `email.sent` with ref `email-9f2c`, appears at the head of that list with its ref intact. Requested from a business the contact does not belong to, the detail is not found (null), so it exposes no history.

## Verification
Invite a contact and record an email.sent event with a ref. Request the contact detail and assert that its events are [email.sent, contact.invited, contact.created], that the first ref is the supplied ref, and that provenance kind is contact.created. Request the detail of another business's contact and assert null.