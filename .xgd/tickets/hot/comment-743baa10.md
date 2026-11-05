---
uid: comment-743baa10
id: COMMENT-7328
type: comment
title: Comment on request REQ-641
created_by: xgd
created_at: '2026-11-03T21:24:50.104410+00:00'
updated_at: '2026-11-03T21:51:09.594762+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2a88fb08
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "642de60b-2d22-4738-8805-7d49037f49f6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bd94a46c-1189-4155-9e63-eb7734c77205-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T21:24:19.680824+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="bd94a46c-1189-4155-9e63-eb7734c77205-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T21:51:04.956071+00:00" -->
#### Claude
Reading the ticket and the code it touches (settings sections, secret hooks, migrations) before cutting a branch.

Still surveying: now the server side — how `/api/settings/currency` is routed and authorised, and how the Shop tab and invoices tests are built.

Auth model found (`operatesBusiness`: owner or delegate). Now the test harness patterns and the boot guard for the startup key check.

I have enough to plan. Moving the ticket to `free_coding` and cutting the branch, then reading how requests get scoped (for the OAuth return URL).

As memory predicted: the branch exists, worktree didn't attach. Attaching it by hand and linking node_modules.

Working out the dev server's port for the OAuth redirect URI, then I'll start writing code.

Plan settled. Checking the Shop tab and tab switching so the "Connect Stripe to start selling" prompt can link to Settings.

Server design is settled. Checking TODO-18 for the platform account id the secret hook should verify, and the probe library shape.

Platform account id isn't recorded anywhere, so the hook will compare against an optional `STRIPE_PLATFORM_ACCOUNT_ID` and say "unverified" without it. Reading the probe library.

Writing the code now, starting with the migration.

Now the server module: config/key selection, signed state, OAuth exchange, Stripe-read status, and the routes.

Removing a header that doesn't belong on the account read, then wiring the router.

Wiring the router: env type, secret scrubbing, imports, and the route block next to Default currency.

Typecheck passes. Adding the startup key-slot check to the Worker entry.

Adding the Worker vars to all three wrangler environments.

Server side compiles. Writing the workers UAT with a fake Stripe at the fetch boundary.

All 11 server UATs pass. Silencing the fake's body-read warning, then building the UI side.

Writing the Payments section module and its transport.

Wiring the section into the Settings pane.

Adding the Shop tab prompt.

Wiring the app: Shop → Settings navigation and the `#payments=` landing from Stripe.

Now the DOM UAT for the section states and the Shop prompt. Checking the Shop transport double shape first.

Same failure behaviour as every other builder call, so that's consistent. Writing the DOM UAT.

Both UI-side UATs pass. Now the deploy secret hooks and their capability probes; checking existing hook tests for constraints first.

Probes next. Checking how `bin/deploy` loads the secrets file, since the live-key hook must refuse a value that came from it.

I'll have the loader export the *names* it took from the file (never values), so the live-key hook can refuse a key that came from the shared file.

Probes work. Writing the two secret hooks.

Hooks parse. Extending the hook test harness to accept extra env, then writing the hooks/probe UAT.

Adding the optional sandbox smoke test and the README entry, then running the regression scope.

Three suites red. REQ-259 is likely mine (a section-title list). Baselining REQ-393/REQ-318 in the main checkout to see if they're pre-existing.

REQ-259 and one REQ-393 case fail on clean working too. The other four REQ-393 cases and the REQ-318 cases are mine; reading why.

Run alone, REQ-393 shows only its pre-existing failure — the earlier extra failures look like load from the parallel batch. Checking REQ-318 alone.

Worktree artifact: `apps/control-app/dist-assets` is a gitignored build output missing here. Linking it temporarily to confirm.

REQ-318 is all green with the build output present. Checking whether REQ-259's pre-existing failure also needs to know about the new section.

That assertion was already stale before my change (it predates the currency and launch sections); I'll leave it and report it. Running the workers regression scope.

