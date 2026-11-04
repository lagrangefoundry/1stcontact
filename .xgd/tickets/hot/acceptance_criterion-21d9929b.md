---
uid: acceptance_criterion-21d9929b
id: AC-2202
type: acceptance_criterion
title: For a fulfilment-capable owner, a contact's detail offers Provision a business,
  which submits the contact's own address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:19.715783+00:00'
updated_at: '2026-11-04T21:40:12.121560+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When the people list reports the caller may fulfil (`canFulfil` — the caller owns the 1st Contact business; this is a property of the caller, so it is reported, and the control offered, in whichever business the caller is scoped to), every contact's detail has an **Add a business** section with a **Provision a business** button. When the list reports otherwise, there is no such section or button. The button opens a dialog titled "Provision a business". The dialog names the contact it is for and has one business-name input. Provision submits the contact's **own** stored address with the typed name, and the operator never types an address. On success the dialog shows "<business name> is provisioned." and the detail is re-read, so the new business appears in the contact's business table. On failure the dialog shows the error message and the Provision button can be used again. How the server resolves the submitted address — only among 1st Contact people, whatever business the contact is in — is AC-2323 (story-387c9dfe).

## Verification
Mount the panel with a list response that reports the caller may fulfil, open a contact, assert the section and button, open the dialog, enter a name and press Provision. Assert the transport received the contact's own email and the typed name, that the success sentence is shown, and that the detail was re-fetched. Repeat with a fulfil transport that rejects and assert the message is shown. Mount with the caller unable to fulfil and assert neither the section nor the button is rendered.

## Reconciliation Decisions
- (review report-0cfddba5 gap 6) The earlier wording ("they own this business AND this business's product is businesses") implied the control appears only in the 1st Contact business. The code reports `canFulfil` as `ownsPlatformBusiness` regardless of scope (router.ts `GET /api/people`), so the control is offered in every business the operator scopes into, while add-a-business looks the address up only among 1st Contact people. Recorded as CODE-ISSUE on story-a55c2f35 and story-387c9dfe; the server half is pinned by AC-2323.
