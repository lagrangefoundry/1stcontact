---
uid: bug-dfbdeaad
id: BUG-372
type: bug
title: 'Checkout: Stripe refuses every session (we send the retired payment_method_types),
  and Shipping accepts codes Stripe rejects'
created_by: EPIC-19
created_at: '2026-11-06T02:38:01.467229+00:00'
updated_at: '2026-11-06T18:44:02.398809+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: critical
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  session_id: e4a6d5a4-46c7-42ca-8834-9650b60566b8
  chat_comment: comment-5442d3c3
  story_points: 8
  commits:
  - working_sha: 3f1a8467b242d945ba1730e4f35d242f4fa2f584
    reconcile_sha: null
    main_sha: null
  - working_sha: 23630bef1129c98da70cddd22071201d263a40be
    reconcile_sha: null
    main_sha: null
  version: 0.2.802
---

## Symptom (operator, 2026-11-05)

On a shop's checkout page (draft, Stripe in test mode, the piece available), Continue to payment answers: "Payment could not be started. Nothing was charged; please try again." Retrying changes nothing.

## Cause (dev D1, confirmed)

- The shop has three zones: "EU" (€10), "UK" (GB), "USA" (US). The **EU zone's only country is `EZ`**.
- `EZ` is not a country. It is a reserved code that the platform's region data names "Eurozone". `isCountry()` (`apps/control-app/src/orders.ts`) accepts any two-letter code that `Intl.DisplayNames` names, so the Shipping editor saved it, and the checkout's Ship to list shows "Eurozone".
- On Continue, `createCheckoutSession` passes `shipping_address_collection[allowed_countries]` = `EZ`. Stripe refuses the code, so `startCheckout` logs `checkout_start_failed`, expires the order (the dev order `ord_4119…` has `ship_country = EZ`, status `expired`) and tells the buyer only "Payment could not be started". Neither the owner nor the consultant can see why.

## Fix

1. **A zone holds only countries Stripe can ship to.** `isCountry` checks against an explicit list: Stripe Checkout's `allowed_countries`, which are ISO 3166-1 countries and territories. Region names are not enough. `EZ`, `EU`, `UN`, `QO`, `ZZ` and the `X?` pseudo-codes are refused when the zone is saved, with "“EZ” (Eurozone) is a region, not a country. Add the countries themselves."
2. **"Whole EU" is one choice in the Shipping editor.** It adds the EU's member countries (the list kept as data, so it can change without a code change), less any already in another zone. The editor shows each country it added, so the owner can remove some.
3. **Zones already saved with a non-country are reported, not silently used.**
   - The Shipping settings show the bad code on its zone: "EZ isn't a country, so no one can check out to this zone. Replace it with countries."
   - Checkout readiness (`describe_site.checkout`, BUG-363) lists it, so the consultant can tell the owner.
   - The checkout's Ship to list leaves it out, so no buyer can pick a destination that will fail.
4. **When Stripe refuses a session, the owner sees why.** In the builder preview, the checkout message adds Stripe's reason after the buyer's sentence, for example "(Owner only: Stripe refused the shipping country “EZ”.)". The published site keeps the neutral sentence. The `checkout_start_failed` log already carries the reason.

## Immediate workaround (operator, no code)

In Shipping, edit the EU zone: remove "Eurozone" and add the EU countries you ship to (for example IE, FR, DE, NL, IT, ES…). Checkout to those countries will then start.

## Update (operator, 2026-11-05): replacing EU with Ireland gives the same error

The dev worker log (`storage/tmp/dev/dev-worker.log`) shows two different Stripe refusals:
1. **First attempt (zone "EU" = `EZ`):** "Invalid shipping_address_collection[allowed_countries][0]: must be one of AC, AD, AE, … ZW, or ZZ". This confirms the cause above.
2. **Second attempt (zone "Ireland" = `IE`, a valid code):** "The `payment_method_types` parameter is no longer supported when creating a Checkout Session. Payment methods are now managed from your Dashboard settings." **This is a defect in our code, not the owner's settings.** `createCheckoutSession` (`apps/control-app/src/payments.ts`) sends `payment_method_types[0]=card`. We send no `Stripe-Version` header, so the account's own API version applies, and it no longer accepts the parameter. **No checkout can start on this account, whatever the shipping.** The REQ-642/643 suites stub Stripe, so they never saw it.