Workers scope all green (103/103). Checking a couple of guard suites that scan the router and the migrations list.

No registry to update. Reviewing the full change set before committing.

Change set looks complete. Appending an "As built" section to the ticket body (keeping the existing text), so every UAT is motivated by ticket language.

Ticket body updated. Committing the work on the branch (explicit paths, no `git add -A`).

Committed. Now the merge-back sequence: lock, merge xgd-working into the branch, bump, fast-forward back.

REQ-641 is `free_coded` with both SHAs and version 0.2.747. Tearing down the branch.

REQ-641 is built and merged into xgd-working, and the ticket is at `free_coded` (commits `92fcb721…` and `95fca4e4…`, version 0.2.747, 13 points). I didn't need to ask you anything first; the judgement calls are listed below. Nothing has been deployed, and nothing has called the real Stripe sandbox yet. Every test so far uses a fake Stripe.

**What an owner sees**
- **Settings → Payments** is a new section after Default currency. It shows one of the four states from the ticket, read from Stripe each time it opens. When Stripe can't be reached it says "We can't check Stripe right now". When the deployment has no Stripe setup it says payments aren't available yet.
- **Connect Stripe** sends the owner to Stripe's own page. When they come back, the Settings tab opens on Payments and says how it went.
- **Disconnect** asks for confirmation first, then removes our access in Stripe.
- **The Shop tab** shows "Connect Stripe to start selling" whenever the business isn't Ready. Its button opens Settings → Payments.

**Under the hood**, it follows the ticket. The `state` check refuses missing, forged, expired, reused, wrong-member and wrong-business returns. Only the `acct_…` id is stored. Migration `0045` adds the tables, the mode comes from configuration, and keys are refused if their prefix doesn't match their slot. `canTakePayments()` is the one exported answer.

**Tests:** 22 new tests across three files, all passing:
- 11 through the real router and real D1, covering test-plan items 1–10 plus the "can't check Stripe" case;
- 6 for the section and the Shop prompt in a browser-like test page;
- 5 for the deploy hooks and key checks, including the optional sandbox test, which skips unless `STRIPE_SECRET_KEY_TEST` is set.

The related workers suites (103 tests) and the settings, shop and deploy suites also pass.

**Decisions to check**
- **"At startup" doesn't stop the Worker.** A swapped key is logged on the first request after the Worker starts, and Payments then shows as unavailable. I didn't want a bad Stripe key to take the whole app down.
- **The same Stripe account on two businesses is always refused.** The refused business doesn't get our access to that account revoked, because that would also break the business that already holds the link.
- **The live key is refused if it comes from the secrets file.** The deploy hook only pushes it when you export it in your shell for that deploy. To make that check possible, the secrets-file loader now passes the *names* of the keys it read from the file (never the values) to the hooks.

**What you need to do**
1. Register these OAuth redirect URIs in Stripe:
   - dev (test mode): `https://localhost:8789/api/stripe/connect/return`
   - production (live, with TODO-20): `https://app.1stcontact.io/api/stripe/connect/return`
2. Optionally add `STRIPE_PLATFORM_ACCOUNT_ID=acct_…` to your secrets file. Without it, the test-key check confirms the key is a working test-mode key but reports the platform account as "not checked". I couldn't find the account id on TODO-18.
3. Run `bin/deploy --env dev` to put migration 0045 and the new section on dev.

**Failures that already happen on a clean xgd-working:**
- **`REQ-259_the_pane_shows_the_domain_section…`** expects exactly three Settings sections. It was already out of date before this change, and Payments adds one more section to what it doesn't expect.
- **`REQ-146_every_error_path_out_of_the_router_is_scrubbed`** trips on an existing `error: String(...)` in the router, not on anything I added.
- **`REQ-393_loading_the_file_leaves_deployed_vars_unchanged`** fails the same way.

<!-- xgd-chat-end -->