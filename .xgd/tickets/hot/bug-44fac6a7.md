---
uid: bug-44fac6a7
id: BUG-163
type: bug
title: 'Three red assertions after the delegation chain: one grant drift, one stale
  figure, and a nudge to a worker that ran out of room'
created_by: EPIC-20
created_at: '2026-09-29T02:57:36.958429+00:00'
updated_at: '2026-09-29T04:29:24.580520+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ec75eab0
  commits:
  - working_sha: 29fd98f7d669070e984892f7ee7c14252931bd43
    reconcile_sha: null
    main_sha: null
  version: 0.2.403
  story_points: 2
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


## What changes in this repo

All three are **amendments to existing UATs**, and there is no fourth case named
for this ticket. Each of the three assertions is the one its own case already
makes; what this ticket changes is the derivation behind it (§1), the figure it
compares against (§2), and what the case says the product does and what that
costs (§3). A new case would re-drive the same route with the same script to
assert the same thing, which is the duplicate coverage the test strategy
forbids. The evidence for this ticket is therefore the diff on those three
cases, and the behaviour each pins is stated above.

### §1 — a third source for the derived grant

`test_UAT_AC1058_…` gains the delegation declaration as a third source beside
L1 and fidelity. The tool names come from the instance configuration the host
itself installs — `delegationInstanceConfig` resolved against upstream's
`DELEGATION_DECLARATION`, group to operations to tool names — so neither the
group `DelegateWork` nor the tool `Delegate` is written out here, and a session
in a deployment with the switch off derives an empty third source and the
equality still holds. The declaration is reached the way every other upstream
declaration is reached in this suite: a dynamic import of the shared store
through `sharedModuleUrl`.

### §2 — two cheap requests, and the nudge named as the reason

`test_UAT_FC_REQ-295_a_worker_that_never_reported_still_bills_the_caller_and_passes_nothing`
asserts the doubled figure as *per-request output × requests sent* rather than
as a new literal, and asserts the two things that make the doubling a designed
second ask rather than a loop: the worker was asked exactly **twice**, and the
second ask is upstream's own nudge text (`delegationNudge`, read from the
library rather than quoted). A third request would fail the count, which is how
"the nudge asks once" is held.

### §3 — the nudge to a worker that ran out of room, and what it costs

`test_UAT_FC_REQ-296_a_worker_is_guarded_against_its_own_smaller_window_and_not_the_callers`
goes on asserting that the guard stopped the worker's own turn after one
request. It now also says what follows: the worker is asked a second time, that
ask is the nudge, and the nudge's turn carries the same over-ceiling history —
so its first request is billed in full and is then cut off by the same guard
before a second one is built.

To make "cut off again" observable rather than asserted, the worker's second
scripted step **ends in a tool call** instead of plain text: the guard fires on
tool activity, so a step that only speaks would complete and the case could not
tell a nudge that was answered from one that could not be. With the tool call
the count stops at two — a third request would mean the nudge turn had carried
on — and the cost is read off the caller's meter: the worker's attributed input
tokens are the sum of both requests, so the wasted one is visible as a figure
rather than only in prose.