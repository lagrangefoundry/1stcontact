---
uid: comment-668fb2ee
id: COMMENT-5761
type: comment
title: Comment on bug BUG-299
created_by: xgd
created_at: '2026-10-26T19:21:17.889759+00:00'
updated_at: '2026-10-26T19:55:47.455674+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-64c4c5f7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f20e8834-5fa3-418c-b438-3888c3a86338",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f891b3ce-3a62-4345-b53f-98230536e69e-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T19:20:12.563608+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f891b3ce-3a62-4345-b53f-98230536e69e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T19:55:46.396287+00:00" -->
#### Claude
Reading the account-chrome module and how the serving Worker applies the session, before planning the change.

Found the stored instance pattern (the repo fixture also points at a nonexistent `/builder`). Checking L1 row layout fields, the router's routes, and package dependencies next.

Still mapping the data: finding where a signed-in person's name and email live so the published page can show their initial.

Reading the name/email tables so the public site's session reader can fetch the initial.

I have the shape. Checking which other code depends on the `businesses` slot or `portal`/`businesses` config before I commit to a design.

Baseline run of the existing account-chrome suites before editing.

Upgrades run on page load (`assemble.ts`), so a v2→v3 migration reaches stored sites on their next render. Writing the framework changes now.

Now the session seam: the initial marker and the Worker-side substitution.

Now the controls: the portal control becomes the avatar.

Now the component: derived targets and no separate businesses slot.

That `--help` actually ran the asset build. Checking what it changed.

Only the account-chrome CSS changed in the generated file, which is wanted. Now the contract (meta) and migration.

Preset updated; writing the v2→v3 migration next.

Now the public-site session reader (initial from name/email) and its call site.

A failure reading the name shouldn't sign the person out, so I'll isolate that read.

Now point the control app's path constants at the shared source.

Now running the affected suites to see what the contract change breaks.

Twelve expected breakages from the contract change. Going through each test file.

Dropping the retired `portal`/`businesses` keys from test configs.

One left: the repo copy of 1st Contact's own site (corpus fixture) is still v2 and must match the v3 preset. Regenerating its instance from the preset.

Existing suites pass. Now the new BUG-299 UATs; first finding how other tests drive the control app router so the "route the app answers" check is real.

I'll write a workers UAT modelled on the REQ-183 harness (real Worker, real D1, real Access token) for the routes. Now finding the Chromium layout helper for the row/avatar UAT.

Writing the node UAT: publish 1st Contact's own site through the public-site Worker with a signed-in session, then check targets, initial, and the Chromium row layout.

The first Chromium layout check passed; the second died because a single-process browser doesn't survive a second context. Launching a fresh browser per test.

All 6 pass, including both Chromium cases. Taking a quick screenshot to eyeball the result.

The row looks right. The "M" is underlined by the default link style, unlike the builder's badge; checking whether L1 has a text-decoration axis.

Now the workers UAT proving both derived targets are routes the control app actually answers.

Running the new workers UAT.

Workers UAT passes. Now typecheck and a wider regression scope (module assets, catalog guards, KB, portal, public-site).

Many failures in a broad scope; most look unrelated. Taking the same scope as a baseline in the main checkout (clean xgd-working) to compare.

While those run, I'll check the KB reference doc that describes account-chrome.

The KB projection is generated (gitignored) and already shows v3. Checking that AI priming/tool text doesn't describe the old slot or config.

While the regression runs finish, checking what tooling exists to correct the production instance's labels (that write I'll leave for your go-ahead).

Still running. Meanwhile updating the ticket body (keeping the existing content, refining Fix and adding design decisions).

Meanwhile, running the related workers suites (upgrade route, sign-in, portal).

Fixed. Waiting on the node baseline comparison.

Still running (some suites take ~80s each). Waiting for the monitor.

Small edge case in the migration: an (invalid) array-bound `signedIn` would be wrapped into the row. Tightening that.

The `textDecoration: 'none'` axis doesn't reach the CSS for a control. Looking at the emitter.

Only account-chrome has link controls, so the blast radius is just this module. Applying it.

The detached run ended up running the whole node suite (797 files): 68 failures on the branch. The baseline full run in the main checkout is in progress for comparison.

