---
uid: comment-211701f8
id: COMMENT-2669
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T01:31:01.165555+00:00'
updated_at: '2026-09-11T01:31:01.165555+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-84199eb5
  kind: note
---

Assessment complete. **REPORT-3850** (`report-84199eb5`) — **FAIL**: 1 violation, 1 warning, 0 needs_review.

## What I found

CAP-92 holds one story (STORY-105) with 14 ACs. I executed the evidence rather than reading it: `tests/reconciliation-assistant-control-surface.test.ts` → **13 passed / 13**. Thirteen ACs have exactly one AC-named UAT each, all substantive — no internal mocking anywhere, every test drives the real `createL1Toolbox` / `editL1Set` against a per-test `mkdtemp` site and reads the draft's bytes back from disk.

**Violation — AC-1411 (`uat-add`).** The audit-durability criterion has no `test_UAT_AC1411_*` test anywhere, and half of what it claims is asserted nowhere in the tree:
- clauses 1–2 (survives the host; concurrent callers lose no entry) exist only under free-coded names at `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:225,255`
- clause 3 (an abandoned turn still records what it managed to do) — implemented at `apps/control-app/src/router.ts:700-709`, where a nine-line comment calls the `finally` placement "the whole of AC3", but never tested
- clause 4 (a failed audit write doesn't fail the turn) — a deliberately empty `catch` at `router.ts:704-708` that nothing forces

**Warning — AC-1073 (`uat-edit`).** The test omits the AC's explicit disjointness clause, and omits it invisibly: `Object.keys({...l1Operations(...), ...nodeOperations(...)})` collapses any overlap, so re-adding `publish` to the host half (where it lived until REQ-149) would leave every assertion green while the host copy silently shadowed the core one at `toolbox.ts:211`. No test in the repo asserts disjointness — I checked all five `nodeOperations` call sites. The test's comment also still says `nodeOperations` supplies "the two that need a disk"; REQ-149 made that false, and the same stale sentence sits in five files.

Three `info` entries record things a later check shouldn't re-open: AC-1073's placement clause *is* covered in a different shape in the workerd suite; the REQ-126 free-coded suite is a same-shape near-clone of the AC-named one, which is the expected FC→AC reconciliation pattern rather than drift; and evidence validity is not in question anywhere in this tree.

## One thing to flag

The workerd suite can't run in this sandbox — it dies at `Error: listen EPERM` before any test executes. So the two existing AC-1411-adjacent assertions were verified by reading source, not by running them, and I said so in the report rather than implying otherwise. That also constrains whoever fixes finding 1: new tests written into `*.workers.test.ts` won't be executable here, though clause 4 is probably assertable against `flushAudit` directly with a rejecting `R2Bucket` double, which needs no listener.

I made no changes to tickets, tests, or code. I did note in the report — as the ac-level cycle did before me — that `uat_coverage` on AC-1411 must not be set from a fix cycle that isn't check/fix_uat_coverage; this is the third report to reach that conclusion independently.
