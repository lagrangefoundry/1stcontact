---
uid: bug-12bb645f
id: BUG-165
type: bug
title: Delegate returns check verdicts as "passed" on a run that came back exhausted
  and unaccepted, with no marker that they are unreliable
created_by: xgd
created_at: '2026-09-29T04:04:02.588828+00:00'
updated_at: '2026-09-29T04:23:04.458661+00:00'
completed_at: null
last_field_updated: body
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


---

## What is being implemented

Scope taken: suggestion 1 in full, at the host seam. Suggestions 2 and 3 are not
taken — see "What is not implemented" below for why.

### 1. A verdict from a run that did not complete is not returned as `passed`

The host already holds the delegation result before the caller sees it — the
same seam `account` is attached at, and for the same reason: it is the one point
in the result's construction that is the host's and not the worker's. Every
check the worker reported as `passed` on any `outcome` other than `reported` is
returned instead as `unverified`, carrying a reason that names the outcome and
points at `account`.

- `failed` verdicts are left exactly as they are, reason included. A failed
  check on a truncated run is still information about the work, and it is not a
  false green.
- `unreported` verdicts are left as they are. The worker said nothing about the
  check; that is already the cautious state.
- A `reported` run is untouched, verdicts and `accepted` alike. Downgrading a
  completed run would remove the economics the mechanism exists for.
- `accepted` needs no change: it was already false on every outcome but
  `reported`. The defect was never `accepted` — it was that `checks` said the
  opposite of it, in the same result, in the shape a completed run uses.

`unverified` is a FOURTH verdict value rather than a reuse of `unreported`,
because the two are different facts and a caller acts on them differently.
`unreported` means there is no answer at all, and the inspection has to be made
from scratch. `unverified` means there IS an answer, it is the worker's word,
and the run it was made on did not finish — so the caller holds a claim it can
settle against `account` for the cost of reading two numbers. Collapsing them
would throw the claim away, which is the same mistake in the other direction.

### 2. The document the consultant reads says so

The framework's own declaration states the contradicting shape as intended: "an
exhausted result with every check passed and 'accepted' false is not a
contradiction". On this host it no longer occurs, so the host composes the
delegation surface with an AMENDED declaration — through the framework's own
supported `decl` seam — in which `shapes.result.checks` names the fourth verdict
and `shapes.result.outcome` states the host's rule. A behaviour the manual
contradicts is a behaviour the model reads as a fault in its own result.

The amendment goes to the CALLER's instance only. A worker is granted
`ReportDelegatedWork` alone, whose operation returns `receipt`, and a manual
renders the shape an operation returns — so the `result` shape never reaches a
worker's manual, and amending its declaration would be an edit nobody reads.

The amendment replaces two named keys and refuses at composition time, naming
the key, if either is absent — the rule `delegation.json`'s own validator
already follows. An upstream restructure that silently dropped the host's prose
would leave the model reading a document describing a verdict vocabulary the
host no longer returns.

### 3. Where it lives

A module beside `account-core.ts`, applied by the same subclass. Both are one
concern — which parts of a delegation result are the host's knowledge and which
are the worker's word — and both are deleted together if upstream ever takes
them.

## What is not implemented, and why

- **Suggestion 2 (settle checks host-side against `account`).** A check is
  prose. Deciding whether "the cards no longer overhang the band" is settled by
  a list of field differences is a judgement rather than a comparison, and the
  only thing on this host that could make it is another model turn — which
  spends the tokens delegation exists to save, on the one path that would run
  after every delegation. Left open.
- **Suggestion 3 (a provenance flag per verdict).** Without suggestion 2 every
  verdict is `asserted`, so the flag would carry one value and no information.
  The `unverified` verdict and its reason already say the one thing the flag
  would have been read for.
- **The related observation (checks phrased as impressions).** Not taken here:
  it is a rule about the caller's `accept` entries rather than about how a
  result is reported, any enforcement is a heuristic over prose, and refusing a
  legitimately-phrased check at the point of the call has its own cost. Worth
  its own ticket.

## Test plan

Real route, real session manager, real delegation surface out of the shared
store, real tool loop on both sides of the hand-off — the one double is the
model client (`.workers` suite):

- a worker that reports a check as passed and is then cut off at its tool-call
  limit: the caller receives that check as `unverified`, with a reason naming
  the outcome, and no `passed` verdict anywhere in the result;
- a worker that reports a failed check on the same truncated run: the verdict
  and its reason survive unchanged, so the demotion is aimed at the green and
  not at the result;
- a worker that completes normally: verdicts stay `passed` and `accepted` stays
  true, so the economics are intact.

And the document (node suite):

- the declaration the caller's surface is composed with names `unverified` and
  states the rule, and the framework's own declaration is left unmutated;
- a base declaration missing either amended key is refused by name.
