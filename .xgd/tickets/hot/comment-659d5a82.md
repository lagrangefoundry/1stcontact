---
uid: comment-659d5a82
id: COMMENT-622
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-03T02:58:08.048227+00:00'
updated_at: '2026-08-03T02:58:08.048227+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-936d1662
  kind: note
---

All three new UATs pass.

## Coverage decision

The story carries **14 ACs**. Eleven already have UATs in existing files, which I am not permitted to modify:

- `tests/reconciliation-3probe-gate.test.ts` — AC-705, 706, 707, 708, 709, 710, 724
- `tests/reconciliation-3probe-gate-evaluator.test.ts` — AC-734, 735, 736, 737

The three with no UAT — **AC-779, AC-780, AC-781** — are what the new file covers, one test per AC, at the module/CLI boundary (`evalScalarTrack` / `expectedTextManifest` / `oracleBoxes` / `sampleFidelityProbe` / `cmdL1Gate` / `1c l1-gate` via `run(argv)`), with real components and only a temp-dir capture bundle as synthetic input.

Fixture note: the AC-781 form fixture initially pinned 400px-wide fields at every ladder width, so the seam the fold pins around them clipped the 320/375 viewports and failed content-robustness. Made the fields track the viewport (`min(400, w-40)`) — a realistic responsive form — and the gate passes.

## Pre-existing failures (not from this work)

Two tests in the **existing** gate files fail on a clean tree, before my file was added (verified by running those two files alone):

- `test_UAT_AC705_...` — asserts `['box','image','image','text']`; REQ-93 now folds the fixture's form control into a `slot` leaf, so the actual list includes `slot`. The AC's substance still holds (the control is excluded from the *measure* — `unmatched` is empty); the assertion is over-tight against REQ-93.
- `test_UAT_AC737_...` — asserts fold residual kinds `['field','image','text']`; the `field` element is now mounted as a form rather than left as a folder-power gap, so only `['image','text']` remain.

Both look like existing-test drift against REQ-93 rather than code regressions, but they live in files I may not modify — flagging for the downstream fix-it loop.

```
UATs generated for story story-24098299 (plan item 6 of 9)

Story: story-24098299
Test file(s) created:
  - tests/reconciliation-3probe-gate-ladder-and-mounted.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

test_files_created:
  - "tests/reconciliation-3probe-gate-ladder-and-mounted.test.ts"
```
