---
uid: bug-df93ff36
id: BUG-375
type: bug
title: 'Shop after the first sale: Orders by default and remembered, one Paid — to
  ship state, self-correcting missed payments, visible order pages with photos, single-page
  checkout'
created_by: EPIC-9
created_at: '2026-11-07T16:50:17.210316+00:00'
updated_at: '2026-11-07T18:25:41.242887+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f2612a47
  commits:
  - working_sha: 9605705b8cc5c2761af8c15c9d8aff11575c6dd1
    reconcile_sha: null
    main_sha: null
  - working_sha: 838687eaeaa7462a6eb06c9eac61fa7ea09f6243
    reconcile_sha: null
    main_sha: null
  version: 0.2.808
  story_points: 18
---

## Symptoms (operator, 2026-11-07, dev, first end-to-end test-mode sale)

A test-mode purchase completed, the order was marked paid and REQ-644's emails exist. Testing it turned up the following:

1. **Shop always opens on Inventory**, and Orders always opens on the "To ship" filter (`apps/control-app/src/builder/shop.js:213`, `builder/orders.js:121`). Nothing is remembered between visits.
2. **A paid order didn't appear in the default list.** "To ship" is a filter for `status = 'paid' AND fulfilment IS NULL AND mode = 'live'` (`orders.ts:778`), so a test order never shows in it. The "Paid" filter (`COALESCE(fulfilment, status) = 'paid'`) is the same list without the live-only rule, so the two filters overlap.
3. **Orders whose Stripe notification was missed stay "Awaiting payment" forever.** Three dev orders were paid at Stripe while no webhook listener was running. Nothing ever corrects them:
   - the order stays `pending`
   - the stock stays held
   - the thank-you page says "confirming…" indefinitely (`checkoutStatus`, `orders.ts:624`, reads only our own row)
   - no confirmation email is sent

   There is no sweep for pending orders. The 10-minute cron (`index.ts` `scheduled`) doesn't touch orders. This would hit production whenever a notification is missed.
4. **The purchase-flow pages are hard to see and thin.**
   - The default order-complete, order-cancelled and order-status pages aren't in the Page menu; you reach them only by typing the URL or making a real purchase. Order status also needs a real email token.
   - Order complete and order status are two separate pages reading different data: `checkoutStatus` vs `BuyerOrderView` (`fulfilment.ts:305`).
   - Neither shows a product photo or links to the item's product page, although `order_lines.inventory_item_id` is stored (`checkout/component.ts:81-97`, `orders.ts:627`, `fulfilment.ts:346,364`).
   - The consultant's guidance (DOC-47 / REF-behaviors) doesn't describe the complete, cancelled or status modes.
   - On the cancelled page, "Back to the shop" goes to the site root (`l2/checkout.ts:352`).
   - The Piece (product template) page may be marked "not linked" in the Page menu. Confirm this.
5. **Stripe's payment page opens in a new tab from the builder preview** (BUG-374, because hosted Checkout can't run in a frame). It works but is untidy. Separately, the operator wants **checkout on a single page**, because fewer checkout pages convert better.

## Fix

### 1. Shop remembers where you were
- On the first visit for a business, Shop opens on **Orders** if the business has any orders, otherwise on **Inventory**.
- After that it reopens where the owner left it: the mode, the Orders filter and search, and the open item or order. This is remembered per business in that browser.

### 2. One "Paid — to ship" state, test orders included
- The separate "Paid" and "To ship" filters become one, **"Paid — to ship"**: paid and not yet shipped, cancelled or returned. It's the default filter.
- **Test-mode orders are included, tagged "Test"**, so an owner can rehearse shipping. The existing Test-or-live filter still separates them.
- The order states the owner sees: Awaiting payment → Paid — to ship / Expired. Paid — to ship → Shipped / Cancelled / Returned.

### 3. A missed Stripe notification corrects itself
- A Checkout session lives 30 minutes (`CHECKOUT_HOLD_S`), and Stripe's answer for a session past its expiry is final. So we never poll open sessions: an order still `pending` past its `checkout_expires_at` is checked with Stripe **once** (retrieve the session on the business's connected account) and settled.
- Settling runs the **same outcome path the webhook uses** (`orderPaymentOutcome`), so an order is never processed twice. If the webhook arrives later it's a no-op, and the reverse holds too:
  - paid → `paid` with the buyer's details, the invoice paid, and the confirmation email sent
  - expired → `expired`, the stock released and the invoice voided
