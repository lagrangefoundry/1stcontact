---
uid: epic-8146aecd
id: EPIC-31
type: epic
title: 'Shop tab: inventory, orders and public checkout'
created_by: CHAT-86
created_at: '2026-11-02T17:22:56.202087+00:00'
updated_at: '2026-11-05T00:14:07.393862+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  chat_comment: comment-94b2e9cd
---

## Purpose

A **Shop** tab where a sole-trader business sells physical goods from its own 1st Contact site, with Stripe for payments only. The target is a small seller: often one-off pieces, manual fulfilment, no warehouse. The first customer, and the date, are in [[GOAL-55]].

**This is a product, not one customer's shop** (operator, 2026-11-02). Nothing specific to any customer may appear in this epic, its children, the code or the tests: names, URLs, category names, counts, or plugins. Every difference between businesses is **runtime data** the owner enters or chooses. Examples here are illustrative. Customer specifics for onboarding live in GOAL-55's onboarding notes. Designed in [[CHAT-86]] on 2026-11-02.

Money handling (Connect, webhooks, invoices, refunds, the cache rule) belongs to [[EPIC-9]]. This epic uses it and does not repeat it.

## The model

```
Inventory item ◀──n:1── Order line ──n:1──▶ Order ──1:n──▶ Invoice ──1:n──▶ Payment attempt ──1:n──▶ Refund
                                          └──1:n──▶ Credit note
```

- An **order** is a request for goods. It has a fulfilment lifecycle. It is our record.
- An **order line** is one item and a quantity in an order, with the unit price fixed when the order is created. One order can hold many items (the **cart**), and one item appears in many orders over time.
- An **invoice** is a request for payment. It is our record for one-off sales; see [[EPIC-9]], which owns the invoice model.
- A **payment attempt** is one card try (a Stripe charge). Each attempt is cached from Stripe and points at our invoice through the Stripe payment's metadata `{business_id, order_id, invoice_id}`. Stripe is the truth for every money state. We cache, we never keep a second copy.
- **Orders and invoices stay separate concepts.** The operator considered collapsing them and decided against it: an order is a request for goods, an invoice is a request for payment.

## The purchase flow

1. **Checkout.** The cart's Checkout button calls a Worker endpoint with the cart's lines (the Buy button on a product page is a cart of one). The endpoint re-reads every price and availability from the records — the cart's own copy is never trusted — and holds the stock for every line in one atomic step. It creates an order in `pending` and a **draft invoice** with no number yet, covering the lines plus shipping. Then it opens Stripe Checkout with **manual capture**, so the money is held, not taken.
2. **Payment attempts.** Each card try is recorded as an attempt, with Stripe's decline reason on a failure. Attempts continue until one succeeds in **reserving** the money (`requires_capture`).
3. **Reserved.** The order moves to `reserved` and the **owner is emailed** the item, amount, buyer name and email, shipping address, and a link to the order. The site rebuilds so the item shows its new availability.
4. **Owner ships.** The owner marks the order shipped, optionally adding a tracking number and carrier. **That state change triggers capture**: we take the money, the invoice gets its number and is marked paid, and the order becomes `shipped`.
5. **No success.** If the checkout expires or every card is declined, the order moves to `expired`, the draft invoice is voided, and the stock is released.

**Invoices are numbered when the money is taken.** Numbers are gap-free per business, and an abandoned checkout must not consume one.

**The 7-day hold limit.** Stripe cancels an uncaptured card hold after about 7 days. That has three consequences:
- The order row shows a **"ship by"** date, and the owner is reminded on day 5.
- A lapsed hold moves the order to `hold expired`. The owner then either sends the buyer a **pay link**, which is a new attempt on the same invoice and returns the order to `reserved`, or cancels the order.
- An item flagged **made to order** is captured at purchase, not at shipping, because it cannot ship within the hold window.

**Payment methods.** Checkout offers only methods that support separate capture: cards, Apple Pay and Google Pay. SEPA and iDEAL cannot be held.

**Cancel before shipping** releases the hold. No money moved, so there is nothing to refund.

## Prices

*Operator, 2026-11-02. These rules hold across the Shop and [[EPIC-9]].*

