---
uid: request-d78b1f29
id: REQ-643
type: request
title: 'Shop: orders, shipping zones, checkout page and endpoint, Buy, and Orders
  mode'
created_by: EPIC-31
created_at: '2026-11-04T17:16:09.011405+00:00'
updated_at: '2026-11-05T00:15:09.257396+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b0c6f28f
  commits:
  - working_sha: 6b6c4bb1f7864b5d3daf5837784d04395bc046cf
    reconcile_sha: null
    main_sha: null
  - working_sha: a807d734c23bd00fb4104325a5b49f28133b88a9
    reconcile_sha: null
    main_sha: null
  version: 0.2.767
  story_points: 20
---

## What changes

The first purchase path in the Shop: **orders, shipping zones, a checkout page, the Checkout endpoint, the Buy button, success and cancelled pages, and an Orders mode in the Shop tab.** A buyer can buy one live, available item from a business's site and pay with Stripe; the owner sees the order in the Shop tab. Designed with the operator in the EPIC-31 session, 2026-11-04. Supersedes [[EPIC-31]] where they differ (EPIC-31's capture-on-ship flow is a later fast follow, per [[GOAL-55]]).

**Money is taken at purchase** (automatic capture), per GOAL-55. No holds on the card, no ship-by date, no hold reminders in this ticket.

**Depends on the [[EPIC-9]] ticket for webhooks, the payment cache, Checkout sessions on the connected account, and wiring the real `canTakePayments` into the catalogue.** That ticket is built first; this one uses its operations and does not re-implement them.

## Orders (the record)