- **Three triggers, no new poll loop:**
  - **The thank-you page.** When the buyer's return finds the order still `pending`, ask Stripe about that session right away, even inside the 30 minutes, since the buyer has just paid, and show the result.
  - **Opening Orders.** Any of the business's stale pending orders, up to a small cap, are settled before the list is drawn.
  - **The existing 10-minute cron tick** settles a bounded batch (a LIMIT, oldest first) of stale pending orders across businesses, so stock is released even if nobody opens Orders. One indexed query plus at most N Stripe calls; no per-item query loops (Architecture Policy 35).
- If Stripe can't be reached, the order stays as it is and is retried on the next trigger. Each attempt is logged.
- No manual "Check with Stripe" button for now (operator's choice is open; add one only if asked).

### 4. The purchase-flow pages
- **One order page with two ways in.** The order-complete page and the order-status page become one page:
  - Reached straight after payment (by the order id, as today), it heads with "Thank you — your order is confirmed" (or "confirming…").
  - Reached from an email (by the private token, REQ-644), it shows the order's progress: placed, shipped with tracking, cancelled, refunded.
  - Same layout, same buyer-safe data. One page for the consultant to style. Order cancelled stays its own small page.
- **Each line shows the item's photo and links its name to the item's product page** (`/shop/<slug>`), using the stored `inventory_item_id`. The order emails also show the photo. If an item no longer has a live page, its name is plain text.
- **"Back to the shop"** on the cancelled page goes to the item's product page, or to the shop page, not the site root.
- **The owner can see these pages.** The Page menu lists the order page and order cancelled (whether default or the site's own) as **shop pages**, marked "shown only during a purchase". Neither they nor the Piece template carry the "not linked" mark. In the preview they draw with a sample order: the business's most recent test order, or made-up lines when there are none.
- **The consultant's guidance describes these pages and their fields** (complete/status and cancelled modes), so it styles them with the rest of the shop and edits them on request.

### 5. Single-page checkout with Stripe's embedded form
- The checkout page becomes the whole checkout. The delivery region is chosen at the top, as today. Once it's chosen, the total updates and **Stripe's embedded Checkout form appears on the same page, below it**. The buyer pays without leaving the business's site.
  - If the business ships at a single rate, no region is asked, so the form appears at once.
  - Changing the region replaces the session, expiring the old one so the stock hold stays single.
- Uses Checkout Sessions in embedded mode. Check the exact `ui_mode` value against our pinned `Stripe-Version` (BUG-372). Use `return_url` to the order page above, on the business's connected account (Stripe.js `stripeAccount`). The amounts, shipping and country rules are exactly today's.
- **Cancel** on the checkout page expires the session and releases the hold (as `cancelCheckout` does today).
- **It works inside the builder preview frame**, so BUG-374's new-tab path, and the code that exists only for it, is deleted.
- **Security exception, made explicit and narrow.** This is the first third-party script on a customer site.
  - Load Stripe.js only from `https://js.stripe.com`, only on the checkout page, and only when the business can take payments.
  - Update any CSP and allowlists that apply (script-src/frame-src for `js.stripe.com` / `checkout.stripe.com`, as Stripe documents), and record the exception in the Security Policy / DOC-5 with its reason.
  - No other page loads it.
- **Needs the platform's publishable keys:** `STRIPE_PUBLISHABLE_KEY_TEST` now and `_LIVE` with TODO-20. They're publishable, not secret, so they can be plain vars. The session reports the exact name for the operator to add to the dev secrets file.

## Not in scope
- The oversized region-select font reported on one site. BUG-373's control-type fix is in place, and the stored page draws at body size offline, so it wasn't reproduced. Reopen it with a screenshot if it recurs.

## Test plan
UATs named `test_UAT_FC_BUG-375_*`, in the real-Chromium Shop suite. Stripe is mocked only at its HTTP boundary; webhooks are signed test events through EPIC-9's endpoint.
- Shop opens on Orders when orders exist, otherwise on Inventory. After switching mode and filter and reloading, it reopens on the same mode, filter and order.
- A paid test order appears under "Paid — to ship", tagged Test, and that is the default filter. The separate Paid filter is gone.
- A pending order past its expiry, with Stripe saying the session is `complete`: opening Orders marks it paid with the buyer's details and the confirmation email is recorded. A later webhook for it is a no-op.
- The same for a session Stripe says `expired`: the order is expired and the stock released.
- The cron tick settles at most its batch size of stale pending orders, issuing no per-order store query beyond the batch.
- The thank-you page with a pending order and Stripe saying `complete` shows the confirmed state without any webhook.
- The order page by order id and by email token draws the same layout. Each line has the item's photo and a link to its product page. A line whose item has no live page has a plain name.
- The cancelled page's "Back to the shop" goes to the item's page.
- The Page menu lists the order and cancelled pages as shop pages without "not linked", and their preview draws a sample order.
- Single-page checkout: choosing a region mounts the embedded form on the same page. Changing it expires the old session. Cancel expires the session. In the builder preview frame, no new tab opens and the form mounts in the frame.
- Stripe.js is loaded only on the checkout page, only from `js.stripe.com`.

## Definition of done
After `bin/deploy --env dev`, on our own test business:
- A test-mode purchase is made entirely on the checkout page, in the builder preview, with no new tab.
- The order page shows photos and links.
- A purchase made with `stripe listen` stopped is corrected by opening Orders, and its email arrives.

Record the results in this ticket.
## What landed (implementation record, 2026-11-07)

**1. Shop remembers where you were.** The Shop tab keeps its place per business in the shell's storage (`place:<businessId>`): mode, the Orders filter and search, and the open order or item. On a first visit it opens on Orders when the business has any order, else Inventory. Nothing is saved while a business's place is being cleared or put back, so a business switch never overwrites another business's place.

**2. One "Paid — to ship" state.** The Orders status filter's `paid` value is "Paid — to ship" (`COALESCE(fulfilment, status) = 'paid'`: paid, not shipped, cancelled or returned), the default, with test orders included and tagged Test. The `to_ship` filter and its live-only rule are gone. The filter list is: Paid — to ship, Any status, Awaiting payment, Shipped, Cancelled, Returned, Expired. The row badge reads "Paid — to ship".

**3. Missed notifications settle themselves.**
- The webhook's `checkout.session.*` handling moved into one exported path, `settleCheckoutSession` (`payments.ts`). The webhook passes the event's outcome. A session read back from Stripe (`retrieveCheckoutSession`) passes its own `status`. Both mark the invoice paid or void once and tell `orderPaymentOutcome`, so whichever comes second is a no-op.
- `settlePendingOrder` and `settleStaleOrders` (`orders.ts`) do the settling. A stale order is still `pending` past `checkout_expires_at`. Each run is one indexed query (`orders_pending_expiry`, migration `0054_order_settle.sql`), then at most N Stripe reads, one after another. Stripe unreachable leaves the order as it is and logs `order_settle_unreachable`; every settle logs `order_settled`; `settle_checked_at` records the last check.
- Triggers:
  - Opening Orders (`GET /api/shop/orders`) settles at most 5 (`SETTLE_ON_OPEN`).
  - Every cron tick settles at most 20 (`SETTLE_BATCH`), oldest first.
  - The order page by order id asks Stripe at once about a still-pending order, even inside its 30 minutes.
- When the caller has no request origin (the cron, the service binding), the paid emails link to the order's stored `app_origin`, else the origin of `STRIPE_CONNECT_REDIRECT_URI` (this app's own address). The preview stores its origin on the order at start.

**4. The purchase-flow pages.**
- **One order page** at `order-status`: mode `status`, verb `order` with `{ order }` or `{ token }`. The `status` verb, `checkoutStatus` and the separate order-complete page are deleted. A page stored in mode `complete` stays valid and is drawn as the order page, so stored definitions keep loading; no module version bump.
- **Two ways in.** By order id the view carries no address and no cancellation request, so an id seen in a log reveals no personal data. By token it carries both, as before. `confirming`/`confirmed` head the page only when it is reached by id.
- **Lines.** New typed L1 bind fields `lineName`, `lineAmount` and image field `linePhoto`. The script repeats the template's line row once per line. Each line's photo is the published site's prepared file (`assets/s/…`, from the site's photo index; new column `orders.site_key`), or `shop-photos/…` in the preview. Its name links to `shop/<slug>` while the item is live and the site has product pages; otherwise it is plain text. The old `lines` text field is still filled, for stored pages that use it.
- **Emails.** The order emails show each line's photo from the published site.
- **Cancelled page.** New bind field `back`. It is drawn pointing at the shop's page (the first served page with a product grid), never the site root. After `cancel` answers with the item's slug, the script points it at the item's page.
- **Page menu.** `editPageList` marks shop pages (`shop: product|checkout|order|cancelled`). It also lists the default order and cancelled pages (`default: true`) when the site has none of its own. The menu shows them as "Shop: <title> — shown only during a purchase"; the product template shows as "Shop: <title>"; no shop page is "not linked".
- **Preview.** The builder's render always writes the order and cancelled pages when it has a catalog, even before the business can sell. The order page carries a sample order (`data-checkout-sample`): the most recent paid test order, else made-up lines from live items.
- **Consultant guidance.** DOC-47 describes the order page, the cancelled page, their fields, and the payment form's place on the checkout page.

