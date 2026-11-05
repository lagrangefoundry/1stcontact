---
uid: comment-b0c6f28f
id: COMMENT-7796
type: comment
title: Comment on request REQ-643
created_by: xgd
created_at: '2026-11-04T22:05:52.374835+00:00'
updated_at: '2026-11-04T23:59:41.606725+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d78b1f29
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "005d96e1-332a-41f4-8f5c-c542208049b3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dc7fd26d-d827-4606-8b69-bb9720de4c5a-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T22:04:33.573435+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="dc7fd26d-d827-4606-8b69-bb9720de4c5a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T23:59:32.083803+00:00" -->
#### Claude
Worktree is set up. Reading the payments, invoices and catalog code this ticket builds on.

Still reading: the L1 field-binding layer and how product pages are generated, so the checkout pages can reuse them.

Still mapping the code before writing anything: L1 field binding, product-page generation, and the REQ-642 webhook flow are read. Next: the public-site form endpoint path and the test harnesses.

I have the picture. Writing the code now, starting with the orders/shipping migration.

Migration written. Now extending the REQ-642 payments code with what this ticket needs: buyer details on the paid outcome, shipping-address/phone collection, and expiring a session on cancel.

Payments extensions done. Now the core `orders.ts`: shipping settings, the quote and Checkout endpoint logic, the payment outcomes, cancel, and the owner's order reads.

Core order logic written. Now wiring the owner routes (shipping, selling state, orders) into `shop-routes.ts`.

Owner routes are wired. Now the framework side: new bind fields in the L1 schema, a hidden-until-needed binding, and `<select>` options for the Ship-to control.

Now the `checkout` module itself (meta, component, client script) and its default L1 pages.

Module and client script written. Registering the module and writing its default L1 pages (design roles and components only, no literal colours).

Now the generator: drawing a checkout page per live item plus the two order pages, from the site's own `checkout` pages or the defaults.

Generator and catalog feed are wired. Next: the webhook registration in the control app, the `ShopCheckout` service entrypoint, and the public-site endpoint.

Now hooking the checkout endpoint into the public-site Worker's POST path.

The worktree's package links resolve `@1stcontact/*` to the main checkout's sources, not this branch's. Rebuilding those links so the branch's own framework code is what gets compiled and tested.

