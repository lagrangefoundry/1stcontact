---
uid: request-86de9c7b
id: REQ-659
type: request
title: 'Shop: a buyer becomes a contact, a paid order graduates them to customer,
  and every order email is tracked on the contact'
created_by: EPIC-9
created_at: '2026-11-07T17:47:09.379039+00:00'
updated_at: '2026-11-07T18:53:33.212193+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0eefe3dc
  commits:
  - working_sha: cd6cb095c1acb7bbcca325125eb2ae794445d855
    reconcile_sha: null
    main_sha: null
  - working_sha: 7407b5f26245c80710deaba4d7ca8780aed7d748
    reconcile_sha: null
    main_sha: null
  version: 0.2.809
  story_points: 8
---

## What this is for

A person who buys from a business's site is one of that business's **contacts**, and once a purchase succeeds they're a **customer**. Every email we send them about an order is part of their history in the contact system. Today none of this happens: a paid order stores the buyer's name, email, phone and address on the `orders` row only (`orders.ts` `orderPaymentOutcome`). No `users` (contact) row is created or matched, and REQ-644's order emails (`order-emails.ts`) record no `contact_events`. So the business's People tab never shows its buyers.

Operator, 2026-11-07: "a purchaser is a contact absolutely and any emails that we send them should be tracked in the contact system. If they successfully make a purchase they should graduate to customer (not just contact)."

## Behaviour

1. **A paid order makes the buyer a contact of the business.**
   - When an order becomes `paid`, from the webhook or from BUG-375's missed-notification correction (the same outcome path), the buyer's email (from Stripe's `customer_details`) is matched to a contact in the business's own tenant, ignoring case.
   - If there's no match, a contact is added through the existing `addContact` path, with the buyer's name and phone. The source is recorded as the shop, so the history says how they arrived.
   - If there is a match, the existing contact is used. Name and phone are filled only where empty, never overwritten.
   - The delivery address stays on the order only. It isn't copied onto the contact (collect only what's needed, DOC-5 rule 26).
