---
uid: bug-8ebfe194
id: BUG-191
type: bug
title: Delegated builder turn ends 'aborted' and reports nothing, so all checks come
  back unreported although its writes landed
created_by: xgd
created_at: '2026-10-03T19:58:22.721660+00:00'
updated_at: '2026-10-03T22:57:49.844954+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-9eb8d065
  severity: medium
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