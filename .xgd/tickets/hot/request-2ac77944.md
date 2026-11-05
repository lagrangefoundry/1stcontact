---
uid: request-2ac77944
id: REQ-644
type: request
title: 'Shop: fulfilment, cancellation requests, order status page, returns and refunds,
  order emails'
created_by: EPIC-31
created_at: '2026-11-04T17:16:37.567809+00:00'
updated_at: '2026-11-04T22:00:01.314630+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-539b611b
---

## What changes

What happens **after a sale**, for the owner and the buyer: **mark shipped, owner cancellation with a refund, the buyer's order status page with an optional cancellation request, returns and refunds from our own buttons, and the order emails.** Builds on [[REQ-643]] (orders, Checkout, Orders mode). Designed with the operator in the EPIC-31 session, 2026-11-04.

**Money is taken at purchase** ([[GOAL-55]]), so a cancellation after payment is a refund. There are no holds, ship-by dates or hold reminders here (capture on ship is a later fast follow).

**Depends on:**
- [[EPIC-9]] for the **refund operation on the connected account** (operator, 2026-11-04: refunds are made from our buttons at launch, not only in the Stripe dashboard), refund webhooks and credit notes ([[REQ-637]]).
- [[EPIC-30]] for every email: the owner's emails are notifications; the **buyer emails need EPIC-30 to support a buyer recipient and a link to the public order status page.** That architecture (including owner-editable, branded wording) is being decided in EPIC-30; **editable and branded wording is not launch blocking**, so at launch these emails use platform-set wording, are sent in the business's name, and replies go to the owner.

## Owner: in the Orders mode

- **"To ship"** is the Orders list's default filter: paid live orders not yet shipped, cancelled or returned. Test-mode orders never appear in it.
- **Mark shipped**, with an optional tracking number and carrier → order `shipped`.
- **Cancel** a paid, unshipped order (with a confirmation): refunds the full amount through EPIC-9 from our button, issues the credit note, puts the items' availability back and rebuilds their pages, → order `cancelled`.
- **Record return** on a shipped order: choose which lines came back and, per line, whether to **restock** (availability back, pages rebuilt). The **proposed refund** is those lines' total; the owner can change it, up to the amount not yet refunded (for example keeping the postage), and confirms → refund, credit note, order `returned`.
- **Refund** with no return (for example goodwill on a damaged item): any amount up to the amount not yet refunded.
- A refund made **in the Stripe dashboard** still arrives by webhook and appears on the order with its credit note.
- Every one of these, plus cancellation requests and their outcome, appears in the order detail's **chronological record** (REQ-643), alongside the invoice, attempts, payment, refunds and credit notes.
- **Settings (Shop):** "Email the buyer when an order ships" (on by default) and "Let buyers request cancellation" (setting; default chosen by the session and stated here).

## Owner notifications (EPIC-30 notification kinds)

- **New order:** on `paid`. Item(s), amount, buyer name, shipping address, link to the order in the Shop tab. Always on.
- **Cancellation requested:** when a buyer requests it, with a link to the order.

## The buyer

- **Order confirmation email**, always sent on `paid` (operator, 2026-11-04): order number, lines, amount paid, delivery address, the business's dispatch note (setting expectations for shipping), and a link to the **order status page**. Stripe's own receipt is unaffected.
- **Shipped email** when marked shipped, with tracking number and carrier when given, if the owner's setting is on.
- **Cancellation and refund emails:** when an order is cancelled (with the refund), when a cancellation request is declined, and when a return refund is made.
- **Order status page:** reached from the emails by a private, unguessable link, with no login (the [[DOC-5]] rule 24 pattern). It shows the order number, lines, totals, delivery address and a **buyer-safe history** (placed, shipped with tracking, cancellation requested, cancelled, refunded); nothing internal (no decline reasons, no notes meant for the owner).
  - **Request cancellation** button, only when the owner's setting is on and only until the order is shipped, cancelled or returned. **It sends a request; it never cancels.** The order shows "cancellation requested" and the owner is notified.
  - The **owner decides**: **Cancel** (above), or **Decline** with an optional note to the buyer (for example "it's already in the post"). The buyer is emailed either way. This removes the race where an item is posted before the owner marks it shipped and the buyer cancels in between.
- **No buyer accounts at launch.** Returns are not self-service: the buyer contacts the owner, who records the return.

## States added

Order: `paid` → `shipped` → `returned` · `paid` → `cancelled` · `paid`/`shipped` may carry a pending **cancellation request** (paid only) and partial refunds.

## Out of scope

Buyer accounts (to be designed later), owner-editable/branded email wording (EPIC-30), capture on ship, customs paperwork.

## Test plan

UATs named `test_UAT_FC_<REQ-ID>_*`, in the BUG-333 real-Chromium Shop suite (`pnpm test:browser`); Stripe mocked only at its HTTP boundary, refund webhooks as signed test events through EPIC-9's endpoint; email asserted on the recorded outgoing message (EPIC-30's record), not a mock of our own code.
- To ship: shows paid live unshipped orders only; test orders never; shipped/cancelled leave it.
- Mark shipped with and without tracking → `shipped`; shipped email sent only when the setting is on, with tracking.
- Owner Cancel → refund request for the full amount, credit note, availability restored and page rebuilt, `cancelled`, buyer emailed.
- Record return: chosen lines, per-line restock, proposed refund = lines' total, edited amount capped at the refundable remainder, credit note, `returned`.
- Goodwill refund; a dashboard refund webhook appears on the order with its credit note.
- New-order notification and buyer confirmation on `paid`; confirmation carries the dispatch note and a working status-page link.
- Status page: no login, buyer-safe history only; an unguessable link for one order never shows another.
- Cancellation request: button only with the setting on and before shipping; request → "cancellation requested" + owner notified, order not cancelled; owner Cancel or Decline → buyer emailed with the outcome.
- Every action appears in the order's chronological record.

**Definition of done:** the whole suite passes, and after `bin/deploy --env dev` a test-mode order on our own test business is taken through mark shipped (with tracking), a cancellation request and decline, and a return with refund, with the emails received; recorded in this ticket.


## The order status page is L1, via the framework's module seam (operator, 2026-11-04)

- The buyer's order status page is a **page in the business's site definition, built as an L1 module** in the framework, in the same shape as REQ-643's checkout pages (extend that module or the catalogue module; the session records which).
- The module supplies the order data (looked up by the private link), the buyer-safe history, and the Request cancellation control; its client script calls a Worker endpoint ([[DOC-5]] rule 11).
- **Styling is L1 with the site's design tokens**, so it matches the business's site. No hand-written page, no raw template holes (security policy, REQ-82). A default page exists for every site that sells.

Test plan addition: the status page renders through the shared L1 renderer from the site definition; injected text in an order line name is inert on it.