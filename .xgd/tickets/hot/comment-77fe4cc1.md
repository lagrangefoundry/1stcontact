---
uid: comment-77fe4cc1
id: COMMENT-6899
type: comment
title: Comment on goal GOAL-55
created_by: xgd
created_at: '2026-11-02T22:49:20.238490+00:00'
updated_at: '2026-11-04T15:39:54.230899+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: goal-51bfae86
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "922a5587-0c0e-430d-8fc6-38a5d267e936",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="426b155c-b90b-4793-b019-9e79a3523996-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T22:48:41.213669+00:00" -->
#### You
ok lets talk about hitting this goal can you read your epics and their transcripts and look at their children. I am about to load up the first pieces of the implementation to see how they look

<!-- xgd-turn id="426b155c-b90b-4793-b019-9e79a3523996-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T22:51:32.195111+00:00" -->
#### Claude
Reading the two epics, their transcripts and their three children (REQ-631, REQ-633, TODO-18). Both REQs are already coded and at `ready_to_reconcile`. Next I'll look at what they landed.

I've read GOAL-55, both epics with their transcripts, and their three children. Here's where things stand against the goal, and the one problem to know about before you load the new pieces.

## The children

| Ticket | State |
|---|---|
| **REQ-631** Shop tab: inventory, WooCommerce import | Built, at `ready_to_reconcile`. 3 commits on xgd-working, version 0.2.735. |
| **REQ-633** Catalogue: product grid and product pages | Built, at `ready_to_reconcile`. 3 commits on xgd-working, version 0.2.737. |
| **TODO-18** Stripe accounts A and B | Open. This is your task. |
| **EPIC-9 code** | **No child ticket exists yet.** The week-1 plan has the Stripe foundation landing now, but nothing has been filed. |

So the Shop half of week 1 is done four days early, and the payments half hasn't started.

## The problem: the two pieces aren't connected

REQ-631 and REQ-633 were built at the same time, each against the other's interface, and nothing joined them afterwards. I checked the code:

- **The site doesn't read the real inventory.** The site build, the builder preview and publish all get their items from `inventory` in `apps/control-app/src/catalog.ts:63`. That is still REQ-633's in-memory placeholder, which is empty in a deployed Worker. REQ-631's real `liveItems()` in `shop.ts:354` is never called.
- **A Save doesn't rebuild anything.** `shop.ts:369` still has REQ-631's empty placeholder `catalogItemChanged`, which takes `(env, business, itemId)`. The real one is in `catalog.ts:100`, with a different signature (`deps, business, itemId`), and nothing calls it.

**What you'll see:** the Shop tab and the import will work, and the 365 products will appear in the Inventory list. But a product grid placed in the builder will be empty, and Saving an item won't change the site. The suites don't catch this because each one tests its own side of the interface.

The fix is small:
1. Make `inventory` read from `shop.ts`'s D1 `liveItems`, mapping its photo references to `{src, alt}`.
2. Replace the placeholder with a call to the real `catalogItemChanged`, passing `openStore()` and `siteLocksFor(env)`.
3. Add one UAT that goes end to end: Save in the Shop API, then check the published grid.

It should land before Lauren starts on the 9th. I'd do it under REQ-633, since that ticket's own body says it was meant to swap the source. Reconcile hasn't picked up either ticket yet, so adding a commit is still clean. One thing to settle with you first: the process says to check with you before adding commits to a ticket at `ready_to_reconcile`, so I'd ask you to hold off reconciling REQ-633 until the fix is in.

## Before it runs on dev

- Migration **0040_inventory.sql** has to be applied.
- **`bin/deploy --env dev`** is needed. Dev serves a frozen copy of the code, and the deploy also creates the `SHOP_IMPORT` Workflow and the `SITE_COORDINATOR` Durable Object, which both tickets need.
- The import mapping for her shop is in GOAL-55's onboarding notes: Originals ← LO Originals, Reworked, Preloved; merge the two "Brooches"; drop Care Guide.

## Things the built tickets left out or changed

- **REQ-631** has no background sweep for photo descriptions (photos are described when first opened), no drag reordering, and no UI for collection order (there is an API).
- **REQ-633** made Sold, price, Buy and Commission bound text fields rather than module controls. That's sensible, and the ticket records it. A Save can take up to 60 seconds to reach a visitor because of the edge cache.

## Against the plan

- **Lauren building from the 9th:** on track once the wiring fix is in, her business exists with her invited as owner, and you've run the capture of her current site. Those last two are yours, from the "outside both" column.
- **Payments:** this is where the risk is. Week 2 needs `canTakePayments` and the invoice schema from EPIC-9, and week 3 needs checkout sessions and webhooks. None of it can start until TODO-18 gives us test keys, and the foundation ticket doesn't exist yet. I'd file it this week. Stripe's verification of accounts A and B is the only step that involves waiting, so it's worth starting now.
- **Next Shop step:** orders with lines, plus shipping zones (Shop items 3 and 5). Neither needs EPIC-9.