**5. Single-page checkout.**
- **Sessions are embedded.** `ui_mode=embedded` is the value under the pinned `2025-09-30.clover`; `2026-03-25.dahlia` renames it `embedded_page`. `return_url` is `order-status?order=<id>`, and there is no success or cancel URL.
- **`start` answers** `{ orderId, number, clientSecret, publishableKey, account }`.
- **On the page.** The checkout script starts as soon as a quote can check out: a region chosen, or at once with one rate. It loads Stripe.js and mounts the form in a new `payment` control, which `checkoutActions` places right after the actions row on every checkout page.
- **Changing the region** cancels the open order (releasing its hold) before starting another.
- **Cancel** points at `order-cancelled?order=<id>` while a session is open; that page ends it. Continue remains as the retry when a start fails.
- **BUG-374's checkout new-tab path is deleted.** The preview panel's general rule that a scripted off-origin navigation opens a new tab stays: it is not checkout-only.
- **Security exception.** Stripe.js comes only from `https://js.stripe.com/v3/` (`STRIPE_JS`), only on the checkout page, only after a session is open. The preview's site CSP admits `js.stripe.com` (script), Stripe's frames, and Stripe's API (connect). The exception is recorded in DOC-2 (Security Policy) §5. Published sites send no CSP today.
- **Publishable keys.** `STRIPE_PUBLISHABLE_KEY_TEST` / `_LIVE` (`pk_…`). With the key for the mode in use missing, no checkout starts; the owner's preview says which key is missing.

