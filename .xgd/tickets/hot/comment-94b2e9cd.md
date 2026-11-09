---
uid: comment-94b2e9cd
id: COMMENT-6740
type: comment
title: Comment on epic EPIC-31
created_by: xgd
created_at: '2026-11-02T17:24:17.509637+00:00'
updated_at: '2026-11-09T20:29:49.250289+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-8146aecd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "054a00ab-b2be-4d47-a7c7-6ed2d1a7b206",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-11-02T17:24:12Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
Please do a capture on laurenowensjewellery.ie — a friend's site moving to us. She has inventory and a shopping cart; sole-proprietor, manual fulfilment. We'd need cart/checkout UI, a UX to manage inventory (picture, description, price, quantity), fulfilment by email to her, payments and payments management. Are there 3rd-party carts we could partner with short-term?

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Live capture can't run in the agent sandbox (Chromium can't use the authenticated proxy) — operator runs `1c capture page` + `1c rights assert`. Site survey: WooCommerce, ~15+ visible pieces €200–€1,800, mostly one-of-a-kind, commission form. Options: Stripe Payment Links per piece (recommended — fits Stripe-only rule, no third-party script), Snipcart, Shopify Buy Button, Ecwid. Embedded vendor JS would need a vetted capability module under the security policy.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
We'd need to integrate Stripe payments (next anyway). I think we need a Catalog module — she needs a UX to manage the catalog, right?

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
EPIC-9 covers Connect, one-off charges, webhooks but not anonymous public-site checkout. Catalogue needs: products as D1 records (live sold state, rebuild on change), price_data at checkout (no Stripe product mirror), atomic hold against double-selling unique pieces via per-site coordinator. Owner UX: item grid, item editor (chat-assisted), orders view, phone-first.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
No cut of her sales for now — friend, beta. Isn't the picture catalogue called the Library? Yes, a new Shop tab: items with photo, description, price, availability — availability an integer not a boolean. Orders and Payments are two screens but mostly data movement; an order is a data object with states.

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Library confirmed (older tickets said 'picture catalogue'). Integer availability makes holds trivial. Order states reserved→paid→shipped, expired, refunded/cancelled. Suggested folding Payments into Orders for the shop — each order has one payment; business-wide payments live in EPIC-9's billing tab.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
How much can Stripe help? Prefer no other 3rd party; open source acceptable. Payments must support subscriptions, history, refunds, and a payment always associates with an Invoice. Can Invoice and Order collapse? Probably not — an Order is a request for goods, an Invoice a request for payment.

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Agreed, keep them separate. Stripe covers Connect, Checkout, invoicing, Billing/dunning, refunds, Customer Portal, Tax. OSS engines (Medusa, Vendure, Saleor, Lago, Kill Bill) are all Postgres servers — a second backend; useful OSS is library-level (stripe-node on Workers, Dinero.js, pdf-lib, Drizzle).

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
0.4% for invoicing, really? I'm nervous about maintaining a copy — cache it, don't copy it. Agree Stripe-only. Is Lauren already on an ecom engine we could integrate with?

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Yes: WooCommerce + official WooCommerce Stripe Gateway — she already has a Stripe account. 365 products, simple, mostly sold archive; plugins Deposits, Flexible Shipping, Catalog Mode. Recommend one-time import over integration (integration keeps WordPress as a second backend). Standard Connect is the only type that links an existing account. 0.4% confirmed (Invoicing Starter) — skip it for shop sales. Cache rule: Stripe is truth, D1 cache keyed by Stripe ID.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
Orders and invoices should be internal records; Stripe for payments only — payments link to those records.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
No, I don't want to run subscriptions ourselves — subscriptions must be owned by Stripe. Does that mean all invoices are Stripe's at 0.4%, or can one-off invoices be separate from subscription invoices?

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
They separate: subscription invoices fall under Billing's ~0.7%; 0.4% applies only to one-off Stripe invoices. One Invoice concept, two sources (internal authoritative; stripe cached). Two numbering series. Never enable Checkout invoice_creation.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
Shop page: item list with nested orders, nested invoices, nested payment attempts, and a detail page. Purchase → order → invoice → attempt(s) until one succeeds in reserving; owner notified. Owner ships and marks shipped; that state change drives card capture. Orders can be returned; payments refunded.

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Manual capture: Checkout holds, Mark shipped captures. Uncaptured holds lapse after ~7 days → 'ship by' date, day-5 reminder, lapsed hold → pay link or cancel; made-to-order items capture at purchase. Cards/Apple/Google Pay only. Invoice numbered at capture so abandoned checkouts consume no number. Return is an order event (optional restock); refund is a payment event (Stripe refund + our credit note). Cancel before ship = release, nothing to refund.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
Buyer emails: we need to support them — it's a setting whether on. Sold archive: we agreed on the value of having them in the portfolio.

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Buyer confirmation and shipped emails are per-business on/off settings; Mark shipped takes optional tracking. Sold pieces stay as a portfolio: Sold badge, no Buy, price hidden by default, 'Commission something like this' link.

<!-- xgd-chat role="user" ts="2026-11-02T17:24:12Z" -->
#### You
Update the payments EPIC, create a Shop EPIC, and a GOAL 'Simple ecom site' with the minimum from both to get Lauren live. Rename Items → Inventory. If cheap, add a chat pane to the Shop tab with tools to add/modify all the objects, help generate descriptions and find sales patterns — in the Shop epic but not the goal.

<!-- xgd-chat role="assistant" ts="2026-11-02T17:24:12Z" -->
#### Claude
Filed EPIC-31 and GOAL-55, revised EPIC-9. Shop assistant follows the Settings tab's pane+assistant-as-callers-of-one-API pattern, so it's cheap. Added a privacy rule: buyer personal data never goes to the AI provider; sales-pattern tools see de-identified data only. Added shipping rates by zone (from her Flexible Shipping setup) as a requirement not discussed before.

<!-- xgd-turn id="b06e8a78-425b-4b5a-9304-b233ace42303-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T17:58:32.553152+00:00" -->
#### You
Please read you spec and GOAL-55 and lets talk about the minimum functionality that you need to provide to meet 55 and how we can get there a step at a time?

<!-- xgd-turn id="b06e8a78-425b-4b5a-9304-b233ace42303-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:02:14.145668+00:00" -->
#### Claude
Reading the tickets is done. Now I'm checking what the codebase already has (Stripe, forms, the Settings tab pattern, sections) so the steps start from what exists.

I've read EPIC-31 and GOAL-55 and checked the code. **Nothing for payments exists yet**: no Stripe dependency, no invoices, no orders, and EPIC-9 has no children. A few things we can build on do exist: the contact-form module and the public-site lead endpoint (the pattern for a dynamic section on a static site), Durable Objects (the per-site lock that stops two buyers getting one piece), `mail.ts`/`resend.ts` for email, and the Settings tab pattern.

## What GOAL-55 really needs

GOAL-55 is done when "her shop is live and taking real orders". Measured against that, I'd trim three things from its current minimum:

1. **WooCommerce order history.** Sold pieces come from the products themselves: the public Store API returns out-of-stock products with no key needed. Old orders are just history. Leaving them out also means we never need her REST key.
2. **The Refund button.** We need webhook handling of refunds anyway, because she can always refund from her Stripe dashboard. So for the first live weeks, a dashboard refund shows up on the order with a credit note, and the button comes later. Record return with restock is cheap and stays in.
3. **Hold-then-capture-on-ship, as the first version.** This is the most complex part of the design: the hold, the ship-by date, the day-5 reminder, lapsed holds, and release on cancel. Taking the money at purchase is the path we're building anyway for made-to-order items. If we build that path first, the shop works end to end, and manual capture becomes one later step that changes only *when* the money is taken.

## The steps

Each step leaves something you can see working.

| # | Step | You can see | Epic |
|---|---|---|---|
| 1 | **Inventory and import.** The inventory item model (integer availability, section, hidden, made to order), an import of all 365 products and photos from the Store API, the Inventory list and the item detail page | Her whole catalogue in the Shop tab | 31 |
| 2 | **Catalogue on the public site.** The product grid, product pages, sold-as-portfolio with "Commission something like this", hidden pieces left out, and a rebuild after each edit | Her shop as a static catalogue on a preview site | 31 |
| 3 | **Stripe foundation.** Connect (her existing account, Standard, test mode), a signature-verified idempotent webhook endpoint, the attempt/refund cache tables, invoice records with gap-free numbering | Her test account linked, and webhook events landing | 9 |
| 4 | **Buy, with the money taken at purchase.** Shipping zones and countries, the Buy endpoint with the per-site lock, order + draft invoice → Checkout → webhook → paid and numbered, expiry releases the stock, the owner's new-order email, the rebuild | A complete test-mode purchase that shows up nested under the item | 31 + 9 |
| 5 | **Fulfilment.** Mark shipped with tracking, the "to ship" filter, the order detail timeline, and the two buyer emails with their on/off settings | The full order lifecycle | 31 |
| 6 | **Hold, then capture on ship.** Manual capture, the ship-by date, the day-5 reminder (a cron job), a lapsed hold → cancel, and cancel → release | The design as specified | 31 + 9 |
| 7 | **Returns.** Record return with restock, dashboard refunds coming in by webhook with a credit note; the Refund button if we have time | Returns handled | 31 + 9 |
| 8 | **Go live.** A test-mode run end to end on her account, the switch to live, her rebuilt site and her domain | GOAL-55 done | goal |

After step 2 she could go live as a catalogue only, with the commission/enquiry link, if her WooCommerce renewal date comes before checkout is ready. After step 4 the shop is real. Steps 5–7 are what make it pleasant to run.

## Questions for you

1. **When is her renewal date?** It decides whether the catalogue-only launch is a real fallback or just a nice property.
2. **Are you happy to build capture-at-purchase first** and add manual capture at step 6? Or should step 4 hold the money from day one?
3. **Are dashboard-only refunds acceptable** for her first live weeks?
4. **Can we drop order-history import** from GOAL-55?
5. **Tickets.** I'd group these into four children rather than eight:
   - steps 1–2: catalogue
   - step 3: under EPIC-9
   - steps 4–5: checkout and fulfilment
   - steps 6–7: holds and returns

   Each would be coded in its own session. Shall I file them and update GOAL-55's minimum to match?

<!-- xgd-turn id="aecf9b8f-8078-468d-8907-27da5d00ca7d-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:18:26.942727+00:00" -->
#### You
We have to be live by the end of this month

**Are you happy to build capture-at-purchase first** and add manual capture at step 6? Or should step 4 hold the money from day one? <-- capture on ship as far as I know is a hard legal requirement in the US. We are not in the US and we are not supporting Amazon. For a small vendor it probably doesn't matter. But we can't go live without it right? Not for long?

<!-- xgd-turn id="aecf9b8f-8078-468d-8907-27da5d00ca7d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:19:16.581748+00:00" -->
#### Claude
No, we can go live without it, and with the end of November as the deadline I'd launch with capture at purchase. (I'm not a lawyer, so this is something for her adviser to confirm, but the evidence points one way.)

**It isn't a legal requirement, even in the US.** The US rule people half-remember is the FTC's Mail Order Rule. It requires you to ship within the time you state (or 30 days if you don't state one), and to offer a cancellation and refund if you can't. It governs shipping time, not when the card is charged. "Don't charge until you ship" was a card-network guideline, and Amazon chose to follow it. In practice, Shopify, Stripe Checkout and WooCommerce's Stripe Gateway all charge immediately by default.

**Ireland and the EU don't require it either.** The Consumer Rights Directive sets these:
- delivery within 30 days unless agreed otherwise
- a 14-day right to withdraw
- a refund within 14 days of withdrawal

Charging at purchase is lawful as long as she refunds properly. The 14-day window is already on our list for her to check.

**She almost certainly charges at purchase today.** The WooCommerce Stripe Gateway has a setting, "Issue an authorization on checkout, and capture later", and it's off by default. She can confirm in WooCommerce → Settings → Payments → Stripe. If it's off, capture at purchase is exactly what her buyers get now.

**Capture on ship is still worth having**, just not for launch. It means she never holds money for an order she then can't fulfil, and that matters most for one-off pieces. It's also the most fiddly part of the design: holds lapse after 7 days, which brings the ship-by date, the reminders and the lapsed-hold states. I'd build it straight after launch, or decide then whether she wants it at all.

## What the deadline means for the plan

We have about four weeks. The first three steps are independent, so they can run in parallel sessions:
- **Weeks 1–2:**
  - Steps 1–2 (catalogue) and step 3 (Stripe foundation) in parallel.
  - Her site rebuild in parallel too: you still need to run the capture.
- **Week 3:** steps 4–5, which give a full test-mode purchase and fulfilment.
- **Week 4:** record return and restock, dashboard refunds coming in by webhook, the run on her test account, the switch to live, and the domain.
- **After launch:** step 6 (hold, then capture on ship) and the Refund button.

If checkout slips, the catalogue-only launch from step 2 is the fallback for the end of the month.

If you agree, I'll put the deadline and the revised minimum into GOAL-55. That means:
- capture at purchase for launch
- dashboard refunds for the first weeks
- no order-history import

Then I'll file the four children. Do you also want me to ask Lauren (or you ask her) to check that capture setting?

<!-- xgd-turn id="2019b380-222e-4b2e-b756-815ffa4389b9-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:22:19.630322+00:00" -->
#### You
By the end of this week, I need a working inventory module - we can migrate all her items and she can see the interface to change them and she can work on building a site.

While she is building a site we can be testing and fixing the ecom pieces to make it work for real.

<!-- xgd-turn id="2019b380-222e-4b2e-b756-815ffa4389b9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:23:40.599303+00:00" -->
#### Claude
The operator wants a child ticket for the inventory module. I'll check the tab and image-library code briefly so the ticket points at the right seams.

Now I'll record the deadline and the plan on GOAL-55, and link the child from EPIC-31.

I've filed **REQ-631, "Shop tab: Inventory list, item editing and WooCommerce product import"**, under EPIC-31. It's at `draft`, waiting for a session to pick it up. I've also written the end-of-month deadline and this plan into GOAL-55, and listed REQ-631 as EPIC-31's first child. It covers exactly what you asked for by Friday:

- **The import.** All her products come in from the WooCommerce Store API, which needs no key: name, description, price, availability, sections and all photos. Sold pieces come too, so they're ready for the portfolio later. Re-running the import updates items rather than duplicating them.
- **A Shop tab with the Inventory list.** It shows photo, name, price, availability and section, with Sold and Hidden badges, a section filter and search.
- **An item detail page** where she edits photos, name, description, price, availability, section, hidden and made to order. New and delete are included.
- **Room for orders later.** The data model is shaped for them, but no money and nothing on the public site yet.

Two things the child session will have to settle, both written into the ticket:
- **Scale.** About 365 products with roughly 8 images each is around 2,900 images, too many for one Worker request. The import has to run as a background or resumable job.
- **Cost.** Our upload pipeline describes every image with an AI call. The session should choose between describing all images now and describing only the main one now, with the rest later.

**The catalogue isn't in REQ-631.** Once she's building her site, she'll want her products on it fairly quickly. That means the product grid and product pages, which I'd make the next child, early next week.

Still open in GOAL-55, marked as awaiting your confirmation:
- capture at purchase for launch
- dashboard-only refunds at first
- no order-history import

Lauren should also check the "Issue an authorization on checkout, and capture later" setting in WooCommerce → Settings → Payments → Stripe. If it's off, which is the default, she charges at purchase today.

<!-- xgd-turn id="1a8eb112-7ec4-48e0-bd31-2dc471a16be9-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:29:15.856575+00:00" -->
#### You
Additional requirement - may need to be a fast follow - but we do need a multi-item cart

<!-- xgd-turn id="1a8eb112-7ec4-48e0-bd31-2dc471a16be9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:30:03.674077+00:00" -->
#### Claude
I'll add the cart to EPIC-31's spec, and note in GOAL-55 that it is required. Reading the current body first so I edit in place rather than rewriting.

I've added a multi-item cart to EPIC-31's spec, under a new section, "The cart", and noted in GOAL-55 that it's required and can be a fast follow.

**Most of what makes it cheap is built in from the start.** Orders now have **order lines** (an item, a quantity, and the price at the time of the order). Checkout takes a list of lines, and a single Buy is just a cart with one line. So when the cart arrives, it's only the browser-side pieces: Add to cart, a cart drawer or page, and quantity changes. Nothing in the backend gets reworked. If it slips past launch, nothing has to be undone.

What I specified:
- **The cart lives in the buyer's browser.** No login and no server session, so the site stays static.
- **Adding to the cart doesn't hold stock; Checkout does.** All lines are held in one atomic step. If a piece has sold or its price has changed, the buyer is told which line before reaching Stripe, and can carry on with the rest. Prices are always re-read from our records; the cart's copy is never trusted.
- **One order means one payment, one shipping rate for the buyer's zone, and one shipment.** No split shipments.
- **A return names which lines came back,** and she picks which of them to restock. The proposed refund is those lines' total, and she confirms the amount.
- **A mixed cart with a made-to-order piece is captured at purchase,** once capture on ship exists.

REQ-631 doesn't change: inventory items are the same with or without a cart.

**One check for you:** her current shop probably has shipping rules that depend on the number of items, through the Flexible Shipping plugin. I've specified one rate per order per zone. If she charges more for more pieces, the shipping child will need that rule as well.

<!-- xgd-turn id="b05b56b1-4c17-44a7-916e-189992bb9afa-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:32:46.864663+00:00" -->
#### You
She is shipping jewelry - I would expect flat rate for multiple items

<!-- xgd-turn id="b05b56b1-4c17-44a7-916e-189992bb9afa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:33:08.416948+00:00" -->
#### Claude
Agreed. I'll record that as settled in the shipping section.

I've recorded it in EPIC-31's Shipping section: **one flat rate per zone, however many items are in the order**, with no per-item, weight or quantity rules. That matches what the cart section already says (one rate per order), so nothing else needed changing. All she has to configure is her zones, a price for each, and the countries she ships to.

<!-- xgd-turn id="37a29bc0-63a4-42c2-a6f5-8e372bc00c25-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:38:13.607948+00:00" -->
#### You
She has only 3 purchases to date that have gone out of Ireland. What do we know about customs duty, import taxes etc. I assume these would typically be paid upfront at the post office. Ideally we would produce a form that describes the contents price, calculates taxes to be paid and lets her pay them at the PO?

<!-- xgd-turn id="37a29bc0-63a4-42c2-a6f5-8e372bc00c25-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:39:08.301121+00:00" -->
#### Claude
The usual model is the other way round. **For goods leaving the EU, the buyer pays duty and import tax at the destination**, normally to their own carrier or post office when the parcel arrives. Nothing is paid at the Irish post office. What she does at the post office is the customs declaration.

This is from general knowledge, and I haven't checked current rules. Some details below change often and need checking with An Post or her adviser.

## What applies where

- **Within the EU:** no customs, no duty and no declaration, the same as posting within Ireland. If she's VAT-registered and her EU-wide distance sales pass €10,000 a year, VAT is charged at the buyer's country's rate through OSS. That's part of the "is she VAT-registered?" question already on her list.
- **UK, US and the rest of the world:**
  - **The paperwork.** She completes an electronic customs declaration: An Post has required the data online since 2021, for its CN22/CN23 forms. It covers what the parcel contains, an HS (customs) code for each item, its value, origin Ireland, and the weight.
  - **The money.** The buyer pays the duty and import VAT, plus the carrier's handling fee, on delivery.
- **Exceptions where the seller pays up front** (called "DDP", delivered duty paid):
  - **UK.** For parcels of £135 or less, the UK expects the overseas seller to register for UK VAT and charge it at checkout. Small sellers who don't register leave the buyer paying VAT plus a Royal Mail fee.
  - **US.** The US ended its duty-free allowance for low-value parcels in August 2025. Postal routes have been in flux since then: An Post paused US shipping for a period. Jewellery also attracts a tariff. Of everything here, this is the most likely to have changed.

## What I'd build, and what I wouldn't

I would **not build the tax calculator or prepayment.** It needs:
- each country's duty tables, which in practice means a paid service such as Zonos or Avalara. That's a new outside dependency, which our architecture rules try to avoid.
- in the UK's case, a VAT registration she doesn't have.

With three non-Irish orders to date, the cost is far out of proportion. If she ever wanted it, the right move is a carrier's DDP service, not ours.

These two parts are worth having:
1. **An import-duty notice, needed for launch, which costs no code.** A line on her shipping page and at checkout: *"Orders outside the EU may be charged import duty and taxes by the destination country, payable by the recipient."* This avoids the classic complaint from a buyer who gets a surprise charge.
2. **A customs declaration helper, later.** On a non-EU order, the order page lays out each line's description, HS code, value, origin and weight, ready to copy into An Post's online form. The only new data is an HS code. That could be a default per section, since jewellery is mostly one heading (7113), with a per-item override.

I've recorded both in EPIC-31: the helper and the DDP exclusion under "Deferred", and the duty notice as launch copy. Neither touches GOAL-55's build list.

**One choice for her:** she could simply not ship outside the EU at launch. Her list of shipping countries is already a setting. With three such orders ever, that may be the simplest answer until the helper exists.

<!-- xgd-turn id="1ff81670-266a-4cd6-9208-7d2373142772-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:44:39.565142+00:00" -->
#### You
I was not suggesting that we build anything buyt the FE we would have to find a partner to do the calculations for us. What you are suggesting works and is a fast follow

<!-- xgd-turn id="1ff81670-266a-4cd6-9208-7d2373142772-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:45:19.485485+00:00" -->
#### Claude
Understood: our own front end over a partner's calculation, not duty tables of our own. I've updated EPIC-31 and GOAL-55 to say so. Customs now lands in three stages:

- **For launch:** the import-duty notice on her shipping page and at checkout. It's only copy, so it goes in with her site pages.
- **Fast follow:** the customs declaration helper on non-EU orders. For each line it shows the description, the HS code (a default per section, with a per-item override), the value, origin Ireland and the weight, ready for An Post's online form.
- **Later:** duty prepayment, as our front end over a partner's calculation (a duty service or a carrier's prepaid-duty offering). Adopting a partner means adding them to our architecture's short list of allowed outside services. For the UK, she would also need a UK VAT registration.

