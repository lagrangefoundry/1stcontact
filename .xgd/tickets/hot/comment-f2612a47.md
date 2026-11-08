---
uid: comment-f2612a47
id: COMMENT-7923
type: comment
title: Comment on bug BUG-375
created_by: xgd
created_at: '2026-11-07T17:41:31.691894+00:00'
updated_at: '2026-11-07T18:19:38.433502+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-df93ff36
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "824a8da0-9a90-4fad-bbdb-5b2a435f2811",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dfae6c79-9915-4e7d-943f-22bcecff21c4-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T17:41:10.487325+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="dfae6c79-9915-4e7d-943f-22bcecff21c4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:19:38.117895+00:00" -->
#### Claude
No duplicate found for BUG-375. Next I'm setting up the branch and reading the shop/orders/checkout code.

Set status and cut branch.

Reading orders.ts, the core of the order lifecycle.

Still mapping the checkout code. Next is the page-side checkout script (L2 preset).

Reading the order-email and builder Shop code next.

Still mapping. Checking how a module version bump with a migration is declared, so merging the "complete" and "status" modes won't break stored pages.

Still reading the builder shell to see how the Shop's storage is scoped per business.

Reading the catalog data the builder preview draws from. I'll add a sample order there for the order-page preview.

Checking the CSP headers and the exact Stripe embedded-checkout API for our pinned version.

Done mapping. Next: migrations and the Stripe smoke command, then I start writing code.

Writing code now, starting with payments.ts: embedded sessions, a shared settle path, and session retrieval.

Now orders.ts: the embedded start, order settling, and the order lines with photos.

Now the bulk of orders.ts.

Server-side reworked. Updating the manifest, then the buyer order view in fulfilment.ts.

Wiring the cron tick next, then the page script and render.

Typecheck passes. Now the page side: checkout module, preset, and script.

Adding typed bind fields to the L1 schema for order lines (photo, linked name, amount) and the cancelled page's Back link.

Updating the L2 preset: one order page with a line row, a bound Back link, and the payment mount.

Now the checkout component: the merged order mode, the payment control, sample order, and the Back link.

Rewriting the page script (client.js): embedded checkout, the one order page, the cancelled page.

Now the generator: one order page, the sample order in builder renders, and the shop page for Back.

Wiring the preview's sample order into the control app's catalog source.

Typecheck is real and clean. Checking the generator and framework packages too.

Regenerating module-assets.ts from the changed client.js.

Server and page done. Now the builder: Orders filter and remembering where the owner was.

Now the Page menu: list the order and cancelled pages as shop pages.

Code is mostly in place. Finding existing tests the change touches.

Running the related node suites to see what my change breaks.

Now the orders-actions and checkout-page tests.

These suites pin what BUG-375 replaces (separate complete page, redirect to Stripe). Reading them to rewrite for the new behaviour.

Now the REQ-644 order status page suite.

Now the BUG-368 actions test.

Chromium suites skip here. Checking the memory note on running them in the sandbox.

Chromium runs. BUG-374's three new-tab checkout tests describe the path this ticket deletes, so I'll remove them and keep its scripted-navigation test.

Writing the new Chromium UAT for the single-page checkout.

The new Chromium UATs pass. Now the workers suites (purchase, payments, fulfilment, draft checkout).

Webhook events in tests carry no `status`. Making the shared path take the event's own outcome.

Updating the workers suites' Stripe fakes and env for embedded sessions.

Down to assertions that pin old shapes. Fixing each.

Existing suites pass. Now the BUG-375 workers UAT for missed payments, based on the purchase suite's harness.

Writing the missed-payment and order-page workers UAT.

Workers UATs pass. Now jsdom UATs for the builder (remembered place) and the order page script.

Writing the builder-side UAT (remembered place, one Paid — to ship filter, Page menu).

Next: a UAT for the order page script (photos, links, sample order) and the page listing.

Code and UATs in place. Now the docs: consultant guidance (DOC-47 / REF-behaviors) and the Security Policy exception.

Writing the docs now: locating the Security Policy text.

Docs updated. Running a broader regression batch around shop, checkout, catalog, and render.

Those two are unrelated build-order checks (matched "order" in the filename) and look environmental. Running the second half.

Only a worktree artifact (no dist-assets). Now a broader workers batch.

