---
uid: bug-8ebfe194
id: BUG-191
type: bug
title: Delegated builder turn ends 'aborted' and reports nothing, so all checks come
  back unreported although its writes landed
created_by: xgd
created_at: '2026-10-03T19:58:22.721660+00:00'
updated_at: '2026-10-03T23:03:12.345169+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-9eb8d065
  severity: medium
  commits:
  - working_sha: 8d9b2f4e9bfa9195439a4e9ae5f6fcbc08e856af
    reconcile_sha: null
    main_sha: null
  - working_sha: def6c83bbe38e5728df722c1b441bc083faad31b
    reconcile_sha: null
    main_sha: null
  version: 0.2.462
  story_points: 3
---

## What happened
The consultant called `Delegate` (role `builder`) with a moderate brief: change one text, insert two new top-level sections, change one section's fill and border, change one text, and set the site title and page SEO meta. It also included 3 `accept` checks.

The result came back with:
- `outcome: "silent"` and an empty `summary`
- all three checks `unreported` ("the worker reported nothing at all")
- `nudge_skipped`: "its turn ended 'aborted' rather than finishing… Read the worker's own session record for why its turn ended."
- `activity.operations: 40`. The last operation was a successful `describe_page`, so the worker was not out of budget when it stopped.

The `account` (host diff, changes 67→75) shows all of the requested writes landed correctly.

At about the same time the tester saw several unrelated dev sessions crash together, so the trigger may have been an upstream model/API failure. That would explain the cause, but the handling is still a problem.

## Problems
1. **The abort reason isn't surfaced in the result.** The caller is told to read the worker's session record, but the consultant has no tool that can read it (the delegation surface explicitly has no operation for a worker's turns). The caller can't tell whether the worker failed upstream, hit a guard, or crashed.
2. **Checks the host could settle went unanswered.** Two of the three checks were about structure (section order; two review attributions). A worker abort shouldn't stop checks that can be answered from host-side state.
3. **No retry for a transient upstream failure.** If the abort came from an API error, one automatic retry of the final report turn (or a structured `error` field with the upstream status) would turn "silent" into something the caller can act on.

## Expected
When a worker turn aborts, the result should carry the abort reason (upstream error, timeout, guard), and checks the host can answer should still be answered.

## Reproduce
Not deterministic. Look for any `Delegate` result with `outcome: silent` and `nudge_skipped` mentioning `aborted`.


## Diagnosis (added at implementation)

The likeliest cause is not an upstream failure but this repository's own context-budget guard ([[REQ-296]], `budget-core.ts` `guardTurn`). The builder worker runs on `claude_builder` (Haiku 4.5, 200k window, 32k max_tokens), so its per-request ceiling is 0.9 × (200k − 32k) ≈ 151k. The guard checks after every **tool activity** and, when the last request reached the ceiling, ends the turn with `interrupted: true`, so the manager closes it `aborted`. That matches the report exactly: 40 operations, and the last one a *successful* `describe_page` (a large read). The writes landed because the guard stops *between* requests.

The reason is lost on the way to the caller. The guard puts `stop_reason: 'context_budget'` on the adapter's terminal event. The manager does not forward it (by design: it is adapter vocabulary). The framework's delegation toolbox reads only `status`, so the caller sees `aborted` and a pointer to a session record it cannot read. The worker's `turn_end` record still carries everything needed: `status`, `error`, the stop-watch `reason`, and the per-request usage the guard fired on. `budgetStopMeta` already re-derives `context_budget` from exactly those for the consultant's own turns.

## Fix (scope)

**Problem 1, surfacing the reason (in scope, 1stcontact-only).** `reportingDelegationToolbox` already adds host fields (`wrote`, `activity`) read from the worker's session log on any non-`reported` result. It gains one more field, `ended`. It is present only when the worker's last turn did not close `complete`, and it is read from that turn's `turn_end` record:
- `status`: the turn's own status (`aborted` / `error`)
- `reason`: `context_budget` when the turn was the budget guard's stop (derived with the existing `budgetStopMeta` against the **worker's** ceiling, `projectBackendCeiling(lib, <worker backend>)`). Otherwise the stop-watch reason the record names, if any.
- `occupancy_tokens` and `ceiling`, when the reason is `context_budget`, so the caller sees how full the worker was
- `error`: the error message, when the turn errored

The field's description in the result shape tells the caller what `context_budget` means: everything written before the stop landed (read `account`), and the remainder should go out as a fresh, smaller brief, because the same worker has no room left. Absent on a turn that completed, so a normal silent run reads exactly as before.

**Problem 2, host-settled structural checks (out of scope).** The host deliberately claims only the three containment phrasings it can answer unambiguously ([[REQ-354]]: a wrong claim is worse than no claim). Section order and review attribution would be new claim grammar, which is a separate request, not a fix to this one. On an aborted run, the caller still has `account` to settle such checks itself.

**Problem 3, retry (no change).** Retrying a budget stop is pointless: the second turn carries the same history and is cut off on its first request (the BUG-75 argument, and why the nudge is already skipped). A genuine upstream API error already comes back as `outcome: failed` with the message in `summary`, not `silent`. With this fix it also comes back in `ended.error`.

## Test plan

`tests/test_UAT_FC_BUG-191_aborted_worker_says_why.workers.test.ts`, which runs the real `/api/ai/prompt` route in workerd with the scripted model as the only double:
- a worker whose request is metered over its own ceiling: the caller's result carries `ended: {status: 'aborted', reason: 'context_budget', occupancy_tokens, ceiling}` beside `outcome: silent`, with `ceiling` equal to the builder backend's ceiling
- a worker that finishes its turn and simply says nothing: no `ended` field

Regression scope: the BUG-167 and REQ-296 suites.


## As implemented

- `budget-core.ts`: `TURN_END` (`'turn_end'`) now lives here beside `TEXT`/`DONE`/`TOOL_ACTIVITY`, and `host-core.ts` imports it instead of defining its own (one definition site).
- `account-core.ts`: new `workerEnding(lib, records, ceiling)` returns a `WorkerEnding` (or `null`) read from the worker's **last** `turn_end` record. `reportingDelegationToolbox(lib, ceiling = 0)` attaches it as `ended` on any non-`reported` result, beside `activity`. The `ended` description is added to the delegation result shape the caller reads. A `0` ceiling only means a budget stop goes unnamed.
- `host-core.ts`: the reporting toolbox is built with the worker's ceiling, `projectBackendCeiling(lib, workerSettings.backend)`. That is the same settings name the worker's guard was built under, so `ended` names a budget stop on the same line the guard drew (151,200 tokens for Haiku 4.5 today).

**Adjacent test brought up to date:** `test_UAT_FC_REQ-296_a_worker_is_guarded_against_its_own_smaller_window_and_not_the_callers` was failing on clean xgd-working. It still asserted that the nudge goes out after a budget stop (two worker requests). Upstream lagrange-framework BUG-75 has since landed and skips the nudge for an `aborted` turn, which is the `nudge_skipped` this ticket observed. The case now asserts one worker request, no nudge text, and only that one request on the bill. Its own comment had predicted that flip.

Regression run: the BUG-191, BUG-167 and REQ-296 suites, 14/14 passing in workerd. The type check is clean.