While the baseline finishes, spot-checking the failures most plausibly related (module docs, control types, render) in both trees.

Those all pass in isolation in both trees, so their full-run failures look load-related. Waiting for the full baseline to confirm.

While waiting, committing the work on the branch (version bump comes at merge time).

Committed (`0d9681e85c`). Waiting on the baseline before merging back.

Baseline started a few minutes ago; it takes roughly 13 minutes. Waiting for the monitor event.

The baseline has more failures (82) than the branch (68). Only three appear on the branch alone; the BUG-299 one was the underline, since fixed. Checking the other two in isolation in both trees.

Both runs hit my 280s timeout with no output. Rerunning with more time and saving logs.

Merged xgd-working into the branch cleanly (it brought in other sessions' REQ-470 work). Re-running my UATs and the module-assets consistency check on the merged tree before landing.

Fast-forwarded onto xgd-working. Marking the ticket free_coded.

Ticket is `free_coded` with both commits recorded. Cleaning up the branch.

Updating the ticket body for the one change made after I wrote it (the link-control underline reset in the emitter).

Saving one non-obvious finding to memory: the sandbox's single-process Chromium dies on a second context.

BUG-299 is fixed and landed on xgd-working, with the ticket at `free_coded` (commits `0d9681e85c` and `f5026050e2`, version 0.2.672). It won't reach 1stcontact.io until it's deployed and the site is republished, and production still needs one label edit I haven't made (both below).

**What a signed-in visitor sees now:** one row with "My businesses" on the left and a round avatar showing their initial on the right, vertically centred. The avatar's accessible name is "Your account". Someone who doesn't run a business sees the avatar on its own.

**How it works** (the `account-chrome` module moves to version 3):
- **No more hand-typed link targets.** The site config used to hold the two URLs, and every copy had them wrong: production used `/portal` and `/businesses`, and the repo's copy of the site used `/builder`. The module now works both out from the sign-in address it already has: the account link goes to `/account` and "My businesses" to `/` on `app.1stcontact.io`. The control app takes those paths from the same file, so the two can't drift apart. A config that still names old links is rejected, and if one is passed anyway it's ignored.
- **The row is part of the page design.** "My businesses" no longer has its own separate area that stacked under the account link. The two now sit together in the signed-in area as one row. The module still hides "My businesses" for people who don't run a business.
- **The initial is filled in per visitor.** Published pages are fixed files, so they carry a `?` placeholder. The public site's server swaps in the first letter of the person's name, or of their email if there's no name. Only that one letter is ever put into the page, and it's escaped so it can't inject markup. If the name lookup fails, the avatar shows `?` instead of signing the person out.
- **Stored sites upgrade themselves.** Pages are upgraded when they're loaded, so 1st Contact's stored chrome turns into the new row on its next render. The old link becomes the round badge in the colour it was already painted.
- **No underline on these links.** The renderer now removes the browser's default underline from links inside modules, as it already did for links in text. Only this module has such links, so nothing else changes.

**Tests:**
- New tests:
  - Against the real control app, both new targets return the account page and the builder, and the old `/portal` and `/businesses` return neither.
  - Through the public site serving 1st Contact's own page, the hrefs, the initial (name, then email, then `?`, escaped), old config being refused, and the old stored version upgrading into the row.
  - In Chromium at desktop width, the row layout, the round badge and the no-business case.
- I updated the existing tests that assumed the old version (REQ-200, BUG-76, BUG-85).
- A full run of the node test suite showed nothing new failing compared with a clean xgd-working run (68 failures on the branch, 82 on clean). The one exception, BUG-134, fails only because the branch's separate checkout lacks a scratch folder (`.xgd/tmp`) it writes to; it's unrelated to this change. I re-ran my tests after merging in the latest xgd-working and they pass.

**Waiting on you:**
1. **Deploy** the public site and the control app, then republish the 1st Contact site.
2. **Fix the production label.** The live chrome still says "Your businesses" instead of "My businesses", because the upgrade deliberately keeps labels that were set by hand. Remove `portalLabel` and `businessesLabel` from its `signin` module and republish. This writes to production, so I haven't done it; say if you want me to.

Anyone without a Cloudflare Access session will still hit the Access login before either link opens.

<!-- xgd-chat-end -->