## Operator action needed
Add **`STRIPE_PUBLISHABLE_KEY_TEST=pk_test_…`** (the platform's test publishable key) to the dev secrets file before `bin/deploy --env dev`. Add `STRIPE_PUBLISHABLE_KEY_LIVE` with TODO-20.

## Tests
New UATs:
- `test_UAT_FC_BUG-375_missed_payments.workers.test.ts`: opening Orders settles a paid session once and a later webhook is a no-op; an expired session releases stock; the cron settles a bounded batch with one finding query, and Stripe down waits; the thank-you page confirms without a webhook; lines carry photo and slug and the email shows the photo.
- `test_UAT_FC_BUG-375_single_page_checkout.test.ts` (real Chromium): the form mounts in the preview frame with no new tab; a region change replaces the session; Cancel ends it; Stripe.js loads only on the checkout page, only from js.stripe.com.
- `test_UAT_FC_BUG-375_order_page.test.ts`: the same lines by id and by token; Back goes to the item's page; the listing names the shop pages; the preview draws a sample, and a publish never does.
- `test_UAT_FC_BUG-375_shop_remembers_and_page_menu.test.ts`: first visit, the Paid — to ship default with Test, the remembered place per business, the Page menu labels.

Existing REQ-642/643/644, BUG-367/368/372/374 suites were updated where they pinned what this ticket replaces: the redirect URL, success/cancel URLs, the `status` verb, To ship, order-complete, and opening on Inventory. BUG-374's three new-tab tests were removed with that path.

Definition of done (deploy and real purchase on dev): not yet run; needs the publishable key above.