**A price is an integer and a currency.** The integer is in the currency's smallest unit, with an ISO 4217 code: €19.99 is `{amount: 1999, currency: "EUR"}`, and a zero-decimal currency such as the yen has `amount` equal to the whole number. Stripe takes amounts in the same units.
- **No decimals and no floating point**, anywhere: not in storage, in calculations, or in what we send to Stripe.

**An item holds a list of prices**, one row per currency and **market** (a set of countries).
- **First release:** a single row in the business's currency covering all markets, and the edit screen shows a single price field.
- **Later:** more rows (for example GBP for the UK) need no change to the data shape.
- **Every price is set by the owner. None is derived from an exchange rate.**

**The customer pays exactly what they see.**
- **Shown prices include any tax.** EU consumer law requires shop prices to include VAT. If the business is VAT-registered, VAT is extracted from the price for the invoice, never added on top.
- **Display formats straight from the integer**, with exactly the currency's number of decimal places: 1999 EUR is shown as "€19.99". A shown price is never a rounded copy of the real one.
- **Totals are integer sums:** unit price × quantity for each line, plus one shipping amount, gives the total.
- **Rounding happens in two places only, and never changes what is paid:**
  - the VAT breakdown on an invoice
  - discounts, later

  Each has one defined rule, applied once.
- **A cart and an order have one currency.**

**The order records the exact price the customer agreed to.**
- Each order line stores its unit amount, currency, quantity and line total, **copied at the moment of purchase** and never looked up from the item again. The order stores the shipping amount and the total the same way. A later price change on the item never alters an existing order.
- **"Agreed" means the price shown at Checkout.** If the current record differs from the cart's copy (the static page can be stale), the buyer is shown the current price before going to Stripe. The order uses it only once they continue.
- **The order is what the buyer pays.**
  - The invoice copies the order's lines.
  - The Stripe Checkout session is built from the order's exact amounts (`price_data`), never from a price catalogue held in Stripe.
  - When payment arrives, the amount and currency taken are checked against the invoice total. A mismatch is flagged, never silently accepted.
- **Stripe's local-currency conversion at Checkout (Adaptive Pricing) is off, and so is Stripe Tax**, so no other amount or currency can be shown to the buyer. A buyer's bank converting the charge on a card in another currency is between them and their bank.

**Discounts (later).**
- A discount is its own **negative line** on the order, with a reason, never an edited unit price.
- A percentage discount becomes a fixed integer amount at purchase, under one rounding rule, and the order stores the result.
- A displayed sale price ("was €40, now €32") is a second price row with an active date range.

## The cart

**A multi-item cart is required** ([[GOAL-55]]; operator, 2026-11-02). It may land as a fast follow just after launch, but **the order model and the Checkout endpoint take lines from the start**, so the cart adds no rework.

