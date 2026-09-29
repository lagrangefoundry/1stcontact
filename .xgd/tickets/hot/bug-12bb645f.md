---
uid: bug-12bb645f
id: BUG-165
type: bug
title: Delegate returns check verdicts as "passed" on a run that came back exhausted
  and unaccepted, with no marker that they are unreliable
created_by: xgd
created_at: '2026-09-29T04:04:02.588828+00:00'
updated_at: '2026-09-29T04:04:02.588828+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-438553d0
---

## What I was doing

Using `Delegate` (role `builder`) to hand over a layout-geometry fix on a page, with one entry in `accept`.

## What happened

The call returned:

- `outcome: "exhausted"`
- `accepted: false`
- `checks: [{ check: "<my check text>", verdict: "passed" }]`

The verdict was false. The check asked the worker to confirm, by looking at the rendered result, that certain elements no longer overhung a region. The worker's own `summary` showed how it got there: it had taken a boundary value that applied at one viewport width and validated boxes at two *other* widths against it. Every box it reported as fixed was still ~112px outside the boundary. The `account.changed.differences` record made this provable without going back to the site — I could read the written values and compare them to the real boundary at each width.

So the run simultaneously reported (a) that it had run out of room, (b) that its result was not accepted, and (c) that my acceptance check had passed.

## What I expected

That check verdicts from a run that did not complete would be either withheld or explicitly marked as unreliable. `outcome: "exhausted"` and `accepted: false` are both signals that the worker did not finish; a `passed` verdict presented in the same shape and the same field as a verdict from a completed run contradicts them.

## Why this matters more than an ordinary wrong answer

The documented economics of delegation are that a run where everything passed should cost the caller a short summary and nothing else — re-inspecting the work moves the tokens to the more expensive side rather than saving them. That guidance is correct, and it is exactly what makes this defect expensive: a green verdict is *designed* to be trusted, so a false one converts the mechanism's main benefit into its main risk. A caller following the documented pattern would have shipped the unfixed page believing it fixed.

`account` is what saved it, precisely because it is derived host-side and does not pass through the worker. That property is load-bearing and worth protecting.

## Suggested shape of a fix

The gap being reported is "an unfinished run's self-certification is indistinguishable from a finished run's". Ways it could close, in rough order of how much I'd want them:

1. When `outcome` is not a normal completion, do not populate `verdict` with `passed` — use something like `unverified` / `not-established`, or return the check with no verdict. "Unanswered" is already a state the caller is told to treat differently from "passed", so this is consistent with the existing contract.
2. Where a check is settleable against `account` — anything that is a value comparison or an existence claim — settle it host-side rather than taking the worker's word. A verdict derived from the same source as `account` inherits its trustworthiness.
3. Optionally, surface a flag on each verdict recording *how* it was established (measured / observed / asserted), so a caller can weigh an impression differently from an arithmetic check.

## Related observation, possibly a separate ticket

A check phrased as an impression ("confirm X sits inside Y and does not overlap Z") is something a worker can sincerely believe it verified, and cannot be caught being wrong about. A check phrased as a comparison with both operands named is not. The `accept` parameter's guidance already pushes this way — "not 'the page looks right'" — but nothing enforces or nudges it at the point of the call. Rejecting or warning on checks that name no comparison would have prevented this instance at the source. Happy to file separately if that is better tracked on its own.

## Shortest reproduction

Delegate a task with an `accept` entry phrased as a visual confirmation, and constrain the run so it exhausts its tool-call limit before finishing. Observe that `checks[].verdict` can come back `passed` alongside `outcome: "exhausted"` and `accepted: false`.