2. **A successful purchase graduates them to customer.**
   - A new pipeline stage, **customer**, is added after the existing ones in the one definition (`builder/people-axes.js`): lead → invited → customer. The first paid order sets it.
   - It's never moved backwards by a later cancellation or refund. Once someone has bought, they're a customer, and the refund is in their history.
   - It's independent of the access axis: a customer is not a member and can't sign in because of a purchase (DOC-44's separate axes).
3. **The purchase is in their history.** `contact_events` gets an event when the order is paid, naming the order number and total and linking to the order in Shop → Orders. It also gets one each for shipped, cancelled, refunded and returned (new event kinds in `builder/contact-events.js`).
4. **Every email to a buyer is tracked on the contact.** REQ-644's confirmation, shipped, cancellation-request outcome, cancellation and refund emails each record `email.sent` against the contact, exactly as other platform emails do (REQ-198). Delivered and bounced then arrive through the existing Resend webhook (`email-webhook.ts`) and attach to the same contact.
5. **The contact shows their orders.** In People, a customer's detail lists their orders (number, date, total, state), each opening that order in Shop → Orders. An order's detail in Shop links back to the buyer's contact.
6. **No marketing consent is implied.** Buying records no newsletter or mailing-list acceptance. Order emails are transactional. Any opt-in is a separate acceptance (REQ-240), never a side effect of buying.
7. **Test-mode orders do the same**, so the flow can be tested end to end. Their events and orders carry the existing Test marking, so an owner can tell a rehearsal from a sale.

## Constraints
- All of it stays inside the business's tenant (`users WHERE tenant_id = business`), and no buyer data leaves it (DOC-5 rule 26).
- Matching and writing happen once per paid order, in the same outcome step, idempotent with it. A replayed webhook or a late correction adds no second contact, event or stage change.
- No per-item store queries in loops (Architecture Policy 35).

## Test plan
UATs named `test_UAT_FC_REQ-659_*`. Stripe is mocked at its HTTP boundary, with signed test webhooks through EPIC-9's endpoint. Email is asserted on the recorded outgoing message.
- A paid order from a new email adds a contact with the buyer's name and phone, at stage **customer**, with a "paid" event naming the order. The contact has no address.
- A paid order from an email matching an existing contact (different case) adds no contact, moves them to customer, and keeps their existing name.
- The confirmation email is recorded as `email.sent` on that contact. A Resend "delivered" webhook for it attaches `email.delivered` to the same contact.
- Shipped, cancelled and refunded each add their event and email record. A refund doesn't move the stage back from customer.
- A replayed `checkout.session.completed` adds no second contact or event.
- The purchase records no newsletter acceptance.
- People shows the customer's orders, each opening its order in Shop. The order links back to the contact.

## Definition of done
After `bin/deploy --env dev`, make a test-mode purchase on our own test business with a new email address. The buyer then appears in People as a customer, with the order and the confirmation email in their history. Record the result in this ticket.


## Implementation (2026-11-07)

**Where.** `apps/control-app/src/buyers.ts` (new) does enrolment and the order events. `orders.ts`'s paid outcome calls `enrolBuyer` once, on the move to `paid`, before any email. `order-emails.ts` records each buyer email against the contact and writes `email.sent`. `fulfilment.ts` writes `order.shipped`, `order.cancelled`, `order.returned` and `order.refunded`. Migration `0055_buyer_contacts.sql`.

**Design decisions made while building**
- **A contact's phone is a new column, `users.phone`.** Contacts had nowhere to hold one. It's filled only when empty, never overwritten. People shows it read-only on "Who they are"; nothing edits it yet.
- **The order records its buyer's contact, in a new column `orders.contact_id`** (indexed `orders_business_contact`). People lists a contact's orders with one indexed query (Architecture Policy 35), and Shop's order detail returns `contactId` for the link back.
- **The provenance event says the shop.** `addContact` takes an optional `via` (`add` by default, `shop` here). The contact's first event is `contact.created` with `via: 'shop'`, which People's history notes as "From the shop". The `order.paid` event is stamped after the contact exists, so it can never become the contact's origin.
- **New event kinds** in `builder/contact-events.js`: `order.paid` (labelled "Bought"), `order.shipped`, `order.cancelled`, `order.refunded`, `order.returned`. Each has `ref` = the order id, and detail `{number, total, currency, test}`. Shipped adds `tracking`; refunded and cancelled add `refunded`. People notes them as "Order 1001 · €24.99 · Test" and shows an "Open order" link.
- **`order.refunded` is written whenever our own refund button refunds money:** goodwill refunds (no email, as in REQ-644), plus the refunds inside cancel and return. A refund made in Stripe's own dashboard isn't on the contact's history. The payment outcome carries no refund id, so it can't be told apart from one of ours. It still appears on the order's own record.
- **Never backwards also covers the invite.** `markInvited` no longer lowers a later stage (`stagesAfter` in `people-axes.js`). Inviting a customer stamps `invited_at` and records the invite, and leaves them a customer.
- **Delivered and bounced attach the way REQ-198 does it.** The order email's message record carries `contact_id` = the contact. The Resend webhook updates that record's status, so People's Messages shows it as delivered. The `email.sent` event's `ref` is that message's uid. No separate `email.delivered` event is written; that matches every other platform email.
- **Matching runs through `addContact`.** It matches any of the contact's addresses, ignoring case, and fills the name only where empty. A synthetic (probe) order writes into its run's gutter through the scope, the same way a probe's form submission does.
- **Links between the tabs.** People's Orders section and history open the order in Shop → Orders (`onOpenOrder`). Shop's order detail has "Open their contact in People" (`onOpenContact`, `people.openPerson`). Both are wired in `app.js`.

## UAT coverage (as built)
- `tests/test_UAT_FC_REQ-659_buyer_contacts.workers.test.ts` (real router, public-site Worker, signed Stripe and Resend webhooks):
  - a new email → a customer contact with name and phone, no address, history `contact.created`(shop) then `order.paid`, People lists the order, and the order links back;
  - an existing contact in a different case is reused, keeps their name and becomes a customer;
  - the confirmation is recorded on the contact with `email.sent`, and Resend's delivered event attaches to the same contact;
  - ship, goodwill refund and cancel add their events and emails, the stage stays customer, and an invite doesn't pull them back;
  - a replayed completion adds nothing, and no acceptance is recorded.
- `tests/test_UAT_FC_REQ-659_people_orders.test.ts` (jsdom panels):
  - People lists the orders and opens them; the history notes the order and opens it, with the phone and origin shown;
  - Shop's order detail links back to the contact, and has no link without one.

Definition of done (the dev purchase) is still to do after `bin/deploy --env dev`.