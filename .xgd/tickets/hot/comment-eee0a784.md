---
uid: comment-eee0a784
id: COMMENT-6939
type: comment
title: Comment on request REQ-634
created_by: xgd
created_at: '2026-11-03T00:02:41.239495+00:00'
updated_at: '2026-11-03T00:26:59.197029+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2d24fa39
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "26c7869b-f6c9-443e-8f24-88a62163f62b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c327ea14-1901-4f1b-98c0-0ca9f833cf7f-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:01:49.856557+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="c327ea14-1901-4f1b-98c0-0ca9f833cf7f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:26:58.778427+00:00" -->
#### Claude
Reading the router and the existing REQ-631 tests to find where the 404 comes from.

Still hunting the 404 cause; checking whether the dev services are running so I can reproduce it directly.

Bundle has the hook; the 404 comes from inside. Checking whether the dev store has the inventory tables (migration 0040).

Confirming how to read/write the business's site `config.currency` through the site store.

Design settled. Reading the Shop tab UI and the import module to plan the source-neutral Import.

Plan is clear. Setting the ticket to `free_coding` and cutting a branch.

Cutting the branch and setting up the worktree.

Branch cutting is blocked by the sandbox (`.git/config` is read-only), so I'll take the unbranched session lock on xgd-working and finish within this turn.

Fixing §1 in the router.

Writing the code now: currency store in `shop.ts` first (reads/writes the business site's `config.currency`).

Now replacing the shop currency functions.

Refactoring `shop-import.ts` behind a source adapter registry.

Now the routes: source-aware import endpoints, `/api/shop/import/sources`, drop `/api/shop/settings`, add the Settings currency route.

Running the typechecker to see what breaks after the server-side changes.

Typecheck clean. Adding migration `0041_default_currency.sql`.

Now the test factory's migration list.

Now the client: transport in `api.js`.

Now the Shop tab UI: remove the currency field, make the action **Import** with a source choice.

Adding a Default currency section to Settings (new `currency.js` module, mirroring how the other sections are structured).

Checking whether new builder modules need registering anywhere (asset manifests).

Server and UI are in place. Now the REQ-631 tests: they assumed a business without a site and the old `{url}` import bodies. Checking what they touch.

Now running the REQ-631 workers suite to see where things stand.

Now my own UATs. First, the "through the real router with a signed-in session" guard — finding the existing session-cookie helper.

Writing the workers UATs (through `worker.fetch` with a real session on `/b/<business>/...`).

Almost all green. One ordering bug: an invalid code with priced items was asked for confirmation before being validated. Fixing — validate first.

All 5 pass. Verifying the guard actually catches the §1 bug by temporarily reverting the router fix.

Guard confirmed (all 5 fail without the fix), router restored. Now updating the REQ-631 jsdom test's import flow to the new source choice, then writing the REQ-634 UI tests.

Now the REQ-634 UI test (Import choice, no currency in the bar, Settings dropdown, confirmation).

UI tests pass (8/8, not skipped). Typechecking and running the adjacent suites: Settings, REQ-633 catalog, REQ-151 locale, builder origin, and other workers suites that use the factory.

Confirmed: the suite only scans literal paths in `router.ts`, and my addition matches through a constant, so those failures were already there. Moving to the ticket body, version bump and commit.

Updating the ticket body first: I'm appending an implementation section and keeping the existing text.

Ticket updated. Now bump the version, commit, and promote.

All three parts of REQ-634 are built and committed, and the ticket is at `free_coded` (commit `a3d8e3459a`, version 0.2.738, 8 story points). One step remains for you: the dev store needs migration `0041` applied, along with this code, on the next `bin/deploy --env dev`.

**1. The Shop API's 404 in dev.** The router passed `shopRoute` the full URL, so it saw `/b/<business>/api/shop/...`. That never matched, and the router fell through to its final 404. It now gets the path with the business prefix removed, like every other route. The migration was applied and the dev bundle had the code, so neither was the cause. REQ-631's tests called the router without the prefix, which is why they passed. The new guard tests go through the real worker with a signed-in session on `/b/<business>/api/...`. With the old line put back, all five of them fail.

**2. Import is source-neutral.** The Shop tab's bar now has just **New item** and **Import**. Import asks where to import from, listing WooCommerce as the only option. Choosing it asks for the **Shop address**, then Scan leads into the existing mapping step, run and report. Each source is an adapter in one list on the server, so adding a source means adding one entry and no new screens.

**3. Default currency.** I kept the site's `locale.currency` as the one stored value, as the ticket asked me to choose. Removing that field instead would have broken existing site definitions that set it, and changed REQ-151's behaviour. The choice is recorded in the ticket.
- **Settings:** a new **Default currency** dropdown of ISO 4217 currencies (`EUR — Euro` style), never free text.
- **Shop tab:** the currency field is gone from the bar, and the item editor shows the currency next to the price but doesn't let you change it.
- **Old table:** migration `0041` copies any existing `shop_settings.currency` onto the business's site, then drops the table.
- **Changing it with priced items:** you're asked to confirm, with a list of the items that will need re-pricing. Nothing is converted; existing prices keep their own currency.
- **Import:** if the business never chose a currency and has no prices yet, an import adopts the shop's currency.
- **REQ-633's catalog:** checked, no change needed. It already formats each price in that price's own currency.

**Tests:**
- 5 new worker tests and 4 new UI tests pass.
- I updated REQ-631's tests only where this ticket replaces REQ-631's behaviour: the new import request shape, Settings' currency route, and giving each test business a site.
- The REQ-631, REQ-633, REQ-151 and Settings suites all pass, and the typecheck is clean.
- Two tests in `reconciliation-builder-workspace-origin.test.ts` fail (AC977 and AC964). They're about other routes, and the new route isn't one the suite checks.

**Other things to know:**
- The sandbox wouldn't let `xgd branch cut` write `.git/config`, so I worked directly on xgd-working under the session lock. Releasing that lock at the end was refused because BUG-329 now holds the merge lock, so I couldn't end the session lock cleanly; BUG-329 holds it now.
- The Settings assistant can't change the default currency yet; only the Settings pane can.

<!-- xgd-chat-end -->