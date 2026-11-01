---
uid: comment-f27bebbb
id: COMMENT-5945
type: comment
title: Comment on bug BUG-323
created_by: xgd
created_at: '2026-10-31T22:47:50.532808+00:00'
updated_at: '2026-10-31T23:03:08.868827+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-39d43ee6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fdc06141-cf49-4a95-b64f-be1075e97376",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8ef70a99-664d-496b-a234-2685210ba787-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T22:46:32.172736+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="8ef70a99-664d-496b-a234-2685210ba787-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T23:03:07.153441+00:00" -->
#### Claude
Reading the ticket and finding how the host already refuses builder changes the brief didn't ask for.

Found a precedent: `site-import.ts` already refuses a builder action based on what the brief says. Reading how it gets the brief.

Tracing how a builder's Delegate `scope` reaches its writes — the brief can take the same route.

Builder writes run under a per-worker "writer" (holder + scope). The framework's account `mark` hook sees both the worker id and its brief, so I can attach the brief there. Checking `draftAccount`.

Plan is clear for the refusal half. Now looking at how earlier fixes repaired stored sites, for part 3.

Setting the ticket to `free_coding` and cutting the branch.

Now the code. First, the schema rule the builder reads:

The prose reaches the builder through the platform reference, so the JSDoc line is the right place. Now the host check — reading `draftAccount`'s mark hook to feed the brief to the writer.

Writing the menu-button rule module and wiring it into the lease store.

Now the lease store check:

Now the claims side (brief per builder) and the host wiring:

Now the repair. Checking the page tables' columns for the migration:

Good precedent (`runMigration` over the shipped SQL). Looking at the BUG-289 test to reuse its button observation:

The workers route gives end-to-end coverage (consultant Delegate → builder write → host refusal). Checking which L1 op a builder would use to set a field on the nav:

Writing the UAT file:

Running the new suite:

The fixture's palette reference doesn't resolve on a seeded site; dropping it.

All three pass. Confirming the refusal test actually fails without the host check:

Negative check confirmed. Now the regression scope: typecheck, lease/scope suites, BUG-289, and anything that projects schema prose.

Typecheck clean. Running the adjacent suites:

Checking whether the REQ-458 failure predates my change (baseline on clean working):

REQ-458 fails identically on clean `xgd-working`, so it's pre-existing. Running REQ-410 too, then reading my notes on the version gate.

Everything green apart from the pre-existing REQ-458 failure. Committing the code:

Now the ticket body — keeping what's there and adding what landed:

Now merge back, bump the version, and move to `free_coded`:

`free_coded` on the first attempt. Verifying both commits are on `xgd-working`, then tearing down the branch:

BUG-323 is done and parked at `free_coded`. Two commits are on `xgd-working`: the fix `1243ae4` and the version bump to 0.2.717 `a454e26`. The ticket records both, with 3 story points. The three new tests pass, and I checked that the "refused" test fails when the host check is switched off.

**What changed**
- **The builder's rule:** the nav schema description the builder reads now says the menu button stays three bars unless the client asked for words on it.
- **The host enforces it:** each builder's Delegate brief is now attached to its writes. If a builder write gives a nav a word button (`label` or `icon_label`) that the page didn't already have, it is refused with "the menu button stays three bars unless the client asked for words on it; nothing was written". The check runs where every draft write already passes. A brief "asks" when one of its sentences names the menu button (or the hamburger, or `menuButton`) and words on it, such as "the word Menu on the phone menu button".
- **Repair:** a new migration, `db/migrations/0039_menu_button_default.sql`, sets every stored draft word button back to `icon`, Ariel's included. Nothing on record says whether a client asked, so all of them go back, as the ticket allowed. It keeps `menuLabel`, which is still the button's screen-reader name, and bumps each changed site's version so no stale cached copy is served.

**Things to know**
- **Ariel's live site won't change on deploy.** The migration repairs the draft when it runs at deploy, but published revisions can't be changed. The phone header shows three bars from Ariel's next publish.
- **The tests check the rendered HTML, not a real phone browser.** They read the folded nav's button from the real renderer's output (three bars drawn, no words). That's the button a 375 px screen shows, but no 375 px browser layout ran, because Chromium can't start in this sandbox.
- **Other suites:** the typecheck is clean and the related lease, scope, header and migration suites pass. The one failure, in REQ-458's "builder holding the pages" test, fails the same way on a clean `xgd-working`, so this change didn't cause it.

The ticket body keeps your original sections and adds "What changed" and "Design decisions". The test names in it are now filled in as `test_UAT_FC_BUG-323_*`.

<!-- xgd-chat-end -->