### Added to the fix

5. **Checkout sessions use the payment methods set in the business's Stripe Dashboard.** Remove `payment_method_types` from the Checkout Session request.
6. **Pin the Stripe API version.** Every Stripe request sends one `Stripe-Version`, a constant in one place, so a change to an account's default version can't silently change what we send. The request body is valid for that version.
7. **The shipping editor offers only countries Stripe accepts.** The list comes from Stripe's own `allowed_countries` enumeration, kept as data from the refusal above (less `ZZ`, "unknown region"). Countries are picked by name from that list; nothing can be typed in. This replaces the explicit list in item 1 with that same source.
8. **A real-Stripe check the operator can run.** `1c stripe smoke --business <id>` creates and immediately expires a test-mode Checkout Session with the business's real settings (one line, one zone's countries). It reports Stripe's answer word for word, so a parameter Stripe has stopped accepting is caught before a client meets it. Stubs remain for the UATs.
9. **Each field in the Shipping editor has a one-line explanation** (see the operator-facing text below). The editor checks a zone against what checkout will send before saving it.

### What the Shipping fields mean (for the editor's help text)

- **Zone name:** your own label for a group of destinations, e.g. "Ireland", "Rest of EU". Buyers don't see it; it appears on the order and the invoice line ("Shipping — Ireland").
- **Rate per order (EUR):** what one order costs to ship to any country in this zone, whatever is in the order.
- **Countries:** where this rate applies. The buyer picks one at checkout, and Stripe's address form accepts only that country. A country can be in one zone only.

## Test plan

- UAT (workers, real D1): saving a zone with `EZ` (or `EU`, `UN`, `ZZ`) is refused, naming it as a region. `GB`, `US` and `IE` are accepted. "Whole EU" saves the member list less countries already zoned.
- UAT: with a zone already stored as `EZ`, the quote's countries omit it, the shipping read reports the zone's bad code, and `describe_site.checkout` lists it.
- UAT (workers, recording Stripe stub): the Checkout Session request carries no `payment_method_types` and sends the pinned `Stripe-Version`.
- UAT: the shipping editor's country choices are exactly Stripe's `allowed_countries` less `ZZ`; a code outside that list is refused on save.
- UAT: `1c stripe smoke` against a recording stub posts the business's real session shape and prints the stub's answer verbatim.
- UAT (workers, stubbed Stripe refusing the shipping country): a preview `start` answers the buyer's sentence plus the owner-only reason. A published `start` answers the neutral sentence only.
- Regression scope: REQ-643 shipping and checkout suites, BUG-363, BUG-367, BUG-368.

## As implemented (2026-11-06)

- **No `payment_method_types`** (item 5). The Checkout Session body is built in one place, `checkoutSessionForm` (`payments.ts`), used by both checkout and `1c stripe smoke`. The session offers the payment methods switched on in the business's own Stripe Dashboard.
- **Pinned version** (item 6). `STRIPE_API_VERSION` (`stripe-connect.ts`) is `2025-09-30.clover`. `stripeHeaders()` adds it to every Stripe request: Connect OAuth, account read, session create/expire/read, payment re-reads.
- **Stripe's list is the data** (items 1 and 7). `apps/control-app/src/shipping-countries.json` holds Stripe's `allowed_countries` enumeration, copied word for word from the refusal in the dev log, plus `excluded: ["ZZ"]` and the 27 `euMembers`. `countries.ts` reads it: `isCountry` is true only for that list less ZZ.
  - Saving a zone with any other code is refused. A code the region data names (`EZ`, `EU`, `UN`, `QO`) gets "“EZ” (Eurozone) is a region, not a country. Add the countries themselves."; anything else gets "“XX” is not a country Stripe can ship to."
  - The session builder also refuses such a code before calling Stripe.