I haven't changed any code or tickets. Shall I do the wiring fix under REQ-633, and file the EPIC-9 foundation ticket?

<!-- xgd-turn id="1096bed0-3fe7-4f92-b62e-1fb15035bc66-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T15:36:12.210187+00:00" -->
#### You
Ok lets take a look at the plan please?

We have some basics in place. I suspect the next steps are: EPIC-31

- Orders, Invoices and a purchase flow
- Shopping cart

Is there anything else we need?

<!-- xgd-turn id="1096bed0-3fe7-4f92-b62e-1fb15035bc66-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T15:39:44.032690+00:00" -->
#### Claude
I'm checking what has landed since Monday so the plan is based on the code as it is now. I'll be done shortly.

I've gone through GOAL-55's plan and what has landed since Monday. Orders, invoices and the purchase flow are the right next step. **The shopping cart is not in the launch minimum.** Under the plan it's the first fast follow in December. Three things you didn't list are in the minimum, and the purchase flow can't go live without the first one.

## What's done (built, all at `ready_to_reconcile`)

| Area | Tickets |
|---|---|
| Inventory, import and the Shop tab | REQ-631, REQ-634, REQ-639, BUG-333 |
| Catalogue on the site | REQ-633 |
| Connecting a Stripe account (Settings → Payments) | REQ-641 |
| Invoice records, gap-free numbering, credit notes | REQ-637 |
| Stripe sandbox accounts | TODO-18 (done) |

The wiring gap from Monday is fixed. The catalogue now reads the real inventory, and Save rebuilds the site. **One new gap of the same kind:** `catalog.ts:33` still has the placeholder `canTakePayments`, which always answers false. The real one is in `stripe-connect.ts:468`, and nothing connects the two. So Buy can never appear, even after an account is connected.

## What's left for launch

**1. Stripe webhooks and Checkout sessions (EPIC-9). You didn't list this, and it's the critical path.** No ticket exists yet. REQ-641 and REQ-637 both list it as out of scope. It covers:
- one webhook endpoint per mode, with signature checks and each event processed only once
- the cache of payment attempts and refunds
- creating the Checkout session on her connected account
- passing completed, expired and failed outcomes to the Shop
- `account.updated` and deauthorisation, which rebuild the pages so Buy appears or disappears
- connecting the real `canTakePayments` to the catalogue

None of the purchase flow can be tested end to end without it.

**2. Orders and the purchase flow (EPIC-31, Shop items 3 and 4).** This is your first bullet:
- orders and order lines, each recording test or live mode
- the database rules REQ-637's migration says orders must add
- the Checkout endpoint: hold the piece, create a pending order, a draft invoice and a Stripe session
- an expired checkout releases the piece
- the Buy button on the product page, plus success and cancelled pages

**3. Shipping zones and countries (Shop item 5). You didn't list this.** Checkout needs it to charge shipping and to know where she ships.

**4. After a sale (Shop items 6–8). You didn't list this either:**
- Fulfilment: mark shipped, with optional tracking and carrier; the "to ship" list (test orders never appear in it); the order detail page with its timeline.
- Emails: the owner's new-order email, buyer confirmation and buyer shipped.
- Returns: record a return, with optional restock. A refund she makes in her Stripe dashboard arrives by webhook and appears on the order with a credit note.

Without these she can take money but can't see what to post.

## Outside the code

- Her business set up with her invited as owner, and the capture of her current site, before she starts building on the 9th.
- Her site's shipping, refund, privacy and terms pages.
- **TODO-20:**
  - Activate the live Stripe accounts. Stripe's verification can take days, so this is the one item worth starting today.
  - Register the webhook endpoints in Stripe once item 1 is deployed.
- The domain, the live smoke test, and her link proven in test mode before it goes live.

## On the cart

Most of her pieces are one-offs, and Buy is already a cart of one. The orders backend (item 2) is built to take several lines, so adding the cart later is UI work plus the "sold while in your cart" message. I'd keep it in December unless you want it at launch. If you do, it adds about half a week.

## Suggested tickets

To keep the count low, I'd file three:

1. **EPIC-9:** webhooks, the payment cache and Checkout sessions, plus connecting `canTakePayments`.
2. **EPIC-31:** orders, shipping zones, the Checkout endpoint and Buy.
3. **EPIC-31:** fulfilment, emails and returns.

Tickets 1 and 2 can be built at the same time. Last time two tickets built side by side never got joined up, so whichever lands second should have to pass a full test-mode purchase on our own test business, written into its ticket.

That schedule is a little ahead of the plan, which had orders in week 2. I haven't created or changed anything. Shall I file the three tickets?

<!-- xgd-chat-end -->