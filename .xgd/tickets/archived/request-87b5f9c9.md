---
uid: request-87b5f9c9
id: REQ-630
type: request
title: 'components/ai: a host hook that shapes a detached pass''s result before it
  is recorded'
created_by: REQ-627
created_at: '2026-11-01T22:36:05.678590+00:00'
updated_at: '2026-11-01T22:41:29.762201+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

## Why

Requested by 1st Contact, under its REQ-627 ("each builder pass is its own durable step"; operator decision via 1st Contact EPIC-19, 2026-11-01). This follows on from REQ-232 (non-blocking Delegate).

1st Contact adds fields of its own to every Delegate result. It does this in a `DelegationToolbox` subclass, after `super.delegate()` returns:
- `wrote`;
- `activity` (read off the worker's junction);
- `ended` (the budget or ceiling the worker hit);
- a host-written summary for a worker that reported nothing;
- the account's `changed`, trimmed to what the caller is shown.

In detached mode `super.delegate()` returns `started`. `runWorkerPass` then records the base result on the caller's junction (`event: 'result'`), and `deliverResults` renders that recorded result. There is no point at which a host can add its fields, so a detached caller sees less than a blocking one. The operator has ruled out overriding framework internals (`_result`) and dropping the fields.

## What

1. **A runtime hook on `DelegationRuntime` that shapes a detached pass's result,** e.g. `passResult(result, ctx)`. It may be async. It is called by `runWorkerPass` with the finished result, in the blocking shape, before the result record is written. What it returns is the result that is recorded, delivered and returned.
   - `ctx` carries at least the caller, the worker session id, the role, the backend, the handle, the hand-off's goal and scope, and the manager, so the host can read the worker's junction.
   - The hook runs for every outcome, `stopped` and `refused` included.
2. **A hook that throws, rejects or returns a non-object leaves the result unshaped,** and the pass is not lost over it.
3. **The shaped result must be JSON-serialisable;** if it is not, the unshaped one is recorded. Spend attribution (`attributed`) is unaffected.
4. **Blocking mode is unchanged.** The hook is detached-only, since a blocking host already shapes its result after `delegate()` returns. Or apply it in both modes, if that's simpler and documented. Say which in this ticket.
5. **JS and Python peers both,** with identical semantics and the test plan run against both (as REQ-232).

## Test plan

- A detached pass with a `passResult` hook records the shaped result. `deliverResults` delivers exactly the shaped result, and `runWorkerPass` returns it.
- A hook that throws or rejects records the unshaped result, and the pass still completes.
- A hook that returns a non-serialisable value records the unshaped result.
- The hook is called for `refused` and `stopped` passes too.
- Blocking behaviour is unchanged (or matches item 4's documented choice).

Moved: this is a lagrange-framework ticket created here by mistake. It now lives there as REQ-235 (request-260dcca8). Archived.