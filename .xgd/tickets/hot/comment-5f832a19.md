---
uid: comment-5f832a19
id: COMMENT-5532
type: comment
title: Comment on bug BUG-236
created_by: xgd
created_at: '2026-10-20T19:41:19.831464+00:00'
updated_at: '2026-10-20T19:59:25.362259+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6facfa71
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2d9cbae2-1c14-4e0f-9590-038ea5583a15",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3e0b9eb6-e200-493f-a258-eb9edc48192d-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T19:40:30.514606+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3e0b9eb6-e200-493f-a258-eb9edc48192d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T19:59:24.810507+00:00" -->
#### Claude
Still mapping: now reading the `webui-chat` component's API so I know what the host can control (composer text, rendering of the consultant's reply).

Locating the priming text for the panel-question announcement and the "one question per message" rule.

Mapping the plan panel next (typed answers, comp board, redraw), since items 5 and 6 live there.

Understood the comp board's host model; now finding how the per-turn "plan answers" notice decides what's new, so "I've finished commenting" can reach the consultant the same way.

Now the host's `set_ask` (item 6: refuse changing a shown question's form).

Now the UATs that pin the old `delegation-method` wording (item 4).

Designing the "hold the worker's result while the client is typing" piece; checking where the composer sits in the DOM to place the marker.

Writing the code now, starting with item 3 (holding the worker's result while the composer has unsent text) in `chat.js`.

Now the hold itself inside `talkDesk`'s stream wrapper.

Now wiring the hold into the panel: the marker button, the composer check, and the poll.

Now the CSS: item 1's capped, scrolling chip area, and the held-result marker, placed in the REQ-414 section (not the file's tail).

Items 1 and 3 are in. Now the plan panel (items 5 and 6b): Done buttons, Enter to submit, "Saved ✓", comp-board Done / "I've finished commenting", and typed text that survives redraws.

Now the comp board: per-site Done, kept note text, and "I've finished commenting".

Panel side done. Now the host: a `finish` comp action, the stored `comps_finished_at`, and the per-turn notice line.

Item 6a: `set_ask` refuses changing a shown question's input type or options.

Host and panel code for items 1, 3, 5, 6 written. Now the priming text (items 2, 3-guidance, 4), editing `priming.json` textually in both copies.

Updating the REQ-401 UAT that pins the per-question announcement, which the ticket says this replaces.

Now item 4, the `delegation-method` passage. Checking what REQ-415 actually attaches to a builder's result so the new wording is accurate.

Still on item 4 — a text splice in `priming.json` isn't matching; finding the mismatch.

Updating the REQ-295 / REQ-342 / REQ-343 UATs that pin the old "believe them, don't look" wording.

Now running the affected suites.

One failure, in a test I didn't touch (a `ManageTextStyles` grant). Confirming it fails on the clean main checkout too.

Pre-existing on the clean checkout, so not mine. Now writing the BUG-236 UATs. Checking how existing tests drive `set_ask` and the plan-answers notice.

Workers-project tests drive the real routes; checking that suite runs in this sandbox before building on it.

Workers suites run once the generated artifacts are copied. Seeing how BUG-200's suite posts asks, to reuse its pattern.

Writing the browser-side UAT file now. Checking the REQ-414 and REQ-364 harnesses for mounting the tray and the plan panel.

Writing the jsdom UAT file (composer cap, held result, plan panel Done/Saved/kept text, comp board, priming wording).

Ten of eleven pass, including the hold. The attachments test dropped no chips; checking how the tray takes a drop.

All 11 browser UATs pass. Now the host-side workers UAT: the `set_ask` refusal through a real consultant turn, and "finished commenting" reaching the next turn's notice.

Both host UATs pass. Running the wider regression scope (plan, comps, chat, attachments, priming, delegation suites).

Some failures; memory says REQ-295/341 delegation suites are red on a clean tree. Baselining the failing files on the main checkout.

The same 10 fail on the clean main checkout, so they predate this change. Running the second half of the regression scope.

REQ-342's "rides every turn" suite failed; checking whether that's my priming change.

Also fails identically on the clean checkout. Running the project's typecheck and lint.

Typecheck clean. Checking my notes on this project's `free_coded` gate before committing.

All green apart from the pre-existing failures. Committing on the branch with explicit paths.

Before committing, I'm updating the ticket body so every UAT traces to its wording. I'm keeping the existing text and adding an implementation section.

Committed. Now locking and merging back into xgd-working.

The merge failed with "Unable to write index". Checking for a held index lock vs a sandbox denial.

No lock left behind, so it was a transient collision with a concurrent ticket commit. Retrying.

Moved to `free_coded`; the gate added its own version-bump commit. Cleaning up the branch and checking the ticket fields.

Done. Saving one non-obvious lesson from this session: a fresh worktree needs the whole `generated/` directory copied in, not just the two files the memory named.

I've implemented items 1–6 of BUG-236. Item 7 isn't done because lagrange-framework REQ-214 is still a draft. The work is merged into xgd-working and the ticket is at `free_coded` (version 0.2.558). I haven't promoted it to `ready_to_reconcile`; that's your call.

**What changed**
1. **Attachments:** the file chips now take about two rows and scroll inside themselves. With 20 files attached, the text box and Send stay usable.
2. **Pacing (consultant instructions):**
   - New panel questions get one line in total, never one line per question.
   - A message ends on its one real question, and that question is the main thing in it.
   - "What happens next" goes in its own message.
   - This replaces REQ-401's "announce every question" wording, here and in `set_ask`'s description.
3. **Worker's hand-back:**
   - The consultant is told to keep its result to about three lines.
   - Once the consultant has gone to work, anything it says while the text box has unsent text waits behind a small "The consultant has finished — show what it said" button above the box.
   - It appears when the client sends or clears the box, or presses the button. Talker replies still come through meanwhile.
4. **Builder instructions:** "believe them and move on" and "not otherwise" are gone. The consultant now looks at the picture and layout check attached to the builder's result before telling the client it's done. The record of what changed means it doesn't need to re-read the site's data. The REQ-295/342/343 tests are updated to the new wording.
5. **Panel "finished":**
   - Every typed answer has a Done button, Enter submits one-line answers, and "Saved ✓" shows once stored. Saving when you leave the box still works, and an answer is only sent once.
   - Each comp site has a Done that saves both likes and dislikes.
   - "I've finished commenting" under the board tells the consultant once, on its next turn. Adding or noting a site afterwards shows the button again.
6. **Questions keep their form:**
   - The host refuses a `set_ask` that would change a shown question's input type or options. The refusal tells the consultant to withdraw it and add a new question with a new id; rewording is still allowed.
   - Text the client is typing in any answer box or comp note survives a panel redraw.

**Item 7 (the "+" inside the text box, and moving the status widget under the progress bar):** I didn't build a stand-in by moving `webui-chat`'s elements from our side, because it would be thrown away once REQ-214 lands. The ticket body says item 7 is still open; it can be done here once REQ-214 is in.

**Tests:** 13 new tests across two files (one runs in a simulated browser, one against the real routes and database); all pass, and the typecheck is clean. In the wider plan/chat/delegation run, 14 tests failed in REQ-122, REQ-295/341 and REQ-342's "rides every turn" suite. The same 14 also fail on the unchanged main checkout, so they were already broken and aren't caused by this change.

The ticket body keeps its original text, plus a new "Implementation" section describing what landed and naming each test.

<!-- xgd-chat-end -->