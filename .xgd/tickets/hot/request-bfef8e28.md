---
uid: request-bfef8e28
id: REQ-411
type: request
title: 'Builder parallelism: host Tool closures carry their operation''s concurrency
  (follow-up to REQ-410, after lagrange-framework REQ-208)'
created_by: EPIC-19
created_at: '2026-10-18T22:09:52.340245+00:00'
updated_at: '2026-10-18T22:09:52.340245+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-50f38524
---

## Why

REQ-410 found the reason builders never overlap: the host hands the consultant every tool, `Delegate` included, as a `lib.Tool` closure (`toolSet` in `tools/generate/src/cli/ai/host-core.ts`, ~L1517) so each call runs inside its draft-file lease context (`around`). The framework only ran calls together when a *declared operation* said so, and a closure never did, so `max_concurrent: 3` had no effect. lagrange-framework **REQ-208** (landed 2026-10-18, `dba2ad9df2`) lets a registered `Tool` declare itself concurrent: `new Tool(name, description, schema, handler, { concurrent: true })`. The installed shared store already carries it.

## What changes

1. **Each closure carries the concurrency of the operation it wraps.** `toolSet` passes `{ concurrent: box.concurrent(name) }` when it builds each `lib.Tool`, so the flag comes from the declaration (`Delegate` is `concurrent: true` in `delegation_surface.json`) and nothing names `Delegate` specially. Every other tool stays non-concurrent, as its declaration says.
2. **The lease context is per call.** Confirm that `around` gives each concurrent call its own writer context, so two builders running at once each write as themselves and their leases don't mix. If it doesn't, make it so.
3. **The consultant is told the truth.** The parallel slot (`delegation-parallel`, cap from `max_concurrent`) is offered only where closures can actually run concurrently: `concurrentSupported(lib)` must also check that the installed `lib.Tool` accepts the option (e.g. `new lib.Tool('x', '', {}, () => null, { concurrent: true }).concurrent === true`). Before REQ-208 that check would have been false, and the priming would say builders run one at a time — which is what should have happened instead of promising parallelism the host could not deliver.
4. **Commit REQ-410's parallel-builder UAT**, written by REQ-410's session but left uncommitted because it could not pass.

## Why free-coded
A one-line flag pass-through, a capability check, and a test that already exists: REQ-410's follow-up, split out only because REQ-410 had reached `ready_to_reconcile` while lagrange-framework REQ-208 was unbuilt.

## Test plan
UATs (`test_UAT_FC_<ID>_*`), through the real Worker host with only the model scripted:
- Two `Delegate` calls in one consultant reply, scoped to different sections of one page, run concurrently: both builders open before either finishes.
- Each of them writes only its own section; a write by one to the other's section is refused by the lease.
- Two `Delegate` calls on the same file: the second is refused at claim, as now.
- A non-concurrent tool in the same reply still runs alone.
- The consultant's priming carries the parallel paragraph with the configured cap when the installed `Tool` supports `concurrent`, and the serial paragraph when it does not.

Regression: REQ-410, REQ-397 (both suites), REQ-389.