The fast-follow list after launch is now the multi-item cart UI and the customs helper, then capture on ship and the Refund button. REQ-631, the inventory module due Friday, is unaffected.

<!-- xgd-turn id="573c7f3f-6e75-44c5-9324-105c4243e3b3-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:54:20.937093+00:00" -->
#### You
ok what is our min functionality for GOAL-55 based on this conversation? And what are our fast follows?

<!-- xgd-turn id="573c7f3f-6e75-44c5-9324-105c4243e3b3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:54:59.105860+00:00" -->
#### Claude
Here's where the conversation leaves GOAL-55: live by **30 November**, with **REQ-631, the inventory module, due Friday 6 November**.

## Minimum to go live

**Shop (EPIC-31)**
1. **Inventory.** Items with an integer availability, section, hidden and made to order, all 365 products and photos imported from the WooCommerce Store API, the Shop tab's Inventory list and item detail page. *(REQ-631, this week)*
2. **The catalogue on her site.** The product grid, a page for each product, sold pieces kept as a portfolio (Sold badge, no price, "Commission something like this"), hidden pieces left out, and a rebuild whenever availability changes.
3. **Orders built for a cart from day one.** Orders have lines, and Checkout takes a list of lines; launch uses a single Buy button, which is a cart of one.
4. **Checkout with the money taken at purchase.** The per-site lock so two buyers can't get one piece, order → draft invoice → Stripe Checkout → paid and numbered, an abandoned checkout releasing the stock.
5. **Shipping.** One flat rate per zone, however many items, plus the list of countries she ships to.
6. **Fulfilment.** Mark shipped with optional tracking, the "to ship" filter, and the order detail page with its timeline and actions.
7. **Emails.** The owner's new-order email, plus buyer confirmation and buyer shipped, each a per-business on/off setting.
8. **Returns.** Record return with optional restock; a refund made in her Stripe dashboard shows up on the order, with a credit note.

**Payments (EPIC-9)**

9. **The Stripe foundation:**
   - Connect to her existing Stripe account
   - no platform fee
   - a signature-verified, idempotent webhook endpoint
   - payments and refunds cached from Stripe, with Stripe as the truth
   - our own invoices, numbered gap-free when the money is taken, with credit notes
   - a test-mode run end to end on her account before going live

**Outside both epics**

10. Her site rebuilt in the builder (you run the capture), with the commission enquiry form and the refund, shipping, privacy and terms pages. The shipping page includes the **import-duty notice**.
11. Her domain moved to us, or pointed at us.
12. For her to check: the 7-day vs 14-day return window, whether she's VAT-registered, and her current Stripe capture setting.

**Fallback if checkout slips:** launch with items 1, 2 and 10 as a catalogue with an enquiry link only.

## Fast follows, roughly in order

1. **The multi-item cart:** Add to cart, the cart view, changing quantities, and a message for any piece that's sold out at checkout.
2. **The customs declaration helper** for non-EU orders, with an HS code default per section.
3. **Hold, then capture on ship:** the ship-by date, the day-5 reminder, lapsed hold → cancel, and cancel → release.
4. **The Refund button** in the Shop tab.

## Later

- the pay link for lapsed holds
- duty prepayment through a partner
- the Shop assistant
- deposits
- price on request
- invoice PDFs
- WooCommerce order-history import

**Three of these I've assumed rather than had from you:**
- capture at purchase for launch
- dashboard-only refunds at first
- no order-history import

GOAL-55's body now has its original minimum with several updates appended below it. If you confirm these three, I'll rewrite its minimum and fast-follow sections as this one list, so whoever picks up the next child reads the plan as it stands.

<!-- xgd-turn id="0effbe7f-1c60-40ee-80a9-1584390df686-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:56:36.779405+00:00" -->
#### You
ok I want you and EPIC-9 to update GOAL-55 - you go first - you need to align on each other's work and on ordering via that ticket

The priority for me as I said is Lauren's UX so she can work on her site next week

<!-- xgd-turn id="0effbe7f-1c60-40ee-80a9-1584390df686-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:59:03.580786+00:00" -->
#### Claude
My earlier `--append-body -` calls wrote a literal "-" rather than the text. I'll check EPIC-31 for the same damage, then rewrite GOAL-55 in full.

Now I'll rewrite GOAL-55 in full: the consolidated minimum, the ordering by week, the split of work between the two epics, and the points EPIC-9 has to confirm.

GOAL-55 is updated. I'll check whether the EPIC-9 session is reachable so I can hand it over.

I've rewritten GOAL-55 as the single plan both epics work from. **The EPIC-9 session isn't running**, so it hasn't seen the changes yet. When you start it, point it at GOAL-55's sections marked "EPIC-9 to confirm".

**GOAL-55 now has:**
- **Priority.** Lauren's own experience comes first. From next week she can see and edit her products and build her site with them on it. Taking money is tested and fixed behind her.
- **The Shop minimum**, the 8 items we agreed: capture at purchase, dashboard refunds, one flat rate per zone, orders built for a cart from day one.
- **The EPIC-9 minimum**, kept as written, with a note that it now needs only automatic capture and refunds coming in by webhook.
- **A who-owns-what table and the handshake between the epics.** The Shop owns inventory, orders, shipping, the per-site lock, the Checkout endpoint, the Shop tab, the emails and the site sections. EPIC-9 owns:
  - the Stripe connection
  - the webhook endpoint
  - the Stripe cache
  - invoices with their numbering and credit notes
  - the Stripe operations
  
  The Shop creates the order, asks EPIC-9 for a draft invoice and a Checkout session, and EPIC-9's webhook calls back to the Shop with the outcome.
- **Ordering by week:**

| Week | Shop | Payments | Lauren / outside both |
|---|---|---|---|
| 1 (2–6 Nov) | REQ-631, the inventory module, due Friday | Stripe foundation | you run the capture of her current site |
| 2 (9–13 Nov) | **the catalogue on her site first thing**, then orders and shipping | her account connected in test mode | she builds her site |
| 3 (16–20 Nov) | checkout, fulfilment, emails | the end-to-end handshake in test mode | |
| 4 (23–27 Nov) | returns | switch to live | the domain |
| 30 Nov | **live** | | |

- **Fast follows, Later, and the decisions taken today**, all written into the ticket.

**Next child for the Shop:** the catalogue on her site. She needs it early next week, and I can file it now if you want it running in parallel with REQ-631.

**I also found and fixed a mistake of mine.** My earlier appends to GOAL-55 and EPIC-31 had written a literal "-" instead of their text. The full rewrite of GOAL-55 replaces them, and I've restored EPIC-31's Children section, which now also points to GOAL-55 for ordering.

<!-- xgd-turn id="9beb6a83-6d39-47e6-961a-fac634dfbaeb-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:34:21.019768+00:00" -->
#### You
please take one more pass on GOAL-55

An then lets talk about your initial tickets, and any dependencies that you might have on EPIC-9

Initial tickets -> get Laurens UX ready for her to work on a site

<!-- xgd-turn id="9beb6a83-6d39-47e6-961a-fac634dfbaeb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:36:10.696579+00:00" -->
#### Claude
EPIC-9 has edited GOAL-55 since my rewrite. I'll read the rest of what it changed before making my pass.

Now the initial tickets. I'll check where REQ-631 stands and how a framework section gets its data, since the catalogue depends on both.

I've made my pass on GOAL-55. EPIC-9 had already confirmed the ownership table and written its own minimum: the Payments section in Settings, the webhook event list, and a test path on our own Stripe accounts. My changes fit the Shop's sections to those:

- **Catalogue (Shop item 2):**
  - It can be placed in the builder like any other section, so the site consultant can put her product grid on a page.
  - Until the business can take payments, an available piece shows an enquiry link where Buy would be. That same state is the catalogue-only fallback, so **the catalogue never waits for EPIC-9**.
- **Orders and checkout (items 3, 4 and 6):**
  - Every order records test or live mode when it's created.
  - The Checkout endpoint refuses unless the business can take payments.
  - The timeline reads payment attempts and refunds from EPIC-9's cache and keeps no copy.
  - Test-mode orders never appear in "to ship".
- **A new table, "What the Shop needs from EPIC-9, and when":**

  | Shop item | Needs from EPIC-9 | By |
  |---|---|---|
  | Inventory and catalogue | nothing | — |
  | Buy-button state | one read, `canTakePayments(business, mode)`, plus a signal when it changes so the Shop can rebuild | end of week 2 |
  | Orders | the invoice and invoice-line tables, so an order can point to its invoice | end of week 2 |
  | Checkout | draft invoice, a Checkout session on her account, webhook outcomes passed to the Shop | start of week 3 |
  | Returns | dashboard refunds reaching the Shop, credit notes | week 4 |
  | Testing | our own test business with a shop | start of week 3 |

  EPIC-9 still has to confirm the dates.
- **The "Outside both" column:**
  - week 1 now includes setting up her business on 1st Contact and inviting her as owner
  - week 4 now matches EPIC-9's test path: a live smoke test on our own test business, her link proven in test mode, then live

## The tickets that get Lauren working on her site

**Neither ticket depends on EPIC-9.** The Shop's dependencies on EPIC-9 only start with orders, at the end of week 2.

1. **REQ-631, the inventory module** (filed, still `draft`, due Friday). The import of all 365 products and photos, the Inventory list and the item detail page.
2. **The catalogue on her site** (not filed yet). Your priority is that she builds her site with her products on it, so I'd file this now and run it in parallel. It would cover:
   - a **product grid** section, built from her inventory and filterable by section
   - a **page for each product**, generated from its record
   - sold pieces as a portfolio, and hidden pieces left out
   - the enquiry link where Buy will be
   - the preview updating when she edits an item

   It's the only real design work in the first week. The framework's sections (contact form, carousel) don't currently read business data, and nothing generates pages from records yet. So the ticket introduces "a section built from her records" to the site generator.

**Why two tickets and not one:** they touch different parts of the code (the Shop tab versus the framework and site generator), and one session can't finish both by Friday. The catalogue's only dependency is REQ-631's item model, which REQ-631's body already sets out, so the catalogue session can start from that today rather than waiting for the code.

**Three things only you can do this week, not tickets:**
- create her business on 1st Contact and invite her as owner
- run the capture of her current site
- ask her to check her Stripe capture setting

Shall I file the catalogue ticket?

<!-- xgd-turn id="01289a9c-ffc5-4e1c-9e72-be7c9b5f680e-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:38:47.200928+00:00" -->
#### You
2 is part of the Shop tab, right?

I am imagining a Shop tab (item list plus detail page) which show:
Inventory 
Orders - Orders - Invoices - Payment attempts and Payments

For our short term goal we need the inventory, right?

<!-- xgd-turn id="01289a9c-ffc5-4e1c-9e72-be7c9b5f680e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:39:15.726825+00:00" -->
#### Claude
No. Item 2, the catalogue, is **the public site**: what her buyers see. The Shop tab is her back office.

- **The Shop tab** is where *she* manages her products and orders. REQ-631 builds it.
- **The catalogue** is what *buyers* see: the product grid and a page for each piece on laurenowensjewellery.ie. It's built from her inventory records and placed on her pages in the builder, like the contact form or carousel are today. It's the same data, shown on the other side.

**For next week, yes: the Shop tab needs only Inventory.** But if she's building her site next week, she'll want her products on it, and that's the catalogue. Without it she can edit her 365 items but can't put them on a page. So her UX next week is the two together: REQ-631 for the tab, plus the catalogue ticket for the site.

**On your Shop tab layout:** you describe two top-level lists, Inventory and Orders, with each order opening into its invoices, payment attempts and payments. That's different from what EPIC-31 says now, which is a single Inventory list with each item's orders nested under it and no separate Orders screen. **I think yours is right, and the cart is the reason.** Once one order can hold several pieces, nesting orders under items puts the same order under each of its items, and "what do I need to post?" becomes an orders question, not an inventory one. So I'd change EPIC-31 to:

- **Inventory**: a list plus a detail page. The item's detail shows the orders it appears in.
- **Orders**: a list plus a detail page. The "to ship" filter and "show expired" live here, and the detail page has the timeline and the actions. Each order opens into its invoices, then its payment attempts and refunds.

Orders isn't needed until checkout, in week 3, so REQ-631 doesn't change. Shall I make that change to EPIC-31 and file the catalogue ticket?

<!-- xgd-turn id="83856576-2fb2-4862-b795-9febe01b0516-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:45:19.756216+00:00" -->
#### You
Orders does not go under Inventory that's weird. Both are top level.

Lets focus on inventory.

Catalog then is a new module. It needs to support a design system - and that in turn needs to be connected to the site design. Each catalog item needs consistent styling and layout. The module itself should supply the data and the way that styling is stored - do you agree? (styling must be in L1)

<!-- xgd-turn id="83856576-2fb2-4862-b795-9febe01b0516-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:46:23.580170+00:00" -->
#### Claude
Let me look at how existing modules hand presentation to L1, so my answer rests on the real mechanism.

Agreed, and I've changed EPIC-31: **Inventory and Orders are both top-level views**, each a list with a detail page. An item's detail page links to the orders it appears in, rather than holding them. REQ-631 doesn't change.

## The catalog module

Yes to a new module. I'd adjust one part of how you put it: **the module supplies the data and the shape of the styling, and the styling itself is stored in L1 in the site definition.** That's exactly how the existing modules already work:

- **The carousel** owns only behaviour (snap scrolling, autoplay) and declares named **slots**. Each slot is an L1 subtree in the page's definition that sets the whole look.
- REQ-96 went further and deliberately removed even "slides per view" from the module, because it was a visual setting in disguise. Our framework rules forbid visual settings on a module.

The catalog follows that rule.

**What the catalog module owns:**
- **The data.** It reads her inventory records at build time: visible items only, filtered by section, in an order of her choosing.
- **The contract.** Two slots:
  - a **card** template, used for every item in the grid
  - a **product page** template, used to generate one page per visible item
- **Bindable fields.** Name, photos, price, section, description, the Sold state.
- **Controls the module wires up.** Buy, the enquiry link that stands in for Buy until she can take payments, and "Commission something like this".
- **Behaviour.** A piece that's sold hides its price and swaps Buy for the commission link. A hidden piece is left out.

**What L1 owns:** the look of the card and the product page, using the site's own design tokens (fonts, colours, spacing), like any other section.

**Consistency comes from the structure.** There's one card template per grid and one product-page template per site, applied to every record. Two items can't drift apart because neither has its own styling. And because the templates are ordinary L1, the consultant designs them the way it designs anything else on her site, so the catalog follows her site's design.

**What's genuinely new, and where the work in this ticket is:**
1. **Binding a record's fields into L1.** The carousel's slots hold content written into the template ("this slide says X"). The catalog needs one template filled from 365 records. That means a new typed L1 primitive: a text or image node that names a field ("the item's name", "its first photo", "its price, formatted") instead of holding the text or image itself. Our security policy says new needs get a typed L1 primitive, never a raw templating hole, so the bound values pass through the same escaping as everything else.
2. **Generating pages from records.** Nothing in the site generator produces one page per record yet. The product-page template plus her inventory would produce `/shop/<item>` pages, with a rebuild whenever an item changes.
3. **The consultant learning to use it.** It has to be able to place a product grid and design its card and product page, or Lauren can't build her shop pages next week.

This is the hardest ticket of the first two weeks. I'd file it as the second child of EPIC-31, beside REQ-631, so it can start against REQ-631's item model today. Shall I file it?

<!-- xgd-turn id="fdc2ab7e-5670-4747-b640-55c7c1c371e8-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:48:44.984820+00:00" -->
#### You
How does the site know which inventory items to display?

<!-- xgd-turn id="fdc2ab7e-5670-4747-b640-55c7c1c371e8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:49:16.546895+00:00" -->
#### Claude
The site never keeps its own list of items. It decides from two things: **the item's own switch** and **each grid's selection rule**.

**1. The item decides whether it is on the site at all.**
- Every inventory item that isn't **hidden** is published and gets its own product page at `/shop/<item>`. That includes sold pieces, which stay on as her portfolio.
- **Hidden** removes the item from every grid and every page.
- She controls this from the item in the Shop tab, never by editing pages.

**2. Each product grid on a page holds a selection rule, not a list.** The rule is part of the grid's settings in the site definition (it's about data, not looks, so it's allowed module configuration):
- **which sections**: e.g. only Rings, or all of them
- **which availability**: in stock, sold, or both
- **an order**: newest first, price, or her own manual order
- **an optional limit**: e.g. "the 8 newest"

So her home page might have "New in", which is in stock, newest first, limit 8. A Shop page might have one grid per section, and a Portfolio page might show sold pieces only. When she adds a ring, it appears in every grid whose rule matches it, with no page edits. Each card links to that item's product page, which always exists because every published item has one.

**When the site reads the records:** at build time, from the inventory records. The preview in the builder reads them live, so an edit in the Shop tab shows up while she's building. A sale, an expiry or a restock triggers a rebuild of the published site.

## Two things to settle before I file this

1. **"Section" is carrying two different things.** Her current site groups pieces as **Originals, Reworked and Preloved**. Her WooCommerce categories are a different axis: **Rings, Pendants, Charms and Fixtures, Bracelets, Chains, Earrings, Brooches, Custom work**. A grid rule probably wants both ("reworked rings"). EPIC-31 and REQ-631 currently give each item **one section**, taken from its first WooCommerce category, which would lose one of the two axes. I'd change REQ-631 so each item has a **collection** (Originals, Reworked or Preloved) **and one or more categories** (Rings, Earrings and so on), both editable, and both available to grid rules. REQ-631 is still `draft`, so the change costs nothing now. I'd also have to check where Originals, Reworked and Preloved live in WooCommerce: they may be tags.
2. **Do item edits go live immediately, or wait for her Publish?** Sales have to go live immediately, so a sold piece can't be bought twice. For her own edits to price, description and photos, I'd say also immediately: these are shop records, not page design. The alternative is holding them until she publishes the site, like a page change. Immediate is simpler, but a half-finished description would be visible to buyers while she types.

Once you've decided these, I'll update REQ-631 and file the catalog module ticket with the selection rule, bindable fields and page generation described above.

<!-- xgd-turn id="3e3c5f19-80fc-44b1-a62b-2d2a46c50fb2-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:53:38.437410+00:00" -->
#### You
Inventory should not be connected to site publication they are separate.

I think we should have the ability for an inventory item to exist in the system but not visible on the site: hidden or draft status - changes is a little more complicated. I suggest that an item is live or not if its live everything on it is visible - there's no price change that stays in draft (outside of the current editing screen obviously hitting [Save] publishes it if the item is live? Make sense? Can you play that back?

<!-- xgd-turn id="3e3c5f19-80fc-44b1-a62b-2d2a46c50fb2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:54:10.291809+00:00" -->
#### Claude
Here's how I understand it.

**Inventory and site publishing are separate.**
- The site's Publish button covers the site's design: pages, layout, where a product grid sits and what its rule selects, and how cards and product pages look.
- Inventory has its own on/off per item and never waits for the site's Publish.

**Each item is either live or not live.** There's one switch, replacing "hidden" and any idea of draft edits.
- **Not live:** the item exists in the Shop tab but appears nowhere on the site: no product page, in no grid. New items start here, so she can prepare a piece before showing it.
- **Live:** everything on the item is public. There's no separate draft copy of a live item, so no unpublished price change sitting in the background.

**Save is the publish step for an item.** Changes in the item's edit screen are only hers until she presses **Save**. Saving a live item puts the change on the site straight away. Saving an item that isn't live just stores it. Switching an item to live or not live takes effect on Save too.

**Sold is separate from live.** A live piece with availability 0 stays on the site as portfolio, marked Sold with no price. To take a sold piece off the site, she switches it to not live.

One consequence of this, because the public site is static: pressing **Save** on a live item, or a sale, rebuilds that item's product page and any grids it appears in. That rebuild happens on its own, without the site's Publish. The two meet only at the grids:
- the grid's position and rule go live when she publishes the site
- the items inside it follow each item's own Save

**One question:** should imported items arrive live or not live? I'd import them **live**, because they're all public on her current site today. Her new site isn't published yet anyway, so nothing shows until she publishes it.

