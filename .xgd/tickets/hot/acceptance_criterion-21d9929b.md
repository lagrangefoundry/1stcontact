---
uid: acceptance_criterion-21d9929b
id: AC-2202
type: acceptance_criterion
title: For a fulfilment-capable owner, a contact's detail offers Provision a business,
  which submits the contact's own address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:19.715783+00:00'
updated_at: '2026-11-01T19:33:19.715783+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When the people list reports the caller may fulfil (they own this business AND this business's product is businesses), every contact's detail has an **Add a business** section with a **Provision a business** button. When the list reports otherwise, there is no such section or button. The button opens a dialog titled "Provision a business". The dialog names the contact it is for and has one business-name input. Provision submits the contact's **own** stored address with the typed name, and the operator never types an address. On success the dialog shows "<business name> is provisioned." and the detail is re-read, so the new business appears in the contact's business table. On failure the dialog shows the error message and the Provision button can be used again.

## Verification
Mount the panel with a list response that reports the caller may fulfil, open a contact, assert the section and button, open the dialog, enter a name and press Provision. Assert the transport received the contact's own email and the typed name, that the success sentence is shown, and that the detail was re-fetched. Repeat with a fulfil transport that rejects and assert the message is shown. Mount with the caller unable to fulfil and assert neither the section nor the button is rendered.
