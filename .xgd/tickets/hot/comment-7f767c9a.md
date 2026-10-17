---
uid: comment-7f767c9a
id: COMMENT-5368
type: comment
title: Comment on request REQ-401
created_by: xgd
created_at: '2026-10-17T15:15:40.701947+00:00'
updated_at: '2026-10-17T15:27:43.376703+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9ec5da8f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7d2e2865-91de-4778-bdfe-0688de837cd6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="976742a3-80f5-4862-92a5-663074c1fdd8-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T15:15:17.840691+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="976742a3-80f5-4862-92a5-663074c1fdd8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T15:27:43.328722+00:00" -->
#### Claude
I'm reading the ticket and the existing plan-panel code and tests before cutting the branch.

Still exploring: the comp board's status needs server data (the visual_concept decision and a client "skip"), so I'm checking the plan view and comp-action route next.

Still reading: the builder's remembered-settings storage and the chat's CSS, so the fold state and type can reuse them.

I'm checking the chat component's own CSS to see what type tokens it exposes for the plan panel to reuse.

Mapping which existing tests touch the panel so I don't break them; next I'll cut the branch and build.

I have the design clear. Moving the ticket to free_coding and cutting the branch now.

Setting up the worktree so webui and generated modules resolve, so the panel tests actually run instead of silently skipping.

Baseline runs for real (4 passing). Now the server side: comp-board status and a client "skip" in plan-core.

Now editing plan-core: the skip field, the status rule, and the reminder line.

Server side done. Now the panel strings and storage key in config.js.

Now the panel itself. Rewriting the item drawing in plan-panel.js: each question and the comp board become foldable items in two sections.

Panel logic is in. Checking how the chat pane is wrapped so the shared type token can be applied to both the chat and the panel.

Writing the CSS: the shared chat type token, the one-line item, the status box, and the fold.

Now running the existing panel suites to see what the restructure broke.

All 19 related suites pass (87 tests). Now the consultant's priming and the set_ask description.

Now the UAT file. Checking how other suites seed a real chat turn, so the font comparison reads an actual chat message.

jsdom resolves neither `var()` nor inheritance, so the font UAT needs to walk the cascade itself. Finding where the shell declares the family.

Writing the UAT file now.

All 11 pass on the first run, which makes me suspicious, so I'll check the font test actually catches the old size.

The font test catches the old size. Re-running the panel suites plus every suite that reads the priming or plan surface.

Many failures; most look environmental. Checking the actual errors, especially the priming budget one, which my additions could have caused.

Failures trace to `lib.registerDefaults is not a function` in session setup, an upstream shared-store issue rather than my diff. Confirming against the untouched main checkout.

Same 28 failures on the untouched main checkout, so they predate this work. But they hide the priming size-budget check, so I'll check that cap directly.

The cap is 200,000 characters and I added about 800, so there's no budget risk. Running the type check and lint next.

Type checks are clean for my files. Updating the ticket body with the design decisions, keeping the existing content.

Ticket updated. Committing on the branch.

Committed. Taking the merge lock and merging back into xgd-working.

Merged cleanly; nothing to rematerialize. Moving the ticket to free_coded and letting the gate bump the version itself.

REQ-401 is built, merged into xgd-working and parked at `free_coded`. That's commit `ab405ea` plus the automatic version bump to 0.2.512 (`0322176`). The new UATs (11) and the 19 existing plan-panel suites all pass. I haven't looked at it in a real browser, and dev won't show it until someone runs `bin/deploy --env dev`.

**What the client sees**
- **One line per item.** Each question, and the "Sites we're comparing" board, folds to a line with ▸/▾, a status box (empty white, grey with "–", or ✓), and the question cut off with "…". Screen readers get "Open", "Skipped" or "Done". Clicking anywhere on the line, or Enter/Space, toggles it; clicking inside the answer area doesn't.
- **Two sections.** OPEN QUESTIONS and WHAT YOU'VE TOLD US. Items move between them as their status changes, an empty section is hidden, and withdrawn questions appear in neither.
- **Folds stick.** Open items start expanded. An item collapses once when it's answered or skipped. Anything the client folds or unfolds is remembered per site and item in the builder's own storage, so it survives redraws and reloads.
- **Same type as the chat.** The chat component hard-codes its 13px and offers no setting to read, so I defined that size once in `builder.css`. The chat and the panel both now take it from there, so changing it moves both. The font family already came from the shell for both.

**Decisions I made that you may want to check**
- **When the comp board counts as done:** once the `visual_concept` decision is no longer open *and* names at least one comp. The consultant's instructions already say to record it "with the comps that shaped it". A concept picked by default with no comps behind it leaves the board open.
- **Skipping the comp board:** this needed a new `skip` action on `/api/plan/comp`, saved in the plan as `comps_skipped_at`. Adding a site to the board reopens it. The consultant's per-turn plan summary now says "The client skipped comparing other sites."
- **Placement:** the comp board sits last among the open items and first among the settled ones. The "N questions still to answer" line still counts questions only, not the board.
- **Consultant rules:** "open every question with its subject" and "announce every question you add in one line" are in both versions of the consultant's instructions and in the `set_ask` description.

Eight other suites that test the consultant's instructions and session setup (REQ-182, -239, -283, -284, -285, -295, -388, AC1320) can't confirm this change. They fail the same way on an untouched checkout (`lib.registerDefaults is not a function`), so the failures predate this work. Their size-limit check didn't run as a result, but the limit is 200,000 characters and this adds about 800.

The ticket body now records all of the above, and the ticket is ready for you to promote when you're happy.

<!-- xgd-chat-end -->