If this matches what you meant, I'll write it into EPIC-31 and REQ-631. That replaces "hidden" with live/not live and adds "Save publishes a live item". I'll also include the collection plus categories change from my last message, unless you'd rather keep a single section.

<!-- xgd-turn id="b0c9f23f-dd07-45c4-a13e-2007c2367faf-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:02:38.069249+00:00" -->
#### You
Sure imported content defaults to live

<!-- xgd-turn id="b0c9f23f-dd07-45c4-a13e-2007c2367faf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:04:05.978063+00:00" -->
#### Claude
GOAL-55 still says "hidden" in its Shop item 2, so I'll align that line too.

I've written your live/not-live model into EPIC-31, REQ-631 and GOAL-55, with imported items arriving live. REQ-631 is still `draft`, so the changes are in before anyone starts on it.

**In all three tickets:**
- **Inventory is separate from site publication.** The site's Publish button covers its design: pages, where grids sit, each grid's selection rule, and the card and product-page styling.
- **Each item is live or not live.** This replaces "hidden".
  - New items start not live.
  - Imported items arrive live.
  - A live item has no draft copy.
- **Save is an item's publish step.** Edits stay private until Save. Saving a live item updates the site straight away, without the site's Publish.
- **Sold is separate from live.** A live sold piece stays on the site as portfolio. Switching it to not live removes it.

**REQ-631 only stores the live flag and the Save.** Making the site follow a Save belongs to the catalog ticket, because REQ-631 has no public-site output.

**I also made the collection-and-categories change**, since you didn't object:
- Each item has one **collection** (Originals, Reworked or Preloved) and any number of **categories** (Rings, Earrings and so on), both from lists the business can add to.
- The import brings across every WooCommerce category. It sets the collection where a category or tag matches one of her collection names.
- Where her site actually records Originals, Reworked and Preloved is still unknown, so the session building REQ-631 will check that.

If you'd rather keep a single section, it's a quick revert while REQ-631 is still `draft`.

**EPIC-31 now also describes the catalog module** as we discussed it:
- The module supplies the data, the template slots, the fields that can be bound into them, and the controls.
- Styling lives in L1, with one card template and one product-page template applied to every record.
- Each grid holds a selection rule: collection, category, availability, an order, a limit.
- Every live item gets its own product page.

The catalog ticket isn't filed yet. Shall I file it now so it can run in parallel with REQ-631?

<!-- xgd-turn id="85c4e5fc-3759-4414-b943-90f536f829f8-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:12:12.292026+00:00" -->
#### You
Can we take a moment on prices
Price should be a number and a currency
In general (not for Lauren) we need to support multiple prices for an item in different currencies and regions. We also need to consider (not for now) discounting and how it is represented.
We need to be very careful with price rounding - customer should pay exactly what they see and what we show should be exactly that.
the order needs to capture the exact price a customer agreed to

<!-- xgd-turn id="85c4e5fc-3759-4414-b943-90f536f829f8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:12:58.423320+00:00" -->
#### Claude
Agreed on all four points. This is how I'd pin them down.

## How a price is stored

- **An integer number of the currency's smallest unit, plus an ISO currency code.** For example, €19.99 is `{amount: 1999, currency: "EUR"}`. No decimals and no floating point anywhere: not in storage, in calculations, or in what we send to Stripe. A currency with no smaller unit, like the yen, has `amount` equal to the whole number. Stripe takes amounts in the same smallest units, so nothing is converted on the way to Stripe.
- **Items hold a list of prices from day one**, not a single price field: one row per currency and market, where a market is a set of countries.
  - **For Lauren:** a single EUR price for all markets.
  - **Later:** a GBP price for the UK, and so on. The data shape already allows this, so adding it needs no change to existing items.
- **Every price is set by her; none is converted.** We never show a price derived from an exchange rate. Converted prices are exactly where rounding surprises come from.

## The customer pays exactly what they see

- **Shown prices include any tax.** EU consumer law requires shop prices to include VAT. If she is VAT-registered, the VAT is worked out from the price for the invoice, never added on top. So the sticker price is the price she charges.
- **Display comes straight from the integer.** 1999 EUR is formatted as "€19.99" with exactly the currency's number of decimal places. A shown price can never be a rounded copy of the real one.
- **All totals are integer sums:** each line is unit price × quantity, plus one shipping amount, giving a total. Adding integers can't produce a rounding difference.
- **Rounding happens in only two places, and never changes the total:**
  - the VAT breakdown on an invoice (how much of €19.99 is VAT)
  - later, discounts
  
  Each will have one defined rounding rule, applied once.
- **A cart has one currency.** Mixing EUR and GBP in one cart isn't allowed.

## The order records the exact price the customer agreed to

- **Each order line stores** the unit price, the currency, the quantity and the line total, as charged. The order stores the shipping amount and the total. Each of these is copied at the moment of purchase, never looked up from the item later. If she changes the item's price afterwards, the order doesn't change.
- **"Agreed" means the price shown at Checkout.** The cart's copy of a price comes from the static page, so it can be stale. If the current record differs, the buyer is shown the new price before going to Stripe, and the order uses it only once they continue.
- **The order is what the buyer pays.** The invoice copies the order's lines. The Stripe Checkout session is built from the order's exact amounts, never from a price catalogue held in Stripe. When the payment arrives, we check the amount and currency Stripe took against the invoice total, and any mismatch is flagged rather than accepted.

## Two Stripe settings that would break "exactly what they see"

These are for EPIC-9.

- **Stripe's automatic local-currency pricing** ("Adaptive Pricing") must be **off**. It can show a buyer a converted price in their own currency at Checkout, which is not the price on her site.
- **Stripe Tax must be off**, and no tax may be added at Checkout.

A buyer's own bank may still convert a EUR charge on a foreign card. That happens between them and their bank, outside anything we can control.

## Discounts (not now)

A discount will be its own line on the order: a negative integer amount with a reason, never an edited unit price. A percentage discount becomes a fixed amount at the moment of purchase, using one rounding rule, and the order stores the result. A displayed sale price ("was €40, now €32") is then just a second price row with an active date range.

## What changes now

- **REQ-631:** it currently stores one price in minor units, which becomes the price list with one EUR row per item. The edit screen still shows one price field for Lauren.
- **EPIC-31:** a new **Prices** section with all of the above.
- **GOAL-55's handshake:** the EPIC-9 constraints: Checkout built from the order's exact amounts, Adaptive Pricing and Stripe Tax off, and the amount check when payment arrives.

Shall I write it in?

<!-- xgd-turn id="ceb9a55d-bf88-4a98-95b7-9514a2df5f49-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:15:29.057446+00:00" -->
#### You
yes

<!-- xgd-turn id="ceb9a55d-bf88-4a98-95b7-9514a2df5f49-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:16:38.163228+00:00" -->
#### Claude
One more line: REQ-631's import still just says "price". The Store API returns prices as strings of minor units, with its own currency code and decimal count, so I'll make that explicit.

I've written the price rules into EPIC-31, REQ-631 and GOAL-55.

- **EPIC-31** has a new **Prices** section setting the rules for both epics:
  - **A price is an integer in the currency's smallest unit plus an ISO currency code**, with no floating point anywhere.
  - **An item holds a list of prices**, one per currency and market. Lauren has a single EUR price; adding more currencies later needs no change to the data shape.
  - **Prices are always set by her, never converted from another currency.**
  - **Shown prices include any tax**, displayed exactly from the integer. Totals are integer sums, and rounding happens only in the VAT breakdown and, later, discounts.
  - **The order copies each line's unit amount, quantity and total at the moment of purchase.** "Agreed" means the price shown at Checkout, and a changed price is shown to the buyer before they go to Stripe.
  - **The invoice and Stripe Checkout are built from the order's exact amounts**, and the amount Stripe took is checked against the invoice.
  - **Discounts, later, are their own negative lines on the order.** A sale price is a second price row with an active date range.
