---
uid: request-bfef8e28
id: REQ-411
type: request
title: 'Builder parallelism: host Tool closures carry their operation''s concurrency
  (follow-up to REQ-410, after lagrange-framework REQ-208)'
created_by: EPIC-19
created_at: '2026-10-18T22:09:52.340245+00:00'
updated_at: '2026-10-18T23:21:04.188027+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-50f38524
  commits:
  - working_sha: 2e65cd5767af338269380e57419d4d2199333e84
    reconcile_sha: null
    main_sha: null
  - working_sha: 12be8cfcd802cfde757114838084e47837c16a75
    reconcile_sha: null
    main_sha: null
  version: 0.2.538
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

## What landed

1. **Closures carry their operation's concurrency.** `toolSet` (`host-core.ts`) registers every `lib.Tool` with `{ concurrent: box.concurrent(name) }`. `Delegate` is declared `concurrent: true`, so up to `max_concurrent` builders commissioned in one consultant reply run together. Every other tool is declared non-concurrent: it waits for all calls in flight, runs alone, and is reported before the next call starts. No code names `Delegate`; the same pass-through applies to builder, settings and coordinator tool sets.
2. **Leases are per call. No change was needed.** `around` calls `asWriter`, which is `AsyncLocalStorage.run` per call, so each concurrent call gets its own writer context. Each builder's tool calls run as that builder (`claims.worker(sid)`, nested inside the consultant's context; the innermost writer wins). A builder's write to a section another builder holds is refused by the lease.
3. **The consultant is told the truth.** `concurrentSupported(lib)` (`lease-core.ts`) now requires both that `Delegate` is declared concurrent and that the installed `lib.Tool` accepts the option (`new lib.Tool('probe', '', {}, () => null, { concurrent: true }).concurrent === true`). If either is missing, `parallel` is 1 and the consultant gets the serial paragraph.
4. **REQ-410's parallel-builder UAT.** The uncommitted file was not found in any checkout, so the parallel cases were rewritten here. They are in `tests/test_UAT_FC_REQ-411_concurrent_builder_closures.workers.test.ts`.

## UATs (as landed)

`tests/test_UAT_FC_REQ-411_concurrent_builder_closures.workers.test.ts`. These run through the real Worker routes, real session manager, delegation surface, `claim` hook and real D1 leases. Only the model client is scripted, and its builder side waits at a timed barrier.
- `..._two_delegations_on_different_sections_run_concurrently_and_each_writes_only_its_own`: both builders open before either finishes. The hero builder's write to `story` is refused, and each section ends with its own builder's text.
- `..._two_delegations_on_the_same_file_the_second_is_refused_at_claim`: one builder opens. The other gets `scope_held` with "so this builder was not started and nothing was spent".
- `..._a_non_concurrent_tool_in_the_same_reply_still_runs_alone`: given `Delegate, list_pages, Delegate`, the second builder opens only after the first has finished.
- `..._the_consultant_is_told_the_configured_cap_where_closures_can_overlap`: with `max_concurrent: 2`, the system prompt says "Up to 2 builders run at once." and not "Builders run one at a time."
- `..._a_framework_whose_Tool_cannot_be_concurrent_is_not_offered_parallel_builders`: `concurrentSupported` is true for the installed framework. It is false for one whose `Tool` ignores the option even though `Delegate` is declared concurrent. That false value is what makes the host pass `parallel: 1`, so the consultant gets the serial paragraph.

Without the flag pass-through, the overlap and same-file UATs fail. Regression: REQ-410, REQ-397 (both suites) and REQ-389 all pass (40/40).