---
uid: request-249ea616
id: REQ-354
type: request
title: 'Delegation: settle containment checks from the host''s own record instead
  of the worker''s budget'
created_by: EPIC-20
created_at: '2026-09-30T20:01:58.591686+00:00'
updated_at: '2026-10-01T19:11:38.567938+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1c8616f5
---

## What changes

Checks the host can answer from its own record of what a delegation changed are answered by the host, and never sent to the worker. Today every check is sent to the worker and paid for out of the worker's own tool budget, and some never get answered.

## Why

First live delegation session (Gigabyte Alchemy, 2026-09-29; recorded on EPIC-20): both runs given one five-clause check came back with that check `unreported`, including a run that had done its work correctly. The worker ran out of budget before it verified. Both runs with one-clause checks finished cleanly.

The framework now supports settling checks on the host side (lagrange-framework REQ-188: `claims` / `settle` on the `account` hook). REQ-340 already derives exactly the record needed, a field-level diff of the draft across the delegation. This ticket connects the two.

## Blocked on

lagrange-framework **BUG-78** (`bug-061f71b9`), "Delegation account hooks are called synchronously". Our store is async; until the framework awaits the hooks, `settle` cannot be supplied (see that ticket and `account-core.ts`'s header).

## Behaviour

1. **The host's account is supplied through the framework's hook, not a subclass.** `accountingDelegationToolbox` is deleted. `mark` captures the draft; `changes` returns the same `{from, to, changed}` the subclass returns today. Result shape unchanged for the caller.
2. **The host claims only checks in a small fixed set of phrasings, and never guesses.** At minimum:
   - *page `P` has no changes* — containment of a page;
   - *no element changed any field other than `F1`, `F2`…* — containment of fields;
   - *only the elements at `A1`, `A2`… changed* — containment of addresses.
   A check that does not match one of these exactly is not claimed and goes to the worker unchanged. A wrong claim is worse than no claim.
3. **A claimed check is settled from the diff between the framework's two marks**, `passed` or `failed` with a reason naming what the diff showed (e.g. which page or field broke containment). If either mark failed, the check is reported unsettled, not passed.
4. **Host-settled and worker-reported verdicts are distinguishable** on the result, using the provenance REQ-188 stamps. The consultant must be able to tell a host verdict from a worker's claim.
5. **The consultant is told the phrasings.** The delegation method prose (`templates/delegation-method`) names them as the way to ask for a containment check the host will settle at no cost. Coordinate with REQ-348, which owns the wider briefing guidance.

## Test plan

UATs (`test_UAT_FC_<ID>_*`): each phrasing is claimed and settled pass/fail against a real draft diff; a near-miss phrasing is not claimed and reaches the worker; a claimed check with a failed mark is unsettled; the result carries the host provenance on settled verdicts; the account field is identical to today's with the subclass removed.