- **REQ-631** now:
  - stores prices as a list, with one EUR row per item for now and no single price column
  - parses her current prices as exact integers (WooCommerce's API already gives them in cents), and reports a product as failed rather than guessing if its decimal count doesn't match the currency's
  - refuses a malformed entry like "19.999"
  - has a new test: 1999 is stored, shown as "€19.99", and never passes through floating point
- **GOAL-55's handshake** now carries the constraints for EPIC-9:
  - amounts are integers end to end
  - Checkout is built from the order's exact amounts
  - Stripe's automatic local-currency pricing (Adaptive Pricing) and Stripe Tax are off
  - the incoming payment is checked against the invoice, and a mismatch is flagged

The EPIC-9 session will see these when it next reads GOAL-55. The catalog ticket is still waiting for your go-ahead to file.

<!-- xgd-turn id="ef88cc64-6637-4570-83a5-e05f7b89022e-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:17:14.803246+00:00" -->
#### You
go ahead

<!-- xgd-turn id="ef88cc64-6637-4570-83a5-e05f7b89022e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:18:34.744204+00:00" -->
#### Claude
I'll check where pages are generated and how the consultant learns about modules, so the ticket points at the right code.

I've filed **REQ-633, "Catalog module: product grid and product pages from inventory"**, as EPIC-31's second child, and linked it from EPIC-31 and GOAL-55. It's at `draft`, waiting for a session to pick it up.

What REQ-633 covers:
- **A new `catalog` module** with two template slots: a **card**, used for every item in a grid, and a **product page**, used for every live item's page.
- **The module supplies the data, fields and controls; all styling is ordinary L1**, using her site's design, so every item is laid out and styled the same way.
- **A new typed L1 primitive for binding fields.** It's a node that names a field of the record, such as the name, the photos or the price, instead of holding a value. Bound values pass through the same escaping and checks as everything else.
- **Grids hold a selection rule**: collections, categories, availability, an order, a limit. Every live item gets a page at `/shop/<slug>`, and not-live items appear nowhere.
- **Item content follows the item's Save; site design follows the site's Publish.** The builder preview reads her records live.
- **An enquiry link where Buy will be**, read through one function that stays false until EPIC-9 provides `canTakePayments`. So nothing in REQ-633 waits on EPIC-9.
- **The consultant learns to place a grid and design its two templates.** Without that, Lauren can't build her shop pages.
- Prices are shown exactly ("€19.99" from 1999), and the tests cover security, sold pieces, and Save versus Publish.

**The two tickets that get Lauren's UX ready:**

| Ticket | Delivers | Needed by | Depends on |
|---|---|---|---|
| REQ-631 | the Shop tab's Inventory, and the import | Fri 6 Nov | nothing |
| REQ-633 | her products on her site | Mon 9 Nov onward | REQ-631's item model, which is already in its body, so it can start now |

**REQ-633 is the bigger and riskier of the two**, because of the new field-binding primitive and generating pages from records. I'd start its session first.

Still only you can do these:
- create her business on 1st Contact and invite her as owner
- run the capture of her current site
- ask her to check her Stripe capture setting

<!-- xgd-turn id="f97bbfb2-4b25-4ca7-bdd4-af7aa003ad4c-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:46:17.066722+00:00" -->
#### You
please can you answer the questions in REQ-631 transcript. Put the answers in its ticket.

I am alarmed to see lots of direct references to the names and specifics of Lauren's site. NOTHING specific to here site should appear in the code or even the tickets. We are building a product, she is our first customer but her specifics need to be runtime config.

Please share your answers with me her so we can check on this?

<!-- xgd-turn id="f97bbfb2-4b25-4ca7-bdd4-af7aa003ad4c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:48:05.127908+00:00" -->
#### Claude
You're right, and that mistake is mine: I wrote her shop's details into the specs as examples, and the REQ-631 session has followed them. Rule from now on: **no customer's names, URLs, categories, counts or quirks go into code, tests, fixtures or REQ/EPIC tickets.** They're data she, or we during onboarding, enter at runtime. I've saved this as a standing rule for myself.

Current state: her specifics appear in REQ-631 (13 mentions), REQ-633 (3), EPIC-31 (20) and GOAL-55 (15).

Below are my answers to the REQ-631 session's ten questions, rewritten as general product rules. Every quirk it found in her shop becomes a choice the owner makes at runtime, and nothing in the code knows about her. **I haven't written these into REQ-631 yet**, since you asked to check them first.

## Answers to REQ-631's questions

**The core change: the import gets a mapping step.** Most of the questions come from treating her categories as fixed. Instead, before importing, the import reads the source shop and shows the owner what it found:
- every source category, with its parent and its product count
- every attribute name

The owner then maps each source category to **a collection, a category, or nothing**, and names the target herself. Several source categories can map to one target.
- **Default proposal:** a top-level category that has child categories is proposed as a collection; any other category is proposed as a category.
- **The mapping is saved per business,** so re-running the import reuses it.

1. **Collection names.** Covered by the mapping. The owner names each collection, and which source category feeds it is part of her mapping. No name is built in.
2. **A product in two collections.** Precedence follows the order of the owner's collection list, and every such product is listed in the import report.
3. **Collection categories as categories.** No: a source category mapped to a collection sets only the collection. Target categories with the same name merge (trimmed, ignoring case). Two source categories with different names stay separate unless she maps them to one target.
4. **Stock that isn't tracked.** If the source says in stock but doesn't track a quantity, the item gets availability 1 and is listed in the report as "stock not tracked: check". It is **not** made to order automatically, because that flag changes when payment is taken, so the owner decides it.
5. **Things that aren't products** (deposits, postage, services). The code can't recognise these by name and mustn't try. Instead there are general signals: **a price of 0, untracked stock, or no photo.** A product with any of these is imported **not live**, with the reason in the report, and the owner reviews it. Everything else arrives live, as decided.
6. **Price 0.** Covered by answer 5: imported with price 0, not live, reported as "no price". Price on request stays deferred.
7. **Attributes.** Stored as a **structured list of name/value pairs on the item**, not merged into the description. The list can be edited as simple rows on the detail page, and later the catalog can bind them. Repeated boilerplate is handled in the mapping step: the owner can **drop an attribute name** from the import. That's a general choice, not a rule about any particular attribute.
8. **Which description.** The long description, falling back to the short one when the long one is empty. It's reduced to paragraphs and line breaks, and links become plain text.
9. **AI picture descriptions.** Agree: describe only the main photo during the import. The rest go into the Library undescribed, and are described when first opened or by a background sweep.
10. **Which business.** Not a code question. The import is a runtime action the owner (or you) runs in a business through the UI. The session builds and tests against a **synthetic fixture shop** with made-up names that exercises every case above. **Her business needs creating on 1st Contact; that's your task.**

**If Friday gets tight:**
- **Keep:** the model and API, the mapping step, the background import, and a plain list and detail page. She needs both data and screens.
- **Cut first:** list filters, search, and editing attributes. Attributes are still imported and stored.

## The cleanup

- **REQ-631, REQ-633 and EPIC-31:** remove every specific of hers and keep the rules, with neutral examples where an example helps. The two Lauren-specific findings the session made go into the operator onboarding notes, not the spec:
  - collections are parent categories
  - SKUs are empty
- **GOAL-55 needs your call.** It's the goal of onboarding one customer, so naming her there seems legitimate, and the onboarding facts (her plugins, her return window, her catalogue size) need a home. My suggestion: keep her name and the dates in GOAL-55, but move her shop's data into a short "onboarding notes" section in GOAL-55, not anywhere the code is specified. Or would you rather none of it is in tickets at all?

Once you confirm the answers and decide on GOAL-55, I'll write the answers into REQ-631 and do the cleanup.

<!-- xgd-turn id="d31726da-57fc-4b01-b36c-9cdbc3f28303-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:51:27.376349+00:00" -->
#### You
**Which description.** The long description, falling back to the short one when the long one is empty. It's reduced to paragraphs and line breaks, and links become plain text. <--should we pull them both for different purposes?

<!-- xgd-turn id="d31726da-57fc-4b01-b36c-9cdbc3f28303-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:51:55.447571+00:00" -->
#### Claude
Yes. They do different jobs, so it's worth keeping both as separate fields on the item:

- **Summary**, from the source's short description: a line or two of plain text, no formatting. Product grid cards, the SEO meta description and link previews use it.
- **Description**, from the long description: paragraphs and line breaks, with links turned into plain text. The product page uses it.

Both can be edited on the item detail page, and the catalog (REQ-633) gets both as fields it can bind: a card template binds the summary, a product page template the description.

Two general rules come with it:
- **A missing summary isn't faked.** If the source has no short description, the summary stays empty. A card template that binds the summary shows nothing there. SEO falls back to the start of the description, cut at a sentence or word boundary.
- **The import copies what the source says, without editing it.** A short description sometimes carries shop boilerplate, such as stock or collection notes. The import doesn't strip it by rule, because any rule would be guessing about one shop. Instead, the import report lists summaries that are identical, or share the same opening, across many products, so the owner can clean them up.

That's the only change to my answers: answer 8 becomes "import both, as summary and description". The other nine stand. Shall I write all ten into REQ-631, add the summary field to REQ-633's bindable fields, and do the cleanup? On GOAL-55 I still need your call: keep her name and dates there with her shop's details in an "onboarding notes" section, or take them out of the tickets altogether?

<!-- xgd-turn id="f10907c6-48bb-4a47-8e9d-13644ceb5454-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:54:00.690844+00:00" -->
#### You
Yep Goal 55 is ok - this isn't a privacy issue its a product issue - I want to build a solution that is general not a product for Lauren

<!-- xgd-turn id="f10907c6-48bb-4a47-8e9d-13644ceb5454-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:57:27.140156+00:00" -->
#### Claude
I'll fetch fresh copies of the three bodies and list every customer-specific line before editing.

Now I'll rewrite REQ-631 as a general spec, with the ten answers built in.

Now REQ-633: remove the customer references and add the summary and attribute fields it can bind.

Now EPIC-31. I'll print the sections that carry most of her specifics so I can rewrite them in full.

I've written the answers into REQ-631 and removed her specifics from all three specs.

**REQ-631 is now a general inventory module, with the ten answers built in:**
1. **The import scans the source shop first and shows the owner** every category (with its parent and count) and every attribute name.
2. **The owner maps each category** to a collection, a category, or nothing, names the targets, and can drop attributes. The mapping is saved per business and reused on re-runs. By default, a top-level category with children is proposed as a collection.
3. **General rules replace her quirks:**
   - A product in two collections goes to the first in her order.
   - Categories with the same name merge.
   - Untracked stock becomes availability 1 and is reported.
   - Made to order is never set automatically.
4. **Live on arrival, unless a product shows a general sign of not being a real product:** a price of 0, stock not tracked, or no photo. Those arrive not live, with the reason in the report. **Nothing is ever recognised by its name.**
5. **Summary and description** are separate fields, both imported. **Attributes** are stored as name/value pairs. Only the main photo of each product is described by AI.
6. **The import report** includes summaries repeated across many products, so the owner can clean up boilerplate. Text is never stripped by rule.
7. **The test fixture is a synthetic shop** that exercises every one of these cases. It never copies a customer's data.
8. **If Friday gets tight:** keep the model, the mapping step, the import and plain screens. Cut filters, search and attribute editing.

**REQ-633:** her name and catalogue size are gone. It also gains summary and attributes as fields a template can bind, and the summary is the SEO meta description.

**EPIC-31:** it now opens with the rule that this is a product, not one customer's shop, and every reference to her is gone:
- her name and URL
- her collections and categories
- her plugins
- Ireland and An Post
- the survey of her shop

Shipping zones, customs and the return-window note now read generically.

**GOAL-55:** her specifics moved into a new **"Onboarding notes for this customer"** section, marked as not specification. It holds her shop survey, the REQ-631 session's findings, and the mapping to enter when she imports (Originals ← LO Originals, Reworked, Preloved; merge the two "Brooches"; drop Care Guide). The rest of GOAL-55 is unchanged, as you agreed.

**The REQ-631 session hasn't seen this yet.** Its last turn was the list of questions, so when you resume it, point it at the revised body. Two of my answers differ from its own recommendations:
- attributes are structured, not appended to the description
- the not-live signals are general, not a list of product names

<!-- xgd-turn id="6d632cd1-fa73-4845-a399-7585825dbf80-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:59:28.303245+00:00" -->
#### You
633 also has questions cam you address those too. Lets keep it to one ticket with multiple commits if necessary

<!-- xgd-turn id="6d632cd1-fa73-4845-a399-7585825dbf80-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T21:01:21.624698+00:00" -->
#### Claude
The framework already has a money formatter (REQ-152), which the REQ-633 session proposed to duplicate. I'll check what it does.

I've written answers to REQ-633's six questions into its ticket, under a new "Decisions" section. REQ-633 stays one ticket, landed as several commits on its branch, as you said.

1. **Who creates the inventory table: REQ-631 does, not REQ-633.**
   - REQ-631 lands its migration as its first commit and provides a read of the live items.
   - Each item gets a **slug** that's set once, the first time it goes live, and never changes, so published URLs stay stable.
   - After every Save, REQ-631 calls a function REQ-633 provides to rebuild the affected pages.
   
   I've written this contract into both tickets. Until REQ-631's migration lands, REQ-633 works against an in-memory stand-in with the same shape, so the two tickets can't end up with clashing migrations.
2. **What a Save does to the published site:** I agreed with the session's proposal.
   - A Save re-renders the affected pages from the same live site revision and replaces them in place. Inventory never adds to the site's history.
   - Rolling the site back restores its design, never old prices or availability.
   - A Save rebuild and a site Publish are queued through the per-site coordinator, so they never overlap.
3. **The product-page template is an ordinary page**, so it keeps the site's header and footer. The generator produces one copy per live item at `/shop/<slug>`, and the template itself is never served. The rule against `/` in authored page slugs stays. If a site has no product template yet, there are no `/shop/` pages and cards don't link anywhere; the consultant adds the template along with the first grid.
4. **Big grids get static pages, not a cap.** Each grid has a page size (default 24), with next and previous links.
5. **One contact form with a link that names the item.** The form can be configured separately for enquiries and for commissions, so a business with a separate commission form can point at it. The contact form gets a general prefill feature that drops the item into the message field as plain text and records the item on the lead. The wording of the links is site copy, not code.
6. **Size:** one ticket.

**One correction to the session's own plan:** it proposed writing its own price formatter. The framework already has one, `formatMoney` in `packages/framework/src/intl.ts` (REQ-152). It does exactly what the price rules require: exact integer amounts, the right number of decimals per currency, and the site's locale for separators. I've told REQ-633 to use it and not to add a second.

Both sessions need resuming against their updated bodies:
- **REQ-631:** the ten answers plus this contract.
- **REQ-633:** these decisions.

REQ-631's first commit, the migration, is what unblocks REQ-633's real records, so it's worth starting REQ-631 first.

<!-- xgd-turn id="e74ee6d8-2fd6-4f44-963d-5e8e5dc3b24a-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T23:40:18.200395+00:00" -->
#### You
Ok I am looking at the Shop tab - there's a lot to fix there:

1. Import from WooCommerce fails

Shop addressScan the shopBack to inventory

POST /api/shop/import/scan → 404
2. This is SUPER-SPECIFIC to Lauren's site the button should be Import and WooCommerce should be an option next to (say) csv etc.
3. New Item shows: POST /api/shop/items → 404
4. Currency selection has to be a drop down not a text field but it should also be in Settings and the setting is Default Currency - for now we will not offer pricing in multiple currencies but as discussed that is coming

Is the problem that there is a worker that bin/dev does not start?

<!-- xgd-turn id="e74ee6d8-2fd6-4f44-963d-5e8e5dc3b24a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T23:42:00.165453+00:00" -->
#### Claude
I'll check what REQ-631 has landed, whether the `/api/shop` routes exist in the code, and what the dev services are serving.

Not a missing worker: today's dev deploy does include the Shop API, and the services were restarted after it. Checking why the route itself answers 404.

No, `bin/dev` isn't missing a worker. The dev snapshot is today's (commit b250d3820a, deployed 22:48), it does contain the Shop API, and every service restarted after it (22:57). The dev-worker log shows the requests reaching it and being answered 404. So the Shop tab's own API is refusing them. That's a bug in REQ-631's code or its routing, not your environment. (The "deployed 2026-09-26" line at the top of `dev.log` is left over from an older run; ignore it.)

I haven't dug into the code itself: that's for REQ-631's session. **The catch is that REQ-631 is now `ready_to_reconcile`.** At that status its body is frozen, so I can't add your two spec changes, and reconcile may lock in what's there now. I'd move it back to `free_coded` first (that's your call); then I update the body and the REQ-631 session fixes all four in the same ticket.

**What I'd write in, for your OK:**
1. **The 404s on scan and on New item:** a bug for the REQ-631 session to fix. Add a test that drives the real route through the dev worker, so a route that passes its tests but 404s in dev can't ship again.
2. **Import:**
   - The button is just **Import**, with a choice of source. **WooCommerce is the first source, CSV the next.** Each source feeds the same mapping step and report.
   - Nothing in the Shop tab names a particular platform except inside that choice.
   - **Question:** do you want CSV for Friday, or WooCommerce plus a picker built for more sources, with CSV as a fast follow?
3. **New item:** same 404 bug as item 1.
4. **Currency:**
   - A business setting in **Settings: "Default currency"**, as a dropdown of ISO currencies.
   - Item prices use it, and the item screen shows the currency without letting you edit it. Prices in more than one currency come later, as already designed.
   - **One catch for the session:** sites already have a currency, `locale.currency` (REQ-151), which the money formatter uses. "Default currency" must be that same value surfaced in Settings, not a second currency field that can disagree with it.

Two more things to settle:
- **CSV:** for Friday, or a fast follow?
- **REQ-633:** is it also at `ready_to_reconcile`? If so, the same applies to its body before I can record further changes there.

<!-- xgd-turn id="7be572d8-4fcc-4142-97d4-b5455ce9b036-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T23:44:33.810643+00:00" -->
#### You
CSV - just a suggestion of an alternative import source - not a current requiremen

we need a new ticket for these changes that superceeds 631 and 633 if necessary

<!-- xgd-turn id="7be572d8-4fcc-4142-97d4-b5455ce9b036-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T23:45:37.914523+00:00" -->
#### Claude
I've filed **REQ-634, "Shop tab: working inventory API in dev, a source-neutral Import, and a Default currency setting"**. It's at `draft`, under EPIC-31, and EPIC-31's children list says it supersedes REQ-631 and REQ-633 where they conflict.

It covers three things:

1. **The 404s.** I confirmed this isn't stale code. Today's dev snapshot (b250d3820a) contains REQ-631's Shop routes, and every service restarted after the deploy, yet the dev worker answers 404 to list, new item and scan. The ticket lists the likely causes:
   - another route answering first
   - the Shop route rejecting the path or method
   - the inventory migration not applied in dev

   It also requires a test that goes through the real router with a signed-in user. REQ-631's tests passed while its routes were unreachable, and this closes that gap.
2. **Import.** The action is **Import**, with a choice of source. WooCommerce is the only option today, and a platform name appears only inside that choice. Every source goes through the same scan, mapping and report. CSV is noted only as an example of what the choice must leave room for, not as a requirement.
3. **Default currency:**
   - It moves to **Settings**, as a dropdown of ISO currencies (e.g. "EUR — Euro"). The free-text currency field in the Shop tab's bar goes away.
   - Item prices use the default currency, which is shown on the item screen but can't be edited per item.
   - **Fixes an existing problem:** today there are two stored currencies, the Shop's own setting and the site's locale currency that the price formatter reads, and they can disagree. The ticket requires exactly one.
   - Changing the default never converts existing prices. It asks for confirmation and lists the items to re-price.
   - It also checks that REQ-633's catalog formats each price from its own currency rather than assuming the default.

The table of what REQ-634 replaces: in REQ-631, the "Import from WooCommerce" naming and the separate shop currency. In REQ-633, nothing, unless the currency check finds a problem.

**Something to decide:** REQ-631 and REQ-633 are both at `ready_to_reconcile`. If they reconcile before REQ-634 lands, their stale parts (the WooCommerce button, the bar's currency field) enter the spec and REQ-634 then overrides them; that's expected. If you'd rather avoid that, hold them at `free_coded` until REQ-634 is done. Either way, REQ-634 is ready for a session to pick up, and the 404 fix is the first thing Lauren needs.

<!-- xgd-turn id="d79e76ea-3bce-413f-ae90-d69ff150a6d8-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:44:48.893607+00:00" -->
#### You
REQ-364 landed and BTW I think it should have been a BUG ticket not an REQ. 

Anyway the import not seemed to work - but when I return to the inventory I see no content - this is very disappointing was this code tested?

<!-- xgd-turn id="d79e76ea-3bce-413f-ae90-d69ff150a6d8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:45:39.323938+00:00" -->
#### Claude
You mean REQ-634, I take it. I'll check the dev worker's log for the import job and what's actually in the dev store.

The scan worked (200, 7.4 s). I'll check whether the import itself was ever started after it.

You're right that REQ-634 should have been a bug ticket; I've noted it and will file fixes to landed work as bugs from now on.

**The import never started.** The dev worker's log shows, in order:

1. `GET /api/shop/import/sources`: 200
2. `POST /api/shop/import/scan`: 200, taking 7.4 s. This only reads the source shop and builds the category-mapping table. It writes no items.
3. Straight back to `GET /api/shop/items` and `/taxonomy`: 200, and empty.

The two requests that actually import, saving the mapping and starting the import job (`POST /api/shop/import/mapping` and `POST /api/shop/import`), were **never sent**. In the code, after a scan the Shop tab shows the mapping table, and the button that runs the import, "Import N products", sits **below that whole table**. For a shop with many categories, the scan result looks like the end of the process and the one button that matters is off-screen. I can't tell from here whether that button works, because nothing has ever pressed it in dev.

**Was it tested? Only in pieces, and never as you'd use it.** This is the second time:
- REQ-631's tests passed while every Shop API route answered 404 in dev, because they called the code directly rather than through the real router.
- REQ-634 fixed the routing, but no session ran the full flow (scan → map → import → items in the list) in dev against a real shop before handing over.

That's the gap: none of the tests reproduces what you actually do in the Shop tab.

**What I'd file, as a bug:**
- **The step after a scan must not look finished.** Lead with a clear "Step 2 of 2: check the mapping, then import" heading. Keep the Import button visible without scrolling: sticky, or at the top as well as the bottom. Show the import's progress, and return to the inventory with the items there once it's done.
- **The flow has to be proven end to end.** A browser test runs the whole sequence (choose a source, scan, map, import, see the items in the list) against a fixture shop, through the real router and a signed-in session.
- **Before the ticket is marked done,** its session runs the same flow on dev against a real shop and records the item count in the ticket.

Shall I file it? Until it lands, you should be able to import by scrolling to the bottom of the mapping table and pressing "Import N products". If that fails too, tell me what you see and I'll put it in the same bug.

<!-- xgd-turn id="95760161-60ae-4128-8aae-015926fce79f-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:47:33.601319+00:00" -->
#### You
It definitely found the content - reported an import of 365 items and showed a list of example content but it never hit the store.

In addition to fixing this bug can you also define tests for the rest of the functionality so I am not going a feature at a time making you get it working,please?

<!-- xgd-turn id="95760161-60ae-4128-8aae-015926fce79f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:49:05.713301+00:00" -->
#### Claude
I'll recheck the log for the run you just did, and look at what's in the dev store.

The import never wrote anything. The dev worker's log shows the scan and nothing after it, and every Shop table in the dev store has 0 rows: no items, no saved mapping, no import job. The "365 products" and the examples you saw came from the scan, which only reads the source shop. The two requests that save the mapping and start the import were never sent. So either the Import button failed in the browser, or the scan screen looked finished and the button was never reached. The bug session will reproduce it to find which.

I've filed **BUG-333** (bug, high), listed under EPIC-31. It covers the fix and the tests you asked for.

**The fix:**
- The Shop tab only ever reports imported counts from the server's import job, never from the scan.
- The scan screen says "Step 2 of 2: check the mapping, then import".
- The Import button is visible without scrolling.
- Any failure is shown, never swallowed.
- Progress and the report come from the job. Leaving mid-import and coming back shows the running job.

**The acceptance suite.** It covers everything the Shop tab and catalog do so far, as an owner uses them:
- **How it runs:** in a real browser, through the real router, signed in, against a migrated database and a made-up WooCommerce shop served over HTTP.
- **Every step checks what was saved**, by reloading or reading the store, not just what the screen shows. That check is what would have caught this bug.

| Journey | Covers |
|---|---|
| J1 | Default currency in Settings, including changing it with priced items |
| J2 | Import end to end: source, scan, mapping, import, report, items in the list after a reload, leaving mid-import, failures |
| J3 | Re-import: mapping reused, no duplicates |
| J4 | Inventory list: filters, search, paging, badges |
| J5 | Item editing: every field saved and reloaded, edits private until Save, invalid input refused, exact prices |
| J6 | New and delete |
| J7 | The site follows an item's Save without a Publish, including product pages, grid rules, paging, sold items and the preview |
| J8 | Enquiry and commission links prefilling the contact form, and the lead recording the item |
| J9 | Safety: scripts and links in descriptions are inert, unsafe image addresses dropped |

**Definition of done:**
- **The whole suite passes.** Broken built code gets fixed in BUG-333, not skipped or deferred.
- **It's run on dev before handing back.** After the dev deploy, the session runs the import in the real dev builder against a real shop address, and records in the ticket the item count in the Inventory and the matching row count in the dev store. A ticket nobody has seen working in dev isn't done.

**For the session that picks it up:** it needs a real shop address from you for that final dev run. It also needs to run Chromium, which can't launch in this sandbox normally; the known workaround is Chromium's `--single-process` flag.

<!-- xgd-turn id="56153071-0fbd-461e-8301-26e514fb8df8-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T01:24:20.094725+00:00" -->
#### You
I am super frustrated by this Chromium limitation it is my call and it is not intended. I NEED TO KNOW HOW TO FIX IT

<!-- xgd-turn id="56153071-0fbd-461e-8301-26e514fb8df8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T01:26:41.791063+00:00" -->
#### Claude
xgd already has a per-role `mach_lookup` setting (BUG-1202), which governs exactly the kind of macOS permission Chromium is being denied. I'll read how it's configured.

The interactive role already has `mach_lookup: 'on'`, and Chromium still failed with it. I'll run a quick launch test to confirm which macOS permission is actually being denied.

It's fixable, and it's yours to fix. I re-ran the probe just now to pin down the cause.

**The cause.** Chromium fails at launch with:

```
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)
```

Chromium's main process registers a macOS system service so its other processes can find it. The agent sandbox (macOS Seatbelt) forbids *registering* such a service. Your interactive role already has `mach_lookup: 'on'` in `permissions.yaml`, but that setting only allows *looking services up*, not registering them, so it doesn't help. With `--single-process` Chromium avoids the registration and launches; that's the degraded workaround sessions have been using:
- only one browser context per browser
- no external sites
- no real browser behaviour

I don't believe Claude Code's sandbox has a setting that permits registering services, so the clean fix is to **run the browser tests outside the sandbox through one narrow, named command.** xgd already does this for `xgd branch clean`.

**What to do:**

1. **Edit main's `.xgd/permissions.yaml`** (`~/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/main/.xgd/permissions.yaml`). Under `sandbox: excluded_commands:`, add:
   ```yaml
     - command: pnpm test:browser *
       comment: Browser suites need real multi-process Chromium, which the sandbox kills at launch (Seatbelt mach-register denial on MachPortRendezvousServer; mach_lookup does not cover it). Narrow by design - only this script runs unsandboxed.
   ```
   That file is protected from agent edits, deliberately, so the change has to be yours. This shared list applies to every role, so the headless sessions building the Shop get it too.
2. **Start a new session** so the regenerated sandbox settings take effect.

The `pnpm test:browser` script itself doesn't exist yet. I've written it into **BUG-333**:
- It's the single command for the Shop acceptance suite, running real multi-process Chromium.
- Sessions must run it as the whole Bash call, with no `cd … &&`, pipe or redirect, because an excluded command only matches the whole call.
- **If the exclusion is missing, the suite fails with this diagnosis.** It never quietly skips or drops to `--single-process` again; that silent fallback is part of why broken Shop journeys went unnoticed.

**The trade-off:** whatever `pnpm test:browser` runs, runs with your normal user permissions. That's why it's a single named script rather than all of `vitest`.

I've also corrected my notes so I stop treating this as a fixed limitation.

<!-- xgd-turn id="d53b2009-7949-4465-bd94-df48136aafcd-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:17:45.396339+00:00" -->
#### You
Ok things are working - some UI tidy up:

The buttons on the photos of the detail page - keep the text as hover text switch out the buttons for symbols:
Later -> '>'
Remove -> Trash can
Earlier -> '<'
Make Main -> Star

Order them with Earlier first and Later last. Make sure they fit under a photo in a single line. Center them wrt to the photo

Add a photo from the Library -> '+' Put this next to Photos (the titile)

Price, Avaiulability, Collection - all Title: Value in neat columns 

Categories - put these in neat columns
Add Category - '+' next to the title "Category"

Font consistency throughout Item titles are giant, Category titles are giant

Atrributes - Neat columns to mate Price, Availability etc
Add Attribute - '+' next to Attributes

Item filters: 
Search by name and 50 of 364 on one line
All Collections, All Categories, Live and NotLive  -> see if we can get these on a line below. A few additions:
- Currently Collections both on the item list and the detail page only shows collections for the 50 items loaded it needs to show all collections in the portfolio
 - Availability needs to be a filter suggest: Any Availability | Sold Out | Available

Please create a ticket if all that makes sense?

<!-- xgd-turn id="d53b2009-7949-4465-bd94-df48136aafcd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:19:48.801466+00:00" -->
#### Claude
I'm drafting the ticket. One check first: the code's collection list isn't limited to the 50 loaded items. It reads every collection in the store.

I've filed **REQ-639, "Shop tab: item detail and inventory filter layout tidy-up, full collection lists, Availability filter"**. It's under EPIC-31, at `draft`, and every point you listed is in it:

- **Photo buttons:**
  - The text buttons become symbols in this order: `<` (Earlier), star (Make main), trash can (Remove), `>` (Later).
  - The old words stay as hover text, and screen readers get them too.
  - The buttons sit on one line under the photo, centred to it.
  - Adding a photo from the Library becomes a `+` next to the "Photos" heading.
- **Detail fields:**
  - Price, Availability, Collection and the attributes all line up as `Label: value` in the same two columns.
  - Categories are in neat columns.
  - Add category and Add attribute become `+` buttons next to their headings. I made "Add collection" match too.
  - The item title and the section headings drop to the builder's standard sizes.
- **Filter bar:**
  - Search and "50 of 364" share the first line.
  - Collection, Category, Live/Not live and a new **Any availability | Available | Sold out** filter share the second line.
  - The new filter is applied on the server, so the count and paging follow it.
- **Every collection in the business, not just the loaded 50:** this applies to both the list filter and the detail dropdown, and to categories too.

**The collection list may not be what it looks like.** The code that builds both collection lists already reads every collection the business has; it isn't limited to the 50 loaded items. So the 50-item explanation is probably wrong, and something else is cutting the list short. Likely candidates are the import creating collections for only some products, or the dev store holding fewer collections than your source shop. The ticket asks the session to find the cause, record it, and confirm on dev that the number of collections in the filter matches the number in the store.

**One call for you:** I filed it as a request because it's mostly new layout. If you'd rather the collection-list fix be tracked as a bug of its own, say so and I'll split it out.

<!-- xgd-turn id="d509058b-8c69-423c-ae86-4694ac64a6a8-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:24:32.239931+00:00" -->
#### You
I only see "preloved" the other collections are missing. If I select preloved I see only 330 of the 364 items though?

REQ is fine

<!-- xgd-turn id="d509058b-8c69-423c-ae86-4694ac64a6a8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:35:48.171989+00:00" -->
#### Claude
I'll look at what's in the dev store to explain that.

I'm still looking for the dev store, which sits in a deployed snapshot rather than the main checkout.

The store explains it. I'm checking the saved import mapping to see why.

The store answers both questions, and neither is a display bug. I'm correcting REQ-639.

Nothing is broken here. The collections filter is showing exactly what the import created, and I was wrong earlier to describe this as items "missing" from the list.

**What's in the dev store:**
- **1 collection, "Preloved", holding 330 items.** That's why selecting it shows "330 of 364".
- **34 items have no collection at all.** They do have categories.
- **12 categories:** LO Originals, Rings, Bracelets, Chains, Earrings and the rest.

**Why there's only one collection:**
- When you ran the import, the mapping step turned exactly one source category, Preloved, into a collection and every other source category into a category.
- That's the scan's default rule: a top-level source category with sub-categories becomes a collection. In this shop, only Preloved fit.
- The filter and the item's Collection dropdown already list every collection in the store, not just the loaded 50.

**To get the collections you expected,** re-run the import and switch the source categories you want (e.g. LO Originals) to "collection" in the mapping table. The re-import reuses your saved mapping and doesn't duplicate items. BUG-333 tests that re-import case, but I haven't tried it on your shop.

**I've corrected REQ-639:**
- The collection-list fix and its tests are gone, replaced by the explanation above.
- The title now reads "…layout tidy-up, Availability filter".
- The final check on dev now compares the Availability filter's totals against the store.
- Everything else is unchanged, and it stays a request.

**Something you may want:** the 34 items with no collection can't be picked out with the collection filter today. I could add a "No collection" option to that filter in REQ-639. Shall I?

That notification is a leftover search for the dev store, which I'd already found another way, so there's nothing new in it. REQ-639 is as I left it, and I'm still waiting on whether you want a "No collection" option added to the collection filter.

<!-- xgd-turn id="de80dc58-2c84-41fa-ba12-9f221efa869f-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:38:37.670060+00:00" -->
#### You
If I rerun the import won't I get dupes?
Sure please add a no collection - or just "None"

<!-- xgd-turn id="de80dc58-2c84-41fa-ba12-9f221efa869f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:39:47.313111+00:00" -->
#### Claude
I'll check what a re-import actually does to existing items, rather than lean on the test.

Re-import won't duplicate, but it will overwrite edits. Adding "None" to REQ-639 now.

**A re-import won't create duplicates.** Each item remembers which source product it came from, and a re-import updates that same item rather than adding a new one. The store also enforces this, with an index on source product per business. Photos already brought in are kept too.

**But it isn't harmless, and here's what it does:**
- **Your edits to imported items get overwritten** with the source's values: name, summary, description, price, availability, collection, categories and attributes. Only Live and Made to order survive.
- **Categories you turn into collections stay behind as empty categories.** If you switch "LO Originals" from category to collection, the old "LO Originals" category stays in the category list with no items in it. You'd have to delete it by hand.

So if you've already edited items in the Shop tab, don't re-import just to change collections. If you haven't edited anything yet, re-importing is fine; only the empty categories would need tidying.

**"None" is now in REQ-639.** The Collection filter gets a "None" option after "All collections" that shows the items with no collection. It's applied on the server like the other filters, so the "x of y" count and paging follow it, and it combines with them. I've added a test for it and a check on dev that it shows the 34. The title now ends "…Availability and no-collection filters".

**Something to decide:** the safer way to get your collections is to reorganise in place, not re-import. That means two things REQ-639 doesn't cover:
- turning an existing category into a collection, which moves its items across;
- assigning a collection to several selected items at once.

Shall I add either? Or should re-import instead leave your edits alone and change only collections and categories?

<!-- xgd-turn id="876e4b83-b65b-4a4a-9184-6ba6ee35dfc4-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T01:40:13.210332+00:00" -->
#### You
ok the shop tab is MUCH better there is still some chaos to resolve:

- The << that close the item list need to be to the right of the controls not the left. That chveron could exist just on the top line of the 3 lines of the controls
- [Show More] can we change that to a text link that follows the count: 50 of 364 *More...*
- The titles and prices of the items in the list are still in a HUGE font please reduce them to be consistent
- Live and Solde Pills should be right justified
- Name field - this is redundant the name is at the top. Please

 make the name at the top editable with a double click that opens it in a text field. Remove the name field.
  - catagory names are HUGE - PLEASE I asked you to audit the font sizes I don't think that happened - UIs with all random font sizes look extremely amateur
 - The corner drag to increase the text box sizes allows me to drag it right past a limit where the drag disappears and so does the scroll bar, but the text box doesn't get any bigger - we should not loose the scrollbar
 - Attributes: The "Care guide" is a large segment of formatted text presented in a single line text box. Can we make these fields sensitive to the content inside them and create a box of appropriate size (can be a max of 3-5 lines with a scroll bar

<!-- xgd-turn id="876e4b83-b65b-4a4a-9184-6ba6ee35dfc4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T01:44:08.320534+00:00" -->
#### Claude
I've filed **BUG-339**, "Shop tab: type-size audit, inventory list/filter bar layout, inline-editable item name, textarea sizing". It's under EPIC-31 at `draft`, ready for its session to pick up. REQ-639 is already at `ready_to_reconcile`, so I couldn't safely add these to it. I filed it as a bug because these are fixes to work that has landed.

**You're right that the font audit didn't happen.** REQ-639 set the builder's sizes on the item title and the section headings only. The Shop panel itself has no base font size. So everything left unstyled, including the list's item names, prices and category names, falls back to the page default, which is larger. Fixing elements one at a time would just miss the next one. Instead:
- The panel gets the builder's standard size as its base.
- Every piece of text in the Shop tab must use one of the builder's two sizes: the standard size, or the heading size for the view title.
- A test checks every visible text element in the list, detail and import screens and fails on any other size. That makes the audit something the tests enforce, not something someone has to remember.

**The rest of what you asked for is in the ticket:**
- **Collapse chevron (`«`):** moves to the right end of the top line of the controls, and appears only there.
- **Show more:** becomes a text link after the count, `50 of 364 More…`. It disappears once everything is loaded.
- **Live and Sold pills:** right-justified, so they line up down the list.
- **Name:** the Name field is gone. Double-clicking the title turns it into a text field:
  - Enter or clicking away keeps the change; Escape undoes it.
  - Like any other edit, it's only saved when you click Save, and Revert discards it.
  - An empty name is refused.
- **Resizing text boxes:** a box can't be dragged wider than its column, and its height is capped so the scrollbar and drag handle never disappear off the panel.
- **Attribute values:** a short value stays one line. A long or multi-line value (like the care guide) grows to fit, up to 5 lines, then scrolls. Its line breaks are kept when you save.

Each item has a browser test that checks the result on screen and after a reload. As with BUG-333, the ticket isn't done until the whole suite passes and the changes have been checked on dev with screenshots.

<!-- xgd-turn id="d156b1df-304c-4e49-af52-027d0d82e600-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T16:07:24.806264+00:00" -->
#### You
Please read the last turn on the GOAL-55 trasncript, I need an REQ ticket for: **EPIC-31:** orders, shipping zones, the Checkout endpoint and Buy.

<!-- xgd-turn id="977e180e-9102-43cc-a8bd-b60d2fe384cc-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T16:07:59.352621+00:00" -->
#### You
Please read the last turn on the GOAL-55 trasncript, I need an REQ ticket for: **EPIC-31:** orders, shipping zones, the Checkout endpoint and Buy.

and **EPIC-31:** fulfilment, emails and returns.

Lets talk through the product experience first

<!-- xgd-turn id="977e180e-9102-43cc-a8bd-b60d2fe384cc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T16:10:08.646307+00:00" -->
#### Claude
Found the GOAL-55 transcript, reading its last turn now.

I've read the last turn of GOAL-55 and EPIC-31's design. Most of the experience is already decided in the epic; the open questions sit where the two tickets meet. Here's how both sides would experience it, with my recommendation wherever something is still open. Nothing is filed yet.

## Ticket A: orders, shipping zones, Checkout and Buy

**The buyer**
1. On an available piece's product page they see the price and a **Buy** button. Sold pieces stay as portfolio, with no Buy, as now.
2. **Choosing where to ship.** Stripe Checkout can't change the shipping rate after the buyer types an address. So I'd have them pick a **"Ship to" country on our side** when they press Buy. That gives the zone, the rate and the total before Stripe. Stripe then accepts only addresses in that zone. *Recommendation: a country dropdown in a small Buy step on our page; the country they pick is remembered for next time.*
3. **The Buy step checks before payment.** It re-reads the price and stock. If the piece has just sold, they're told on our page. If the price changed, they see the new price and choose whether to continue. Then the piece is held and they go to Stripe.
4. **On Stripe** they pay by card, Apple Pay or Google Pay. Their card is **authorised, not charged**; the charge happens when the owner ships.
   - **Decision: do we tell the buyer that?** Their bank will show it as "pending". *Recommendation: one line on the Buy step and in the confirmation: "Your card is authorised now and charged when your order ships."*
5. **Success page.** It shows "Thank you, order 1042 received", the piece and the total. Stripe's confirmation can reach us a second after the redirect, so the page shows "confirming…" until the order is marked reserved, rather than claiming success early.
6. **Cancel or back out.** The cancel page says nothing was charged, and **the hold is released at once**, so the piece is buyable again straight away. An abandoned Stripe tab releases the hold when the session expires. *Recommendation: 30 minutes, Stripe's minimum.*

**The owner**
- **Settings → Shipping:** zones (name, flat rate, countries) and the countries they ship to. The Buy button stays hidden until at least one zone exists and Stripe is connected; a short note in the Shop tab says why.
- **Orders tab (basic):** a list with a **Test** badge on test-mode orders, so they can see their own test purchase arrive. *Decision: does the basic list belong in A, or does all of Orders wait for B? Recommendation: A, so A's "full test-mode purchase" check means something to you.*

## Ticket B: fulfilment, emails and returns

**The owner**
1. A **new-order email**: the piece, the amount, the buyer's name and address, a **"ship by" date** (the 7-day hold), and a link to the order.
2. **"To ship"** is the Orders view's default filter. Test orders never appear in it, and expired orders are hidden behind a toggle.
3. **Order detail page:** buyer, address, lines, totals, and a **timeline** showing reserved, reminder sent, shipped, captured, refunded and so on.
4. **Mark shipped,** with optional tracking number and carrier. **That's when the money is taken.** If the capture fails (the hold lapsed), the order is not marked shipped, and they're told and offered **Send pay link**.
5. **Day-5 reminder email** if it isn't shipped yet. On day 7 the order shows **Hold expired**, with Send pay link or Cancel.
6. **Cancel** before shipping releases the hold and puts the piece back on sale. No refund is needed, because nothing was charged.
7. **Record return:** they pick the lines and tick restock (which makes the piece available and live on the site again). We **propose** a refund of those lines' total and they adjust it, for example to keep the postage.
   - **Decision: refunds from our button, or only from the Stripe dashboard?** The epic has a Refund button. The GOAL-55 plan only had dashboard refunds arriving by webhook. *Recommendation: both. Our button is the normal path, and a refund made in the dashboard still shows up on the order with a credit note.*

**The buyer**
- **Order confirmation** from the business's name, with replies going to the owner. It shows the lines, the total, the shipping address and the authorised-now, charged-when-shipped line.
- **Shipped email** with tracking, if given.
- Both buyer emails can be **switched off per business**; the owner's own email can't be switched off.
- **Returns are not self-service.** The buyer contacts the owner, who records the return.

## Things to settle

1. **Ship-to country chosen on our page** before Stripe (my recommendation), or let the buyer choose a shipping option inside Stripe?
2. **Tell the buyer about authorise-now, charge-on-ship?** I'd say yes.
3. **Basic Orders list in A, or all of Orders in B?** I'd put it in A.
4. **Refunds from our button as well as the dashboard?** I'd say both.
5. **Order number shown to buyers:** a short per-business sequence (1001, 1002…) separate from invoice numbers. Invoices only get a number when the money is taken, so they can't be the buyer's reference. OK?
6. **Day-5 reminder and hold-expired handling go in B,** since they're about shipping.

**A dependency, not part of your request:** A can't complete a real purchase without GOAL-55's first ticket, the EPIC-9 one for webhooks and Checkout sessions. Is that being filed from EPIC-9's session, or shall I file it here too?

<!-- xgd-turn id="2070dcbf-b42f-4771-860a-af80c8ee7b0e-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T16:42:45.556803+00:00" -->
#### You
On A:
1 - I assume clicking Buy takes us to a "checkout" page where all this happens?
2 - surely we need a full shipping address?
4 - I thought we were going to start with just charging at the time of purchase?
Lets create a basic orders tab - Shop tab should have a mode selection with a multi-mode pill that mirrors the View | Edit| Input mode selector on the Site tab

In Order mode we would have a list of orders, ability to filter and search clicking an order opens its detail page.

My original idea was that the Item list would be nested allowing invoices, payment attempts and payments to be listed under an order. Thinking about it that feels unnecessarily complicated. I think the order details should just show all of that chronologically:
Order
Invoice
Payment attempt 1..N
Payment (if it exists)

Do you agree? We could add additional modes if there is a need to view payments separately, for example.

On B:
1. This should be a Notification (see EPIC-30) obviously we can extend notifications to meet these needs with requests to EPIC-30

You haven't described the buyer experience past success page a few things:
1. they should get an email confirming the purchase and setting shipping expectations
2. what about shipping/tracking info? Should they get an email when the order is marked as shipped - I think this should be a setting the owner can decide
3. The emails could point them to an order status page with details on the order history? Should it have a cancel button? (Another setting ?) Cancel button only live until shipped, for example - therre is a race condition if we are not careful - Lauren literally takes her sales to the post offiice, if an item has shipped and then a customer cancels before she hits the shipped button we have a problem - solution: If there is a cancel button it sends a cancel request to the owner (notification / order state)? Lauren executes the cancel
4. Lauren's current site offers the option to sign up on checkout - to store CC info I assume - a signed in user could have access their order history?

<!-- xgd-turn id="2070dcbf-b42f-4771-860a-af80c8ee7b0e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T16:43:48.079688+00:00" -->
#### Claude
You're right on 4: I worked from the epic, but GOAL-55 has since overruled it. **At launch, money is taken at purchase.** Capture on ship, the 7-day hold, the "ship by" date and the day-5 reminder are all a later fast follow, so they drop out of both tickets. That also changes your cancel question: once paid, cancelling means a refund.

## A: orders, shipping, checkout, Buy, and Orders mode

**1. Checkout page:** yes. Buy goes to a **checkout page on the business's own site**, showing:
- the piece, its current price, and a "Ship to" country choice (only countries the owner ships to);
- the shipping rate for that country and the total;
- the owner's dispatch note, e.g. "Ships within 3 working days". This is a new field in Shipping settings, so the buyer sees what to expect before paying.

If the piece has just sold or its price has changed, they're told here. **Continue to payment** holds the piece and goes to Stripe.

**2. Full address:** yes. **Stripe collects it**: full name, address, email and phone, restricted to the chosen country so it can't contradict the rate. It reaches us with the payment confirmation and is stored on the order.

**Orders mode:** agreed, and better than nesting.
- A pill at the top of the Shop tab, **Inventory | Orders**, styled like the Site tab's View | Edit | Input.
- **Orders** shows a list with search (buyer name or email, order number) and filters (status, test or live).
- Opening an order shows its detail: the buyer, the address and the lines, then **one chronological record**: order placed, invoice, payment attempts 1…N, payment, and later shipped, refund and credit note.
- More modes can come later, e.g. a Payments view, without changing this.
- This replaces the epic's "order → invoices → attempts" nesting. I'll update the epic to match.

## B: fulfilment, buyer experience, returns

**Emails as EPIC-30 notifications:** agreed. The owner's **new order** email is a straightforward new notification type. **Buyer emails need EPIC-30 to grow**, because today it deliberately refuses two things buyer emails need:
- It only sends to the business's owner and delegates, and a caller can never supply an address.
- Its links can only point into the builder.

The request to EPIC-30 would add a "buyer of this order" recipient, with the address taken from the order record and never supplied by the caller, plus links to the public order status page. The emails are sent under the business's name, and replies go to the owner.

**Buyer, after the success page:**
1. **Confirmation email:** the order, what they paid, the delivery address, the dispatch note, and a link to the order status page. *I'd make this always on, not a setting.* It's the buyer's only route to the status page, and Stripe's receipt doesn't cover the order.
2. **Shipped email:** with tracking and carrier if given. **An owner setting, on by default.**
3. **Order status page:** a private, unguessable link with no login, as in DOC-5's "Manage this inquiry". It shows the lines, the address and a buyer-safe history: placed, shipped (with tracking), cancelled, refunded.
   - **Request cancellation** is an owner setting and shows only until the order is shipped. It **sends a request; it doesn't cancel.** The order shows "cancellation requested" and the owner gets a notification.
   - The owner either **cancels**, which refunds the buyer and puts the piece back on sale, or **declines** (for example, it's already in the post), and the buyer is told either way.
   - Your race goes away because the owner decides, never the buyer's click.
4. **Accounts:** that sign-up on the current checkout is most likely a shop account for order history and saved addresses. *My recommendation is no buyer accounts at launch:*
   - Stripe Checkout already offers **Link**, Stripe's own save-your-card-and-address-for-next-time, at no cost to us.
   - Order history later fits the platform's sign-in by email link: "email me a link to my orders" lists everything bought with that address from this business. No passwords, as DOC-5 requires.

**Owner, in B:**
- Mark shipped (optional tracking and carrier), Cancel (with a refund), handle a cancel request, and Record return (choose which lines, restock or not, refund amount suggested and editable).
- All of it shows up in the order's record.

## Still to decide

1. **Refunds from our buttons?** GOAL-55 says refunds at launch are made in the Stripe dashboard and reach us by webhook. Your owner Cancel and cancel requests really want a button that refunds directly. *I'd add the refund operation to the EPIC-9 ticket.* Otherwise Cancel would have to mean "go refund in Stripe, then come back".
2. **Confirmation email always on:** OK?
3. **Order numbers** for buyers: a short per-business sequence (1001, 1002…). OK?
4. **Tickets:** A and B under EPIC-31, plus one request under EPIC-30 for buyer recipients, public links and the new notification types. B depends on that request.
5. **Still unanswered from last time:** A can't complete a purchase without GOAL-55's EPIC-9 ticket (webhooks and Checkout sessions). Shall I file that here, or is EPIC-9's session doing it?

<!-- xgd-turn id="f31622e9-a8b7-494a-8588-9848435bf762-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T17:14:37.539676+00:00" -->
#### You
I think no accounts at launch makes sense, but since we already support accounts I am curious how much work it is?

1. Yes refund from our buttons. Why not?
2. Sure
3. sure
4. Sure
5. EPIC-9 is doing that we will implement it first

I want to talk about the architecture of "Buyer emails".  I have taken that conversation to EPIC-30 the messages need to be editable and brandable - not launch blocking

<!-- xgd-turn id="f31622e9-a8b7-494a-8588-9848435bf762-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T17:17:37.405388+00:00" -->
#### Claude
Answers noted. I'm filing the two EPIC-31 tickets now, and then I'll answer the accounts question.

I've filed both tickets under EPIC-31, at `draft`:

- **REQ-643, "Shop: orders, shipping zones, checkout page and endpoint, Buy, and Orders mode"**
  - **Orders:** order numbers 1001, 1002…, test or live; the invoice is numbered only when payment succeeds.
  - **Shipping:** Settings → Shipping with zones, flat rates and a dispatch note.
  - **Buying:** a checkout page on the business's site, where the buyer picks the Ship to country and Stripe collects the full address for it.
  - **Checkout endpoint:** takes the money at purchase, holds the piece atomically, and the checkout expires after 30 minutes.
  - **Success page:** says "confirming…" until the payment is confirmed. The cancelled page releases the piece at once.
  - **Orders mode:** the Inventory | Orders pill, with search and filters, and an order detail page showing everything in one chronological record.
  - **Done means:** a full test-mode purchase on our own test business on dev, recorded in the ticket.
- **REQ-644, "Shop: fulfilment, cancellation requests, order status page, returns and refunds, order emails"**
  - **To ship:** the default view in Orders.
  - **Owner actions:** mark shipped, cancel with a refund, record a return (pick lines, restock, suggested refund the owner can change), and a goodwill refund. All refunds are made from our buttons.
  - **Owner notifications:** new order, and cancellation requested.
  - **Buyer emails:** confirmation is always sent. Shipped is an owner setting. Cancel and refund outcomes are emailed too.
  - **Buyer's order status page:** an optional Request cancellation that only notifies the owner; the owner then cancels or declines.
  - **EPIC-30 dependency:** emails go through EPIC-30. The ticket states that editable, branded wording isn't launch blocking.

I added today's decisions and the new tickets to EPIC-31's body. I also left a note on EPIC-9 that our buttons now refund, and listed what REQ-643 needs from its Checkout sessions.

**On refunds (your "why not?"):** there's no reason not to. GOAL-55 left them to the Stripe dashboard only to keep launch small. It's one more operation for EPIC-9: a refund up to what's left, safe to retry, issuing the credit note. Your cancel-request design needs it anyway.

**On buyer accounts:** what we have now are accounts for business owners and their delegates on 1st Contact. Buyers on a business's site would be a new kind of user, so there are two sizes:

- **"Email me my orders":** about a day, as a follow-on to REQ-644.
  - The buyer enters their email on the business's site and gets a link, valid for 24 hours, listing every order they've placed with that business.
  - It reuses REQ-644's status page and EPIC-30's buyer email.
  - There's no session or password, and the risk is low.
- **Real signed-in buyer accounts:** about 1 to 1.5 weeks.
  - **The cost is in safety, not screens.** We'd need a buyer sign-in on the business's own domain, which the existing site sign-in module partly solves. We'd also need a new "buyer of this business" permission that can never open the builder or the owner's portal. Mixing the two is a privilege boundary, so it needs careful tests.
  - **Buyer data obligations:** export and delete for buyer accounts, as DOC-5 requires.
  - **Saved cards** are already covered by Stripe's Link at checkout. Storing them ourselves would add Stripe customer records per business for no gain.

I'd ship "Email me my orders" as the fast follow and only build real accounts if buyers ask for more than order history. Say if you want it added to REQ-644 now; it's small enough to fold in.

<!-- xgd-turn id="da3adf35-b9a6-4fef-b9b9-a2c617e7dbd7-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T17:37:22.261096+00:00" -->
#### You
**The cost is in safety, not screens.** We'd need a buyer sign-in on the business's own domain, which the existing site sign-in module partly solves. We'd also need a new "buyer of this business" permission that can never open the builder or the owner's portal. Mixing the two is a privilege boundary, so it needs careful tests. <-- I think you are making this problem harder than it is level 2 users can log in and do not access the builder. I'm pretty sure that is true and tested

<!-- xgd-turn id="da3adf35-b9a6-4fef-b9b9-a2c617e7dbd7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T17:38:14.204892+00:00" -->
#### Claude
Checking whether the "member without the app" case is actually tested, then I'll answer.

You're right, and I overstated it. Buyer accounts already exist in the design: DOC-42's own example is a customer of a business who signs in to that business's portal to see "his payments to Alice, his details, his delete button", and reaches no app. That's your level 2, and it's tested. REQ-186 has `a_level_two_member_reaches_no_business_of_ours` and `an_invited_person_holds_no_grant_and_no_membership`, so a level-2 person can't get into the builder. Nothing new is needed there.

So buyer accounts are three small additions to existing parts:

1. **The buyer becomes a person in the business.** Sign-in deliberately refuses anyone without a record in the business (there's no self-signup). A purchase should therefore record the buyer as a contact in that business. A **"Create an account"** tick box at checkout then runs the same step REQ-186's invite uses, which turns a known contact into someone who can sign in.
2. **The portal shows their orders.** Add an "Orders" section listing each order with a link to REQ-644's status page. One thing to watch: REQ-183's tests pin "the portal shows no plan, no charges", so this ticket would deliberately change that test, scoped to purchases from this business.
3. **A sign-in link on the business's site.** The site sign-in module from REQ-200 is already there and links to the portal.

**That's about 2–3 days, not 1–1.5 weeks.** Export and delete come with the portal as it is; DOC-42 makes the delete button part of what membership is.

Saved cards still come from Stripe's Link, so we don't build those.

Do you want this in REQ-644, or as a fast follow after launch? It fits REQ-644, since that ticket already builds the status page the portal would link to.

<!-- xgd-turn id="853adbfc-967a-47ef-91ba-e8093850ea57-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:42:32.637644+00:00" -->
#### You
Just to check the checkout page is implemented as an L1 module, right?

<!-- xgd-turn id="853adbfc-967a-47ef-91ba-e8093850ea57-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T21:43:21.604799+00:00" -->
#### Claude
The tickets didn't say so, but they do now. REQ-643 only called it "a static page whose dynamic parts call Worker endpoints", which a session could have met with hand-written HTML. I've added this to it:

- **The checkout, success and cancelled pages are an L1 module** in the framework's modules folder, in the same shape as REQ-633's `product-catalog`. The session can either extend that module or add a sibling `checkout` module, and must record which.
  - The module provides the data, the fields that can be bound and the controls (Ship to, Continue to payment).
  - Its own script calls the Checkout endpoint, the one kind of dynamic part DOC-5 allows.
- **Styling is in L1, using the site's design tokens.** The pages match the rest of the site, and the owner or the Site consultant can restyle them like any other page.
  - Values reach the page only through L1's typed outputs, so no hand-written HTML, CSS or raw template holes.
  - Every site that sells gets default versions of these pages.
- **Added tests:**
  - the pages render through the shared L1 renderer;
  - changing a design token changes the checkout page;
  - script injected into an item name has no effect on the checkout page.

REQ-644's **order status page** gets the same requirement and an injection test of its own.

Your question about buyer accounts is still open: should they go into REQ-644, or wait as a fast follow?

<!-- xgd-turn id="7f35db4d-c7e3-42ac-9af0-16698126d5b0-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:46:23.217191+00:00" -->
#### You
Lets leave the accounts for now

<!-- xgd-turn id="7f35db4d-c7e3-42ac-9af0-16698126d5b0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T21:46:54.553543+00:00" -->
#### Claude
Buyer accounts are left out for now. I've added them to EPIC-31 as **deferred**, with the shape we worked out, so whoever picks them up later doesn't have to rediscover it:
- **Who a buyer is:** buyers become level-2 members of the business, which is already built and tested in REQ-186.
- **Account creation:** an optional "Create an account" at checkout.
- **Portal:** an Orders section in the User Portal. This deliberately changes REQ-183's "no charges" test.
- **Sign-in:** a sign-in link on the business's site, using the existing site sign-in module.
- **Estimate:** about 2–3 days.

REQ-643, REQ-644 and BUG-339 are at `draft`, waiting to be picked up. Build order:
1. EPIC-9's webhooks and Checkout ticket.
2. REQ-643.
3. REQ-644, which also needs EPIC-9's refund operation and EPIC-30's buyer emails.

<!-- xgd-turn id="dc27fc23-b11a-47fe-abea-72ec3155fb84-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:59:17.847753+00:00" -->
#### You
No I don't think I agree with your design. Please do not add it we will come back to it

<!-- xgd-turn id="dc27fc23-b11a-47fe-abea-72ec3155fb84-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T22:00:06.792385+00:00" -->
#### Claude
I've taken it out:

- **EPIC-31:** I removed the deferred buyer-accounts section. It still says "No buyer accounts at launch", the decision you made earlier today.
- **REQ-644:** I also removed my "Email me my orders" fast-follow suggestion from its out-of-scope list. It now says only "Buyer accounts (to be designed later)".

Nothing else about buyer accounts is written anywhere, so we can start from scratch when we come back to it.

<!-- xgd-turn id="54af52c3-12fe-4af3-a464-1a88b93416b8-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T22:01:37.431462+00:00" -->
#### You
Please help me with the questions in 648 - it can add what it needs to L1

<!-- xgd-turn id="54af52c3-12fe-4af3-a464-1a88b93416b8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T22:03:02.682145+00:00" -->
#### Claude
The questions were in REQ-648's session chat. I've answered them in the REQ-648 ticket under "Decisions on the session's questions", so its session can go ahead.

**1. New L1 features: yes, it adds all four, and the Sold badge stays over the photo.** I added a few rules so the result stays clean:
- **Columns per width:** this extends the existing per-width settings (REQ-104), which can already switch a grid between stack, row and grid. It must not be a second, separate mechanism, so there's only one way to say "at this width".
- **One-line title with an ellipsis:** the "text cut off" layout check accepts it as deliberate, and still reports any other cut-off text.
- **Badge pinned to a corner:** it's pinned to a corner of the photo and takes no space of its own, so sold cards are exactly the same height as unsold ones.
- **Right-sized photo files:** the renderer works out each card's drawn width from the grid's columns, so the browser downloads a photo close to that size.
- **Every new feature must, like the existing ones:**
  - be checked by the validator, with fixed lists of choices and size limits;
  - be re-checked when the page is written out;
  - survive the capture round trip, where render-then-capture gives back the same L1;
  - have the same security and robustness tests.

**2. The 4:5 frame:** it comes from the design's `portrait` shape. A design without one gets 4:5 by default, and square is 1:1. A site changes the shape of every card through its design, never by editing the card.

**3. A grid with no `list`:** it draws the standard 4/3/2 grid instead of stacking. When the consultant adds a grid, any part it leaves out is filled from the standard version. The new check catches a grid that's deliberately set too narrow.

**Check widths:** it uses the layout check's existing widths, 1,280 / 900 / 375 px. The widths in the test plan were only examples.

<!-- xgd-turn id="abc843b8-12aa-470e-a467-413afe128b00-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T23:57:44.297323+00:00" -->
#### You
So I need to reimport Laurens inventory - what happens if I rerun the import in the same site - will I get dupes of everything or is it idempotent?

<!-- xgd-turn id="abc843b8-12aa-470e-a467-413afe128b00-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T23:58:19.664819+00:00" -->
#### Claude
A re-import into the same business **won't create duplicates**. I checked the import code as it is today, after BUG-333.

**Why not:** each item records which source product it came from. A re-import looks the item up by that and updates it in place; only products it can't find become new items. Collections and categories are matched by name, ignoring case, so they're reused rather than created twice. The saved category mapping is reused too, so you can change it before you run.

**What a re-import does to items that already exist:**
- **Overwritten from the source:** name, summary, description, price, availability, collection, categories and attributes. Any edits made in the Shop tab to those fields are lost.
- **Kept:** Live / Not live and Made to order.
- **Photos:** photos already imported that are still in the source are kept without downloading them again. Two things to watch:
  - **Photos added from the Library are removed.** The rebuilt photo list holds only source photos.
  - **Photo order goes back to the source's order,** so a different main photo you picked is undone.

**Other effects:**
- **Deleted items come back.** An item deleted in the Shop tab has nothing to match against, so it's imported as new.
- **Products removed from the source stay.** Nothing is deleted from our inventory.
- **Old categories stay behind empty.** If you remap a source category from category to collection, the old category remains in the list with no items in it, and you'd delete it by hand.

**So:** if nobody has edited items, added Library photos or deleted anything since the last import, re-importing is safe and gives the same items, updated. If edits have been made, they'll be overwritten.

Can you tell me which of those apply? Or what's prompting the re-import, e.g. changing the mapping to get the collections you wanted, or picking up new products?

<!-- xgd-turn id="5d2ac5df-d926-487b-a77c-6d40e46c0514-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:08:21.931833+00:00" -->
#### You
ok the new import is WAY better - thank you.

Now this time I named the collections correctly...but on Lauren's site "Reworked" has 4 items. The import only shows 1?

<!-- xgd-turn id="5d2ac5df-d926-487b-a77c-6d40e46c0514-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:08:53.483508+00:00" -->
#### Claude
The import is doing what the model says, though it isn't what you want. **On the source site, 3 of the 4 Reworked pieces are also in LO Originals**:

- 9ct Gold Bar Link Bracelet Antique Clasp LO
- 9ct Gold Reversible Centurion Engraved Pendant
- 9ct Gold Reworked Cherub Pendant

In our model an item belongs to **at most one collection**, so for those three the import chose LO Originals (the earlier collection in your mapping). The import recorded this in its report as a collection choice for each piece. Only one Reworked item is in Reworked alone.

The dev store now has Preloved 330, LO Originals 16, Reworked 1.

**How to fix it.** On the source site, Reworked looks like a kind of LO Original rather than a separate line. If so, **map Reworked as a category instead of a collection** and re-import:

- All 4 pieces carry Reworked, an item can have any number of categories, and the 3 stay in LO Originals.
- A product grid can select by category, so a "Reworked" grid on the site shows all 4.
- Re-importing is safe: no duplicates, and nothing has been edited since this import.
- The empty Reworked collection will be left behind, so delete it in the Shop tab.

**The alternative is to change the model** so an item can be in several collections. That reverses the EPIC-31 rule of one collection per item, and collections would then work just like categories. I'd keep the rule and use a category here.

Do you want to remap it, or do you want items in more than one collection?

<!-- xgd-turn id="8cc446ab-dc81-4123-a8a3-71bce19374d0-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:12:16.167493+00:00" -->
#### You
What is the purpose of the rule? collections and categories are just ways to organize the products on the site why does one need to be exclusive and the other not? The client should decide. If they want something in two collections why not allow it?

<!-- xgd-turn id="8cc446ab-dc81-4123-a8a3-71bce19374d0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:12:42.676146+00:00" -->
#### Claude
There isn't a good reason. The rule came from the first Shop design on 2 November, where a collection was meant as the business's "line" (its own pieces versus second-hand stock) and a piece only comes from one line. Nothing since has depended on that being exclusive:

- **The site's product grids already select "any of these collections",** so an item in two collections would simply appear in both grids.
- **Nothing on the site needs a single collection.** The catalogue does pass one collection name to each card and product page, but showing all of them works just as well.
- **Your source shop already allows it,** which is why the import had to drop Reworked from three pieces. The rule made us lose information on the way in.

**Your argument is right: how the products are organised is the owner's call, not a rule we set.** I'd make collections work like categories, any number per item:

- **Import:** every source category mapped to a collection is applied. No more picking one, and the "collection chosen" section of the report goes away.
- **Shop tab:** the item's Collection dropdown becomes a set of checkboxes, laid out like Categories.
  - The "All collections / None / …" filter keeps working; None means items in no collection.
- **Site:** grids match any of their collections, as they already do. Cards and product pages can show every collection an item is in.
- **Store:** the single collection field on an item becomes a list, like categories. Existing items keep the one they have.

That leaves collections and categories with the same rules. They stay as **two lists the owner names and uses as they like**, for example the line it's from and what kind of thing it is. The only differences are their names and where the owner chooses to show them.

This changes behaviour that's already built (REQ-631/633/639), so I'd file it as one request under EPIC-31 and update the epic's rule. Shall I? Once it's built, re-run the import as it is and all four Reworked pieces will land in Reworked.

<!-- xgd-turn id="cf8695ae-25d3-4b38-9d44-16fc2c6d5ca9-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:13:28.579671+00:00" -->
#### You
Yes please

<!-- xgd-turn id="cf8695ae-25d3-4b38-9d44-16fc2c6d5ca9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:14:13.974710+00:00" -->
#### Claude
Now updating EPIC-31's collection rule in place so it doesn't contradict REQ-651.

I've filed **REQ-651, "Shop: an item can belong to several collections"**, under EPIC-31, at `draft`. It changes four places:
- **Store:** an item holds a list of collections, stored the same way as categories. Every existing item keeps the collection it has.
- **Import:** every source category mapped to a collection is applied, and the "collection chosen" section of the report is gone. Re-import still won't create duplicates.
- **Shop tab:** the Collection dropdown becomes checkboxes laid out like Categories, and the list rows show all of an item's collections. The collection filter (All / None / one collection) works as before.
- **Site:** grids match any of their collections, so an item in two collections appears in both grids. Cards and product pages show all of an item's collections.

Each change has its own test. It's done once a re-import on dev shows a product from two of the source shop's collections in both collections, in the Shop tab and on the site.

I've also changed EPIC-31's rule in place to "any number of collections, the owner's decision", so the epic no longer contradicts REQ-651, and added REQ-651 to its children list.

Once it's built and deployed, re-run the import with your current mapping and all four Reworked pieces should land in Reworked.

<!-- xgd-turn id="7294ec32-874e-492f-85fb-a5be06468cae-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T21:15:52.412070+00:00" -->
#### You
I have not had time to test the second round of shop functionality yet. In your view should I test what we have before implementing the last ticket 644? Or does it matter?

<!-- xgd-turn id="7294ec32-874e-492f-85fb-a5be06468cae-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T21:18:33.785766+00:00" -->
#### Claude
I'd test first, and mainly REQ-643.

**Why it matters:** REQ-644 is built directly on REQ-643. Mark shipped, cancel with a refund, returns, the buyer's order status page and the order emails all act on the orders that REQ-643's Checkout creates. So if REQ-643's orders, shipping zones, Checkout or Orders mode need changing after you try them, REQ-644 would need reworking too. It's also REQ-643's biggest risk: it's 20 points, the size limit for one ticket, and it's untested.

**What doesn't need to wait:** REQ-651 (several collections) and REQ-648 (the product grid standard) are separate from REQ-644. Problems you find there won't affect it.

**A suggested order:**
1. **Deploy to dev first**, if nobody has since these landed. Dev keeps serving the old build until `bin/deploy --env dev` runs.
2. **Re-import the source shop and check the four Reworked pieces show in Reworked.** That tests REQ-651 and the import together.
3. **Check the shop grid on desktop, tablet and phone** (REQ-648).
4. **Buy an item in test mode from start to finish:** add to cart, Checkout, choose a shipping zone, pay, then see the order in Orders mode. Of everything, this is what REQ-644 relies on.

**One thing worth knowing before you start REQ-644:** it also depends on refunds made from our own buttons (EPIC-9) and on emails to the buyer (EPIC-30). If either isn't ready, building REQ-644 now would mean stubbing them out. If you want, I can check where those two stand while you test.

<!-- xgd-turn id="473a9b4f-46b2-4c20-981a-702da58d98ee-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:28:07.898933+00:00" -->
#### You
You got some more children from EPIC 9 please review them

Also -> do we understand the behavior of the flow if the user uses the browser Back button during any of the checkout stages. Ideally this would work seamlessly and "as expected"?

<!-- xgd-turn id="473a9b4f-46b2-4c20-981a-702da58d98ee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:30:13.274979+00:00" -->
#### Claude
Reviewing the two new EPIC-9 children (BUG-375, REQ-659) and reading the checkout client code to answer the Back-button question.

EPIC-9 filed two new Shop children, **BUG-375** (built, waiting at `ready_to_reconcile`) and **REQ-659** (`draft`). I've added both to EPIC-31's children list. On the Back button: I traced it through the checkout code, and it doesn't behave as expected. I haven't run a browser test of it.

## The Back button

Since BUG-375, **just opening the checkout page starts a new order**: it reserves the stock and opens a Stripe session as soon as a region is known, or straight away when there's only one shipping rate. Nothing reuses a session the buyer already has open, and nothing cleans up when they leave the page. The reservation lasts about 31 minutes. So:

| What the buyer does | What happens |
|---|---|
| Goes Back from checkout to the product page | Their reservation stays for ~31 minutes. Nobody else can buy the piece in that time, although the product page still shows Buy. |
| Then clicks Buy again, or reloads the checkout page | For a one-off piece, **their own earlier reservation blocks them**: "Sorry — someone else is buying this right now". It stays blocked until the reservation runs out. |
| Goes Forward to checkout again | Depends on the browser. If it keeps the page in memory, the old form comes back and works. If it reloads, they get the same block as above. |
| Goes Back from the thank-you page after paying | Checkout reloads. A one-off shows "Sorry — this has sold since the page was published", which is confusing for someone who just bought it. If there's more than one in stock, a second order quietly starts. |
| Goes Back from the cancelled page | Works: that page already released the reservation, and checkout starts again cleanly. |
| Leaves while the card is being confirmed | The payment still settles through the webhook or BUG-375's self-correction, and the confirmation email goes out. They just never see the thank-you page. |

Every abandoned visit also uses up an order number, so the owner will see gaps.

In the builder preview, links clicked inside the preview may also add steps to the builder tab's own history, so Back would move the preview rather than leave the builder. I haven't checked this.

**Suggested fix (small, mostly in the checkout script):**
- The checkout page remembers its open session in the browser tab, for that item and region. On a reload, Back or Forward, it shows the same Stripe form again instead of starting a new order. It starts a new one only once that session has ended.
- If the remembered order turns out to be paid, the page says "You've bought this — view your order" instead of "sold".
- When the browser restores the page from memory, it re-checks the order with the server.
- We still don't cancel when the buyer leaves the page. That event also fires during the normal return from Stripe after paying, so cancelling there could end a session that is completing.

UATs in real Chromium would cover Back, Forward and reload at each step. Since this fixes work that has already landed, it would be a bug ticket. Do you want me to file it?

## BUG-375 review

The scope is good, and it's the right fix for what your first sale turned up. Three things:
- **Done isn't checked yet.** It needs `STRIPE_PUBLISHABLE_KEY_TEST=pk_test_…` in the dev secrets file, then `bin/deploy --env dev` and a real test purchase.
- **Starting an order on page load** causes the Back problems above. It also means any visitor or crawler that runs scripts on the checkout page reserves stock. I found no `noindex` on that page; it's worth adding.
- **The checkout still sends a single item.** The multi-item cart is still the planned fast follow. I'm noting this so nobody assumes it's in.

## REQ-659 review

The design is sound: the address stays on the order, a paid order never implies marketing consent, and a replayed webhook adds no second contact. One change I'd make:
- **Test purchases create real contacts.** Behaviour 7 makes test orders do everything. When an owner rehearses with their own email, they become a "customer" of their own business, and test buyers pile up in People. I'd add one line: contacts created from a test order carry the Test mark and can be filtered out. Better still, they don't count as customers.

It's built on BUG-375's settle path, so it should come after BUG-375 is verified on dev.

<!-- xgd-turn id="cb9af7d8-5d74-441e-abab-79a6dcdde181-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:55:32.478749+00:00" -->
#### You
Test purchases can only occur in test sites - all the users in such a site are test users

<!-- xgd-turn id="cb9af7d8-5d74-441e-abab-79a6dcdde181-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:55:48.468647+00:00" -->
#### Claude
You're right, and the code agrees, so I withdraw that point. The payment mode is set for the whole deployment, not per business: `configuredMode` reads `STRIPE_MODE`, and anything other than `live` means test. A test order can only come from the dev deployment, where every business and contact is test data anyway. Behaviour 7 in REQ-659 is fine as written, so I'd leave REQ-659 alone.

Still open is the Back-button bug from my last message. The checkout page starts a new order on every load, so a buyer who goes Back and then comes back can be blocked by their own reservation for about 30 minutes. Do you want me to file that as a bug?

<!-- xgd-turn id="6534218d-e575-4f4c-bef5-d389e3ff1c7e-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:43:52.916078+00:00" -->
#### You
ok can you take a look at production. I started an import from WooCommerce and it sees to have stalled

<!-- xgd-turn id="6534218d-e575-4f4c-bef5-d389e3ff1c7e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T00:47:49.623633+00:00" -->
#### Claude
Checking how the import runs, then reading production's import records and logs.

Now reading production's import rows (read-only queries against the production D1).

The import job was cancelled at 00:40 UTC, after 42 of about 1,943 photos. Reading the two errors just before that, then the Workflow instance's state.

Found the cause of the stall. Checking one side effect (the business's Library search index) before reporting.

The import has stopped for good and won't recover by itself. **Don't start it again yet**: a rerun would stop at the same point, after about 40 photos.

## What happened
Times are Pacific.

- **4:34 PM:** the import started.
- **Products:** all 367 were imported, 37 pages, with no errors.
- **Photos:** 42 of 1,943 were stored. 1,901 are still waiting.
- **4:40 PM:** the job stopped, because the background job ran all its steps in one Worker run and hit Cloudflare's cap on how many storage and database calls one run may make ("Too many API requests by single Worker invocation"). The photo step retried 3 times and failed straight away each time, because a retry in the same run doesn't reset the count.
- **Why it still says running:** the step that should mark the import failed hit the same cap. So Shop still shows it running and nothing is moving. Cloudflare reports the job itself as Completed.
- **When a new import can start:** the stuck row stops blocking one after 30 minutes, at 5:09 PM. Until then, starting an import is refused.

This never showed up on dev because the local dev runtime doesn't enforce that cap.

## A second problem: the business's Library search is now broken
Each stored photo also updates the business's Library search index. Several photos were stored at once, and their index updates overwrote each other part-way. The four index files are saved one after another, not together.

The index now in production is inconsistent: 86 entries but 33,792 numbers, which isn't a whole number per entry. Each later update loads it, refuses it as corrupt, and gives up. So photos added from now on won't be findable by search until the index is rebuilt. The photos themselves are stored safely.

## What needs fixing
1. **The photos need to run outside a single Worker run.** Our Architecture Policy (item 31) already says media processing for a whole catalogue belongs in a job container. The smaller alternative is to start each batch of photos as its own run.
2. **A failed import must be recorded as failed** even when the run that failed can't make any more calls, so it never sits at "running".
3. **Library index updates for one business must happen one at a time.** A corrupt index must be rebuilt, not refused forever. This business's index needs a rebuild now.

Since this breaks work that has already landed (REQ-631, BUG-333), it would be a bug ticket under EPIC-31. Do you want me to file it?

I made no changes to production. I could mark the stuck import as failed now so the Shop tab stops showing it running, but that's a production database write, so I'll only do it if you say so.

<!-- xgd-turn id="ae664eba-9301-4f23-a1f6-83b1b95344a6-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:49:32.562207+00:00" -->
#### You
Please make a ticket

<!-- xgd-turn id="ae664eba-9301-4f23-a1f6-83b1b95344a6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T00:50:42.938612+00:00" -->
#### Claude
Fix the test-plan placeholder name, and add it to EPIC-31's children.

I've filed **BUG-380, "Shop import: photo phase stalls at the per-invocation request cap, stays 'running', and corrupts the Library index"**. It's under EPIC-31 at `draft`, with high severity, and I've added it to the epic's children.

It covers four fixes:
1. **Photos are processed in the job container**, as Architecture Policy 31 requires, so an import of any size finishes. A retry picks up from the photos still waiting, and nothing already stored is downloaded again.
2. **A failed import always shows as failed.** If the background job has ended but the import still says running, the next status check marks it failed. A new import can then start straight away, with no 30-minute wait.
3. **A business's Library index is updated by one writer at a time**, so storing many photos at once can't corrupt it. An index that is already corrupt gets rebuilt rather than refused forever. If this needs a change inside the `@lagrangefoundry/knowledge` package, that part becomes a ticket in that package's repository.
4. **Repairing the affected business after deploy:** the stuck import shows failed, its Library index is rebuilt, and a rerun stores all of about 1,943 photos without duplicates.

It also has the test plan. Its done check is that rerun on production, with no "Too many API requests" errors in the logs.

The import is still showing "running" in the Shop tab. If you'd rather not wait for the fix to clear it, I can mark it failed in production now, but only if you say so.

<!-- xgd-turn id="946e4723-a10f-44b2-995c-2f89e9c23ef5-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T22:29:38.214506+00:00" -->
#### You
**Fill in your business details to start selling: your Terms of sale need your legal name, postal address, contact email. Your site has no Terms of sale yet, so there is no Buy: a buyer has to be able to read what they agree to. They are added when you publish, once selling is set up — see Paperwork → Legal. <-- this is a useful notice, can you have the CTA open the Business Details (today it just navigates to Paperwork-> Legal**

**On the biz details, please make "Country" a drop list of country codes, its a free text field right now expecting an enum...**

<!-- xgd-turn id="732b2ead-3147-4ce1-9a41-83f73680fbec-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T22:30:06.812142+00:00" -->
#### You
**Fill in your business details to start selling: your Terms of sale need your legal name, postal address, contact email. Your site has no Terms of sale yet, so there is no Buy: a buyer has to be able to read what they agree to. They are added when you publish, once selling is set up — see Paperwork → Legal. <-- this is a useful notice, can you have the CTA open the Business Details (today it just navigates to Paperwork-> Legal - this note should disappear when the Biz Details are saved, today it does not**

**On the biz details, please make "Country" a drop list of country codes, its a free text field right now expecting an enum...**

<!-- xgd-turn id="732b2ead-3147-4ce1-9a41-83f73680fbec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T22:31:42.178056+00:00" -->
#### Claude
I'm filing a bug ticket under EPIC-31. The relevant code is `shop.js`, `app.js`'s `onOpenLegal`, and the Business details form in `paperwork.js`.

I'm checking how BUG-380 was linked to the epic, so BUG-392 gets linked the same way.

I've filed **BUG-392**, "Shop: seller-details notice opens Legal not Business details, doesn't clear on save; Country is free text". It's under EPIC-31 at `draft`, with medium severity. I haven't changed any code: an epic session writes the ticket, and the child session builds it.

The ticket covers three fixes:

1. **The button opens Business details.** "Fill in business details" will open the Business details form directly. Today it only goes to the Paperwork → Legal list. The "Open Terms of sale" button on the separate warning about the owner's own Terms of sale still goes to Legal.
2. **The notice goes away once the details are saved.** It stays today for two reasons:
   - The Shop only re-checks this when it decides to. Saving in Paperwork doesn't tell it.
   - The second sentence, "Your site has no Terms of sale yet…", is shown until the next publish, even when nothing is missing.

   With the fix, the Shop checks again when you come back to it or when Paperwork saves. That sentence only shows while details are still missing, because once they're complete, the next publish adds the standard Terms of sale anyway. A partial save keeps the notice, listing only the fields still missing.
3. **Country becomes a drop-down.** It shows country names, saves the two-letter code (for example Ireland saves `IE`), and starts with an empty "Choose a country…". The list comes from the same country data the server checks against, as the shipping country picker already does, so every choice is one the server accepts.

The ticket also has a test plan for each fix.

One decision for you: I've had the "no Terms of sale yet" sentence disappear along with the missing-details part, which is how I read "the note should disappear". If you'd rather keep a short "your Terms of sale are added at your next publish" line until then, tell me and I'll change the ticket.

<!-- xgd-turn id="b848330c-4f7f-4c7d-859b-c65404e5d7e7-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T02:09:39.762196+00:00" -->
#### You
ok I have an issue in prod. I believe we are configured and have a ToS, we are not published (deliberately). I an trying to test the core purchase flow,

I select a region for delivery and the buy button looses its label and collapses to a little snub that is unresponsive?

<!-- xgd-turn id="b848330c-4f7f-4c7d-859b-c65404e5d7e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T02:11:36.656384+00:00" -->
#### Claude
I'm going to find the product page's Buy and region code, then look at what changes when a region is chosen.

Here's what I know so far. Choosing a region makes the checkout script reserve the item and load Stripe's payment form in place of the button. I'm checking where that form is placed on the page.

The checkout's server side is fine. The production logs for this session show the price being re-checked and a Stripe session opening successfully (200) on every region change, and the previous one cancelled when you picked another region. So the failure is in the page, after the session opens.

**Likely cause** (not yet confirmed against your page's template):
- The checkout page only gets a slot for Stripe's payment form when its template has the standard button row, with Continue and Cancel side by side. If your template places Continue differently, the page is built with no slot.
- After choosing a region, the checkout script opens the session and hides Continue whether or not a form appeared. What's left is the button's outer styled box, with no label and nothing behind it. That's the snub you're seeing.

I've filed **BUG-396**, "Checkout: choosing a region hides Continue but no payment form appears (empty box, can't pay)". It's under EPIC-31 at `draft`, with high severity because it blocks buying. The fix:
1. Every checkout page gets a slot for the payment form, whatever its template looks like.
2. Continue is only hidden once Stripe's form is actually on the page. Otherwise it stays labelled and clickable as a retry, the opened session is cancelled so the stock isn't held, and the buyer sees "Payment could not be started. Nothing was charged".
3. When Continue is hidden, the box around it goes too.

It's done when your preview's checkout on production shows Stripe's form after you choose a region.

**To confirm the cause quickly:** open the browser console on the checkout page (in the preview frame) and choose a region. If nothing is logged, it's the missing slot above. If a Stripe or Content-Security-Policy error appears, it's the other possibility in the ticket: Stripe's form loads but stays invisible inside the preview. Pasting whatever shows up there would settle it, and I'll update the ticket to match.

<!-- xgd-turn id="288d77b9-eeef-4982-b53c-9da908e289a3-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T05:35:35.554326+00:00" -->
#### You
Just to be clear I dod not get to push the button

<!-- xgd-turn id="288d77b9-eeef-4982-b53c-9da908e289a3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T05:36:19.408597+00:00" -->
#### Claude
That fits. Since BUG-375, you're not meant to press the button: **choosing the region starts the payment by itself**. The page opens the Stripe session straight away, which is the "start" call in the logs, and is supposed to replace Continue with Stripe's payment form. The button disappears at that moment, but no form appears to take its place. You're left with the empty box around the button.

I've updated BUG-396 to say the box appears on choosing a region alone, with no click. The diagnosis and fix are unchanged:
- every checkout page gets a place for the form;
- Continue is only hidden once the form is really on the page;
- nothing empty is left behind.

The console check would still confirm which of the two causes it is. If nothing is logged when you pick a region, it's the missing slot for the form. If a Stripe or Content-Security-Policy error shows up, Stripe's form is loading but staying invisible inside the preview.

<!-- xgd-turn id="e73cce6d-db51-47ab-9ca1-d6db6409f43f-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T05:41:12.332279+00:00" -->
#### You
I actually thought we agreed to have a single checkout page not two?

<!-- xgd-turn id="e73cce6d-db51-47ab-9ca1-d6db6409f43f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T05:41:59.755326+00:00" -->
#### Claude
Yes, we agreed on a single checkout page, and that's what BUG-375 built. The flow is meant to be:

1. **Product page:** the buyer clicks Buy.
2. **Checkout page, the only one:** it shows the item and the total, and asks for the delivery region. When the buyer picks a region, the total updates and **Stripe's payment form appears on that same page, below it**. The buyer pays there and never leaves the business's site. If there's only one shipping rate, the form appears straight away.

So "Continue to payment" isn't meant to go to another page. It's only on screen until the form loads, and again as a retry if the form fails to start. That's why it disappears when you pick a region: the form is supposed to take its place. On your page the form never appears, which is BUG-396, so what you see is the button vanishing and nothing replacing it. That would look like a step towards a second page that never arrives.

When BUG-396 is fixed, the form will appear on the checkout page as soon as you pick a region. You won't need to press anything to see it.

If by "single page" you meant the product page itself, with region and payment on it and no separate checkout page, that wasn't the agreement in BUG-375. It would be a design change to make in a new ticket, so tell me if that's what you want.

<!-- xgd-turn id="60667a0a-b4ab-4610-bc59-be06a4f3d7fa-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T05:43:43.014847+00:00" -->
#### You
no I mean Product detail page, [BUY] -> checkout page "Select region" -> selection drives population of the rest of the SAME PAGE

<!-- xgd-turn id="60667a0a-b4ab-4610-bc59-be06a4f3d7fa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T05:44:02.783673+00:00" -->
#### Claude
Yes, that's what we agreed, and it's what BUG-375 specified. The flow is:

1. On the product detail page, the buyer clicks **[Buy]**.
2. They land on the checkout page, which asks them to **select a region**.
3. Choosing a region fills in **the rest of the same page**: shipping, the total, then Stripe's payment form below.

That's built, apart from the last part: on your page the payment form never appears. That's BUG-396.

The "Continue to payment" button doesn't fit your description, though. It sits on the page, disabled, before a region is chosen, so it looks like a step leading to another page. Then it disappears when the region is picked. In this design it does nothing except act as a retry if the payment form fails to start.

I suggest adding this to BUG-396: **no Continue button on the checkout page while things are working**. Before a region is chosen, the page shows only the region choice. Choosing one fills in the rest. A "Try again" button appears only if the payment form fails to start. Cancel stays. Shall I add that?

<!-- xgd-turn id="60cfd327-5e40-4281-ba23-40c690db7468-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T05:46:15.811659+00:00" -->
#### You
It should also show no Cancel button - ok it can show a Cancel button but we need to figure out where - right now it would be in the position of the primary CTA (bad!)

<!-- xgd-turn id="60cfd327-5e40-4281-ba23-40c690db7468-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T05:47:00.271903+00:00" -->
#### Claude
I've updated BUG-396 with the new layout and renamed it to match: "Checkout: one page that fills in on region choice — no Continue, Cancel as a back link, payment form always appears".

**Cancel becomes a back link at the top of the page.** It reads "← Back to <item name>", or "← Back to the shop" when the item has no product page. It's a plain text link above the item, not a button. It never sits beside or below the region choice, the total or the payment form, so nothing competes with the payment form. This is where most shops put "back", and it's the behaviour Cancel has today:
- If a payment session is open, it ends it and releases the reserved stock.
- If not, it just goes back.

**The rest of what BUG-396 now says:**
- **No Continue button.** The page shows the item and the region choice. Choosing a region fills in the shipping and total, then the payment form, all on the same page. With one shipping rate, the form appears straight away.
- **Try again** is drawn only if the payment form fails to start. It appears in the form's place, under the "Payment could not be started. Nothing was charged" message.
- **The payment form always has a place on the page**, directly after the total, whatever the template looks like. That fixes the empty box you saw.
- **Nothing empty is ever left on screen**, at any stage.
- **The consultant's guidance (DOC-47) is updated**, so it never styles Cancel or a button into the main-button position.

This replaces the Continue/Cancel button row from BUG-367 and BUG-368, and the ticket says so explicitly so the matrix updates rather than enforcing the old row.

If you'd rather have Cancel somewhere else, for example as a small link under the payment form, tell me and I'll change it.

<!-- xgd-turn id="75fb3414-6f26-4bb0-ac23-f72e9f43af58-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T16:08:54.297875+00:00" -->
#### You
I just did our first, successful live payment. A few issues:

The Cancel link on Lauren's still reads "Cancel". Is that a site level thing now?

We should talk about the customer emails I have a few concerns:
 - When I clicked on the link in the browser that I had the builder open in, it opened the builder
 - Now, clicking on "See your order status" I get taken through login to a Thank you page (Ah we said Thank you == order status, but maybe the site hasn't made that change"
 - The login to see my order status only works once I think this is a product issue that we need to discuss, a customer could want to check on the order multiple times?

<!-- xgd-turn id="75fb3414-6f26-4bb0-ac23-f72e9f43af58-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T16:11:08.019888+00:00" -->
#### Claude
Checking the order-email link and sign-in code now.

The live payment worked. I traced each issue to the code. All three email problems seem to come from one cause, but I haven't checked them against your actual order record.

**1. Cancel still reads "Cancel" on Lauren's**

Yes, the wording is now set per site. BUG-396 only uses "← Back to <item>" when the checkout page has no wording of its own for Cancel (`cancelLabel`). Before BUG-396 the default was "Cancel", and that word may have been saved into Lauren's checkout page, which would override the new default. The other possibility is that the code serving that page doesn't include BUG-396 yet (c9401a7847, from last night).

If it's the saved wording, I'd treat a saved "Cancel" as if no wording were set, so every existing site gets the back link without being republished. BUG-396 is already at `ready_to_reconcile`, so this has to go in a follow-up or with your OK to extend it.

**2–4. The order emails: builder opening, sign-in, Thank you page, single use**

The order-status link was designed to need no sign-in. The email holds a private token on the site's own `order-status` page, the token can be used any number of times, and every email gets a new one (`order-emails.ts:105`). So "checking on my order several times" is meant to work.

What breaks it: the email links back to whatever site address the checkout was started from. A checkout started in the builder's preview records the preview's address (`router.ts:9072`, intentionally, for test orders: "an order settled from the preview mails links back here"). If your live payment was made in the preview frame:
- **The builder opened:** the link points at the app, and that browser was signed in as you.
- **The sign-in:** in another browser, the preview needs the owner to sign in.
- **It only worked once:** the sign-in link is single-use. The order-status link itself isn't.
- **The Thank you page:** you were shown the unpublished draft's version of the order page, so whatever heading it has.

**The product question:** a real buyer must never be sent into the builder. My recommendation:
- **Live orders always link to the business's published site**, wherever the checkout was started.
- **Orders placed from the preview stay test-mode only**, so they can't take real money. Live payments happen only on the published site.

If you want to keep live purchases from the preview possible, the first point alone fixes the emails.

Can you confirm the payment was made in the preview? If so, shall I file this as a bug under EPIC-31, together with the "Cancel" wording fix, or would you rather add the wording fix to BUG-396?

<!-- xgd-turn id="c8e5ab73-ea8c-4ce6-8560-1db63ab4e182-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T16:17:35.156805+00:00" -->
#### You
Well this site was built before a lot of those things changed. I am having the consultant update. I think most of my issues lie there.

<!-- xgd-turn id="c8e5ab73-ea8c-4ce6-8560-1db63ab4e182-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T16:17:51.679633+00:00" -->
#### Claude
Updating the site should fix the parts that live in the site itself: the "Thank you" heading on the order page, and the "Cancel" wording if it's saved in the checkout page. For the wording, ask the consultant to remove Cancel's own wording rather than reword it, so the page picks up the new "← Back to <item>" default.

Two things an update won't change:
- **Where the email links point.** It depends on where the checkout was started, not on the site. A purchase from the published site sends the buyer to the published order page, with no sign-in, and the link works as often as they like. A purchase from the builder's preview sends them back into the preview. The live payment you made sends them there too, so you'll still go through sign-in to see that order.
- **Older sites with "Cancel" saved.** Any other site built before BUG-396 keeps "Cancel" until it's updated too.

The real test after the update is a purchase on the published site. If the email link then opens the order page directly, with no sign-in, the only open question is whether the preview should take live payments at all. Tell me if you want that filed.

<!-- xgd-turn id="7ac0c26b-0dc9-4712-acb5-f66047ebeaaa-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T16:19:29.453109+00:00" -->
#### You
I'm ok with being sent back to the preview it the correct page gets opened. I think I went to the home page.

There is also the Open in a new tab view that would work fine without having to publish the site

<!-- xgd-turn id="7ac0c26b-0dc9-4712-acb5-f66047ebeaaa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T16:20:23.255730+00:00" -->
#### Claude
I'll check what the preview's sign-in does with the address it was asked for.

Taking the email back to the preview is fine. The problem is that it lands you on the wrong page.

**"Open in new tab" is already what the email links to.** A checkout started in the preview mails a link to the same `/preview/<site>/draft/` address the builder's "Open in new tab" uses, pointing at the `order-status` page. So the view itself is right.

**Why you ended up on the wrong page.** The link carries the order's private token after `#` (`…/order-status#t=…`). That keeps it out of server logs, but browsers never send that part to the server. When the preview made you sign in, it remembered the page you asked for (`sign-in-return.ts`) but couldn't remember the token, because the server never saw it. After signing in you reached the order page with no order to show. That's the "Thank you" or home page you saw.

The sign-in only working once fits too. Each sign-in link is single-use. The order link itself can be used any number of times, and once you're signed in in a browser, it should keep working there.

**The fix:** keep the token through the sign-in, so you land on your order. Two ways to do it:
- **Keep the token out of the server (my preference):** the preview's sign-in page saves the token in the browser and puts it back after you sign in.
- **Simpler:** preview orders put the token in the address itself. It would then appear in server logs, which matters less because the preview is only ever you.

I couldn't explain from the code the first symptom, where the link opened the builder in the browser you had it open in. I'd include it in the ticket as something to reproduce.

This needs code, so it should be its own bug under EPIC-31, worked in its own session. Shall I file it?

<!-- xgd-turn id="6caa8ebe-0160-442f-a06c-7cd4263e2583-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T17:56:31.673484+00:00" -->
#### You
Lets hang fire on changes here - the site needs to update to the latest and I need to check the links carefully.

Here is the new order detail page:

1009

Cancelled

9ct Gold Bar Link Bracelet Antique Clasp LO

€1.00

€1.00

€1.00

€2.00

Martin Westhead
334 Santana Row
Apt 339
95128 San Jose
CA
US

11/9/2026 — Order placed
11/9/2026 — Refunded €2.00
11/9/2026 — Cancelled

You'll have an email receipt shortly, and Lauren will be in touch when your piece is on its way.

A few issues and I don't know whether the problems are on the platform side or the site so lets work through them carefully:

1. The amounts have no titles "Shipping" "Total" etc
2. The text at the bottom "You'll have an email receipt shortly, and Lauren will be in touch when your piece is on its way." OK in general but this order was cancelled, it could have been shipped. That text needs to be state-specific, or removed

<!-- xgd-turn id="6caa8ebe-0160-442f-a06c-7cd4263e2583-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T17:57:23.575713+00:00" -->
#### Claude
I'll look at how the order page draws its amounts and that closing sentence, to see which parts come from the platform and which from the site.

Both issues come from the site's own order page. There's also one small platform issue in the same area. I haven't changed anything.

**1. No "Shipping", "Total" labels: the site's page.**
The platform's default order page labels every figure: Order, Status, Items, Subtotal, Shipping, Total, "Delivering to" and History (`l2/checkout.ts:304`). The platform only fills in the figures. The labels are ordinary text in the page, so a page built before this default existed, or rewritten by the consultant, can leave them out. That's what Lauren's page has done. The update should restore them. If it doesn't, the consultant's guidance needs to say "every figure on the order page keeps its label".

**2. "You'll have an email receipt shortly…": the site's wording, but the platform gives the site no good place for it.**
That sentence isn't in the platform anywhere, so the site wrote it. It's plain text, so it shows whatever state the order is in. The order page only has two pieces of wording that appear by state:
- `confirmed`: "Thank you — your order is confirmed."
- `requested`: "You have asked to cancel this order."

A promise like "you'll get a receipt and we'll be in touch when it ships" belongs in `confirmed`. That's the site's fix: the consultant puts the sentence there, or drops it.

**The platform issue:** `confirmed` isn't strictly state-specific either. It shows whenever the buyer arrives back from Stripe and the order is no longer pending (`client.js:377`), and that includes Cancelled, Refunded and Shipped. So a cancelled order reached that way would still say "your order is confirmed". It should show only while the order is Paid and not yet shipped.

**What to look for after the update:**
- Labels beside every figure.
- No closing promise on a cancelled order, opened from the email link and from Stripe's return.

If the closing promise still appears on a cancelled order through Stripe's return, that's the platform issue above. I'll file it when you're ready to make changes.

<!-- xgd-turn id="d33e65ee-d193-440c-8f70-cbef92c3c66f-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:54:56.937622+00:00" -->
#### You
I am finding this conversation confusing, let me explain why...there are a lot of moving parts here:

1. Consultant instructions
2. Default pages
3. APIs and data
4. Module behavior
5. What the consultant for this site built first time around

you own 1-4 but its unclear what the consultant will actually do with what its got - it needs to come up first pass with something that makes sense.

I have asked the consultant to delete the existing pages and rebuild them from defaults and instructions. Lets work through the issues with what it has built (Lauren Test 1 on my account in production)

Can you review the last few turns  - I laid out the things that need fixing - these need to be right first time without help

<!-- xgd-turn id="d33e65ee-d193-440c-8f70-cbef92c3c66f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:55:44.483536+00:00" -->
#### Claude
Reviewing the last few turns: I fixed issues one at a time and kept splitting them into "platform" and "site". If it has to be right first time without help, that split is wrong. Anything a buyer depends on shouldn't rest on the consultant writing the page well. It should be guaranteed by the defaults, the module or the data, and the consultant's guidance should only cover choices of taste.

Here's every issue raised so far, with the layer I think should own it. It's 1–4 throughout, so all of it is mine.

| # | Issue | Owner | Fix |
|---|---|---|---|
| 1 | Checkout's Cancel reads "Cancel", not "← Back to <item>" | **4 Module** | The back link's wording belongs to the module, not the page. A site can't save "Cancel" over it, and wording saved by older pages is ignored. |
| 2 | Order email link → sign-in → lands without the order | **3 APIs/data** | The order token survives the preview's sign-in, so you land on your order, every time. |
| 3 | "Only works once" | follows from 2 | The order link itself can be used any number of times. Only the sign-in link is single-use, and fixing 2 removes it from the path. |
| 4 | Link opened the builder in the builder's browser | **3**, cause unknown | I couldn't explain it from the code. It needs reproducing on the rebuilt site. |
| 5 | Order page figures have no labels (Shipping, Total…) | **4 Module** | Each figure is drawn with its label, so a page can't show a bare amount. The default page has labels today, but nothing stops a rebuilt page dropping them. |
| 6 | Closing promise ("receipt shortly… in touch when it ships") shows on a cancelled order | **4 Module + 2 Default** | The order page gets wording for each state (paid, shipped, cancelled, refunded), and the default page fills each in. The existing "confirmed" wording stops showing on cancelled, refunded and shipped orders, which it does today. Guidance (1) says a promise to the buyer goes in a state's wording, never in plain text. |
| 7 | "Thank you" page vs order status | **2 Default** | There's one order page. Its heading changes with the state, so "Thank you" appears only while the order is paid. Same mechanism as 6. |

**What's left for the consultant (1):** only things that would look wrong, not things that would break: the order page's tone and layout. The defaults and the module guarantee everything else in the table.

**Next step:** I haven't looked at what the consultant has just rebuilt for Lauren Test 1. Before filing, I'd check each row against it, so the ticket records only what's still wrong after a rebuild from current defaults. That's the real "first time" test. Do you want to walk through it on your screen and tell me what you see, or shall I read the rebuilt pages from production myself?

Once that's done, I'd file it all as one bug under EPIC-31, in line with keeping the ticket count down.

<!-- xgd-turn id="7b05c8d3-2663-46a1-97ec-3f8fa5df01d5-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T19:00:21.204670+00:00" -->
#### You
ok lets back up - please drop that list much of that is stale data and test mistakes. I'm going through from scratch with more rigor.  I asked the consultant to delete those and start from scratch. It did and then I listed my concerns at 10:45 PST - it is now making the fixes I asked for. The problem I want us to focus on is that none of my comments should have been needed the consultant should have got this all right first time without my help. 

I want us to look at the defaults and instructions so that it can do so. Make sense?

<!-- xgd-turn id="7b05c8d3-2663-46a1-97ec-3f8fa5df01d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T19:02:56.660536+00:00" -->
#### Claude
Yes, that makes sense. I'll find your 10:45 PST comments to the consultant first, then work from those.

I've found the consultant's transcript. Now reading your turns from the rebuild onward.

Now reading your 10:45 comments (18:46 UTC) and what the consultant did next.

Yes, that makes sense. I read the consultant's transcript for Lauren Test 1 in production: the rebuild, the builder's report on it, and your comments at 18:46 UTC (10:46 PST). Your points were:

- **Order not completed:** needs a way back to shopping, and possibly back to the checkout.
- **Your order:** photos come out at their original size; the money summary has no labels.
- **Checkout:** the photo is missing; the price should sit close to the title; the region prompt should be centred, with space below for Stripe's form to load.

## Why the first build missed them

**1. The consultant never starts from the defaults.**
- The platform has a sound default for each purchase page in `l2/checkout.ts:298`. The checkout default has the photo, the name, the price, and Shipping and Total with labels. The order default has 72px square line photos and labelled Subtotal, Shipping and Total.
- But that default is only drawn when a site has no page of its own (`render.ts:696`). When the consultant adds the checkout component, it gets an empty component (`toolbox-core.ts:846`). The builder hit exactly this: "Module 'checkout' has no slot 'page'".
- So it built each page from the field list in the guidance (DOC-47 §"The purchase pages"). That list gives field names, not labels, photo sizes, or what goes next to what.
- **This one cause accounts for the missing labels, the full-size photos, and the missing photo on the checkout.**

**2. The defaults themselves fall short of what you asked for.**
- **Order not completed:** the "Back to the shop" link draws nothing, in the default as well as in the rebuild. There's no "Return to checkout" at all.
- **Checkout:** the region prompt isn't centred, and no space is held for Stripe's form, so the page jumps when it loads.
- **Checkout price and total:** these rendered empty in the preview. I haven't confirmed the cause yet.

**3. The builder's report lists more gaps in the instructions and the checkout component that would trip any first build:**
- The component reference still lists the old `complete` mode and the Continue settings.
- The terms line is fixed at 16px, off the site's type scale, and can't be restyled.
- The "Try again" and "Request cancellation" buttons can't be given the site's button style.
- The component's slot (the area holding its content) sits off the page grid (96–1184px wide instead of 48–1232px).
- Deleting a purchase page was refused because the consultant's scope didn't include the page's style file.

## The fix

**(a) Adding a checkout component, or a purchase page, starts from the default.** The page area comes filled with the default in the site's design, and the guidance tells the consultant to restyle it, not rebuild it. The labels, thumbnail size and photo then come with the page.

**(b) The defaults cover all of your points:**
- Order not completed: "Return to checkout" as the main button, and a "Back to the shop" link that works.
- Checkout: price beside the title, a centred region prompt, and space held for the payment form.

**(c) The instructions and the component are cleaned up:** the old modes and settings are removed from the reference; the terms line and buttons follow the site's type and button style; the slot sits on the grid.

If that matches what you want, I'll file it as one bug under EPIC-31. Should the delete refusal go in it too, or stay separate since it's about the consultant's tools rather than the purchase pages?

<!-- xgd-turn id="0e6c31ba-40bd-4922-aea0-79c84f7daae0-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T19:06:27.274230+00:00" -->
#### You
That sounds right - lets model the defaults on the finished version on Laurens sites. I still have a couple of tweaks I would like to make...

<!-- xgd-turn id="0e6c31ba-40bd-4922-aea0-79c84f7daae0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T19:07:11.596699+00:00" -->
#### Claude
I've filed **BUG-410**, "Purchase pages: consultant builds start from the defaults, and the defaults are complete enough to need no help". It's under EPIC-31, at `draft`, high severity, and covers everything in my last message. It says the defaults are to be modelled on your finished reference pages. Per the no-customer-specifics rule, it describes them by structure only and never names Lauren's shop or uses its wording.

Go ahead with your tweaks. When you're done, tell me and I'll:
1. Read the three finished pages from production for Lauren Test 1: their structure, sizes, labels and the order things appear in.
2. Write that structure into BUG-410 as the defaults' specification, so whoever builds it has an exact target rather than a summary.

The delete refusal (the consultant's scope lacked the page's style file) isn't in BUG-410. Tell me if you want it filed separately.

<!-- xgd-turn id="50d43fbd-0c79-4138-be92-582d0fa740be-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T19:25:53.134472+00:00" -->
#### You
ok please check out the last few changes to Lauren test 1. There are 2 checkout changes I want that do not seem to be available

<!-- xgd-turn id="50d43fbd-0c79-4138-be92-582d0fa740be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T19:27:40.276608+00:00" -->
#### Claude
I'll pull the latest turns of the consultant's transcript for Lauren Test 1.

Nearly there: checking how Lauren Test 1's checkout page is stored, to see why the price comes out blank.

Neither of the two checkout changes can be made from the page. Both need code changes in the checkout itself, and I've added both to **BUG-410**.

**1. Terms line under the payment form.** The checkout draws "By paying you agree…" itself and always puts it just above where Stripe loads (`component.ts:77`). It isn't part of the page, so the consultant can't move it. It's also why it shows in the browser's default typeface at 16px: it's added after the site's type styles have been applied, so it never gets them.
- **Fix:** it goes directly under the payment form by default, as you preferred. A page can also place it itself, and it uses the site's own small type.

**2. Price beside the title.** The consultant did put the price next to the title. The checkout leaves it blank.
- **Likely cause, not yet confirmed:** with no piece chosen, the preview's checkout shows the first piece in the shop, and that may be a sold one. A sold piece shows no price, and its total can't be worked out, so the total stays blank too. That would also explain the "The shop gave no answer" message. The product page, by contrast, previews the first piece still for sale.
- **Quick check:** press Buy on a piece that's for sale and look at the checkout page that opens. If the price shows there, that's the cause. The fix is for the preview to show the first piece still for sale.

From the same round I also added:
- "Return to checkout" on the cancelled page. The consultant couldn't build it because that page isn't told which piece was being bought.
- The "Order" label in front of the order number, in the default.

When you've finished your tweaks, tell me and I'll read the final pages and write their structure into BUG-410 as the defaults' specification.

<!-- xgd-turn id="9d8bee27-0eee-4451-afb2-9fb3ab41d29d-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T19:31:33.882744+00:00" -->
#### You
I see the price it is Under the region selector and it is left justified

<!-- xgd-turn id="9d8bee27-0eee-4451-afb2-9fb3ab41d29d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T19:32:09.171838+00:00" -->
#### Claude
That figure is most likely the **Total**, not the price. Before a region is chosen there's no shipping to add yet, so the checkout puts the piece's price in the Total (`client.js:154`). It reads as the price, but it has no "Total" label, and the consultant placed it under the region selector, left-aligned.

That means the spot beside the title is probably still empty, even on a checkout you opened with Buy on a piece that's for sale. My earlier guess (the preview showing a sold piece) doesn't explain that, so I've recorded the correction on BUG-410. To find the real cause I need to read how the checkout page is actually stored for Lauren Test 1. I couldn't find it in the production database tables I checked; I'll look further next.

Can you confirm the spot right after the title is empty? If it is, BUG-410 gets three checkout fixes:
- The price shows beside the title as soon as the page loads, before a region is chosen.
- The Total always carries its "Total" label.
- The terms line sits under the payment form.

<!-- xgd-turn id="557fe35d-b3e9-44c7-be5e-006617651d44-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:05:45.041015+00:00" -->
#### You
Well there is only one item to Price == Total. The point is it is in the wrong place and unlabeld. 

It needs to appear, with a label "Total" above the region selector underneath the product description.

I actually think the right model for the top part of this page is the Your Order page - a summary of what you are going to buy with the price..yes?

<!-- xgd-turn id="557fe35d-b3e9-44c7-be5e-006617651d44-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:06:16.515955+00:00" -->
#### Claude
Yes. The top of the checkout should be the same summary as the "Your order" page: what you're buying and what it costs, with the total labelled. Using one block for both pages means they can't drift apart, and a cart with several items later needs no new layout.

I've added this to BUG-410, replacing the "price beside the title" idea. The checkout page, top to bottom:

1. **"← Back to <item>"** link.
2. **Order summary**, the same block as on "Your order":
   - one row per item: small square thumbnail, name, and amount on the right;
   - then **Shipping** and **Total**, amounts in the same right-hand column, Total emphasised;
   - before a region is chosen, Total shows the items' sum and Shipping shows as not yet chosen. Choosing a region fills Shipping and updates Total;
   - it sits under the description and above the region selector.
3. **Region selector**, centred.
4. **Payment form**, with its space held so the page doesn't jump.
5. **Terms line** underneath.

Two details to settle:
- **Shipping before a region is chosen:** show "Shipping — choose a region below", or leave the row out until a region is picked. I'd show it, so the buyer knows the total will change.
- **"Shipping" or "Delivery":** your finished order page says "Delivery". Which should the default use?

<!-- xgd-turn id="4d45a2be-be78-422b-9a03-2c61de7319c4-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:08:51.396821+00:00" -->
#### You
Shipping is more american, Delivery is more British/Irish. Lets default to Shipping on both but make it changable by the consultant.

<!-- xgd-turn id="4d45a2be-be78-422b-9a03-2c61de7319c4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:09:18.336237+00:00" -->
#### Claude
Done. BUG-410 now says:
- **The default label is "Shipping"**, on both the checkout and the order page.
- **The consultant can change every label in the summary**, for example to "Delivery" for a British or Irish business. The checkout and order page use the same wording.
- **The consultant's guidance (DOC-47) says** the labels are the site's own wording to change, and the figures beside them are filled in by the checkout.

One question from last time is still open: before a region is chosen, should Shipping show something like "choose a region below", or be left out until a region is picked? I'd show it, so the buyer can see the total will change.

<!-- xgd-turn id="1c3a1173-235b-4f18-b444-76aca4cbdf5a-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:10:28.069343+00:00" -->
#### You
ok I am reviewing the emails now

<!-- xgd-turn id="3ebfc7e1-db5a-48de-a030-bc29025eac46-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:16:49.535605+00:00" -->
#### You
ok I am reviewing the emails now:

Cancellation declined
 - Sample Business says: “Your order has already left.” <-- is this message entered by the user when they decline the cancelation?

Work is ready
The work on Sample Business that you were waiting for is finished and ready for you to see. [Open it in 1st Contact] <-- is there an owner flow corresponding to this? Are we sure that the owner understands? Posting a photo and description is a very natural thing to do but do they knoe wto do it - also how does the message get the right line? Owner flow?

Order confirmation
In the mailbox is broken for this email. I see: "the email text must keep {{terms_of_sale}} (the terms of sale this order was placed under, at the address that version keeps for good)"

<!-- xgd-turn id="3ebfc7e1-db5a-48de-a030-bc29025eac46-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:17:44.595095+00:00" -->
#### Claude
I'll look up each of the three in the message templates.

Here's what each of the three emails is.

**1. Cancellation declined: yes, that line is the owner's own note.** When the owner declines a cancellation in Orders, there's an optional box, "Note to the buyer (optional), for example 'It's already in the post'" (`builder/orders.js:358`). The mailbox shows a sample note in its place. In a real email, the "{{business}} says: …" paragraph carries what the owner typed. If they type nothing, the email just says the business couldn't cancel the order.

**2. Work is ready: this isn't a shop or commission email.** It's 1st Contact writing to a site owner when the consultant finishes a long piece of work on their site while they're away. The link opens the builder.
- **The opening line** is a short note the consultant writes when it finishes; "Your first draft is ready to look at." is the mailbox's sample.
- **Who sees it:** only the 1st Contact business's own mailbox lists it, because it's the platform's email to its customers. You saw it because your account is 1st Contact.

Reading it the way you did ("posting a photo and description…") suggests the wording invites that misreading. "The work on {{business}} that you were waiting for" could mean anything. I'd say what the work was, e.g. subject "Your {{business}} site is ready to look at" and body "The changes you asked for on your {{business}} site are finished." Does that fit what you had in mind?

**3. Order confirmation: this one is a real bug, and worse than the mailbox shows.**
- On 7 November the confirmation gained two required paragraphs (REQ-666): the link to the Terms of sale the order was placed under, and, for UK and EU buyers, a summary of their right to cancel.
- The business's saved copy of this email was most likely made before that, so it lacks them. The mailbox checks saved copies and refuses to show this one; that's the message you see.
- **Sending doesn't check** (`message-send.ts:105`). So confirmations are probably going out from the old text, without the Terms link or the cancellation summary, which the law requires in an order confirmation. I haven't yet confirmed which text your live order's confirmation used.
- **Fix:** when a saved email lacks a paragraph that's now required, the platform adds it automatically, at load and before every send, so a later addition can't silently go missing again.

This isn't about the purchase pages, so it doesn't belong in BUG-410. Shall I file it as its own bug under EPIC-31, high severity? The "Work is ready" wording is a one-line copy change I can add to it, unless you'd rather keep it separate.

<!-- xgd-turn id="f406b922-30f9-496d-90bb-5d3c12a0d564-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:26:17.806547+00:00" -->
#### You
please create that bug.

Can you update 409 with the latest please?

<!-- xgd-turn id="64282ae9-8a50-4e9f-8d57-ad7c8b1dc786-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:26:39.034264+00:00" -->
#### You
please create that bug.

Can you update 410 (not 409) with the latest please?

<!-- xgd-turn id="64282ae9-8a50-4e9f-8d57-ad7c8b1dc786-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:27:43.081153+00:00" -->
#### Claude
Rewriting BUG-410 as one consistent spec, with the superseded parts removed.

I've filed the email bug and rewritten BUG-410.

**BUG-414**, "Order emails: a saved copy missing a now-required paragraph breaks the Mailbox and sends without the Terms of sale link". It's under EPIC-31, at `draft`, high severity:
- A saved email that's missing a now-required paragraph gets it added automatically, using the standard wording, both in the Mailbox and before every send. The owner's other wording is kept.
- An email that would still be refused is never sent; the standard version goes instead.
- It also carries the "Work is ready" rewording: "Your {{business}} site is ready to look at".

**BUG-410** was a stack of add-ons with superseded parts in it. It's now one consistent specification that drops the abandoned "price beside the title" idea and my unconfirmed blank-price guess. It covers:
- **The consultant starts from the platform's default pages.**
- **One order-summary block shared by the checkout and the order page:** a 72px square thumbnail per item, Shipping and Total labelled (Subtotal only with more than one item), and amounts lined up in one column on the right.
- **The checkout, top to bottom:** back link, description, the summary with the total labelled, centred region selector, held space for the payment form, then the terms line underneath it in the site's own type.
- **The order page** labels the order number: "Order 1009".
- **Order cancelled:** a "Return to checkout" button for the same piece, and a "Back to the shop" link that works.
- **"Shipping" is the default label**, and the consultant can change it to "Delivery".
- **The "Try again" and "Request cancellation" buttons** take the site's button style; the old modes and the Continue setting are removed from the reference.

The ticket says the default pages are modelled on your finished test-shop pages, but it describes them by structure only, since I haven't read the stored pages yet. When your tweaks are done, I'll check BUG-410's specification against them.

I wrote one point you haven't confirmed: before a region is chosen, the Shipping row reads "choose a region below". Tell me if you'd rather hide the row until a region is picked.

<!-- xgd-turn id="b74e2a93-6105-4a09-a3bd-03d66fefce04-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:28:31.615569+00:00" -->
#### You
Is 412 a dupe of 410? If so can you mark it wontfix with an explanation please?

<!-- xgd-turn id="b74e2a93-6105-4a09-a3bd-03d66fefce04-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:29:42.363682+00:00" -->
#### Claude
BUG-412 is closed. I'm adding the explanation as a comment, since a closed ticket's body can't be edited.

Yes, BUG-412 was a duplicate of BUG-410. The consultant had filed it from its own report of the same review. I've set it to `wont_fix`. A closed ticket's description can't be edited, so the explanation is a comment on it (COMMENT-8151). The comment maps each of BUG-412's nine problems to the BUG-410 section that covers it.

While checking, I found BUG-408 (already coded, at `free_coded`) overlaps BUG-410 too. It gives the "Try again" and "Request cancellation" buttons the site's button style, and gives the cancelled page's back link height so it shows. I've noted on BUG-410 that those parts belong to BUG-408 and shouldn't be redone.

BUG-412 was under a different epic, `epic-95bc3b15`, not EPIC-31. Nothing needed changing because of that, now that it's closed.

<!-- xgd-chat-end -->