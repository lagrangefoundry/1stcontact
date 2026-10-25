---
uid: comment-387fb199
id: COMMENT-5645
type: comment
title: Comment on bug BUG-284
created_by: xgd
created_at: '2026-10-25T21:24:16.881476+00:00'
updated_at: '2026-10-25T21:45:10.135985+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e1531356
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f1920885-5fae-402b-ac3b-a5959b467223",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4e5916a3-1253-44c2-9ffa-21b02f420143-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T21:22:25.103596+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4e5916a3-1253-44c2-9ffa-21b02f420143-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T21:45:07.114538+00:00" -->
#### Claude
Branch cut; now locating the speak-first gate and the first-draft copy code.

Reading the continuation loop; now checking how the gate is created per site so the loop can see it.

Part 1 design is clear (wrapper flags a held-then-stopped turn, host loop continues once with a new cue that doesn't re-hold the gate). Now reading the first-draft copy for part 2.

Now reading the existing BUG-278 and BUG-280 UATs to model the new ones on.

Writing part 1: the wrapper reports a held-then-stopped turn.

Now the cue template and roles helper.

Tidying the prompt selection I just wrote.

Part 2: the copy rewinds build-milestone `due`s and draft-relative `told`.

Code done; writing the UAT file now.

All 3 pass. Checking they fail without the fix (reverting host/cadence/copy code temporarily).

Red without the fix, green with it, code restored. Now the regression scope: BUG-278, BUG-280, REQ-428, REQ-450, BUG-262, BUG-241 and the priming/cue suites.

The filter expansion swept the whole suite (empty-match in sed). Rerunning with just the scoped files.

This test doesn't touch my code paths; checking whether it's already red on clean xgd-working.

Pre-existing on clean xgd-working, not mine. Typechecking, then committing.

Typecheck clean. Checking the version-bump convention for this repo before committing.

Updating the ticket body before committing (adding what landed, keeping the original text).

My append wrote a literal `-` (wrong flag). Fixing it: I'll take the existing body, strip the stray dash, and add the section.

Ticket body is right. Now merging back and running the free_coded gate, retrying on version races.

I've fixed both faults. BUG-284 is merged into xgd-working and parked at `free_coded` (commits `7508e035…` and the version bump `f95b9f6f…`, version 0.2.647).

**1. A cue turn the gate held now carries on.** Before, the consultant had a call refused by the speak-first gate, wrote "Next I'm checking…" as a text-only round, and the turn ended. Now the host continues that turn once, with a new hidden cue: "you told your client what you're doing next and ended without doing it; do it now, starting with the call that was held back."
- **Cue doesn't re-hold the gate.** Otherwise the call would just be refused again, since the client has just read the consultant's words.
- **Continuation follows the existing REQ-409 rules:** it only happens while continuations and spend are left, and never after a Stop or an error.
- **Other owed work comes first:** if layout, review or a promise is owed, that cue is used instead.
- **No change when the model goes straight on:** a round that speaks and then calls a tool isn't continued.
- **Same bubble:** the client sees it as a new paragraph in the same message.

**2. The first-draft copy no longer carries the source's build.** The copy now clears a check's `due` when its trigger is a build moment (`first_pass_complete`, `revision_round_finished`, `before_fan_out`, `before_publish`). It also drops a task's `told` when it mentions "draft" or "first pass". Checks due on other triggers, and other `told`s, are kept. `first_pass_at` and `revision_rounds` were already cleared by the existing copy (REQ-450); the test now pins that.

**Tests:** `tests/test_UAT_FC_BUG-284_a_held_cue_turn_carries_on.workers.test.ts` has 3 tests. All pass with the fix, and 2 of 3 fail without it; the third checks that nothing extra happens, so it passes either way. I also re-ran the related tests (BUG-129/241/249/262/277/278/280 and REQ-403/409/415/427/428/450/455). Everything passed except `REQ-428_the_plan_entry_carries_the_open_decisions…`, which fails the same way on clean xgd-working because the plan entry is cut off before its last due line.

**Things to know:**
- Dina's Diner 3 was copied before this fix, so its plan still has the stale dues. Re-copy it to test.
- Dev serves a frozen snapshot, so you need `bin/deploy --env dev` before trying this live.
- The ticket body keeps your original text and now has "What landed" and "Tests" sections.

<!-- xgd-chat-end -->