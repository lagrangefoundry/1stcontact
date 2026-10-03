---
uid: comment-9eb8d065
id: COMMENT-4865
type: comment
title: Comment on bug BUG-191
created_by: xgd
created_at: '2026-10-03T22:52:54.130801+00:00'
updated_at: '2026-10-03T23:03:43.143633+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8ebfe194
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d144c217-380b-432b-9ff8-4e905d443595",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0df7832a-3325-4e90-a4a9-6001ca30af95-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:51:32.999490+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0df7832a-3325-4e90-a4a9-6001ca30af95-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:03:41.317213+00:00" -->
#### Claude
The delegation code lives in lagrange-framework, not 1stcontact — checking the upstream source to confirm where the fix belongs.

Tracing which component produces the `aborted` status — framework manager vs. 1stcontact's own model adapter.

Found a 1stcontact-side guard (`budget-core.ts`) that deliberately closes turns `aborted` — reading it, since it may be the actual cause.

The host already wraps the delegation result (`reportingDelegationToolbox` adds `activity` from the worker's records), so the reason can likely be derived locally. Reading that wrapper.

Confirmed the record shape: `{kind: 'turn_end', status, error?, reason?, requests…}`. host-core already has a reader for it — checking whether I can reuse it.

Reusing that pattern. Now finding the existing BUG-167 UATs for the reporting toolbox to model the new test on.

The BUG-167 suite drives the real route with a scripted model. To trip the guard I need a scripted step that reports large input usage — checking whether a REQ-296 test already does that.

I have the shape. Recording scope on the ticket, then cutting the branch.

Writing the code in the worktree now.

Same scope, so the worker's backend name is at hand. Applying the edits.

Now the account-core change: the `ended` reader, the result-shape description, and the toolbox wiring.

Code in place. Writing the UAT, modelled on the BUG-167 and REQ-296 suites.

Worktree lacks the gitignored `control-app/src/generated` build artifact, so I'm copying it in from the main checkout before running.

Both pass. Tidying a leftover ternary, then running the BUG-167 / REQ-296 regression suites and the type check.

One REQ-296 case fails. Its own comment predicts that the nudge assertion will flip once the upstream BUG-75 fix lands, so I'm checking the baseline on clean xgd-working.

All 14 pass. Running the type check and lint.

Type check is clean. Before committing, re-reading my memory notes on the version-bump and promotion mechanics for this repo.

Plan: commit on the branch without a manual bump, merge into xgd-working under the lock, then let `move-to-free-coded` do the bump itself (avoids the known version-gate race).

Committed. Before merging, updating the ticket body so it reflects the final implementation, including the REQ-296 test update.

Another session (BUG-187) holds the merge lock, taken 3 minutes ago. Waiting for it to release.

I'm waiting for BUG-187's merge lock to clear. Once it does, I'll take the lock, merge `free-BUG-191` into xgd-working, and move the ticket to `free_coded`.

BUG-191 is done and at `free_coded`. A delegated worker whose turn was cut short now tells the consultant why, in a new `ended` field on the delegation result.

**Likely cause: our own context guard, not an outage.** I found this in the code; I haven't confirmed it against the actual dev run. The builder worker runs on Haiku 4.5, which has a 200k-token context window. The context-budget guard from REQ-296 stops a turn once a single request would carry more than about 151k tokens. It checks right after each tool call, and when it stops a turn, the turn is recorded as `aborted`. That fits what was reported: 40 operations, the last one a large `describe_page` read that succeeded, and every write before it landed. The guard does record its reason, but the framework's session manager doesn't pass it on, so the consultant only saw `aborted` plus a pointer to a session record it can't read.

**What changed (1stcontact only):**
- When a worker's turn didn't finish, the result now includes `ended`. It is read from the worker's own end-of-turn record and has:
  - `status` (`aborted` or `error`);
  - `reason`, which is `context_budget` when the guard stopped it;
  - `occupancy_tokens` and `ceiling` on a guard stop, so the consultant can see how full the worker was;
  - `error` when the turn failed with an error.
- The description of `ended` in the result tells the consultant what a `context_budget` stop means: the work done so far has landed, and the rest should go out as a new, smaller delegation rather than asking the same worker again.
- A worker that finished its turn and simply reported nothing carries no `ended`, so that case reads exactly as before.
- The changes are in `account-core.ts` (new `workerEnding` function, wired into `reportingDelegationToolbox`) and `host-core.ts` (passes the worker's own token limit). I also moved the `TURN_END` constant into `budget-core.ts` so it's defined in one place.

**Not changed, with the reasoning recorded on the ticket:**
- **Checks the host could have answered (Problem 2):** the host deliberately answers only the three check phrasings it can't misread (REQ-354). Section order and review attribution would be a new request.
- **Retry (Problem 3):** retrying a guard stop would hit the same limit on its first request. A genuine API error already comes back as `outcome: failed` with the message, and now also in `ended.error`.

**One test I changed outside the new feature:** the REQ-296 test `a_worker_is_guarded_against_its_own_smaller_window_and_not_the_callers` was already failing on a clean xgd-working. It still expected the worker to be asked once more ("nudged") after a guard stop. The upstream lagrange-framework BUG-75 fix now skips that nudge for an aborted turn, which is the `nudge_skipped` in this bug report. The test's own comment predicted this. I updated it to expect one worker request and no nudge.

**Tests:** the new `tests/test_UAT_FC_BUG-191_aborted_worker_says_why.workers.test.ts` plus the BUG-167 and REQ-296 suites: 14/14 pass, and the type check is clean.

The work is merged into xgd-working as commit `8d9b2f4`, with version bump `def6c83` (0.2.462); the branch is cleaned up and the ticket has 3 story points. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->