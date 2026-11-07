---
uid: acceptance_criterion-51c854d3
id: AC-2339
type: acceptance_criterion
title: Each invite goes to the contact's primary address; a contact without one is
  refused by name while the rest of the selection still sends, and the result reports
  each send
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T07:23:04.548157+00:00'
updated_at: '2026-11-07T08:05:52.982558+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Each invite goes to that contact's **primary** address and to no other. A selected
contact with no primary address is refused by name — their display name, else
their address, else their id — and nothing is sent or recorded for them; the
invite never falls back to another address. The remaining selected contacts are
still sent to, one after another. The response carries one result per selected
contact, in order, each `sent`, `failed` (the provider refused it, with the
reason) or `refused` (nothing attempted, with the reason), and the modal stays
open and shows one line per contact naming them and their outcome. The selection
survives a send in which nothing was sent, so the operator can fix the refused rows
and send again.

## Verification

Hold three contacts in a business: one with a primary and a secondary address, one
with a single primary address, and one with an address that is not flagged
primary. Tick all three and send with a recording mail port. Assert the port
recorded exactly two messages, to the two primary addresses and not to the
secondary or unflagged one; assert the response has three results in selection
order, two `sent` and one `refused` naming the third contact, and that the modal
shows three outcome lines. Make the port fail for one contact and assert that
contact's result is `failed` with the provider's reason. Tick only the
no-primary contact and send: assert its result is `refused` and that it is still
checked afterwards.