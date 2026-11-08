---
uid: bug-b6fb57f6
id: BUG-367
type: bug
title: 'Builder preview: checkout can''t reach its quote, so every piece reads "This
  can''t be bought right now"'
created_by: EPIC-19
created_at: '2026-11-05T23:47:28.271053+00:00'
updated_at: '2026-11-06T01:33:19.065699+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  session_id: ed49a53b-2aa7-4210-a10e-3689b524f24e
  commits:
  - working_sha: 1f69cf7322c4baa96ab1d5b92aeee1428aa66617
    reconcile_sha: null
    main_sha: null
  - working_sha: b26df9ecf2d3695737257e7127becf4a9bd39e66
    reconcile_sha: null
    main_sha: null
  - working_sha: 0e9257ddf2bcbbd192b4f603f0b8abf92a7aede5
    reconcile_sha: null
    main_sha: null
  version: 0.2.795
  chat_comment: comment-f4b948cd
---

## Symptom

An operator opened the checkout page, in the builder's draft preview, for an available, priced, live piece on a shop that can now sell (Stripe connected and a shipping zone added). The page shows only its intro line, "This can't be bought right now." and a disabled "Continue to payment". It gives no reason, and the Ship to list is empty.

## Cause

- The checkout page's script (`packages/framework/src/modules/checkout/client.js`) posts `quote` to `api/checkout/quote`, resolved against the page's own URL.
- Only `public-site` serves `api/checkout/*` (`apps/public-site/src/checkout.ts`, over the `SHOP_CHECKOUT` binding). The control app's preview channels route the lead endpoint (BUG-78 imports `handleLead`), but nothing routes checkout. In the draft, the post therefore gets a non-JSON 404.
- The script's fallback shows "This can't be bought right now." whenever an answer carries no `error`. A routing failure is reported as if the piece couldn't be sold.
- BUG-363 added `data-checkout-blocked` for a business that *can't* sell. Once it can, the script runs and hits the missing route.

## Fix

1. **The draft checkout quotes.** The builder's preview channels answer `api/checkout/quote` with the same `checkoutIntake` the published site's binding calls. The same function is imported, not rebuilt (the BUG-78 pattern). The page then shows the current price, the Ship to countries, the rate and the total, exactly as published.
2. **The draft never takes money.** In a preview channel, `start` doesn't open Stripe. It answers with an owner-only sentence: "Payment opens on your published site. Only you see this." Continue to payment stays visible, so the owner can see the page's full shape.
3. **No silent fallback.** When an answer has no `error`, the message names the actual failure: the shop could not be reached, or the shop gave no answer. Nothing was charged; please try again. "This can't be bought right now" is shown only when the quote itself says the piece isn't available.
4. **Ask the country only when it changes the price.** The country is asked before payment because shipping is priced per zone and the buyer is shown the total up front (Stripe then collects the full address, limited to that country). When every country the shop ships to has the same rate, the page doesn't ask. It shows the one rate, and Stripe's address form offers every shipping country. When rates differ, the question stays, worded by the page.
5. **The Plan panel's empty message** (`PLAN_ROUTE_EMPTY`, REQ-657) reads "Your plan appears here once it has been agreed." instead of "…once we know what your site is for." This is folded in here because REQ-657 is already at `ready_to_reconcile`. The REQ-657 panel UAT's pin follows.
6. **The ship-to prompt reads "Please select a region for delivery".** The page's current wording, "Where should we send it?", is the site's own `countryPrompt` setting on its checkout component. The fix changes the framework's default prompt (today "Ship to" / "Choose a country") to "Please select a region for delivery", and removes the site's override so the new default shows. The page's `countryPrompt` still overrides it.
7. **A disabled button looks disabled.** The script and the renderer already set `disabled` on Continue to payment when it can't work, but no framework style anywhere targets `:disabled`, so a disabled button looks exactly like a live one. Every framework button gets a disabled look: dimmed, a not-allowed cursor, no hover change. Continue to payment starts disabled and is enabled only when a quote says `canCheckout`.
8. **Button labels are centred by default.** Every button component centres its label horizontally and vertically. A component or node may still override the alignment.
9. **The checkout's actions are sized to their labels, right-aligned, with a matching Cancel.**
   - From tablet width up, Continue to payment is as wide as its label plus padding (not the full column), and sits at the right of the action row.
   - A **Cancel** button sits to its left, in the secondary style at the same height. It takes the buyer back to the piece's product page, or to the shop if the piece isn't known. Nothing is held or charged.
   - On phone width, the two stack full-width, Continue on top, the usual mobile pattern.

## Test plan

- UAT (workers, real D1 Shop tables): a builder preview `POST …/api/checkout/quote` for a live, priced, available item on a business with payments and a zone answers 200 with the quote. `start` in a preview channel answers the owner-only sentence and creates no order.
- UAT (node, jsdom): the checkout script shows the network/no-answer message, not "can't be bought", when the quote endpoint answers 404 HTML. With a single-rate shop, the page renders no Ship to question and the quote carries that rate. `start` then passes every shipping country to Stripe.
- UAT: the Plan panel's empty state reads the new sentence.
- UAT: with no `countryPrompt` set, the ship-to prompt reads "Please select a region for delivery"; a set `countryPrompt` still wins.
- UAT (Chromium, rendered page): a disabled Continue to payment has a different computed style from an enabled one (opacity and cursor). A button's label is centred in its box. From tablet width up, Continue's width is under half the column and its right edge meets the column's; Cancel sits to its left at the same height and links to the product page. At phone width, both are full width.
- Regression scope: REQ-643 checkout suites, BUG-363 suites, REQ-657 panel suite, BUG-78 preview lead suite.



## Implementation (free-coded, 0.2.795)

- Items 1-5, 7-9 landed in 1f69cf7322 (merged via b26df9ecf2). The control app's preview sends draft `POST api/checkout/<verb>` to public-site's `handleCheckout` (identified, so no rate limit) over the same `checkoutIntake`. In a preview, `start` answers the owner-only notice with the quote and writes no order.
- Single rate: the quote carries `singleRate`. The order's `ship_country` (NOT NULL) is set to the zone's first country for now and corrected from Stripe's address once it's paid. A table rebuild to make it nullable was rejected as too heavy.
- Phone stacking: L1 has no reverse axis, so the template draws Cancel twice and shows one copy per breakpoint. That keeps Continue on top on phones.
- `module-assets.ts` regenerated. The committed copy also lacked the BUG-363 blocked guard.
- **Item 6 (site override) is NOT done.** "Where should we send it?" is data in the remote dev site's checkout component, not in code or local D1. Clearing that site's `countryPrompt` is an operator action. The framework default is changed.
- UATs: tests/test_UAT_FC_BUG-367_* (workers 4, jsdom 6, Chromium 4; Chromium needs `CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox`). 8 failures in generate/req105/AC718/REQ-269/308/349 are pre-existing.
- The commit message lacks the `[FREE-CODED]` tag. It is already merged, so it was not rewritten.