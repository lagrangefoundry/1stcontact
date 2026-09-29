---
uid: bug-44fac6a7
id: BUG-163
type: bug
title: 'Three red assertions after the delegation chain: one grant drift, one stale
  figure, and a nudge to a worker that ran out of room'
created_by: EPIC-20
created_at: '2026-09-29T02:57:36.958429+00:00'
updated_at: '2026-09-29T02:57:36.958429+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ec75eab0
---

## What is red

The DOC-60 chain landed across seven tickets (BUG-71 upstream, REQ-339/340/341/342/343
here) and three assertions in this repo now fail. None of them is a runtime defect in
the shipped behaviour, and one of them is not stale either — it is a real gap the stale
number was hiding. They are grouped because they were found together in one review and
they are all one sitting's work; they do not share a cause.

Run to see them:

```
npx vitest run tests/test_UAT_FC_REQ-295_delegation.workers.test.ts \
               tests/test_UAT_FC_REQ-296_context_budget.workers.test.ts
npx vitest run tests/reconciliation-assistant-conversation.test.ts -t AC1058
```

## 1 · The consultant's offered tools gained `Delegate`, and the assertion that derives them did not

`tests/reconciliation-assistant-conversation.test.ts:490`, in
`test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site`.

The assertion compares the offered tool names against a set it *derives* rather than
writes out — `createL1Toolbox`'s schemas, union the fidelity declaration's operations —
and that derivation is the property the case exists to hold: a written-out list would
pass while the grant drifted underneath it.

REQ-343's own commit created the drift. It added
`const WRITING = { ...delegationDocument, primary_writes: true }` and installed it in
`beforeEach` so the existing cases keep the write tools their evidence depends on. But
the document it spreads has delegation **enabled**, so the consultant is also offered
`Delegate` — correctly, that is the shipped grant — and the equality never accounted
for it.

**The behaviour that must hold:** the expected set goes on being derived from the
declarations that compose the toolbox, and it now has three sources rather than two —
L1, fidelity, and delegation. A delegation-enabled session offers its delegation tool,
and the case says so by deriving it from the same declaration the product composes
from, not by naming `Delegate` in a literal.

## 2 · A silent worker bills two cheap requests, not one

`tests/test_UAT_FC_REQ-295_delegation.workers.test.ts:615` asserts the attributed
output tokens are `250`; they are `500`.

BUG-71 gave the worker an **ask-once nudge**: a worker that has reported nothing is
prompted one more time before the delegation is called silent, because a worker one
turn from a report it has usually already composed is the expensive thing to throw
away. So the silent case legitimately runs the cheap backend twice, and both requests
are billed to the caller — which is the case's own headline (*AND THE TOKENS ARE STILL
ON THE BILL*) working exactly as intended, at twice the figure.

**The behaviour that must hold:** a delegation whose worker never reports still puts
every token it spent on the caller's bill, including the nudge's — and the case names
the nudge as the reason there are two, so the doubled figure reads as a designed second
ask rather than as an unexplained duplicate or a loop. The count stops at two: the
nudge asks once.

## 3 · A worker cut off for room is nudged anyway, and pays a full request to be cut off again

`tests/test_UAT_FC_REQ-296_context_budget.workers.test.ts:608` (condition 7) asserts
the worker made exactly one request; it makes two.

This one is **not** simply a stale number, and the first reading of it — that the
worker's context guard had regressed — was wrong. The guard is intact: the worker's
first turn *was* stopped against the worker's own smaller ceiling, which is the whole
subject of the case, and `describe_page` was never followed by a second request of that
turn.

What sends the second request is the nudge from §2, firing where it should not. In the
framework's `delegation_toolbox.js`, the nudge is skipped only when `ran.stopped`, and
that flag means one specific thing: *the caller cancelled* — it is set by the stop-watch
polling the caller's junction, not by anything the worker's own turn did. The only fact
read off the worker's terminal event is `meta.exhausted`, the iteration cap. A turn this
repo ended itself — `meta.status: 'aborted'`, `stop_reason: 'context_budget'`, from
`tools/generate/src/cli/ai/budget-core.ts` — is invisible to that decision. So
`slot.report === null`, the nudge goes out, and it opens a second worker turn whose very
first request carries the same over-ceiling history: billed in full, and stopped again
at once. The nudge cannot be answered, and we pay a large request to ask it.

**The behaviour that must hold here:** the case says what the product does today, and
says why — the worker was stopped after one request *of its own work*, and the second
request is the nudge, not a failure of the guard. It also records the cost, so the
waste is visible in a test rather than only in an argument: nudging a worker that ran
out of room spends a request that can only be cut off.

**The half that is not in this repo:** the fix is that the nudge should not fire for a
turn that was aborted, and that decision lives in the framework's delegation toolbox.
The terminal event already carries the reason, so the shape is the one BUG-71 already
established for `exhausted` — read the outcome off the event and let it gate the ask.
That needs an upstream ticket in `lagrange-framework`; this ticket does not attempt it,
and this repo's assertion is the one that flips back to one request when it lands.

## Why these are not folded into the tickets that caused them

§1 is REQ-343's drift and §2 is REQ-340's consumption of BUG-71, but both of those are
at `ready_to_reconcile` with commits already recorded. Adding to a ticket in that state
is the thing the process asks to check before doing, and §3 belongs to neither. One
ticket for the three, with the upstream gap named rather than silently pinned.

## Out of scope

- The whole-suite failure count (36 at the time of the review) is mostly contention,
  not this epic: `reconciliation-palette-management` passes in isolation and the
  filing-service clusters need `listen()`. Only the three above were traced to these
  changes.
- The KB skew that blocked the build (`REF-l1` outdated projection, from REQ-335) is
  already fixed — `bin/kb-release` rebuilt it and
  `test_UAT_FC_BUG-71_framework_import_graph` passes.