---
uid: bug-8ebfe194
id: BUG-191
type: bug
title: Delegated builder turn ends 'aborted' and reports nothing, so all checks come
  back unreported although its writes landed
created_by: xgd
created_at: '2026-10-03T19:58:22.721660+00:00'
updated_at: '2026-10-03T19:58:22.721660+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-9eb8d065
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