---
uid: request-5ab240db
id: REQ-642
type: request
title: 'Payments: Stripe webhooks, payment cache and Checkout sessions, wired to canTakePayments'
created_by: EPIC-9
created_at: '2026-11-04T16:09:00.365649+00:00'
updated_at: '2026-11-04T18:57:56.260097+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-de09d013
  commits:
  - working_sha: 4c25f20e559c80055f557c0d792f4de68c7d969a
    reconcile_sha: null
    main_sha: null
  - working_sha: 8fa734fec6341e5177a8d7b0fec24016483d21d4
    reconcile_sha: null
    main_sha: null
  version: 0.2.758
  story_points: 13
---

## What this delivers

**This is the payments half of a purchase:** Stripe webhooks, a record of payment attempts and refunds, Checkout sessions on the business's connected Stripe account, and the real `canTakePayments` answer wired into the site's catalogue. It's the item labelled "EPIC-9: webhooks, the payment cache and Checkout sessions, plus connecting `canTakePayments`" in [[GOAL-55]]'s plan of 2026-11-04. It fulfils GOAL-55's "Minimum from EPIC-9" items 3, 4 and 6, and EPIC-9's side of the handshake.

It builds on [[REQ-641]] (the connection, `stripe-connect.ts`) and [[REQ-637]] (invoices and credit notes, `invoices.ts`). It does **not** build orders, the Shop's Checkout endpoint, Buy or the success and cancelled pages. Those are the parallel EPIC-31 ticket ("orders, shipping zones, the Checkout endpoint and Buy").

**Why free-coded:** it's one cohesive slice on the critical path to the 2026-11-30 launch, and its design is already settled in GOAL-55 and EPIC-9.

## 1. The catalogue uses the real `canTakePayments`

- `apps/control-app/src/catalog.ts:33` is a placeholder that always returns false, so Buy can never appear. **Replace it with a call to the real answer**, `canTakePayments` in `stripe-connect.ts:468`. There must be exactly one implementation; the placeholder is deleted, not kept as a fallback.
- **The mode is the business's connection's mode**, never assumed to be live.
- **If Stripe can't be reached during a render, the answer is false.** The item shows the enquiry link instead of Buy. A Stripe outage must never fail a site build or show Buy for an account that can't take money.
- **A change in that answer rebuilds the business's sites**, through the same rebuild path the catalogue already uses when an item is saved. The changes that count are:
  - connecting or disconnecting in Settings → Payments
  - an `account.updated` webhook
  - an `account.application.deauthorized` webhook

## 2. Webhooks

- **One public endpoint per mode, test and live**, each with its own signing secret: `STRIPE_WEBHOOK_SECRET_TEST` and `STRIPE_WEBHOOK_SECRET_LIVE`.
  - The live secret follows the same rule as REQ-641's live key. It's never in the shared secrets file, and it's pushed to production only when exported in the operator's shell for that deploy.
  - **An endpoint with no secret configured refuses every event.** It never skips the check.
- **Every event's signature is verified**, including the timestamp tolerance, using Web Crypto. There's no Stripe library.
  - An event that fails verification gets a 400 and changes nothing.
- **An event whose `livemode` doesn't match its endpoint is rejected.** So is an event whose `livemode` doesn't match the mode stored on the order or invoice it refers to.
- **Each event is processed exactly once.** Event ids are recorded, and a repeated id gets a 200 and changes nothing.
  - An event whose processing fails is **not** recorded as processed and gets a non-2xx reply, so Stripe retries it.