- **Stored bad codes** (item 3). `readShipping` splits each zone into `countries` (shippable) and `invalid` (codes Stripe refuses). Only `countries` reaches the quote's Ship to list, the published page's shipping, and the session's `allowed_countries`.
  - The read also carries `choices` (the shippable list) and `eu` for the editor.
  - `describe_site.checkout` gains `unshippable: [{ zone, code, message }]`, present only when a zone holds such a code. The message is "EZ isn't a country, so no one can check out to this zone. Replace it with countries."
- **Shipping editor** (items 2 and 9). The country picker offers exactly the read's `choices`, by name. It is a select, so nothing can be typed.
  - "Whole EU (every member country)" adds each member state not already in a zone, as its own chip, so the owner can remove some.
  - A stored bad code shows as a flagged chip with the sentence above.
  - Save is checked against `choices` first: a bad code is reported and nothing is sent.
  - Zone name, Rate per order and Countries each carry the one-line help text above.
- **Owner-only reason** (item 4). `checkoutIntake({ owner: true })` is set only by the builder's draft-preview checkout route. On a Stripe refusal or an unreachable Stripe it answers "Payment could not be started. Nothing was charged; please try again. (Owner only: Stripe did not create the checkout (<Stripe's message>).)". The published site answers the neutral sentence only.
- **`1c stripe smoke --business <id> [--zone <name>] [--currency <ISO>] [--db <file.sqlite> | --remote <env>]`** (item 8).
  - Reads the business's test-mode connection and shipping through the real `readShipping`, from the dev D1 by default (or `--db`, or `--remote <env>` via wrangler, read-only).
  - Uses the first zone that ships anywhere (or `--zone`), one €1.00 line, and the zone's rate.
  - POSTs the real session body with the pinned version, prints Stripe's answer verbatim, and expires the session if it was created.
  - Names any stored bad code. Takes a test key only (`STRIPE_SECRET_KEY_TEST`, from the environment or the dev env files). Exits 1 on a refusal.
- **Superseded assertions**: REQ-642's and REQ-643's session-shape UATs pinned `payment_method_types[0]=card`. They now assert it is absent (BUG-372 supersedes them). The REQ-643 editor fixture carries the read's new `choices`/`invalid` fields.

### UATs

- `tests/test_UAT_FC_BUG-372_shipping_countries_and_checkout.workers.test.ts` (real D1, recording Stripe stub):
  - Region codes are refused and GB/US/IE are accepted.
  - The read's `choices` are Stripe's list less ZZ; a code outside it is refused; Whole EU saves the members less those already zoned.
  - A stored `EZ` is reported on its zone and left out of the draft and published quotes and of the session's `allowed_countries`.
  - The session has no `payment_method_types`, and every Stripe call carries the pinned version.
  - A refusal shows the owner-only reason in the preview and the neutral sentence when published.
  - `describe_site.checkout` lists the `EZ` zone.
- `tests/test_UAT_FC_BUG-372_shipping_editor.test.ts` (jsdom): the choices are exactly Stripe's list; Whole EU; a flagged stored code blocks save until replaced; the help lines.
- `tests/test_UAT_FC_BUG-372_stripe_smoke.test.ts` (CLI `run`, real migrations in SQLite): the real session shape and the verbatim answer, then the expiry; a refusal printed verbatim with exit 1; a test key only.
- Regression run green: REQ-641, REQ-642, REQ-643 (purchase, checkout pages, shop/shipping), BUG-363 (both), BUG-367 (page, draft), BUG-368 (ship-to prompt), REQ-239/REQ-260 settings.

### Operator follow-up

Run `node tools/generate/bin/1c.mjs stripe smoke --business <id>` against the dev shop to confirm the pinned version and body against real Stripe. The suites stub Stripe and cannot. The dev shop's "EU" zone still holds `EZ`: replace it with countries in Settings → Shipping (the editor now flags it).