All three projects typecheck (the two `tools/generate` errors are in files I didn't touch). Now the builder UI: Settings → Shipping first.

Writing the builder pieces: transports in `api.js`, a Settings → Shipping section, and an Orders view for the Shop tab.

Now the Settings → Shipping section.

Now the Shop tab's Orders view.

UI pieces are in. Registering the migration with the test schema and manifest, then running the existing payments/invoice/catalog suites to see what my changes broke.

Now updating the REQ-637/REQ-642 test fixtures (they invent order ids, which the new invoice→order rule refuses) with a small helper that places a real order row.

These two REQ-642 failures are expected from this ticket's own rule (Buy now also needs a shipping zone) and from the new `buyer` field on the paid event. Updating those fixtures to match.

Generated module bundle now differs only by the new checkout block. Running the targeted node suites (catalog render, bind round-trip, module assets, module catalogue).

Adding a Buy node to the shared catalog fixture (shown only when the business can sell, so existing suites are unaffected), then the workers suite.

The seeded site's default currency is USD while the fixture prices the lamp in EUR, so nothing was purchasable. Setting the default currency through Settings in the fixture first.

All 10 workers UATs pass. Now the generator-side UATs for the L1 checkout pages. Looking at how the REQ-633 render test drives the renderer.

Workers and generator layers are in place. Before writing browser journeys, checking whether the real-Chromium Shop suite can run from this worktree at all, using an existing journey.

Still on the generator UATs: debugging why the design's colour doesn't reach the default checkout button.

All 8 generator/page-script UATs pass. Now the builder UI UATs (Settings → Shipping, the mode pill, Orders list and detail, item→orders, the shipping prompt), following REQ-641's jsdom pattern.

Builder UATs pass (6/6). Updating the migration manifest, then running the full node and workers suites to catch regressions.

409 workers files don't fit one 590s call. Splitting into batches.

Batch 1 shows 225 failures, mostly in assistant/consultant suites. Checking one in isolation to tell whether it's my change (e.g. an import cycle) or the worktree environment.

Same failures on clean xgd-working, so pre-existing. I'll run each batch in both trees and compare failure lists rather than eyeball them.

I accidentally launched a full-project run there (empty file list). Stopping it.

Batch 1: identical failure sets. Running batches 2–4 (branch, then base).

Workers project: no new failures in any batch (the REQ-643 suite's 10 pass inside batch 4). Now the node project in batches.

Now the same five batches on clean xgd-working (excluding my new files), then the diff.

Nine branch-only failures to triage. Running each alone in the worktree.

A page holding a `checkout` instance is a template (not served), so the case's home page has no `index.html` alias. Giving the case an optional `file` naming the rendered page.

Wiring the checkout seam case through the builder's own edit render (which draws template pages), since the CLI edit render doesn't.

All branch-only failures resolved or attributed to the worktree location. Checking both trees are clean of stray generated changes before committing.

Code is done and verified. Updating the ticket body (appending what landed and the decisions made, keeping the existing spec intact) before committing.

The ticket body hasn't changed since I read it. Writing the updated body.

Now committing the work on the branch, then the merge-back sequence (lock → merge working in → version bump → fast-forward → free_coded).

Merged cleanly, but REQ-648 (catalog grids) and others landed meanwhile. Checking for a migration-number clash and rerunning my suites and the catalog suites on the merged tree.

REQ-648's skips are its own Chromium-gated checks. Everything else is green on the merged tree. Bumping the version and landing it.

Landed on xgd-working. Tearing down the branch.

Done. One non-obvious trap from this session is worth recording: the memorised worktree recipe silently tests the main checkout's framework code.

REQ-643 is built and merged into xgd-working, and the ticket is at `free_coded`. Two parts of the test plan haven't run: the real-Chromium browser journeys, and the definition-of-done test purchase on dev.

The ticket body now records what landed and the decisions made; the original spec is left intact. The commits are `6b6c4bb1` (the feature) and `a807d734` (version 0.2.767). I set story points to 20.

**What a buyer and an owner get**
- **Settings → Shipping:** zones with one flat rate each, a list of countries, and a dispatch note. A country can't be in two zones; that save is refused with a message naming the country.
- **Buy:** shows on an item that is live and available, when the business can take payments and has at least one shipping zone. Otherwise the item shows the enquiry link, as before. When only the shipping zone is missing, the Shop tab says "Add a shipping zone to start selling".
- **Checkout page:** shows the current price, Ship to, the zone's rate, the total and the dispatch note. A changed price is shown before the buyer continues. A sold item is refused. When two buyers race for one piece, only one gets a Stripe session. The order and its stock hold are written in one database transaction.
- **Outcomes:**
  - Paid: the order is paid, the buyer and address are stored, the invoice gets its number, and the product page is rebuilt as Sold.
  - Amount mismatch: flagged on the order, never marked paid.
  - Expired or cancelled: the stock comes back and the invoice is voided without using a number. Cancel ends the Stripe session at once.
  - The success page says "Confirming…" until the payment is confirmed.
- **Orders mode:** an Inventory | Orders pill in the Shop tab. The list has search, status and test/live filters, a Test badge, and expired orders behind a toggle. Each order shows one chronological record including every payment attempt. An item's detail lists its orders.
- **Pages:** the checkout, order-complete and order-cancelled pages are L1, drawn by a new `checkout` module beside `catalog`. They come from defaults in the site's design unless the site defines its own.

**Decisions that differ from the spec's wording**
- **Sibling module, not a `catalog` mode:** the checkout is the only part of a published site with a script; putting it in `catalog` would ship that script with every product grid.
- **Declined card:** a declined card inside an open session is recorded as an attempt only; the order stays pending so the buyer can try another card. Expiring the order on the first decline would have stranded a later successful payment. The order still expires when the session ends without payment.
- **31-minute expiry:** sessions are set to 31 minutes, not exactly 30, so the request's travel time never falls under Stripe's 30-minute minimum.

**Tests**
- 24 new UATs pass:
  - 10 workers tests through the real router, the public-site Worker, and signed events to REQ-642's webhook endpoint;
  - 8 renderer and page-script tests;
  - 6 builder UI tests in a simulated DOM (jsdom).
- I ran the full node and workers suites on this branch and on clean xgd-working and compared the failure lists. Every failure that appears only on the branch is explained:
  - Two were caused by this ticket and are fixed: the edit-render seam test and the public-site bindings test.
  - One (REQ-447) passes when run alone.
  - Two (BUG-50, BUG-134) fail only because of the worktree's location.
- I updated these existing tests to match the new rules:
  - REQ-637 and REQ-642 now create a real order first, because an invoice must now name a real order.
  - REQ-642's catalogue fixture adds a shipping zone, because Buy now needs one.
  - REQ-642's event checks allow the new buyer field.

**Not done**
- **Browser journeys:** I didn't write the `pnpm test:browser` journeys, because Chromium can't launch in this sandbox and I'd have been adding tests I couldn't run. The same behaviour is covered at the Worker and DOM levels.
- **Dev test purchase:** the test-mode purchase on our own test business hasn't been run. It needs `bin/deploy --env dev` and a browser with a Stripe test card, so it's yours to run and record in the ticket.

**Before going live:** the public-site Worker needs the new `SHOP_CHECKOUT` service binding and a `CHECKOUT_RATE_LIMIT` limiter (120 requests a minute). Both are declared in its `wrangler.toml` for production and dev. Migration `0047_orders.sql` also has to be applied.

<!-- xgd-chat-end -->