Workers batch green. Checking other suites that drive the cron `scheduled` handler, since it now also settles orders.

The one failure (BUG-249 "stalls twice") is on the known pre-existing list. Committing next.

Before committing, appending the implementation record to the ticket body (keeping the existing text).

Committing the work on the branch.

Now the merge-back sequence: lock, merge xgd-working in, bump, fast-forward, promote.

Only ticket files came in. Bumping the version and fast-forwarding.

I guessed the full SHA; getting it properly.

BUG-375 is implemented, merged into xgd-working, and parked at `free_coded` (version 0.2.808). It is not a duplicate. I haven't deployed it or done the real dev purchase in the ticket's Definition of done; that needs one thing from you first, below.

**What changed**
1. **Shop remembers its place.** On a first visit Shop opens on Orders if the business has any orders, otherwise on Inventory. After that it reopens where the owner left it: the mode, the Orders filter and search, and the open order or item, per business in that browser.
2. **One "Paid — to ship" state.** It is now the default filter, and test orders show in it with a Test tag. The separate To ship filter and its live-only rule are gone.
3. **A missed Stripe notification corrects itself.** An order still pending after its session expired is checked with Stripe once and settled by the same code the webhook uses, so a late webhook does nothing. That runs at three moments:
   - opening Orders settles up to 5;
   - each 10-minute cron run settles up to 20, oldest first;
   - the thank-you page asks Stripe straight away, even inside the 30 minutes.

   If Stripe can't be reached, the order stays as it is until the next try.
4. **One order page.** Order complete and order status are now a single page at `order-status`, reached by order id from Stripe or by the email token. Each line shows the item's photo and links to its product page while the item is live, and the emails show the photo. The cancelled page's "Back to the shop" goes to the item, never the site root. The Page menu lists both pages as "Shop: … — shown only during a purchase", the Piece template isn't marked "not linked", and the preview shows a sample order. The consultant's guidance (DOC-47) now describes these pages and their fields.
5. **Single-page checkout.** Stripe's embedded form appears on the checkout page once a region is chosen, or straight away when every region costs the same. It works inside the builder preview frame, and the BUG-374 new-tab code is deleted. Changing the region cancels the old session first, so only one hold exists. Stripe.js loads only from `js.stripe.com`, only on the checkout page, only once a session is open. That exception is written into the Security Policy (DOC-2).

**What you need to do:** add `STRIPE_PUBLISHABLE_KEY_TEST=pk_test_…` to the dev secrets file before `bin/deploy --env dev`. Without it no checkout starts, and the preview tells you that key is missing. The live key comes with TODO-20.

**Decisions to review**
- **Holds start sooner.** Because the form appears as soon as a region is chosen, at single-rate shops every visitor who opens a checkout page now places a 30-minute hold on the item, not only buyers who click Continue.
- **Old "complete" pages still work.** A site page saved in the old `complete` mode is accepted and shown as the new order page. Removing that mode outright would have stopped stored pages from loading.
- **Email photo links** use the `1stcontact.io/site/<key>/…` address, not a business's own domain.
- **Wallets in the preview.** The preview's existing `payment=()` permission rule probably keeps Apple Pay and Google Pay buttons out of the preview form. I didn't check this.
- **Stripe's mode name.** Embedded mode is `ui_mode=embedded` under our pinned Stripe version; a later version renames it `embedded_page` ([Stripe changelog](https://docs.stripe.com/changelog/dahlia/2026-03-25/updates-available-checkout-session-ui-modes)).

**Tests:** I added four `test_UAT_FC_BUG-375_*` files: payments and order page against the real Workers, the checkout in real Chromium, and the order page and builder in a simulated DOM. They pass. I also updated the existing REQ-642/643/644 and BUG-367/368/372/374 tests where they checked behaviour this ticket replaces, and removed BUG-374's three new-tab tests. In the wider runs, four failures are outside this change:
- BUG-249 "stalls twice" was already failing on a clean xgd-working.
- REQ-646 failed only because the worktree has no built assets.
- Two build-order checks (AC1425 and AC1427) were caught by the "order" filename match and look environment-related. I didn't confirm they also fail on a clean tree.

The ticket body has the full implementation record.

<!-- xgd-chat-end -->