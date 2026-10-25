---
uid: comment-f942afba
id: COMMENT-5628
type: comment
title: Comment on bug BUG-277
created_by: xgd
created_at: '2026-10-25T18:58:35.639344+00:00'
updated_at: '2026-10-25T19:25:53.597786+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-05e80baa
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ec5aadc2-e5f3-4546-88f0-e2bb89a0150f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a59c33af-d700-42bc-8bac-cdd156de0425-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T18:57:00.442960+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a59c33af-d700-42bc-8bac-cdd156de0425-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T19:25:52.946896+00:00" -->
#### Claude
I've cut the `free-BUG-277` branch and am setting up its worktree. Next I'll find where `Unable to enqueue` escapes in the turn-streaming code.

Still investigating. I'm checking how the framework builds model history, to decide how the "picking it back up" line can last past a disconnected client.

Now editing `router.ts`: one guard for every client-stream write in `streamTurn` and `streamTail`.

Router side is done. Now the host side: the errored-round recovery in `continuedTurn`, its cue template, and the durable line.

Now the `continuedTurn` changes in host-core.

Code's in. Now typechecking.

No typecheck script, so the UATs will be the check. I'm looking at how the BUG-249 and REQ-416 UATs read `turn_log` and drive a talker, so the new UAT can reuse them.

Writing the UAT file now, with three cases from the ticket's test plan and a live-line variant.

Overloaded is transient and gets retried, which explains it. I'll use a non-transient error and fix the ledger assertion.

All four pass. Next I'm confirming they fail on the unfixed code.

The new UATs fail on the old code for the right reasons: the turn records `error`, as in the field. Now the regression set: BUG-46, BUG-249, BUG-256, BUG-275, REQ-416 and REQ-146.

BUG-249 stalls-twice and the REQ-416 priming test are known red on clean working. BUG-46's abandoned-turn test is the behaviour this ticket supersedes. Checking the two BUG-275 failures against base.

BUG-275 fails on base too (a hook timeout), so it's pre-existing. Next I'm retiring the BUG-46 test that pinned "a cancelled stream aborts the turn", since this ticket explicitly supersedes it.

Three more tests used "close the socket" to stage an aborted turn: BUG-121, REQ-292 and BUG-254. A closed socket no longer aborts, so I'm reading each to find another way to stage that state.

Those pass. Checking whether retiring the tests left unused helpers or imports behind.

Now the whole workers project, to catch anything else that depended on the old behaviour.

19 failures. To separate mine from pre-existing ones, I'm running the same files on the unfixed code.

Only BUG-232's thrown-turn test is new. The rest fail on base too (BUG-275's second case failed on base in the earlier run). Looking at BUG-232.

BUG-232 passes. host-core is shared with the Node host too, so I'm running the Node tests that import it.

Eight failures. BUG-39 ("wire protocol in one place") could be my new test file, so I'm baselining these files on base.

All eight fail on base too. Checking BUG-39's message to make sure my new file isn't one of its offenders.

The flag is `--append-body-file -`. Retrying with that.

Ticket body updated. Now committing on the branch.

Committed. Now the merge-back: lock, merge `xgd-working` into the branch, bump the version, then fast-forward back.

Another session changed `host-core.ts` meanwhile; it auto-merged. Re-running my UATs on the merged tree before landing.

Merged into `xgd-working`. Moving the ticket to `free_coded`.

The ticket is `free_coded`, with both commits and version 0.2.640. Tearing down the branch.

Saving two lessons from this session for later sessions.

BUG-277 is fixed and merged into `xgd-working`, and the ticket is at `free_coded` (commits `6a216a04` and `4d355221`, version 0.2.640). The ticket body now records what landed.

**Cause (confirmed).** The cue turn runs through `/api/ai/prompt` and `streamTurn` in `router.ts`. That code wrote each event to the client with a bare `enqueue`, deliberately: a throw from it was how a closed socket ended a turn. Once the client side had closed, the next write threw "Unable to enqueue". The route recorded that as `error`, and the turn was aborted underneath. The new tests reproduce exactly that `turn_log` row on the old code.

**Fix 1: the connection is not the turn.**
- Every write and close on a client stream now goes through one guard, `clientStream()`. That covers prompt, cue and talker replies in `streamTurn`, and reattach in `streamTail`.
- The guard ignores only the closed-stream error. Anything else still throws.
- A turn whose client has gone runs to its end and is recorded `complete`. Reattach and the next panel load show its reply. Stop now works only through `/api/ai/stop`.

**Fix 2: an errored round is never silent.**
- When a consultant round ends in an error, the client gets "Something went wrong on my side. I'm picking it back up." It arrives live if they're connected, and as a saved message they'll see on the next panel load if not.
- The round is then carried on once, with a hidden cue that names the error. `turn_log` reads `complete` with "recovered after error: …".
- A second error in the same message ends it, as before.
- 429, 529 and 5xx errors are still retried inside the framework and never reach this path.

**Tests.** The four new UATs in `tests/test_UAT_FC_BUG-277_a_closed_stream_does_not_end_the_turn.workers.test.ts` pass, and all four fail on the old code. I ran the full workers project and the Node tests that import host-core. Every other failure also fails on clean working, so none comes from this change. Those are BUG-249 stalls-twice, both BUG-275 tests, REQ-416 priming, REQ-342, REQ-424, REQ-295, BUG-39 and others.

**Older tests changed.** Five existing UATs pinned "a client walking away ends the turn", which this ticket replaces:
- **Removed:** the BUG-46 test that expected `aborted`, BUG-121's interrupted-turn test and REQ-292's no-row-for-a-cut-off-turn test. Each now has a comment pointing to BUG-277.
- **Adapted:** BUG-254 (the turn is now `complete`, still carrying its builder's spend) and BUG-232 (one extra request for the recovery round).

One cost of the removals: code that handles an abandoned turn is still live, for an isolate dying mid-turn, but no workers test can reach it any more.

**Observation (no change).** The consultant's priming and `Delegate`'s goal note already say the logo's size lives in `brand.logo`. The two `logo_sized` refusals were the model not following existing guidance, not missing guidance.

<!-- xgd-chat-end -->