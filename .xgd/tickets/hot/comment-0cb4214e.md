---
uid: comment-0cb4214e
id: COMMENT-5542
type: comment
title: Comment on bug BUG-243
created_by: xgd
created_at: '2026-10-21T14:52:11.042487+00:00'
updated_at: '2026-10-21T15:01:05.240391+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-202fd9a5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "644e575d-f038-4b7b-89e7-0d0317d134ad",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d67c21c0-4088-456a-992c-f02ba952faf7-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T14:51:21.786639+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d67c21c0-4088-456a-992c-f02ba952faf7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T15:01:01.875068+00:00" -->
#### Claude
Now let me find the code involved.

Reading the guard and report seams; next checking what a `tool_activity` event carries so the guard can tell a recorded report.

Checking the upstream tool loop's `tool_activity` meta (has `output`), to detect a recorded report in the guard.

Detecting the report in the guard is feasible: `tool_activity` meta carries `name` and `output`. Checking REQ-409's "replace a stopped builder" logic so a report-ended turn doesn't trigger it.

Now editing `budget-core.ts` in the worktree.

Factoring the shared spend meta so the two `done` events don't duplicate it:

Now the host side: a `reportRecorded` predicate in `account-core.ts`, wired in at the builder's `guardTurn`.

Now the UAT. Checking the scripted client helpers:

Copying the gitignored generated bundle into the worktree, then running both the new and the BUG-212 suites:

All 11 pass. Confirming the new UATs fail without the fix (temporarily dropping the `finish:` wiring):

The fix is what makes all four pass. Now a broader regression scope over the suites that drive builders and the guard:

16 failures across 6 files; several match known pre-existing reds. Establishing a baseline by running the same 6 files with my source changes set aside:

13 are pre-existing; 3 are mine: REQ-339, REQ-411, REQ-421. Looking at what each expects:

The builder there reported first and then said "Reported." — the test relied on that second request. Looking at REQ-411 and REQ-421 before adjusting:

REQ-411's timeline logs "finish" on a builder's last scripted request, which was the `says('')` after the report — never sent now. The script becomes `[REPORT]`. Now REQ-421:

REQ-421 needs at least two builder requests; it had them only via the post-report prose. Giving the builder a read before its report. Applying all three test adjustments:

All three pass. Running lint and typecheck:

No linter in this repo. Typechecking, filtered to the changed files:

Typecheck is clean for the changed files. Before committing, checking my notes on this project's version-bump and gate order:

Now updating the ticket body (keeping the existing sections, adding what landed) before committing:

Committing on the branch (explicit paths only):

Committed `e8b13594`. Lock, merge into xgd-working, rematerialize:

Merged. Moving to `free_coded` without `--version` (the gate bumps the version itself), then cleaning the branch:

Adding the memory index line, then wrapping up.

BUG-243 is fixed and merged into `xgd-working`. The ticket is at `free_coded`, and promoting it to `ready_to_reconcile` is your call.

**What changed:** once a builder's `ReportResult` is recorded, the host ends the builder's turn and sends no further request. I didn't need the fallback wording on the receipt.
- `guardTurn` in `budget-core.ts` takes a new `finish` check. The builder's guard uses `reportRecorded` (in `account-core.ts`): a `ReportResult` whose receipt says it was recorded, not refused.
- When it fires, the reserve notice is switched off for that builder, and the turn closes there with its usage and occupancy attached, as the budget stop already does. It closes as `complete`, not `aborted`, so REQ-409 doesn't swap in a fresh builder and the run no longer reads as "ran out of context". Any tool calls the model put after the report in the same reply are not run.
- A refused report doesn't end the turn: the builder still gets its retry, still with the reserve notice.
- The consultant gets the report exactly as before.

**Framework:** I didn't file a lagrange-framework ticket. The guard already ends builder turns between requests (REQ-296, BUG-212), so this uses the same hook rather than working around one. The ticket says so.

**Tests:**
- **New UATs:** `tests/test_UAT_FC_BUG-243_recorded_report_ends_builder_turn.workers.test.ts` has four:
  - a builder past the reserve sends exactly 3 requests;
  - a builder below the reserve stops right after its report;
  - a refused report gets a retry;
  - the consultant receives the report unchanged.
- **Without the fix:** all four fail.
- **Three existing tests changed:** REQ-339, REQ-411 and REQ-421 broke because their scripted builders depended on a request *after* the report. I moved that work before the report and noted it in the ticket.
- **Regression run:** across the 33 suites that drive builders, the report or the guard, 13 tests fail. Those 13 fail the same way with my changes taken out (reconciliation-assistant AC1051–1061, REQ-341 config, two REQ-295).

The ticket's last check, looking at real builder transcripts for runs that end with repeated `ReportResult` calls, can only happen after the next live session.

Commits: `e8b13594` (fix), plus `64b4e751`, the automatic version bump to 0.2.568.

<!-- xgd-chat-end -->