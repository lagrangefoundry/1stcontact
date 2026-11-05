---
uid: comment-c0c95f3e
id: COMMENT-4868
type: comment
title: Comment on bug BUG-193
created_by: xgd
created_at: '2026-10-03T23:24:05.379003+00:00'
updated_at: '2026-10-03T23:30:32.410491+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fa1334a6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "093924f5-52fb-4928-95d7-d82984bb420e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="51c4994f-8c95-4c37-9aa1-dc4a432b6ef9-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T23:22:30.682382+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="51c4994f-8c95-4c37-9aa1-dc4a432b6ef9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:30:31.852946+00:00" -->
#### Claude
Next, I'll update the ticket, cut a branch, then make the template change and add a UAT.

Now the UAT, modelled on the REQ-283 workers suite.

All 19 tests pass. Next I'm confirming the new UAT fails without the template change.

The red run exposed a weak assertion. `noteBlock` runs past the note into the page digest, which has its own "when this turn began", so I'm tightening it to stop at the next heading.

Red without the change, green with it. Next is a quick check of the priming-configuration suites, then commit.

Everything is green. Next: commit, merge back under the lock, and promote without `--version` so the gate bumps the version itself.

Now the ticket body, then the free_coded gate.

BUG-193 is fixed and parked at `free_coded`; promoting it to reconcile is your call. It wasn't a storage bug: the reporter's own retraction at the bottom of the ticket was right.

**What was actually happening:** the standing note is read when a turn's priming is put together. So the agent always sees the note from the end of the previous turn, and anything it rewrites mid-turn only shows up at the start of the next one. Saves were never lost. The decisions block and the page digest already say they were taken "when this turn began"; the standing note's heading didn't, so an unchanged note looked like a failed write.

**The fix** is a text-only change to the standing-note heading in `tools/generate/src/cli/ai/priming.json`. It now says the note is as it stood when the turn began, that it doesn't change as the agent works, and that a rewrite made during the turn is what the next turn delivers, so its absence isn't a failed write. Storage and the read path are unchanged.

**Test:** `tests/test_UAT_FC_BUG-193_the_note_is_labelled_as_a_start_of_turn_snapshot.workers.test.ts` drives the Worker's real prompt route against D1 with a scripted model:
- Turn 1 writes note A.
- Turn 2 rewrites it to B mid-turn, and its priming still shows A under the new heading.
- Turn 3's priming shows B and not A.

The test fails without the template change and passes with it. The REQ-283 and REQ-339 workers suites and the REQ-182 and REQ-171 priming suites (48 tests) all pass with the change.

**Ticket and merge:**
- The commit `dc9a0cc4` is merged into xgd-working, and the gate added the version bump (0.2.464) as the ticket's second commit.
- The ticket body keeps the original report and now ends with a Resolution section; story points are set to 1.
- The branch and worktree are cleaned up.

<!-- xgd-chat-end -->