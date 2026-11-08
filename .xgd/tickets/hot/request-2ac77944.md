---
uid: request-2ac77944
id: REQ-644
type: request
title: 'Shop: fulfilment, cancellation requests, order status page, returns and refunds,
  order emails'
created_by: EPIC-31
created_at: '2026-11-04T17:16:37.567809+00:00'
updated_at: '2026-11-07T15:55:10.393502+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-539b611b
  story_points: 20
  commits:
  - working_sha: cfe5627b1cb2c7edd8a926ce240bea4bad48025e
    reconcile_sha: null
    main_sha: null
  - working_sha: 160723384405f6ea2cedc827eba2b1f734b9247e
    reconcile_sha: null
    main_sha: null
  version: 0.2.807
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

## Decisions made by the session (2026-11-07)

I asked the operator these questions on 2026-11-05 and got no answer, so the session went ahead with its proposed defaults. The operator can overrule any of them.

1. **Refunds from our buttons are built here.** `createRefund` in `payments.ts` calls Stripe `POST /v1/refunds` on the connected account with an idempotency key. It uses the same webhook and credit-note path as a refund made in the dashboard, so one refund never gets two credit notes. EPIC-9 has no separate ticket for this.
2. **Buyer emails are built here.** Each one is recorded in the business's store against the order (not against a user or contact). It is sent in the business's name (from its verified sending domain if it has one, otherwise the platform address with the business's name), with **reply-to set to the owner**. Wording is set by the platform. There is no unsubscribe link, because these emails are about the buyer's own purchase.
3. **Owner notifications** are new `notify()` kinds, `new_order` and `cancellation_requested`, sent to the owner and live delegates. They are **exempt from the 5-per-hour notification limit**, so a busy shop never stops hearing about orders.
4. **"Let buyers request cancellation" is on by default.** The owner still decides every request.
5. **Status page module:** a `status` mode on the `checkout` module. It gets a default L1 page drawn inside the site's header and footer, like the other checkout pages. Its client script calls `api/checkout/order` and `api/checkout/request-cancel`.
6. **Private link:** a random 32-byte token. Only its SHA-256 hash is stored on the order. The token goes after `#` in the URL (`/order-status#t=…`), so it never appears in server or CDN logs.
7. **Cancelling after a partial refund** refunds whatever has not yet been refunded, not the full amount.
8. **One ticket**, built on the `free-REQ-644` branch over several turns.
9. **Definition of done on dev:** still waiting on the operator for the test buyer's inbox and confirmation that our test business is connected to a Stripe test account. Until then, an email counts as received when its outgoing record exists and Resend reports it delivered.

## What landed (2026-11-07, branch free-REQ-644)

**Schema (`db/migrations/0053_order_fulfilment.sql`).**
- `orders.status` keeps REQ-643's states and CHECK. A paid order moves on in a new **`fulfilment`** column: none → `shipped` | `cancelled`, then `shipped` → `returned`. The database refuses any other move.
  - The order's state as shown is `fulfilment` if set, otherwise `status`.
  - Rebuilding `orders` to widen its CHECK was rejected, because its implicit delete would cascade into the order's lines.
- A cancelled order puts its stock back exactly once, using a trigger like the expiry release.
- New tables: `order_events` (fulfilment record, each entry with an owner text and an optional buyer-safe text), `order_refunds` (refunds asked from our buttons; the row id is Stripe's idempotency key), `order_returned_lines` and `order_status_links` (the SHA-256 of each status-page token; the token itself is never stored).
- `shop_shipping` gains `email_on_ship` and `buyer_cancel_requests`, both on by default.
- `orders` gains `site_url`, recorded at checkout so emails can link to the status page. It also gains `app_origin`, the control app's origin as the paid webhook reached it, so a buyer's cancellation request can link the owner back without a new config var.

**Refunds (`payments.ts` `createRefund`).** Calls `POST /v1/refunds` on the connected account with an `Idempotency-Key`. The reason goes in the refund's metadata. Stripe's answer goes through the same `processRefund` path as a dashboard refund's webhook, so each refund gets one credit note, carrying the button's reason ("Order cancelled", "Return", "Refund"). The webhook that follows adds nothing.

**Owner actions (`fulfilment.ts`, `POST /api/shop/order/{ship,cancel,return,refund,decline}`).** Each answers the order as it now stands. A state that doesn't allow the action answers 409; an amount over what is refundable answers 400.
- **Refundable** is the invoice total, less what has been credited, less refunds still under way.
- **Mark shipped**, with optional tracking number and carrier. Emails the buyer only when "Email the buyer when an order ships" is on.
- **Cancel** refunds what remains refundable (the full amount, or the rest after a goodwill refund). It also clears any pending request, restocks, rebuilds the item's pages and emails the buyer.
- **Record return** takes the chosen lines and whether each is restocked. The proposed refund is those lines' total, capped at what is refundable; the owner may change it, and 0 is allowed (no refund). → `returned`, and the buyer is emailed.
- **Refund** with no return: any amount up to what is refundable, on an order that isn't cancelled.
- **Decline** a pending request, with an optional note of up to 500 characters. The note goes to the buyer by email and appears in their history.
- The order detail now has `refundable`, `tracking`, `lineIds`, `actions` (which buttons apply) and `cancelRequested`. Its chronological record adds fulfilment events, every refund (ours and the dashboard's) and every credit note.
- The list filter `status=to_ship` shows paid live orders with no fulfilment. Status filters now include shipped, cancelled and returned.

**Emails (`order-emails.ts`, `notifications.ts`).**
- Owner: `notify()` kinds `new_order` (on paid, sent once: items, amount, buyer, ship-to) and `cancellation_requested`. Both go to the owner and live delegates (`teamOf`) and are **exempt from, and not counted toward, the 5-per-hour limit**. A `facts` list (escaped label and value pairs) carries the order details.
  - The link is an auto sign-in into `/b/<biz>/?show=order&order=<id>`. The builder's `show=order` target opens the Shop tab's Orders mode at that order.
- Buyer: `confirmation` (always on paid, with the dispatch note and delivery address), `shipped`, `cancelled`, `cancel_declined` and `return_refund`.
  - Each is recorded in the business's store, with the order id as contact and address id and fields `order_id`, `order_email` and `reply_to`.
  - Sent in the business's name: from its verified domain, otherwise the platform address under the business's name. `reply_to` is the owner's verified address. A test order's subject starts `[Test]`. No unsubscribe link.
  - Each email mints a fresh 32-byte token, and its link is `<site>/order-status#t=<token>`.
  - Synthetic orders, and orders with no buyer email, send nothing. A failed send is recorded or logged, and never fails the webhook or the button.
- `Message` and `OutgoingMessage` gain `replyTo`; Resend is sent `reply_to`.

**Buyer status page.** The `checkout` module gains a `status` mode, with a `request-cancel` control and a `requestCancelLabel` config. The L1 text bind fields gain `state`, `lines`, `subtotal`, `address`, `history` and `requested`.
- A default L2 page is drawn at `/order-status` inside the site's own header and footer. A site's own `checkout` page in `status` mode replaces it.
- Its script reads the token from the URL fragment and posts `api/checkout/order`. It writes every value with `textContent` (line breaks kept) and shows Request cancellation only when the answer allows it.
- Pressing Request cancellation posts `api/checkout/request-cancel` and then says the request was sent. It never says the order is cancelled.
- A token works only on its own shop's site, and only for a paid order; anything else answers 404.
- The buyer-safe history contains: Order placed, Shipped (with tracking), Cancellation requested, the declined request with the owner's note, Cancelled, Return received, and Refunded (successful refunds only).
- A request answers 409 when the setting is off or the order is shipped, cancelled or returned.

**Builder.**
- The Orders list opens on **To ship**. A row is badged "Cancellation requested" when one is pending.
- The detail has action forms: Mark shipped (tracking number and carrier fields); Cancel and refund, with a confirmation step; Decline, with a note; Record return (per line: came back, put back in stock; refund pre-filled with the chosen lines' total, checked against what is refundable before sending); Refund.
- **Settings → Shop** has the two switches, each saving when changed.

## Test plan as built
- `tests/test_UAT_FC_REQ-644_fulfilment.workers.test.ts` (real router, public-site Worker, D1 and R2; Stripe faked at fetch, including `/v1/refunds`; webhooks signed): To ship and shipped email with tracking, plus the setting off; new-order notification and confirmation with a working link; owner Cancel; Record return; goodwill and dashboard refunds, then Cancel refunding the rest; request, decline and cancel; button rules and links never crossing shops; status page published.
- `tests/test_UAT_FC_REQ-644_order_status_page.test.ts` (generator plus client script in jsdom): the default page through L1; the site's own page validates and replaces it; the script draws the order, with injected markup in a line name staying inert; the request never says cancelled; a missing or unknown token.
- `tests/test_UAT_FC_REQ-644_orders_actions.test.ts` (builder in jsdom): opens on To ship; Mark shipped; Cancel's confirmation; Record return's proposed and edited amount; a request flagged and declined; Settings → Shop.
- Not yet done: the BUG-333 real-Chromium Shop suite run, and the definition-of-done walk-through on dev (needs the test inbox and the Stripe test connection, decision 9).