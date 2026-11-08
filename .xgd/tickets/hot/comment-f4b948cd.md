---
uid: comment-f4b948cd
id: COMMENT-7892
type: comment
title: Comment on bug BUG-367
created_by: xgd
created_at: '2026-11-06T00:00:08.543202+00:00'
updated_at: '2026-11-06T01:22:45.961711+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b6fb57f6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ed49a53b-2aa7-4210-a10e-3689b524f24e",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "302de881-b6d1-4d52-93e7-ebda425cf979",
  "chat_ticket_uid": "bug-b6fb57f6"
}
-->

<!-- xgd-turn id="79d156e199bd408887691a538036c70b-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T00:05:15.549195+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="79d156e199bd408887691a538036c70b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T00:05:31.865365+00:00" -->
#### Claude
Reading the free-coding protocol and the code this ticket touches before I start.

Checking for duplicate tickets, then reading the checkout code.

Not a duplicate (BUG-363 is the predecessor it builds on). Starting: mark `free_coding`, cut the branch.

Mapping how preview channels route the lead endpoint (the pattern to copy for checkout).

Now reading the order/quote logic (for the single-rate case) and the default checkout template.

Studying how L1 renders `control` buttons — that's where the disabled look and centring belong.

Item 5 first (small), then the server side.

Now public-site's `handleCheckout` gets an `identified` flag (as `handleLead` has) and the control app's preview route.

Now wiring the route into the preview block, right after the `api/lead` route.

Now the checkout page script (items 2, 3, 4, 7).

Writing the component changes (prompt default, single-rate, Cancel, Continue starts disabled).

Now the default template: drop the static "Ship to" label (the select carries its prompt), and add the action row.

Now the renderer: disabled look and centred labels for button controls (items 7, 8).

Code typechecks. Logging progress, then running the existing checkout suites before writing the UATs.

Writing the workers UAT (draft quote, draft start, single-rate path end to end).

Passed first time, so checking the tests can actually fail: disabling the route temporarily.

<!-- xgd-turn id="570025fd1e844e18825c63aa0749d0c4-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T01:11:06.713949+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

<!-- xgd-turn id="570025fd1e844e18825c63aa0749d0c4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T01:11:39.770947+00:00" -->
#### Claude
All green. Doing the fail-check I was mid-way through: neutralise the route, confirm the UAT goes red, restore.

Route UAT fails without the fix, passes with it. Now the jsdom and Chromium UATs — looking at how existing checkout tests drive the script and render pages.

Workers UAT is green and goes red without the route. Now writing the jsdom UAT (no-answer message, single-rate page, default prompt, Cancel link).

All pass. Tidying a clumsy helper, then the Chromium UAT.

Writing the Chromium UAT (disabled look, centred label, action-row geometry at tablet and phone widths).

Chromium skipped — checking why it's unavailable here.

The Chromium suites skip in the sandbox unless launch args are set; re-running with `CHROMIUM_LAUNCH_ARGS`.

Real layout problems surfaced. Dumping the rendered action row to see what Chromium actually does.

Single-process Chromium allows one page; relaunching per width.

The page's column was 0 px wide because the test fixture's design sets no content width — a fixture gap, not a product bug. Giving the fixture site a real design measure.

Still tracing how a real site gets its column width, so the Chromium fixture matches a published page.

Module fragments rely on the site's page-level design variables (`:root`), which this bare fixture site doesn't emit. Injecting the same `:root` variables a designed site declares.

All four pass. Confirming they fail against the old renderer and template.

The framework here is 1stcontact's own (not lagrange-framework), so no Python peer. Now looking for other tests pinning strings or CSS I changed.

`module-assets.ts` mentions the checkout script — checking whether `client.js` is bundled into it (then it needs regenerating).

The checkout script is compiled into the generated `module-assets.ts`, so that file has to be regenerated. Reading two memory notes about doing that in a worktree.

Regenerating just `module-assets.ts` through its builder, then checking the diff contains only my `client.js` change.

A REQ-99 test pins the control's hover selector as `.k-l1-0:hover`, but item 7 makes it `:hover:not(:disabled)` on purpose. Updating that pin.

Searching for other tests that pin a control's CSS, since every button's CSS now starts with `text-align: center`.

Eight failures; checking which are pre-existing by running the same files with my source changes temporarily reverted.

All 8 also fail without my changes, so none are mine. Logging progress, then reading the promotion steps.

Before committing, re-checking the free-coding protocol's end-of-work steps.

Version is now allocated by the gate, which simplifies promotion. Committing the work on the branch (explicit paths only).

Committed. Merging back next. The main checkout has an uncommitted `module-assets.ts` change that would block the merge, so checking it first.

Merged cleanly. Re-running my UATs and the module-assets consistency check on the merged tree.

All 40 pass. Fast-forwarding `xgd-working` and rematerialising tickets.

<!-- xgd-turn id="a44b43a6864b44b9b575c4e8e89dc131-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T01:21:30.355358+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

<!-- xgd-turn id="a44b43a6864b44b9b575c4e8e89dc131-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T01:22:13.138798+00:00" -->
#### Claude
Promoted to `free_coded` (version 0.2.795). Now noting how it was built on the ticket and cleaning up the branch.

BUG-367 is now `free_coded` at version 0.2.795. Eight of the nine fix items are merged into `xgd-working`; item 6 needs you, because the wording it removes is stored in the site, not in code.

**What changed:**
- **Draft checkout quotes (items 1–2):** the builder preview now answers `api/checkout/*` using the same checkout function the published site uses. In the draft, Continue to payment never opens Stripe: it shows "Payment opens on your published site. Only you see this." and creates no order.
- **No silent fallback (item 3):** when the shop can't be reached or gives no answer, the page now says so. "This can't be bought right now" appears only when the quote says the piece isn't available.
- **Single rate (item 4):** when every country costs the same to ship to, the page doesn't ask for one, and every shipping country is passed to Stripe. The order's ship-to country can't be left empty in the database, so it's temporarily set to the zone's first country and replaced with the buyer's real one once payment completes.
- **Wording (items 5–6):** the Plan panel's empty message is the new sentence, and the framework's default ship-to prompt is now "Please select a region for delivery".
- **Buttons (items 7–8):** disabled buttons are dimmed, show a not-allowed cursor and don't change on hover. Continue to payment starts disabled until a quote allows checkout. Button labels are centred by default.
- **Action row (item 9):** from tablet width up, Continue is sized to its label and right-aligned, with a Cancel button to its left. Cancel goes back to the product page, or to the shop if the piece isn't known. On phones both are full width with Continue on top. To get that order, the page template contains Cancel twice and shows one copy at each width, because the layout engine can't reverse a row's order.

**Tests:**
- 14 new UATs pass: 4 against the real shop tables, 6 in jsdom, 4 in Chromium.
- I checked that the route, Chromium and jsdom tests fail on the old code.
- The Chromium tests only run in the sandbox with `CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox`; without it they skip.
- 8 other test failures (in generate, REQ-105, AC718, REQ-269, REQ-308 and REQ-349) also fail with my changes taken out, so they were already failing.
- I regenerated the bundled checkout script. The committed copy was also missing BUG-363's guard for shops that can't sell.

**Still open:**
- **Item 6 needs you:** "Where should we send it?" is the dev site's own `countryPrompt` setting on its checkout component. Clear that setting and the new default will show.
- **Missing tag:** my commit message lacks the `[FREE-CODED]` tag the promotion checklist asks for. It was already merged when I noticed, so I left it rather than rewrite merged history.

I added these implementation notes to the end of the ticket body, and removed the branch and its worktree.

<!-- xgd-chat-end -->