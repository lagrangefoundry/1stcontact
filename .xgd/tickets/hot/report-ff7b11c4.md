---
uid: report-ff7b11c4
id: REPORT-2408
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (ac) — attempt
  9'
created_by: xgd
created_at: '2026-08-20T08:20:02.517904+00:00'
updated_at: '2026-08-20T08:20:02.517904+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (ac)

**Attempt**: 9
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

This was the one-edit cycle the assessor described. Violation 1 — STORY-83's
In-scope clause on **per-instance class prefix namespacing**, claimed by no AC —
is closed by widening AC-723 (as directed: *not* by authoring a new AC), plus the
matching verification step and an executable UAT so the widened criterion is not
an immediate coverage gap.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-723 (`acceptance_criterion-8db8ef76`) | Added a **Per-instance class namespaces** paragraph to the Criterion and a third Verification step. Everything else preserved verbatim |
| 2 | uat-add | `tests/req93-l1-slot-mounted-behaviors.test.ts` | Authored `test_UAT_AC723_two_instances_of_one_behavior_keep_disjoint_class_namespaces`; passes |

## Detail

### 1. AC-723 — the added clause

Written about the **property**, not the call sites, per the assessor's REQ-148
note: mounted-fragment classes are drawn from a per-instance prefix, so two
instances of the same behavior in two seams of one page emit **disjoint** class
sets, each instance's rules select only its own nodes, and the same holds between
a fragment and its host document. The clause names no Astro file, so it survives
REQ-148 deleting Astro from the module render path — only *who supplies* the
per-instance value moves, and the AC says "whoever renders a fragment supplies a
value unique to that instance".

Placed between the **Bound** paragraph and the `data-l1-behavior` rename note,
i.e. inside the seam-emission material AC-723 already owns.

Verification step added: render two instances of one behavior under their own
prefixes, mount both into one document, assert disjoint class sets, per-instance
selector scoping, and no collision with host classes — plus a contrast render
under one shared prefix showing the names then coincide, which is the collision
the namespace exists to prevent.

### 2. The UAT

Real entry points only — `renderL1Fragment` and `renderL1Document` from
`packages/framework/src`, no mocks. Assertions:

- both instances emit a non-empty, equal-sized class set, and the intersection is
  empty (disjointness is not vacuous);
- `selected(css) === classesIn(html)` per instance — every class a fragment's
  selectors name is one it emitted, and none of the other's;
- host-document classes (from the two-seam page that mounts both fragments) are
  absent from both fragment class sets;
- the contrast case: the same subtree rendered twice under one shared prefix
  yields identical class names.

One design note worth recording: the host/fragment comparison must be on **whole
class tokens**, not substrings. The document emits `l1-0`, which is a literal
substring of the fragment's `form-0-form-l1-0` but selects nothing inside it — a
`toContain` check fails spuriously there (it did, on the first run). The test
compares parsed token sets and a `\.([A-Za-z0-9_-]*l1-\d+)` selector regex, both
of which match greedily and so read the full class name.

## Verification run

`npx vitest run tests/req93-l1-slot-mounted-behaviors.test.ts` → **10 passed, 1
failed**.

- The new test passes.
- The single failure is the **pre-existing, environment-caused** one that
  `report-efb09896` finding 3 documented and executed itself:
  `test_UAT_AC1344_mounted_behavior_carries_its_conformance_obligations` throws
  `EPERM` from `server.listen` (`tools/generate/src/cli/serve.ts:54` via
  `conformance/harness.ts:196`) because this regression worktree denies socket
  binding. Not an assertion failure, not introduced here, and unchanged by this
  call — the identical failure was recorded before my edits.

No test I did not touch changed state.

## Code Edits (if any)

None. Test-only and matrix-only; no production code was modified.

## needs_review Items Forwarded

None from this cycle's findings. Two informational items carried forward from
`report-efb09896` remain operator-side, both outside a matrix editor's reach:

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-1344 `uat_coverage` | Its `pass` rests on a test this environment cannot execute (EPERM on socket bind); criterion independently verified against harness source | Re-run `test_UAT_AC1344_*` in an environment permitting `server.listen` — a uat-level question, not settleable at ac |
| AC-718 (ticket index) | `xgd ticket list` surfaces AC-718 as `pending` while `xgd ticket get` returns `deprecated` | Stale read-path index; tooling fix |
