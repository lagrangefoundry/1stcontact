---
uid: comment-6ecb92e4
id: COMMENT-5751
type: comment
title: Comment on bug BUG-293
created_by: xgd
created_at: '2026-10-26T02:02:43.015707+00:00'
updated_at: '2026-10-26T02:27:53.206379+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d94308ad
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "004e05e0-80cb-43e2-a927-d3c2faac2f44",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1bb86a62-004f-4e7c-b509-79ca2af55a0f-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T02:01:02.577354+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1bb86a62-004f-4e7c-b509-79ca2af55a0f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T02:27:52.513107+00:00" -->
#### Claude
Now let me set status and cut the branch.

Now the code. Let me look at `composeSection` and the renderer.

I'm reading the composition and renderer code to find where a button's size and alignment are decided. Next I'll check whether the schema already has a per-node self-alignment I can reuse.

Plan is clear. Next I'll look at the host's layout check, where the oversized-button check will go.

I'll add the oversized-button check as its own named layout check. Next I'm finding how recent UATs load a stored site's page, so the tests can use Dina 4's real home page.

I'm pulling Dina 4's stored home page out of the dev store so the tests can use the real page.

Dina's page sections live in a separate table. I'm pulling them now.

Assembling Dina's home page from the frame and its section rows to build a test fixture.

The current page has since been reworked by the builder (button moved into the heading group). I need the earlier version with the pill, so I'm checking the revision history.

The old section (before the builder's 02:03 workaround) was [heading group, table, button]. I'll rebuild it from the stored parts and write the fixture.

Fixture written. Now the renderer fix: a painted link run (fill or border) sizes to its label and takes its container's alignment instead of stretching.

Now the edits to `ParentFlow`, the child flows, and the text case.

Renderer typechecks. Now the `cards` composition: it should only lay out real cards, with a leading heading group as the intro and a trailing button as the section's action.

Composition typechecks. Now the layout check. First I'll see what else references a finding kind so the new one is wired everywhere.

Adding a floor so a small button raised to a tap-target minimum isn't flagged.

Pre-existing errors only, none in my files. Now the UAT; I'll reuse BUG-289's serve-and-measure shape.

Writing the UAT file now.

Width passes; the height is 7 px over because the label's glyph box is shorter than its line box. I'll check that's the only difference.

The box is exactly one 28 px line plus padding, so the test should measure the label by its line height. Fixing the test.

All 4 pass. Now I'll confirm they fail on the old code by setting the three source changes aside, running the tests, and putting the changes back.

That ran far more than my scope (the file list didn't expand, so vitest ran everything). Rerunning with an explicit list.

Six failures. A memory note says REQ-415, REQ-418, BUG-237 and BUG-276 were already red on clean working. Checking each failure's message, REQ-447 especially.

Baselining those five files on the clean main checkout.

Five of the six are red on clean working too. REQ-447's Ariel render-fidelity test is caused by my change, so I'm looking at its detail.

REQ-447 passes now (8/8). Next I'm checking other suites that render painted link buttons, since they may pin the old CSS.

Baselining these four on clean working.

Both are red on clean working too. Everything I touched is green, and every remaining failure is also red on clean working. Next: update the ticket body, then commit.

Now the commit, following the promotion recipe from memory: merge working into the branch, bump, fast-forward back, gate.

One thing worth remembering for later sessions: where a dev site's pages are stored. I'll add it to the existing dev-store memory.

BUG-293 is fixed, merged into `xgd-working`, and the ticket is at `free_coded` (commits `096aa10f` and the version bump `8125b7ce`, version 0.2.661, 5 story points).

**What changed**
1. **A button keeps its own size** (`render.ts`). A linked text run drawn with a fill or a border (what a `button.*` component becomes) now sizes to its label and padding, with the label centred. It sits where its container aligns its items (start, centre or end) and is never stretched. If the container stretches its items or says nothing, the button goes where its own text is aligned.
2. **`cards` only lays out cards** (`composeSection`). A group holding the heading right after any leading text joins the intro, and trailing buttons or links go below the grid as the section's action. Whatever is left must be two or more groups, or the section is left as built. Dina's "What to order" (heading group, table, button) is now left as built.
3. **New layout check** (`button_size`, finding `oversized_button`). At every checked width it reports a button more than twice its label plus padding, across or down. A side under 48 px is never reported, so a short label padded out to a tap-target size isn't flagged.

**Tests:** `tests/test_UAT_FC_BUG-293_a_button_keeps_its_own_size.test.ts` has 4 UATs. They use Dina 4's real home page from the dev store, run through the real renderer in Chromium. All 4 pass, and all 4 fail on the old code; the old code reproduced the 357 px button exactly.

**Decisions to review:**
- **The "before" page is rebuilt, not stored.** The builder reworked Dina's "What to order" section at 02:03, after the operator saw the oval. I rebuilt the earlier version (heading group, table, button) from the stored sections and the change log, and the fixture keeps both the earlier and the current page.
- **The check test redraws the pill with CSS.** With the fix in place the renderer can't draw the oval any more, so that test lays a CSS rule over the page to draw it at 357×248.
- **REQ-447's Ariel snapshot changed.** `tests/fixtures/req447-sites/ariel/layout-before.json` recorded Ariel's buttons stretched up to 1184 px wide. I updated only those ten entries to the new widths and wrote this up as a "Supersedes" section in the ticket.

**Regression runs:** about 180 related test files, covering layout checks, compositions, design, button components, and the critic's rubric and priming. The only remaining failures are 11 tests that also fail on a clean `xgd-working`: REQ-415, REQ-418 (×2), BUG-237, BUG-276, REQ-349, REQ-371, AC931, AC1084, REQ-436 and REQ-458.

I also added a note to my dev-store memory on how a site's pages are stored in the dev D1, for building fixtures like this one.

The ticket is ready for you to promote to `ready_to_reconcile` when you're happy with it.

<!-- xgd-chat-end -->