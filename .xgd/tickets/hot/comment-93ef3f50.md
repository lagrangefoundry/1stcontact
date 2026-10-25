---
uid: comment-93ef3f50
id: COMMENT-5524
type: comment
title: Comment on bug BUG-232
created_by: xgd
created_at: '2026-10-20T02:02:53.014300+00:00'
updated_at: '2026-10-20T02:13:57.021806+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4c3f7e10
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2c4e81e8-5571-436e-a5a1-b4d0e59224e2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3a6dc2a1-ddfa-43a9-84ae-725ffc4f67af-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T02:02:26.388051+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3a6dc2a1-ddfa-43a9-84ae-725ffc4f67af-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T02:13:54.104088+00:00" -->
#### Claude
Branch cut; now reading `host-core.ts` around the spend paths.

Now checking what the installed manager actually writes onto `turn_end`.

Still locating the installed framework package to confirm `turn_end`'s spend fields.

Found the shared framework store; reading the manager's `turn_end` write.

Checking whether the junction log has a cheap cursor accessor, so the recovery can't pick up a previous turn's `turn_end`.

Found `SessionLog.size()` — a cheap cursor. Reading it to confirm.

Now verifying upstream's throw path emits spend, so I can script the failure.

Writing the change: replace `turnAttributions` with a reader for this turn's own `turn_end`, then wire it into both paths.

Now the site path's `finally` and cursor.

I'll reflow the one long line by hand, then typecheck.

Typecheck is clean for `host-core.ts`. Now the UAT; checking whether the REQ-292 helpers are shared anywhere.

Helpers are copied per file in this suite, so I'll follow that. Writing the UAT.

Fresh worktree lacks the generated control-app artifacts (a known worktree issue). Checking my note on how to handle it.

All three pass. Confirming the first and third cases actually fail without the fix:

Case 1 fails without the fix (no row at all), as expected. Case 3 guards against re-billing the previous turn's `turn_end`. Now the regression scope:

Three failures, all thrown from `new SessionManager` while opening a session, before any turn runs. Confirming they're pre-existing by running them without my patch:

Tests and types are clean. Updating the ticket body before committing: re-reading it, since it changed on disk.

Committing on the branch, then merging back under the lock.

It's at `free_coded`, with the gate's own version-bump commit added as the second commit. Setting story points and tearing down the branch.

BUG-232 is fixed and merged into `xgd-working`. The ticket is at `free_coded` with version 0.2.548, story points 3, and two commits: the fix `fe129534` and the gate's version bump `9ed79cc8`. I haven't promoted it to `ready_to_reconcile`; that's your call.

**What was wrong:** the spend wasn't lost. When a turn throws, the manager writes the turn's spend onto its `turn_end` record, but this host only read spend from the final event of the stream, which a throwing turn never sends.

**The fix** (`tools/generate/src/cli/ai/host-core.ts`, in both the site/coordinator path and the settings path):
- The host first reads spend from the stream's final event, as before. Only when that event is missing or carries no measured usage does it read this turn's `turn_end` from the junction. A completed turn makes no extra read, unless delegation is switched on: then the junction is read anyway, and one read gets both the delegated workers' spend and the turn's own.
- **I added one thing you didn't ask for.** Once `turn_end` is a spend source, the old "take the last `turn_end` in the log" read becomes dangerous. A turn that writes no `turn_end` of its own would pick up the previous turn's record and bill it twice. That happens when the context budget refuses a turn before the model runs, or when a turn throws before the manager has written anything. So the host now notes where the log ends before the turn starts and reads only past that point. This also stops those turns re-billing the previous turn's delegations, which could already happen before this fix.
- A `turn_end` that measured nothing still claims nothing: no row, or zero counters with a NULL cost if a worker was billed. Unknown is never zero.
- The out-of-date comment in the `finally` is rewritten to describe the new source.

**One behaviour delivers nothing yet:** a client walking away mid-turn. The host now takes that exit through the same recovery, but today's framework records no spend on its `turn_end` for that exit, so nothing is recovered. It will start working once upstream records that spend.

**Tests:** `tests/test_UAT_FC_BUG-232_thrown_turn_spend.workers.test.ts` has three cases, all passing. They drive the real route with a real D1:
- **Throw after two billed requests:** one row with `outcome: error`, `requests: 2`, the summed counters and a priced cost. This case fails on the unfixed code, which writes no row at all.
- **Completed turn:** row unchanged from before.
- **Throw before any request, after a metered turn:** exactly one row, the first turn's, so nothing is billed twice.

**Regression run:** 70 of 73 tests pass across the related spend, delegation, budget and group-chat suites. The 3 failures fail the same way without my change: one is the upstream `logDir` → `junctions` rename, two are the known delegation-suite failures.

The ticket body now has "What changed", "Design decisions" and an updated "Test plan". Your existing sections are untouched.

<!-- xgd-chat-end -->