- **These endpoints receive events from connected accounts**, because charges are direct charges on the business's account. The event's `account` field identifies the business. An event for an account linked to no business gets a 200 and is ignored.
- **The webhook confirms a payment; the Checkout success redirect never does.**
- **Events handled at launch:**
  - **`checkout.session.completed`:** check that the amount and currency taken equal the invoice total. If they match, mark the invoice paid (REQ-637's `markInvoicePaid`, which assigns its number) and tell the Shop the outcome is `paid`. **On a mismatch, the invoice is not marked paid.** The mismatch is recorded as a payment issue, and the Shop is told `amount_mismatch`.
  - **`checkout.session.expired`:** void the draft invoice (`voidInvoice`) and tell the Shop `expired`.
  - **`payment_intent.succeeded` and `payment_intent.payment_failed`:** record each attempt in the cache, with the decline reason on a failure. A failed attempt tells the Shop `failed`, but the session stays open for the buyer to try again.
  - **Refund events** (a refund the owner makes in their Stripe dashboard): record the refund in the cache, issue a credit note against the invoice (`issueCreditNote`, carrying the refund id), and tell the Shop `refunded` with the amount. **A refund id never produces a second credit note.**
  - **`account.updated` and `account.application.deauthorized`:** rebuild the business's sites (§1). After a deauthorisation, Settings → Payments shows "disconnected".
- **The Shop's handler is registered, not imported.** The Shop registers one handler that receives `{ businessId, orderId, invoiceId, mode, outcome, amount?, currency? }`. The outcome is one of `paid`, `expired`, `failed`, `refunded` or `amount_mismatch`. With no handler registered, the payment side (cache and invoice) still completes. That lets this ticket land before or after the orders ticket.

## 3. The payment cache

- **Payment attempts and refunds are cached from Stripe, keyed by their Stripe id**, scoped by business and mode, and linked to the invoice. Each record holds the amount, the currency, the status and, for a failure, the decline reason.
- **Stripe is the truth.** Any cache entry can be dropped and re-read from Stripe. There is one function to re-read an entry by its Stripe id.
- **No card data is stored**, only Stripe ids and statuses (DOC-5 rule 18).
- **Cache records are money records** and follow the retention rule for them (DOC-37). They aren't deleted with the business's other operational data.

## 4. Checkout sessions

- **One operation creates a Checkout session on the business's connected account**, using the `Stripe-Account` header (a direct charge) and the mode stored on the invoice. Its input is:
  - the business and the invoice id
  - the order id
  - the lines and shipping, as integer minor units with a currency code
  - the success and cancel URLs
  - optionally, the buyer's email
- **The session is built from the order's exact amounts** (`price_data`), never from prices stored in Stripe. The operation **refuses** to create a session whose line total doesn't equal the invoice total, or whose invoice isn't a draft for that business.
- **Fixed settings:**
  - automatic capture
  - cards only (Apple Pay and Google Pay come through card)
  - no `invoice_creation`
  - Adaptive Pricing off
  - no automatic tax
  - no platform fee (`application_fee_amount` is left out)
  - metadata `{ business_id, order_id, invoice_id }`, on both the session and its payment intent
- **The operation refuses when `canTakePayments` is false** for that business and mode.
- The session's lifetime is passed in by the caller, so the Shop can match it to how long it holds the piece. Stripe's minimum is 30 minutes.

## Out of scope

- orders, order lines, holds, the Shop's Checkout endpoint, Buy, and the success and cancelled pages (the EPIC-31 ticket)
- manual capture and holds (fast follow 3)
- the refund operation and Refund button (fast follow 4)
- invoice PDFs
- subscriptions

## Joining up with the orders ticket

This ticket and EPIC-31's orders ticket are built at the same time. **Whichever lands second must pass a full test-mode purchase end to end on our own test business before it is moved to `free_coded`.** The purchase runs: Buy → Checkout → `checkout.session.completed` → invoice numbered and paid → order moved. The second one's ticket records the run. If this ticket lands first, its tests use a registered stand-in for the Shop's handler.

## Operator steps (after this lands)

- **Dev:** forward test-mode events to the local server with the Stripe command-line tool. The coding session gives the exact install command and `stripe listen --forward-connect-to …` command, and puts the printed signing secret in `STRIPE_WEBHOOK_SECRET_TEST`.
- **Production ([[TODO-20]]):** register both endpoints in Stripe, listening to **events on connected accounts**, with the event list above. Then set the two signing secrets.
- The coding session reports the exact endpoint URLs.

## Test plan

UATs are named `test_UAT_FC_<this ticket>_*`. They use the same stand-in for Stripe as REQ-641's tests, and sign events with a test secret. There's an optional check against the real sandbox when `STRIPE_SECRET_KEY_TEST` is present. The tests cover:

1. A catalogue render shows Buy for a ready connected business and the enquiry link otherwise. A Stripe error during render gives the enquiry link.
2. Connecting, disconnecting, `account.updated` and deauthorisation each rebuild the business's sites.
3. A bad signature, a stale timestamp, a missing secret, or a test event at the live endpoint (and the reverse) is rejected and changes nothing.
4. A repeated event id changes nothing. A failed processing is retried and then succeeds once.
5. `checkout.session.completed` with a matching amount numbers and pays the invoice, records the payment, and calls the Shop's handler with `paid`.
6. A mismatched amount or currency leaves the invoice a draft, records the issue, and calls the handler with `amount_mismatch`.
7. `checkout.session.expired` voids the invoice and calls `expired`. `payment_intent.payment_failed` records the decline reason and calls `failed`.
8. A dashboard refund records the refund and issues exactly one credit note, even when the event is repeated. It calls `refunded`.
9. A cache entry can be dropped and re-read from Stripe.
10. Creating a Checkout session sends the `Stripe-Account` header, `price_data` amounts, the fixed settings and the metadata. It's refused for a total mismatch, a non-draft invoice, or a business that can't take payments.


## As built (2026-11-04)

The scope above is implemented in full except the optional sandbox check (see the end of this section). These are the decisions made while building it.

**§1 Catalogue.**
- `catalog.ts`'s placeholder is deleted. `InventorySource` now carries `canTakePayments(business)`, and `shopInventory` answers it with `stripe-connect.ts`'s `canTakePayments`, in the mode of the deployment's connection. Any error is "no".
- Buy itself is the orders ticket's job. What a "yes" changes today is that **the enquiry link is withheld where Buy goes**, and the UATs check exactly that on the published product page.
- A Stripe outage during a rebuild still completes the rebuild, answers the webhook 200 and leaves the enquiry link in place.
- Connect and disconnect (Settings → Payments), `account.updated` and `account.application.deauthorized` all call `rebuildCatalogFor(…, 'payments')`, the same path an item's Save uses. On the Worker it runs after the response (`waitUntil`).
- A Publish with nothing changed is a no-op and does not re-render. Only these rebuilds pick up a change in the answer.

**§2 Webhooks.**
- The endpoints are `POST /api/stripe/webhook/test` and `POST /api/stripe/webhook/live`, matched exactly and ahead of the sign-in gate, like the email webhook.
- The answers are:
  - **503** when that endpoint's secret isn't set
  - **400** for a bad signature, a stale or missing timestamp, or a `livemode` that matches neither the endpoint nor the invoice the event names
  - **200** for an event processed now or before, or for an account linked to no business
  - **500** when processing fails, so Stripe retries. The event is not recorded.
- **Work is idempotent per event:** paying, voiding and crediting each happen once. **The Shop's handler is told at least once.** A handler that throws fails the event, and Stripe's retry tells it again.
- **`checkout.session.completed`** confirms only with `payment_status = paid`. Stripe's currency is compared upper-cased.
- **Payment attempts** come from `payment_intent.*` and are keyed by the charge id (the payment intent id when there is no charge). `checkout.session.completed` marks the invoice paid with the payment intent id, and `payment_intent.succeeded` writes the attempt to the cache.
- **Refunds** come from `refund.created`, `refund.updated` and `charge.refunded`, which carries its refunds. A refund is cached in every state. It gets a credit note (reason "Refunded in Stripe") once its status is `succeeded`, and the Shop is told `refunded` only when that note is new.
- **The invoice for a refund** is found through the invoice's `payment_id` (the payment intent).
- **Deauthorisation** marks the connection `disconnected_by = 'stripe'`, so Settings → Payments shows "disconnected by Stripe".
- **The Shop's handler** is `registerShopPaymentHandler(fn | null)` in `payments.ts`.
- **Import order:** `index.ts` imports `payments` *after* `./router`. Importing it first evaluates `shop.ts`'s module graph early and leaves `identity.ts`'s SQL fragments undefined inside `people.ts` (an import cycle). The comment at the import says so.

**§3 Cache.** Migration `0046_payments.sql` adds three tables:
- `payment_webhook_events`: processed event ids, per mode
- `payment_records`: attempts and refunds, keyed by Stripe id. Each row holds the amount, the currency, the status and the decline code. There is no card data.
- `payment_issues`: one row per `(kind, stripe id)`. Today the only kind is `amount_mismatch`.

Records and issues `REFERENCE invoices ON DELETE CASCADE` and copy the invoice's `synthetic`/`run_id`, so they follow the invoice's DOC-37 rule. Nothing else deletes them.

`refreshPaymentRecord(env, { businessId, mode, stripeId }, { fetch })` is the one re-read. It handles `ch_…`, `pi_…` and `re_…`, reads with the business's `Stripe-Account`, and writes the row whether or not it is still there.

The tables are deliberately not named `stripe_*`, because REQ-641's "keys are stored nowhere" UAT dumps every `stripe%` table.

**§4 Checkout.**
- `createCheckoutSession(env, input, { fetch })`. Lines become `price_data` line items. Shipping becomes a fixed-amount `shipping_options` rate.
- The session is refused, as a `CheckoutRefusedError` with a code, in these cases:
  - the invoice is missing (`no_such_invoice`) or not a draft (`invoice_not_draft`)
  - the input names another order (`invalid`)
  - the currency or total differs from the invoice (`total_mismatch`)
  - the lifetime is under 30 minutes or over 24 hours (`invalid`)
  - the deployment's mode isn't the invoice's, or `canTakePayments` is false (`cannot_take_payments`)

**Deploy.**
- New hooks `bin/deploy.d/secrets/65-stripe-webhook-secret-test` and `75-stripe-webhook-secret-live`. The live one follows the live key's rule: it's refused when it comes from the shared secrets file and pushed only when exported in the shell.
- `probe.mjs` checks the `whsec_` shape only, and says that it cannot prove more.
- The secrets are also added to the router's scrub list, and documented in `wrangler.toml`.

**Not done: the optional sandbox check.** A real Checkout session needs a connected test account. This session had none, so there's no sandbox UAT.

## UATs (`test_UAT_FC_REQ-642_*`)

These map to the test plan above.

- `tests/test_UAT_FC_REQ-642_payments.workers.test.ts`:
  - `catalogue_offers_enquiry_until_ready_and_on_a_stripe_error` (1)
  - `connect_disconnect_and_account_events_rebuild_the_sites` (2)
  - `unverified_or_wrong_mode_events_are_rejected_and_change_nothing` (3)
  - `a_repeated_event_changes_nothing_and_a_failed_one_is_retried_once` (4)
  - `completed_checkout_numbers_and_pays_the_invoice_and_tells_the_shop` (5)
  - `a_mismatched_amount_or_currency_is_not_paid_and_is_recorded_as_an_issue` (6)
  - `expired_checkout_voids_and_a_failed_attempt_records_its_decline` (7)
  - `a_dashboard_refund_issues_exactly_one_credit_note` (8)
  - `a_cache_entry_can_be_dropped_and_re_read_from_stripe` (9)
  - `checkout_session_is_a_direct_charge_with_the_orders_exact_amounts` and `checkout_is_refused_for_a_total_mismatch_a_non_draft_or_a_business_that_cannot_take_payments` (10)
- `tests/test_UAT_FC_REQ-642_webhook_secret_hooks.test.ts` (the deploy rules above):
  - `webhook_secret_probe_checks_the_shape_and_says_it_cannot_prove_more`
  - `test_webhook_secret_is_probed_then_pushed`
  - `live_webhook_secret_only_from_the_shell_never_the_file`

## Operator steps (exact)

**Dev.** The dev Worker serves a frozen snapshot, so run `bin/deploy --env dev` after this lands. Then:
1. Install the Stripe command-line tool: `brew install stripe/stripe-cli/stripe`
2. Run `stripe login`
3. Run `stripe listen --forward-connect-to http://127.0.0.1:8786/api/stripe/webhook/test`. Port 8786 is `1c dev serve`, the control-app Worker.
4. Put the `whsec_…` it prints in the shared secrets file as `STRIPE_WEBHOOK_SECRET_TEST`, then restart the dev services.

**Production ([[TODO-20]]).** In Stripe → Developers → Webhooks, add two endpoints, each listening to **events on connected accounts**:
- `https://app.1stcontact.io/api/stripe/webhook/live`, in live mode
- `https://app.1stcontact.io/api/stripe/webhook/test`, in test mode

Subscribe each to:
- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `refund.created`
- `refund.updated`
- `charge.refunded`
- `account.updated`
- `account.application.deauthorized`

Then deploy with `STRIPE_WEBHOOK_SECRET_LIVE=whsec_… bin/deploy --env production`, exported in the shell and never in the file. Put the test endpoint's secret in the secrets file as `STRIPE_WEBHOOK_SECRET_TEST`.