- An **order** has order **lines**; each line stores the item, unit amount, currency, quantity and line total **copied at the moment of purchase**, never looked up again. The order stores the shipping amount, the total, the currency, and whether it is a **test or live** order.
- The order model and the Checkout endpoint **take a list of lines from the start**, so the later cart needs no rework. The Buy button sends a list of one.
- **Order numbers:** a short per-business sequence (e.g. 1001, 1002, …) shown to the buyer and the owner. It is separate from invoice numbers.
- **States in this ticket:** `pending` → `paid`; `pending` → `expired`. (Fulfilment states arrive with the fulfilment ticket.)
- The database rules that [[REQ-637]]'s migration says orders must add are added here.
- An order has an **invoice**: created as a **draft with no number** at Checkout (lines plus a shipping line), **numbered and marked paid when the payment succeeds** ([[REQ-637]]'s gap-free numbering), and **voided** if the checkout expires or fails. An abandoned checkout never consumes an invoice number.
- **Payment check:** when payment arrives, the amount and currency taken are compared with the invoice total; a mismatch is flagged on the order, never silently accepted.
- Buyer personal data (name, email, phone, address) lives only on the order and is never sent to an AI provider ([[DOC-5]] rule 26).

## Shipping (owner)

- **Settings → Shipping:** the owner defines **zones**, each with a name, **one flat rate** (an integer in the business currency's smallest unit), and a list of countries. The countries the business ships to are the union of its zones' countries; a country is in at most one zone.
- A **dispatch note** field (free text, e.g. "Ships within 3 working days"), shown to the buyer at checkout.
- One flat rate per order, whatever the number of items.

## The buyer's path

1. **Buy button** on a product page, shown only when the item is live, its availability is above 0, the business can take payments (EPIC-9's real `canTakePayments`), and at least one shipping zone exists. Otherwise no Buy (sold pieces keep the existing Sold/portfolio behaviour). When Buy is missing only because shipping or payments isn't set up, the Shop tab tells the owner why.
2. **Checkout page** on the business's own site (a static page; its dynamic parts call Worker endpoints, [[DOC-5]] rule 11). It shows the item, its **current** price read from the records, a **Ship to** country choice (only countries the business ships to), that zone's rate, the total, and the dispatch note.
   - If the item has sold since the page was published, the buyer is told and cannot continue.
   - If the price differs from the published page, the buyer sees the current price; the order uses it only if they continue.
3. **Continue to payment** calls the **Checkout endpoint**, which re-reads every price and availability from the records (never trusting the page's copy), **holds the stock for every line in one atomic step per business** (two buyers, one piece: the second is told on the checkout page, before Stripe), creates the `pending` order and its draft invoice, and opens a Stripe Checkout session through EPIC-9 with:
   - automatic capture; cards, Apple Pay and Google Pay only;
   - the session built from the order's exact amounts (`price_data`); Adaptive Pricing and Stripe Tax off;
   - **full shipping address collection restricted to the chosen country**, plus the buyer's name, email and phone;
   - metadata `{business_id, order_id, invoice_id}`;
   - a **30-minute** expiry.
4. **On Stripe** the buyer pays. Stripe's own Link (saved card and address) is left as Stripe offers it.
5. **Success page:** order number, item and total. It shows "confirming…" until the order is `paid` (the webhook can arrive after the redirect) and never claims success before then.
6. **Cancelled page:** says nothing was charged. Returning from Stripe's cancel **expires the session at once**, so the hold is released and the item is buyable again immediately. An abandoned session releases at expiry.
7. **Outcomes from EPIC-9's dispatch:** completed → order `paid`, buyer and shipping address stored, invoice numbered and paid; expired or failed → order `expired`, invoice void, availability restored. Each card attempt (with Stripe's decline reason on failure) is recorded against the invoice.
8. A sale or a release **rebuilds the affected pages** (the item's product page and the grids selecting it), independently of the site's Publish, so a sold one-off shows Sold.

## The Shop tab: Orders mode

- A **mode pill** at the top of the Shop tab, **Inventory | Orders**, mirroring the Site tab's View | Edit | Input selector (same component and styling). Inventory is today's view.
- **Orders list:** order number, date, buyer name, total, status, and a **Test** badge on test-mode orders. **Search** by order number, buyer name or buyer email. **Filters:** status, and test/live. Expired orders are hidden by default behind a "show expired" toggle.
- **Order detail page:** the buyer (name, email, phone), the shipping address, the lines and totals, then **one chronological record** of everything that happened: order placed, invoice (draft, then numbered and paid, or voided), payment attempts 1…N (with decline reasons), and the payment. This replaces EPIC-31's nested order → invoices → attempts design. Other modes (for example a Payments view) can be added later without changing this.
- The **item detail page** lists the orders the item appears in, each linking to its order.

## Out of scope

The cart (fast follow), capture on ship and holds (fast follow), fulfilment, cancellation, returns, refunds and every email (the EPIC-31 fulfilment ticket), buyer accounts.

## Test plan

UATs named `test_UAT_FC_<REQ-ID>_*`. Browser journeys run in the BUG-333 real-Chromium Shop suite (`pnpm test:browser`), signed in, real router, migrated store; Stripe is mocked only at its HTTP boundary, and webhook deliveries are signed test events through EPIC-9's real endpoint.
- Shipping settings: zones, rates and dispatch note saved and reloaded; a country can't be in two zones; Buy hidden with no zone, shown once one exists.
- Buy visibility: live + available + payments + zone → Buy; any one missing → no Buy.
- Checkout page: shows current price, ship-to countries, rate, total, dispatch note; changed price shown before continue; sold item refused.
- Checkout endpoint: order `pending` with copied line prices, draft invoice without a number, session request carries exact amounts, the chosen country as the only allowed shipping country, automatic capture, card/wallet methods, metadata, 30-minute expiry.
- Two buyers, one piece: concurrent checkouts → exactly one session; the other told on the checkout page.
- Completed webhook → order `paid`, address stored, invoice numbered and paid, availability 0, product page rebuilt as Sold; amount mismatch flagged.
- Expired/failed webhook and the cancel return → order `expired`, invoice void, availability restored, no invoice number consumed.
- Success page shows "confirming…" until `paid`, then the order number.
- Orders mode: pill switches modes; list search and filters; Test badge; expired hidden by default; detail shows the chronological record including multiple attempts; item detail links to its orders.

**Definition of done:** the whole suite passes, and after `bin/deploy --env dev` a full **test-mode purchase on our own test business** (Buy → checkout page → Stripe test card → success → order `paid` in Orders, item Sold on the site) is run and recorded in this ticket. Whichever of this ticket and the EPIC-9 ticket lands second must pass that purchase.


## The checkout, success and cancelled pages are L1, via the framework's module seam (operator, 2026-11-04)

- The checkout, success and cancelled pages are **pages in the site definition, built as an L1 module** in the framework (`packages/framework/src/modules/`), alongside and in the same shape as REQ-633's `product-catalog`. Either extend `product-catalog` or add a sibling `checkout` module; the session chooses and records why.
- The module supplies the data (the item, its current price, the ship-to countries, rates, total, dispatch note, and the order on the success page), the bindable fields, and the controls (Ship to choice, Continue to payment). Its dynamic behaviour is the module's client script calling the Checkout endpoint ([[DOC-5]] rule 11).
- **Styling lives in L1 in the site definition, using the site's design tokens**, so these pages look like the rest of the business's site and the owner and Site consultant can restyle them like any other page. No hand-written HTML or CSS page, and no raw template holes; values reach the page only through L1's typed sinks (security policy, REQ-82).
- A site that sells gets default checkout, success and cancelled pages (like the default product page) without the owner building them.

Test plan addition: the three pages render through the shared L1 renderer from the site definition (no separate template); restyling a site token changes the checkout page; the module's fields pass the L1 validator, and injected text in an item name is inert on the checkout page.

## Implementation (free-coded, 2026-11-04)

**Module choice: a sibling `checkout` module** (`packages/framework/src/modules/checkout/`), not a mode of `catalog`. `catalog` renders wholly at build time and ships no script; the checkout is the one dynamic part of a published site (its script calls the Checkout endpoint). Folding it into `catalog` would put a client bundle and endpoints behind every product grid. The two share the record: the checkout page binds the item through the same `catalogRecord` and L1 field binding as the product page.

**What landed**
- **Migration `0047_orders.sql`**: `shop_shipping` (dispatch note), `shipping_zones` (name, one flat rate), `shipping_zone_countries` (primary key `(business, country)`, so a country is in at most one zone), `orders` (per-business number from 1001, mode, `pending`/`paid`/`expired`, amounts copied at purchase, buyer fields, `payment_issue`), and `order_lines` (snapshots). Triggers: inserting a line **holds** stock (refused unless live and available, then availability goes down); `pending → expired` **releases** it, exactly once; the status flow is `pending → paid | expired` only; lines and mode are fixed. REQ-637's invoice rules are added: an invoice must name an order of the same business (insert and update), an order with a paid invoice can't be deleted, and deleting any other order takes its draft or void invoices with it.
- **`orders.ts`**: shipping read and save (refused whole with the owner's sentence: two zones with the same name, a country in two zones, no currency); `sellingState`; the quote (current price in the business's default currency, availability, ship-to countries and rates, total, dispatch note); **`startCheckout`** (re-reads everything; the buyer sends the total they were shown and a different current total is refused `price_changed` with the new quote; holds stock in ONE D1 batch with the order; creates the draft invoice with a shipping line; opens the session through REQ-642's `createCheckoutSession`; on any failure voids the draft and releases the stock); **`cancelCheckout`** (expires the Stripe session at once, then releases; a session Stripe reports as already paid is left alone); the status read for the success page (no buyer data); `orderPaymentOutcome`, the Shop's registered payment handler; and the owner's `listOrders` and `readOrder` (one chronological record).
- **REQ-642 extensions (`payments.ts`)**: the session collects a shipping address restricted to the chosen country, and a phone number. The `paid`/`amount_mismatch` event carries the buyer (from `customer_details` and the shipping details). `checkout.session.async_payment_failed` voids like an expiry and tells the Shop `failed`. `expireCheckoutSession` added. The Shop handler is handed `{env, deps}`, and the webhook deps carry `catalogChanged`, so a sale or a release rebuilds the item's pages independently of Publish.
- **Session parameters**: automatic capture; `payment_method_types=[card]` (cards plus Apple Pay and Google Pay); `price_data` from the order's amounts; a fixed shipping rate; Adaptive Pricing and Stripe Tax off; metadata `{business_id, order_id, invoice_id}`; success URL `<site>/order-complete?order=…`; cancel URL `<site>/order-cancelled?order=…`.
- **Expiry is 31 minutes, not exactly 30**: `CHECKOUT_HOLD_S` is 30 minutes plus a minute's margin, so the request's transit time never undercuts Stripe's 30-minute minimum.
- **Payment outcomes**: `paid` → order paid, buyer and address stored, pages rebuilt (Sold). `amount_mismatch` → flagged on the order (`payment_issue`), never marked paid. `expired` → order expired, stock released, pages rebuilt. **A declined card inside an open session (`payment_intent.payment_failed`) is recorded as an attempt only**: the buyer can try another card, so the order stays pending. The order expires on `failed` only once the invoice is void (the session ended).
- **Public endpoint**: `public-site` answers `POST /api/checkout/{quote,start,cancel,status}` on the site's own origin. The site key is resolved from the path by the route grammar, with the same cross-tenant guard as `/api/lead`. Requests are metered by a new `CHECKOUT_RATE_LIMIT` (120 per 60 s per site and IP) and forwarded over a new `SHOP_CHECKOUT` service binding to control-app's `ShopCheckout` entrypoint (a thin wrapper over `checkout-intake.ts`). The binding and the limiter are declared at top level and in both named environments.
- **L1 pages**:
  - New text bind fields `buy`, `shipping`, `total`, `dispatch`, `order`, `unavailable`, `changed`, `confirming`, `confirmed`. A record value of `false` keeps a node but hidden, so the page's script can show it without writing markup. The schema's strict `bind` refuses a stored `hidden` key.
  - A control may carry `select` options (escaped).
  - `catalogRecord` offers **Buy** (a link to `checkout/<slug>`) only when the item is available and the business can sell (payments AND at least one country). Otherwise the enquiry link shows as before.
  - The generator writes `checkout/<slug>` for every live item (a sold one says so and disables Continue), plus `order-complete` and `order-cancelled`, when the business can sell.
  - Each page is the site's own page holding a `checkout` instance for that mode (never served at its own address, like the product template), else the framework default (`l2/checkout.ts`). The default is drawn inside the site's header and footer and resolved in the site's design: type roles, space steps, content width, and the `action`/`onAction`/`border`/`text` colour roles for the controls.
  - The script fills figures with `textContent` only.
- **Builder**:
  - Settings → **Shipping** (zones with a name, a rate, and countries as removable chips added from a list; dispatch note; Save sends the whole set).
  - Shop tab **Inventory | Orders** pill, using the Site tab's `segmentedControl` (exported from `toolbar.js`).
  - **Orders list**: number, date, buyer, total, status, Test badge, payment-issue badge. Search by number, name or email; status and test/live filters; Show expired toggle.
  - **Order detail**: buyer, address, lines and totals, and the one chronological record.
  - **Item detail** lists the item's orders, each opening its order in Orders mode.
  - The Shop says "Add a shipping zone to start selling" (linking to Settings → Shipping) when payments are ready but no zone exists.

## Test coverage (all passing)
- `tests/test_UAT_FC_REQ-643_purchase.workers.test.ts` (10 tests). Real router, real public-site Worker, and signed events through REQ-642's real webhook endpoint; Stripe is faked at the fetch boundary. Covers:
  - shipping saved, reloaded, and refused for a country in two zones;
  - Buy needing live, available, payments and a zone;
  - the checkout page and quote, a changed price, and a sold item;
  - the exact session request;
  - two buyers for one piece (one session);
  - the completed webhook (paid, buyer stored, invoice numbered, page rebuilt as Sold, success status carries no PII);
  - an amount mismatch flagged;
  - expiry and cancel releasing the piece with no invoice number consumed;
  - the Orders list's search, filters, Test badge and expired toggle, and the item's orders;
  - the detail record with several attempts.
- `tests/test_UAT_FC_REQ-643_checkout_pages.test.ts` (8 tests). Covers:
  - default checkout, complete and cancelled pages rendered through the shared L1 renderer, with Buy linking to them;
  - no Buy and no checkout pages without payments or a zone;
  - restyling the site design restyles the checkout page;
  - the site's own checkout page passing the site validator and replacing the default;
  - injected markup inert;
  - the page script: current figures, changed price, Continue to Stripe, sold-before-Stripe, and "confirming…" until paid.
- `tests/test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts` (6 tests, jsdom). Covers the Shipping section, the mode pill, the Orders list and detail, an item's orders, and the shipping prompt.
- **Existing suites updated for this ticket's rules**:
  - REQ-637 and REQ-642 place a real order before drafting an invoice.
  - REQ-642's catalogue fixture adds a shipping zone (Buy now needs one), and its event assertions allow the new `buyer` field.
  - REQ-223's seam test expects `SHOP_CHECKOUT` and counts limiters per name.
  - AC-954's seam cases include `checkout@1`, read from the builder's edit render because a checkout page is a template.
  - The catalog fixture's card and product page carry a `buy` node.
- **Not run**: the real-Chromium browser journeys (`pnpm test:browser`), because Chromium cannot launch in the agent sandbox. The same behaviours are covered at the Worker and DOM levels above. The definition-of-done test-mode purchase on dev (`bin/deploy --env dev`, Stripe test card) is still to be run and recorded here.