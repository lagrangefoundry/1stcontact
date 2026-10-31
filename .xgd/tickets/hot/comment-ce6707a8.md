---
uid: comment-ce6707a8
id: COMMENT-5747
type: comment
title: Comment on bug BUG-292
created_by: xgd
created_at: '2026-10-26T01:27:29.673631+00:00'
updated_at: '2026-10-26T01:50:46.037794+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-42eb71ac
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b3fd8de7-9ceb-4a7a-bdd2-982f66bf856e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b751d473-f91f-4729-90e5-23b2dfde8fe5-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T01:26:11.098613+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b751d473-f91f-4729-90e5-23b2dfde8fe5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T01:50:43.764136+00:00" -->
#### Claude
Reading the ticket and the speak-first gate code. Some of the fix may already be landed by BUG-290, so I'm checking that first.

Still mapping how per-request cost is recorded, so the Debug tab can show what refused rounds cost.

Checking what the framework records as a request's `trigger`, to see whether refusals can be counted without a schema change.

Deciding where refusal counts and cost should live. Checking the existing turn-health/turn_log surface before adding anything new.

Now the chat panel side (fix 4): reading how chat.js places streamed text and cued replies.

webui-chat already draws `forked` text as its own bubble — checking how it handles that, since it may be the mechanism for "late text goes at the bottom".

Enough context. Cutting the branch and marking the ticket `free_coding`.

Setup done (generated artifacts copied, shared store linked). Now editing `cadence-core.ts`: refusal wording, the host's line on override, and a `refused` hook for the meter.

Simplifying: since BUG-290 releases the gate after the first refused result, at most one request per round is refused, so `refusedAny` alone is enough.

Now the meter: a `speak_first_refused` column on `request_spend` (migration 0034, same shape as REQ-438's `review_id`). Reading spend.ts's insert.

Plain sha256, and there's a `bin/migration-manifest` tool. Writing the migration and wiring it through.

Now the factory, spend-core record, spend.ts row, and host tagging.

Now host-core: the `refused` hook marks the site, and the consultant's sink tags the next request it writes.

A business-level tally avoids any site→session mapping, and the Debug tab is already per business. Looking at how an existing tenant-scoped spend route reads D1.

Writing the read: a spend.ts query, a `/api/refusals` route, and the Debug-tab section.

Route and fetch in place. Now the Debug panel section; reading how the reviews section loads and draws.

Debug panel done. Now rewording the home-structure note so "tell your client" comes first.

Checking the other speak-first cues for the same "act, then tell" ordering.

The critique and promise cues (both on the speak-first list) also order work before the line to the client. Rewording them the same way.

chat.js done. Now the UATs; reading BUG-290's workers test to reuse its harness.

Checking how BUG-287's UATs trigger the home-length hold, to reuse for the "hold after a reply" UAT.

Running the new workers UAT.

All 4 pass. Quick check that they bite: disabling the host line and the request tag should fail test 2.

The UAT bites. Now the jsdom UAT for the chat order and the Debug tally; finding an existing Debug-panel test harness.

Passing (not skipped). Checking it fails against the old chat.js.

Now the Debug-tab rendering UAT.

Regression scope next: the speak-first, cadence, spend, Debug and chat-panel suites.

No summary line came back; rerunning with output captured to a file.

Known vitest quirk with long filter lists; splitting into batches.

Two failures to baseline. Running the same two files on the clean xgd-working checkout.

Both are pre-existing on clean xgd-working (it even fails one more there). Running the remaining batches.

Baselining those five files on clean xgd-working.

Identical 8 failures on clean xgd-working, so none are from this change. Now the other chat-panel suites that import chat.js, plus typecheck.

Same 5 fail on clean xgd-working too. Now typecheck and lint on the changed files.

Typecheck clean on touched files. Reading the promotion memory before commit/merge.

Updating the ticket body now (keeping Symptom/Cause, revising Fix to what was built, adding the UATs) before committing.

Ticket updated. Committing on the branch.

Committed. Now lock, merge xgd-working into the branch (checking nobody else took migration 0034), bump, and merge back.

Clean merge (priming.json and spend-core auto-merged with another ticket's edits). Re-running the BUG-292 UATs on the merged tree before bumping.

Running the bump → commit → xgd-merge → move-to-free-coded tail as a retry loop (other sessions commit tickets to xgd-working constantly).

Now cleaning up the branch and worktree.

BUG-292 is implemented and merged into xgd-working. The ticket is at `free_coded` (version 0.2.660, commits `9a8e4aa0…` and `9919712a…`), and the branch has been cleaned up. All the new UATs pass. The wider regression runs show some failures, but each of those suites fails the same way on clean xgd-working.

**Already fixed by BUG-290.** BUG-290 came from the same incident and landed first. It stops the gate from holding a round once the client has heard from the consultant in that message, and it refuses at most once per round before letting calls run. So the 28-refusal loop can't recur. This ticket builds on that and adds the rest:

1. **The incident's case is now tested.** The consultant replies, the host holds the reply with the home-length cue, and the held round's first call (recording the new structure, with no words first) runs without a refusal.
2. **Cues put the line to the client first.**
   - The home-length note now says: tell your client the new structure in one line, then record it with `set_decision`, then build.
   - The review-hold and promise cues put the line to the client first in the same way.
   - The refusal no longer says "acknowledge what they just did", since a host hold doesn't follow anything the client did.
3. **The client hears something, and the cost shows up on the Debug tab.**
   - When the gate lets a call run with nothing said yet, the host first sends one neutral line: "I'm working on this now — it takes a few minutes, and I'll tell you here when it's done."
   - The request each refused round spent is marked in a new `request_spend.speak_first_refused` column (migration `0034`, manifest updated).
   - The Debug tab has a new **Refused rounds** section, fed by `GET /api/refusals`. It shows "N refused rounds, $X." and the most recent ones.
4. **Chat order.** Once a cued reply has been drawn below a running round, that round's later text appears as a new message at the bottom instead of going back into its old bubble. Nothing is overwritten. The fix is in `chat.js`, because `webui-chat` lives in lagrange-framework.

**Decisions you may want to revisit:**
- The ticket asked for refusals to stop after the second one. BUG-290 already stops them after the first, so I kept that and added only the line to the client and the Debug tab figures.
- The Debug tab tally is per business, not per site, so it doesn't need to work out which sessions belong to which site.
- Text arriving late in the chat appears in chunks: at each tool call, each progress update and the end of the round. It doesn't stream in letter by letter like a normal reply.

**Tests:**
- Three new UAT files cover the hold after a reply, the single refusal plus the host's line plus the priced row and route, the cue wording, the chat order, and the Debug tab section.
- I checked the key UATs fail when the change is removed: the host's line and the refusal marking for the refusal test, the old `chat.js` for the chat order test.
- Regression scope covered all the speak-first, cadence, spend, Debug and chat-panel suites. Failures there (BUG-245 priming, BUG-275, REQ-416, REQ-428, REQ-431, REQ-436, BUG-64, BUG-244, REQ-127, builder-assistant-pane) all fail identically on clean xgd-working.

Migration `0034` adds a column, so it needs applying to each environment's D1 at deploy. It's ready for you to promote to `ready_to_reconcile` when you are.

<!-- xgd-chat-end -->