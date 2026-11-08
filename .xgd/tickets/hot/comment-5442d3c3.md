---
uid: comment-5442d3c3
id: COMMENT-7902
type: comment
title: Comment on bug BUG-372
created_by: xgd
created_at: '2026-11-06T16:08:31.106955+00:00'
updated_at: '2026-11-06T17:06:29.084224+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-dfbdeaad
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e4a6d5a4-46c7-42ca-8834-9650b60566b8",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "b0389e92-c770-43b0-8a43-adefdc59a572",
  "chat_ticket_uid": "bug-dfbdeaad"
}
-->

<!-- xgd-turn id="bfc0be21-4e6a-4c50-a0b9-706c9c7e5388-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T16:51:39.745339+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="bfc0be21-4e6a-4c50-a0b9-706c9c7e5388-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T17:06:28.447402+00:00" -->
#### Claude
Not a duplicate (REQ-643 is the origin feature; no other ticket covers this). Starting implementation: marking the ticket `free_coding` and cutting a branch.

Reading the shipping/checkout code in `orders.ts` to map out the fix (country list, zone validation, readiness, owner-only refusal reason).

Still mapping: next the Shipping editor (`builder/settings.js`) and checkout readiness (`describe_site.checkout`).

Found the test harness to reuse. Now checking `describe_site.checkout` readiness and the `1c` CLI layout for the smoke command.

Data source settled (Stripe's own list from the dev log refusal, as JSON). Now looking at the `1c` CLI structure for the `stripe smoke` command.

Design settled. The smoke command will share one request builder with `createCheckoutSession`, so the two can't drift apart. Checking how existing CLI UATs drive `1c` before writing code.

Writing code now. First the country data and the shared `countries.ts` module.

Now the pinned `Stripe-Version` in `stripe-connect.ts`.

Now `payments.ts`: one shared session-form builder, no `payment_method_types`, pinned headers.

Now `orders.ts`: zone validation, bad codes reported on read and left out of the quote, and the owner-only refusal reason.

Now the owner-only reason in `startCheckout` and its plumbing through `checkoutIntake` and the preview route.

Now readiness for `describe_site.checkout` in `catalog.ts`.

Now the Shipping editor (`builder/shipping.js`): Stripe's list only, "Whole EU", flagged bad codes, field help, and a check before save.

Now the `1c stripe smoke` command. Checking that `payments.ts` loads outside workerd and how `shopCurrency` reads.

Writing the smoke module (`tools/generate/src/cli/stripe-smoke.ts`), which reuses the real `readShipping`, `checkoutSessionForm` and `stripeHeaders`.

Wiring `1c stripe smoke` into the CLI dispatch.

Code is in place. Setting up the worktree so tests and typecheck can run.

Typecheck clean. Now the UATs. Reading the BUG-363 readiness test helper to reuse its `describe_site` path.

Writing the workers UAT file (real D1, recording Stripe stub).

Five of six pass. Fixing the fixed zone id in the test helper.

All 6 workers UATs pass. Now the editor UAT (jsdom), plus the REQ-643 editor fixture, which now needs to carry `choices`.

Editor UATs pass (10/10 with REQ-643's). Now the `1c stripe smoke` UAT.

Running `1c stripe smoke` in-process via the CLI's `run`, against a real-schema SQLite file and a recording Stripe stub.

Smoke UATs pass (3/3). Running the regression scope (REQ-642/643, BUG-363/367/368).

Both failures pin the very parameter BUG-372 removes (fix item 5). I'm updating those two assertions to expect its absence and noting that BUG-372 supersedes them.

Regression scope green. Trimming the harness helpers my workers test copied but doesn't use.

All green. Committing on the branch.

Committed. Updating the ticket body: I'm keeping everything already there and adding an "As implemented" section that names every UAT.

Ticket body updated. Now landing it: lock, merge `xgd-working` into the branch, bump the version, then fast-forward back.

Merged cleanly. Re-running typecheck and the BUG-372 and checkout suites on the merged tree before landing.

Merged tree green (40 tests). Fast-forwarding `xgd-working`.

Landed on `xgd-working`. Moving the ticket to `free_coded` (no `--version`, so the gate bumps the version itself).

BUG-372 is fixed, landed on `xgd-working`, and parked at `free_coded`. It isn't a duplicate: REQ-643 built the original feature and no other ticket covers this. The fix has not been tried against real Stripe yet. The suites fake Stripe, which is how the original bug got through.

**What changed**
- **Checkout sessions no longer send `payment_method_types`.** The business's own Stripe Dashboard now decides the payment methods. Checkout and the new smoke command build the request in one shared place, so they can't drift apart.
- **The Stripe API version is now pinned.** Every Stripe request sends `Stripe-Version: 2025-09-30.clover`, set in `stripe-connect.ts`. I picked that version myself: it's a known release and our request body is valid for it. Change it if you'd rather have another.
- **A shipping zone can only hold countries Stripe ships to.** The list is Stripe's own, copied from the refusal in the dev worker log, and kept in `apps/control-app/src/shipping-countries.json`. Saving `EZ`, `EU`, `UN` or `QO` is refused with "“EZ” (Eurozone) is a region, not a country. Add the countries themselves."
- **Zones already saved with a bad code are reported, not used.** The Shipping settings flag the code on its zone, `describe_site.checkout` lists it under a new `unshippable` field, and the checkout's Ship to list leaves it out.
- **Shipping editor:**
  - You pick countries by name from Stripe's list; nothing can be typed.
  - A "Whole EU" choice adds each member country not already in another zone, one by one, so some can be removed.
  - Each field has a one-line explanation.
  - A zone is checked before it's saved.
- **When Stripe refuses a session, the builder preview shows why** after the buyer's sentence: "(Owner only: Stripe did not create the checkout (…).)". The published site keeps the neutral sentence.
- **New command:** `node tools/generate/bin/1c.mjs stripe smoke --business <id>`. It builds a real test-mode session from the business's settings, prints Stripe's answer word for word, then expires the session. It only accepts a test key and exits 1 if Stripe refuses.

**Tests:** 13 new UATs across three `test_UAT_FC_BUG-372_*` files all pass, and so do the related REQ-641/642/643, BUG-363/367/368 and Settings suites. I re-ran the key ones after merging. Two older assertions in the REQ-642 and REQ-643 suites expected `payment_method_types[0]=card`. They now expect it to be absent, with a note that BUG-372 supersedes them. I didn't re-run the Chromium checkout-button suites; this change doesn't touch the page script.

**What you need to do**
1. Redeploy dev (`bin/deploy --env dev`); the dev environment keeps running the old code until you do.
2. Run the smoke command against the dev shop. This is the first check against real Stripe, of both the pinned version and the request body.
3. In Settings → Shipping, replace `EZ` in the dev shop's "EU" zone with real countries. The editor now flags it.

Ticket: two commits (the fix, `3f1a8467`, and the version bump to 0.2.802), story points 8. The body now has an "As implemented" section listing every UAT.

<!-- xgd-chat-end -->