- **The cart lives in the buyer's browser** (local storage) — no login, no server-side session ([[DOC-5]] rules 9, 22). The published site stays static.
- **Add to cart** on the product page and the product grid; a **cart** view (a drawer or page in the framework) lists the lines, lets the buyer change quantities (capped at the item's availability as published) or remove lines, and shows the subtotal.
- **Adding to the cart does not hold stock.** One-off pieces are held only at Checkout. If a line is no longer available or its price has changed at Checkout, the buyer is told which line, before reaching Stripe, and can continue with the rest.
- **One order, one Checkout, one payment** for the whole cart. **Shipping is one rate per order** for the buyer's zone, not per item.
- **Fulfilment is per order.** Mark shipped ships the whole order; no split shipments.
- **A return names its lines**, and the owner chooses which of them to restock. The proposed refund is those lines' total; the owner confirms the amount.
- **Made to order in a mixed cart** (once capture on ship exists): if any line is made to order, the whole order is captured at purchase.

## Returns and refunds

- **A return is an order event.** The goods come back, and the owner can choose to **restock**, which puts the availability back.
- **A refund is a payment event.** It is a Stripe refund against a captured attempt, plus our credit note against the invoice. Any amount up to the captured total is allowed; for example, the owner may keep the postage.
- A return proposes a refund, and the owner confirms the amount. A refund can also be made with no return, for example a goodwill refund on a damaged item.

## States

| Record | States |
|---|---|
| Order | `pending` → `reserved` → `shipped` → `returned` · `pending` → `expired` · `reserved` → `cancelled` · `reserved` → `hold expired` → (pay link) `reserved` or `cancelled` |
| Invoice | `draft` → `paid` (numbered at capture) → `part credited` / `credited` · `draft` → `void` |
| Payment attempt | `failed` (with the reason) · `held` → `captured` · `held` → `released` / `lapsed` |
| Refund | `pending` → `succeeded` / `failed` |

## The Shop tab

**Collections and categories** (2026-11-02; revised 2026-11-04, [[REQ-651]]). An item has any number of **collections** and any number of **categories**. These are two separate lists the owner names and uses as they choose, and a product grid's rule can use either:
- **Collections** are the business's own list (for example a house line versus second-hand stock). An item may be in several: how products are organised is the owner's decision (operator, 2026-11-04), superseding the earlier "at most one" rule.
- **Categories** say what the item is (for example its product type), and an item may have several. This replaces the single "section" of earlier drafts.
- Both lists are the business's own runtime data. Neither is ever built in.

**Live or not live, and Save publishes** (operator, 2026-11-02):
- **Inventory is separate from site publication.** The site's Publish button covers the site's design: pages, layout, where a product grid sits and its selection rule, and how cards and product pages look. Inventory never waits for it.
- **Each item is live or not live.** This one switch replaces "hidden".
  - A **not-live** item exists in the Shop tab but appears nowhere on the site: no product page, and in no grid. **New items start not live.**
  - A **live** item is public in full. **There is no draft copy of a live item**, so no unpublished price change sits in the background.
  - **Imported items arrive live** (operator), because they are public on the owner's current shop. Products showing a general sign of not being real products (price 0, stock not tracked, no photo) arrive not live for review ([[REQ-631]]).
- **Save is the item's publish step.** Edits on the item detail page are private until **Save**. Saving a live item puts the change on the site straight away, without the site's Publish: its product page and the grids it appears in are rebuilt. Saving a not-live item only stores it. Switching between live and not live takes effect on Save.
- **Sold is separate from live.** A live item with availability 0 stays on the site as portfolio. To take it off the site, the owner switches it to not live.

**Two top-level views, Inventory and Orders** (operator, 2026-11-02). Each is a list with a detail page. **Orders do not nest under Inventory**: with a cart, one order holds several items, so nesting would repeat the order under each of them.

**Inventory** (renamed from "Items" by the operator):
- **A list of inventory items.** Each row shows the photo, name, price, **availability**, collection and categories, plus a Sold badge and a Live or Not live badge.
- **Availability is an integer, not a boolean.** A one-off piece has 1, and three of the same thing needs no special case. A hold decrements it; an expiry, a cancellation or a restock increments it.
- **The item detail page.** The owner edits photos, name, description, price, availability, **collections**, **categories**, **live**, and **made to order**. Below, a list of the orders the item appears in links to each order.

**Orders:**
- **A list of orders.** Each order opens to its invoices, and each invoice to its payment attempts, payments and refunds.
- **A "to ship" filter** answers "what do I need to post?". Test-mode orders never appear in it.
- **Expired orders are hidden by default**, behind a "show expired" toggle.
- **The order detail page.** It shows the buyer, the shipping address and the lines, then a **timeline** of every state change across the order, its invoices, attempts and refunds. Actions: **Mark shipped** (with optional tracking and carrier), **Cancel**, **Record return** (with an optional restock), **Refund**, and **Send pay link** (for a lapsed hold).

**There is no separate Payments screen** in the Shop tab. Payments are reached through their order. Business-wide payment and invoice history, including subscriptions, is [[EPIC-9]]'s billing tab, which these records feed.

## The Shop assistant

The Shop tab gets a chat pane, the **Shop assistant**. It follows the Settings tab's existing pattern: **the pane and the assistant are both ordinary callers of one API**. The assistant is never driving the pane, and the pane never calls the assistant. Anything the pane can do, the assistant can do through the same operations, under the same rules.

- **Tools.** The assistant can create, modify, hide, and restock inventory items. It can read orders, invoices, attempts and refunds. It can take the order actions (mark shipped, cancel, record return, refund, send pay link), each through the same validation as the pane's buttons.
- **Description generation.** From the item's photos and a few words from the owner, the assistant drafts the item's name, summary and description for the owner to accept.
- **Sales patterns.** The assistant answers questions such as what sells, at what price, in which section, how fast, and which countries buyers come from.
- **Privacy rule** ([[DOC-5]] rule 26). Product photos and copy are going onto the public site, so they may go to the AI provider. **Buyer personal data must not**: no names, emails or addresses. Sales-pattern tools give the model de-identified data only: item, price, dates, state, and buyer country.
- **Money actions.** A refund or capture from chat goes through the same operation and confirmation as the button.

**The Shop assistant is not in [[GOAL-55]]'s minimum.**

## Emails

- **Owner: new order.** Sent when an order reaches `reserved`. Always on.
- **Buyer: order confirmation.** Sent from the business's name when an order reaches `reserved`. **A per-business setting, on or off.**
- **Buyer: shipped.** Sent on Mark shipped, with the tracking number and carrier when given. **A per-business setting, on or off.**
- Stripe's own payment receipt to the buyer is unaffected.
- All email goes through our existing email provider.

## Shipping

The owner sets shipping rates by zone (for example the home country, the rest of the EU, the rest of the world) and the list of countries they ship to. Checkout collects the shipping address and applies the matching rate as an invoice line.

**One flat rate per zone, whatever the number of items** (operator, 2026-11-02): for small goods, a cart of several items posts as one parcel. There is no per-item, weight or quantity rule.

## The public site

- **A catalog module** (a behaviour module in the framework):
  - It supplies the data from the inventory records, the slots, the fields that can be bound, and the controls (Buy, the enquiry stand-in for Buy, and "Commission something like this").
  - **Its styling lives in L1, in the site definition**, using the site's design tokens. There is one **card** template per grid and one **product page** template per site, applied to every record, so every item is laid out and styled the same way.
  - Binding a record's fields into L1 needs a new typed L1 primitive (a node that names a field instead of holding its value), never a raw template hole ([[DOC-5]] security policy).
- **Which items a site shows.** Every **live** item gets a product page at `/shop/<item>`. Each **product grid** holds a **selection rule** (not a list of items) as module configuration in the site definition: collections, categories, availability (in stock, sold or both), an order, and an optional limit. For example, "New in" might be in stock, newest first, limit 8. A new live item appears in every grid whose rule matches it, with no page edits. Each card links to its product page.
- **The preview reads the records live**, so a Save in the Shop tab shows up while the owner is building the site.
- **The Buy and Add to cart buttons, and the cart view**, are the only dynamic parts: the cart is client-side script, and Checkout calls the Checkout endpoint, permitted under [[DOC-5]] rule 11.
- **Sold pieces stay on the site as a portfolio** (operator decision). Each one is marked **Sold**, has no Buy button, and by default does not show its price. A **"Commission something like this"** link opens the business's commission or enquiry form with the piece prefilled. Switching a piece to **not live** removes it from the site entirely.
- **A sale, an expiry, a cancellation, a restock, or a Save on a live item rebuilds the affected pages** (the item's product page and the grids that select it), independently of the site's Publish, so the static site follows the records.

## Two buyers, one piece

Holds are taken atomically **per business** (one coordinator per site, [[DOC-5]] rule 7). Two simultaneous checkouts containing a piece with availability 1 cannot both get it: the second buyer is told that line is no longer available before reaching Stripe. A multi-line hold is all lines or a clear report of which failed — never a partial hold the buyer did not agree to.

## Importing from another shop platform

A **one-time import** brings an existing catalogue in, so the owner re-types nothing. WooCommerce is the first source; the shape allows others. [[REQ-631]] specifies it:
- **WooCommerce's public Store API needs no key.** It returns every published product: names, long and short descriptions, prices in minor units, stock, categories, attributes and image URLs.
- **The owner maps source categories** to collections or categories and chooses which attributes to keep. No shop's structure is assumed.
- **Sold products are imported too**, for the portfolio.
- Order history and draft or private products would need the platform's REST key, and are not imported.
- **A site capture is not an inventory source.** A capture records a page's look, not product records.

**Integrating with the source platform instead of importing was considered and rejected.** It would keep the old platform as a second backend to host and patch, which is what an owner moving to us is leaving.

## Deferred, with a known shape

- **Deposits.** Part-payment, for example on commissions. This is an order with more than one invoice, which the model already allows.
- **Price on request.** An item shows an enquiry link instead of a price and a Buy button.

- **Customs paperwork for orders outside the EU** (discussed 2026-11-02; not in [[GOAL-55]]). Within the EU there is no customs. Outside it, duty and import VAT are normally the **buyer's**, collected by the destination carrier on delivery, and not paid at the sender's post office. The useful shape is a **customs declaration helper** on the order detail page: per line a description, an HS code (a field on the item, or a default per category), the value, the origin country (from the business's address) and the weight, laid out for the carrier's online customs entry. **The helper is a fast follow after launch** (operator, 2026-11-02). **Duty calculation and prepayment (DDP) is a later option, and not for now.** It would be our front end over a **partner** who does the calculation (a duty-calculation service or a carrier's DDP offering); we would never maintain duty tables ourselves. Adopting a partner means adding an external dependency to [[DOC-5]] rule 1, and for the UK it also needs a UK VAT registration.
- **Import duty notice.** Checkout and the shipping page say that orders outside the EU may be charged import duty and taxes by the destination country, payable by the recipient. This is copy on the business's shipping page, so it can go in at no build cost.

## Notes for the business, not for us

Owners set their own return window. EU distance-selling rules give consumers **14 days** to withdraw, and goods made to the consumer's specification are exempt. We do not decide this. A business whose stated window is shorter should check it with its own adviser.

## Depends on

[[EPIC-9]] provides:
- Connect (linking an existing Stripe account)
- signature-verified, idempotent webhooks
- the Stripe cache rule
- one-off invoices: numbering, credit notes
- manual-capture charging and refunds on a connected account


## Children

- [[REQ-631]]: Inventory list, item editing and WooCommerce product import. Due Friday 2026-11-06 ([[GOAL-55]]).
- [[REQ-633]]: Catalog module: product grid and product pages from inventory. Needed when [[GOAL-55]]'s first customer starts building, from 2026-11-09. It can start in parallel against REQ-631's item model.
- [[REQ-634]]: Shop tab fixes from operator testing (2026-11-02): the API answering 404 in dev, a source-neutral Import, and Default currency in Settings. **Supersedes REQ-631 and REQ-633 where they conflict.**
- [[BUG-333]]: the import reported success but wrote nothing. Also adds **the Shop's end-to-end acceptance suite** (journeys J1–J9, run in a real browser through the real router, asserting on persisted state), and requires a manual run on dev before done.

Ordering across this epic and [[EPIC-9]] is agreed in [[GOAL-55]] "Plan and ordering".


## Decisions, 2026-11-04 (operator, EPIC-31 session)

These supersede the sections above where they differ.
- **Launch takes the money at purchase** (automatic capture, per [[GOAL-55]]). The purchase flow's holds, ship-by date, day-5 reminder and hold-expired states are the capture-on-ship fast follow.
- **Shop tab modes:** a mode pill, **Inventory | Orders**, mirroring the Site tab's View | Edit | Input selector.
- **Order detail is one chronological record:** order, invoice, payment attempts 1…N, payment, then shipping, cancellation, refunds and credit notes. This replaces the nested order → invoices → attempts view. Further modes (for example Payments) may be added later.
- **Buy goes to a checkout page on the business's site:** current price, Ship to country, rate, total, dispatch note. Stripe collects the full address, restricted to that country.
- **Order numbers** are a short per-business sequence, separate from invoice numbers.
- **Refunds are made from our buttons at launch** (Cancel, Record return, Refund), through [[EPIC-9]]'s refund operation; dashboard refunds still arrive by webhook.
- **Buyer order status page:** private link, no login. It has an optional **Request cancellation**, which only notifies the owner; the owner cancels or declines.
- **Emails are [[EPIC-30]] notifications.** The buyer-recipient architecture and owner-editable, branded wording are being decided in EPIC-30; editable wording is not launch blocking. The buyer confirmation email is always on, and the shipped email is an owner setting.
- **No buyer accounts at launch.**

## Children (2026-11-04)

- [[BUG-339]]: Shop tab type-size audit and list/detail layout fixes.
- [[REQ-643]]: orders, shipping zones, the checkout page and endpoint, Buy, and Orders mode. Depends on EPIC-9's webhooks and Checkout-session ticket, which is built first.
- [[REQ-644]]: fulfilment, cancellation requests, order status page, returns and refunds, and order emails. Depends on REQ-643, on EPIC-9's refund operation, and on EPIC-30's buyer recipient.

- [[REQ-651]]: an item can belong to several collections (supersedes the one-collection rule).