---
uid: bug-bd3a4488
id: BUG-167
type: bug
title: 'Delegation: a silent run that wrote nothing is indistinguishable from one
  that wrote a great deal'
created_by: xgd
created_at: '2026-09-29T04:55:11.413291+00:00'
updated_at: '2026-09-30T21:17:10.139965+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-56a0d44f
---

## What happened

A single-job delegation returned:

- `outcome: "silent"`
- `summary: ""`
- `changed: []`
- `decisions: []`
- one acceptance check, `verdict: "unreported"`
- `usage`: 45,872 output tokens, 159,724 cache-creation, 1,189,725 cache-read

and `account.changed.differences: []` — the host-derived record confirming **nothing at all was written to the site**.

So the worker ran, consumed a substantial budget, produced tens of thousands of output tokens, and left no trace: no edit, no error, no partial work, no explanation.

## Why this is its own defect and not covered by BUG-165

BUG-165 is about a *false* verdict on an unfinished run. This is about *no* verdict and no account, and the specific harm is different: **`outcome: "silent"` conflates two opposite situations.**

Earlier in the same session, another run returned `outcome: "silent"` with an empty summary and had in fact completed roughly half a four-part brief — a substantial styling pass plus an element removal. Same outcome value, same empty summary, and the site had materially changed.

So `silent` means "the worker said nothing", which spans:

- did nothing, and said nothing about why
- did everything, and said nothing about it
- did some of it and stopped, and said nothing about which part

The caller cannot tell these apart from the result. The host-derived change record *can* — and did, in both cases — which is the argument for treating that record as primary. But the result object itself gives no signal, and a caller who trusts `summary` over `account` will draw the wrong conclusion in at least two of the three cases.

## What I expected

That a run which wrote nothing would be distinguishable, in the result, from a run which wrote a great deal. Minimally:

1. **Distinguish "silent and inert" from "silent and productive".** The host already computes `account`; whether `differences` is empty is known at the moment the result is assembled. Surface it as an outcome or a flag — `silent-no-writes` versus `silent-with-writes` — rather than leaving the caller to infer it.
2. **A run that spends a nontrivial budget and writes nothing should say something about why.** Output tokens were produced; something was reasoned about. Whether it hit an internal refusal, looped, or reasoned itself into inaction, none of it reached the caller.
3. **Report the last operation attempted**, if anything was attempted. "Read the page map, then stopped" and "attempted a write that was refused" are very different findings and either would have been actionable.

## Cost shape, which is the part that matters commercially

The premise of delegation is that mechanical work moves to a cheaper session. That holds when the run produces something. This run produced nothing *and* cost real money *and* cost the caller a full round trip to discover it — a round trip that itself has to be paid for out of the expensive session's budget, because establishing "nothing happened" required a call.

A null run is therefore more expensive than it looks: the loss is not the worker's tokens, it is the worker's tokens plus the caller's turn plus the re-brief. Anything that makes null runs rarer, or at least self-announcing, pays for itself quickly.

## Observed correlation, offered as a lead rather than a conclusion

Across seven runs in one session against one site, with the same role:

| Run | Operations in brief | Acceptance checks | Outcome |
|---|---|---|---|
| 1 | 3 defects, one method choice left open | 1, phrased as a visual impression | `exhausted`, false `passed` |
| 2 | 1, exact values supplied | 1, existence | clean |
| 3 | 4 | 1 | `silent`, partial writes |
| 4 | 2 | 1 | `failed` — own context exceeded (205,617 > 200,000) |
| 5 | 1 large (8 elements) | 1 check with 5 sub-clauses | `reported`, verdict `unreported` |
| 6 | 1 narrow | 1, existence | clean, `passed` |
| 7 | 1 job but two phases (add an element, then recolour 6) | 1 check with 5 sub-clauses | `silent`, **zero writes** |

Two things stand out:

- **Both clean runs had exactly one narrow operation and one single-clause check.** Nothing else did.
- **Both runs given a compound check — one check containing five sub-clauses — returned `unreported`**, including one that had otherwise done its work correctly.

The second is the more actionable, because it suggests **an acceptance check is not free to the worker**. Verifying five properties across eight elements is itself a read-heavy task drawn from the same budget as the edit, and a caller adding checks in good faith — as the delegation guidance encourages — may be starving the work to pay for its verification. If that is what is happening, it is worth surfacing: either check evaluation should be budgeted separately from the work, or callers should be told that checks are charged against the same allowance so they can size them accordingly.

## Reproduction

Delegate a brief containing two dependent phases (create an element, then modify elements whose addresses depend on that creation), with a single acceptance check carrying five sub-clauses. Observe `outcome: "silent"`, empty summary, and `account.changed.differences` empty.


## Fix (free-coded)

**Where it lands.** The `outcome` vocabulary (`reported`/`silent`/`exhausted`/`stopped`/`failed`) belongs to the upstream shared AI library and is pinned across its language peers, so this fix does not add outcome values. It adds two host-side fields in this repo's delegation subclass (`accountingDelegationToolbox`, `tools/generate/src/cli/ai/account-core.ts`) — the same seam that already attaches `account` — and declares both in the result shape the calling model reads, so the caller's manual describes them.

1. **`wrote`** — a boolean on every result that carries `account`: `true` when the host's record shows the draft changed during the delegation (any difference, including a truncated list), `false` when nothing was written. A `silent` run that wrote nothing and a `silent` run that wrote a great deal now differ on a top-level field, without the caller having to inspect `account.changed.differences`. (Expectation 1.)
2. **`activity`** — present whenever `outcome` is not `reported`, i.e. whenever the worker's own answer is not a finished report. Read by the host from the worker's own session log after the run, never from the worker's word:
   - `operations` — how many tool calls the worker made. `0` means it reasoned and then did nothing at all.
   - `last_operation` — the last tool call it made: `name`, its `input` and its `result`, each clipped to a short bound. A write that was refused therefore shows the refusal text; "read the page map then stopped" shows a read. Absent when `operations` is 0. (Expectation 3.)
   - `last_words` — the worker's final prose, clipped, when it said anything. Whatever it concluded before going quiet reaches the caller. (Expectation 2.)
   Clipped values say they were clipped. Reading the log never fails the delegation: if the log cannot be read, `activity` is omitted and the rest of the result stands.

**Not addressed here:** the observation that acceptance checks draw on the same worker budget as the work. That is guidance about how the upstream delegation surface is priced and described, not something this host-side record can fix.

## Test plan

`tests/test_UAT_FC_BUG-167_silent_runs_say_what_happened.workers.test.ts`, driving the real `POST /api/ai/prompt` route in workerd with only the model client doubled (the REQ-340 harness):
- a silent worker that only reads → `outcome: silent`, `wrote: false`, `activity.operations` ≥ 1, `activity.last_operation.name` is the read, `last_words` carries its last prose;
- a silent worker that writes → `wrote: true` beside the same `silent` outcome;
- a worker that makes no tool call at all → `activity.operations: 0`, no `last_operation`;
- a worker that reports → `wrote` present, no `activity`.
Regression scope: the REQ-340 and REQ-295 delegation suites.
