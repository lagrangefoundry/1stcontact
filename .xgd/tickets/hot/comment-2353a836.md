---
uid: comment-2353a836
id: COMMENT-5743
type: comment
title: Comment on bug BUG-289
created_by: xgd
created_at: '2026-10-26T00:50:45.491508+00:00'
updated_at: '2026-10-26T01:19:21.204254+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4e490663
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "cab79a84-5643-4290-b38b-f4a16e024f77",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="46f24e5a-b147-4298-a545-7ae2e8d425d4-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T00:49:07.826348+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="46f24e5a-b147-4298-a545-7ae2e8d425d4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T01:19:18.773971+00:00" -->
#### Claude
Ticket's scope is clear; branch `free-BUG-289` is cut. Now reading the seed code and existing header tests before changing anything.

Surveyed the code: seed in `design-seed.ts`/`host-core.ts`, arrangement in `design.ts`, nav toggle in `render.ts`, checks in `layout-check.ts`. Reading the check format next.

Found Dina 4's stored snapshots in the local dev store; extracting the two headers (00:00 UTC grouped one and the later flat one) as test fixtures.

Now implementing. First the arrangement in `design.ts`.

Now the nav's `menuButton` field and the renderer's hamburger.

Now the renderer: the button markup, the 44px target, and the toggle sitting last in a header row.

Now the layout check.

Now the host: seeding the brand on `read_design` and the note on `set_design`.

Typecheck clean. Now the UATs — checking how the existing workers tests drive `read_design`/`set_design`.

Writing the UATs now; checking how `write_positioning` takes `location_led` so the workers test can make Dina location-led.

I'll let the header logo give way on a phone (shrink, contained, and its wrapping group allowed to shrink) so the one-row layout never pushes the page sideways.

Now the UATs. Browser/render file first.

Several fail — probably my in-page probe. Dumping the rendered header to see.

The probe treated the logo's `display:contents` link as hidden. Fixing the probe, and making the renderer's group rule see through that link.

All six browser UATs pass. Now the workers UAT for `read_design` seeding and the `set_design` note.

The tool result clips long strings, so the note was cut before the size. Checking the limit.

I'll return the note as a short list of lines so no line is clipped.

Both workers UATs pass. Now the regression scope: suites touching nav, header, brand, design seed and the layout check.

Some failures; baselining those files on the clean main checkout before blaming the diff.

Pre-existing on clean: everything except REQ-422's collapse test and BUG-286's seed test (the builder-origin and REQ-140 extras are worktree-location artifacts). Looking at those two.

Node side clean. Now the workers suites — BUG-276's refusal test first, since seeding on read changes its premise.

Baselining the three workers suites that failed (REQ-162, REQ-143, REQ-295) on the clean checkout.

All three are pre-existing on clean. One more check: suites pinning the L1 schema surface or generated manuals, since `nav` gained a field.

All pre-existing. Regression scope is clean apart from known-red suites. Checking the project's version-bump convention before committing.

Ready to record. Updating the ticket body first — keeping the existing sections and adding what landed, the decisions, and the tests touched.

Ticket updated. Committing the work on the branch.

Committed (`6f59c492`). Now the merge-back sequence: lock → merge xgd-working in → bump → fast-forward via `xgd-merge` → move to free_coded.

Landed as `free_coded` at 0.2.657. The merge pulled in a concurrent change to `host-core.ts`, so re-running typecheck and the BUG-289 UATs on the merged tip.

BUG-289 is implemented and merged into `xgd-working`. The ticket is at `free_coded` with both commits recorded (`6f59c492` for the work, `634c750a` for the version bump to 0.2.657) and 8 story points. The ticket body keeps your original sections and adds what changed, the decisions, and the UATs.

**What changed**
1. **The design starts from the logo.** When a site has a logo and its design has no logo brand, `read_design` now writes the brand the logo suggests into the design. For Dina's emblem that means centred, 126 px at desktop (1.5×), links in `lead`, and the address leading when the business's location is part of its pitch. If the design lacks `lead`, that type role is written too. The consultant is told this is a starting point it can change. If a later `set_design` changes the brand to something that contradicts the logo, it is still written but comes back with a note. The note covers a different arrangement, or a logo under 80% of the suggested size.
2. **A group holding the menu counts as the menu.** It stays visible on a phone, the address inside it waits for 640 px, and it is never treated as the main action. So Get directions no longer disappears on a phone.
3. **The phone header is one row:** logo, then the action, then the menu button. The groups don't wrap and the action stays on one line. If the row doesn't fit, the logo shrinks, so the row never wraps and the page never scrolls sideways.
4. **New layout check, `phone_header`.** Below 640 px it reports a header that hides all its links and buttons outside the menu, or one whose items spill onto a second row.
5. **The menu button is a hamburger by default.** The nav has a new `menuButton` setting: `icon` (the default), `label` or `icon_label`. The button is still named "Menu" for screen readers, opens and closes without script, and is at least 44×44 px.

**Decisions I made**
- The menu button always comes last on a phone, after the action, rather than only when the row doesn't fit.
- The layout check runs one width at a time, so it can't literally compare desktop with phone. It reports a header that has actions but shows none of them on a phone.
- The `set_design` note is a list of short lines, because write results cut each string at 200 characters.
- **Logo can be flagged as small:** when the logo has to shrink on a phone, the existing logo-size check may report it as smaller than the brand size. That's accurate, so I left it.

**Existing tests I changed** (this ticket deliberately changes their behaviour):
- REQ-422's phone test expected the word "Menu" on the button; it now expects the three bars.
- BUG-276's refusal test read the design before writing it, but reading now seeds the brand. It now writes first.
- BUG-286's check for the 22 px links only found that size through the old word button. It now renders with one real menu entry.

**Tests**
- Both new test files pass: 2 workers tests and 6 Chromium tests.
- The tests use Dina 4's two headers and design, taken from the local dev store into `tests/fixtures/bug289/`. The logo is a synthetic stand-in.
- I re-ran them after merging, because a concurrent change to `host-core.ts` came in with the merge.
- I ran the related suites (header, nav, brand, design seed, layout check, priming; about 280 files). Every remaining failure also fails on the clean checkout, or only fails because the tests ran from the branch worktree rather than the main checkout.

The ticket is ready for you to promote to `ready_to_reconcile` when you want.

<!-- xgd-chat-end -->