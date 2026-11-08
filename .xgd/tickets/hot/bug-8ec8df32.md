---
uid: bug-8ec8df32
id: BUG-386
type: bug
title: 'Paperwork: drop SMS text, show Recipients as a field, On/Off only where optional'
created_by: EPIC-30
created_at: '2026-11-08T20:28:29.652125+00:00'
updated_at: '2026-11-08T20:32:06.478978+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: medium
  priority: high
  parent_uid: epic-087800af
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-addf5a62
---

## Symptom

Operator review of the landed Paperwork tab (REQ-660, REQ-661, REQ-662, REQ-663), 2026-11-08:

1. Every message has an **SMS/push text** field — "we don't support that today - confusing to users".
2. Trigger labels carry their recipients — "Cancellation requested (to the team)", "New order (to the team)". "The recipient set is not changeable in these situations but I think it deserves its own field and should appear in the Item level summary: Invitation - Contact, New Order - Owner & Delegates etc."
3. **Every** message has an On | Off switch — "what does it mean to turn them off? Are there use-cases for that? Won't that just break the business?" Off sends nothing when the trigger fires; for a delegate invitation it refuses the invitation itself. Off on sign-in, invitations or access-ended locks people out; off on New order / Cancellation requested hides orders from the owner; the order confirmation is a legal requirement for distance selling (UK/EU); the privacy-notice email is how people are told of a change; "Work is ready" already has the per-person "Stop these emails" opt-out.

## Fix

1. **Remove SMS/push text** everywhere: the message record (`sms_text`), the Detail pane, the Email assistant's tools (`read_message`, `update_message` parameters) and its priming. No channel sends it today. It returns with an SMS or push channel.
2. **Recipients is its own field**, fixed per trigger (not editable), shown in the **Detail** pane and in the **Items** summary next to each message. Labels lose their bracketed recipients. Recipients per trigger:

   | Trigger | Recipients |
   |---|---|
   | Sign-in link | Person signing in |
   | Invitation | Invited contact |
   | Invitation to help run the business | Invited person |
   | Access ended | Person whose access ended |
   | Work is ready | Owner & delegates |
   | New order | Owner & delegates |
   | Cancellation requested | Owner & delegates |
   | Order confirmation, Order shipped, Order cancelled, Cancellation declined, Return refunded | Buyer |
   | We've updated our privacy notice | Contacts who accepted it |
   | Reply to a form | Person who filled in the form |

   The Email assistant's `list_messages` / `read_message` report it.
3. **On/Off only on optional messages.** A trigger declares whether it is optional; only optional messages show the switch, accept `enabled: false` (pane, routes, the Email assistant's `update_message` — a refusal names the reason otherwise) or can be off. Today the only optional message is **Order shipped** (it was optional in Shop settings before Paperwork took its switch). Every other message is always on; any stored "off" on a non-optional message is ignored and cleared, so it sends.

## Design note (no defect seen)

**Invitation to help run the business** — a delegate is a 1st Contact user, so its link signs the person in to **1st Contact** and opens that business in the builder (`/b/<businessId>/…`); never the business's own client sign-in under `/c/<businessId>/`. The code already issues it against the platform tenant (`requirePlatformTenant` in the delegate route). Operator: "there may not be [a bug] — just wanted to make sure the design was clear." Pin it with a UAT.

## Test plan

UATs named `test_UAT_FC_BUG-386_*`:
- No message record, route response, Detail pane or Email assistant tool carries an SMS/push field.
- The Items list and the Detail pane show each message's Recipients; "New order" reads "Owner & delegates", "Invitation" reads "Invited contact"; no label contains "(to the team)".
- Order shipped shows On | Off and, when off, sends nothing when an order is marked shipped; no other message shows the switch; setting `enabled: false` on New order is refused with its reason; a non-optional message stored off still sends.
- A real delegate invitation's link, followed, signs the person in to 1st Contact (platform-tenant session) and lands on the builder for that business, not `/c/<businessId>/`.