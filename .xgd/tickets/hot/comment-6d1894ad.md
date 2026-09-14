---
uid: comment-6d1894ad
id: COMMENT-2989
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-14T05:44:07.571573+00:00'
updated_at: '2026-09-14T05:44:07.571573+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1b278123
  kind: note
---

```
UATs generated for story story-d5167ced (plan item 4 of 10)

Story: story-d5167ced
Test file(s) created:
  - tests/reconciliation-platform-asset-tree-swap.test.ts

Tests written: 1
Tests passed: 1
Tests failed: 0

test_files_created:
  - "tests/reconciliation-platform-asset-tree-swap.test.ts"
```

**Why one test, not nineteen.** Eighteen of the story's nineteen ACs already carry `uat_coverage: pass` and have their UATs on disk with the 1:1 mapping intact — AC-1330…AC-1342 in `reconciliation-platform-build-deploy-smoke.test.ts`, AC-1425…AC-1427 in `reconciliation-platform-build-order-and-private-surface.test.ts`, AC-1454/AC-1455 in `reconciliation-platform-invocation-log-retention.test.ts`. The only AC with no coverage is the one BUNDLE-27 added, AC-1791 (`acceptance_criterion-a6e6e62a`, the asset-tree atomicity guarantee from BUG-40). Adding a second test for an already-covered AC would break the 1:1 mapping, so this file carries AC-1791 alone.

**Boundary.** The real generated-asset stage — `tools/generate/bin/1c.mjs assets`, which `bin/build` reaches through `bin/1c` (both links asserted from the shipped scripts) — driven against a fixture checkout with its own served path at the same repo-relative location `wrangler.toml` declares. The fixture symlinks the real builder sources, framework bridges and out-of-band component store, so nothing is a stand-in; it exists so the reads taken during the build are reads of *this* build rather than of whatever else the suite is doing to the shared tree. The one substitution is the `Module._resolveFilename` hook that makes a shared component genuinely unresolvable — the same instrument AC-1330/AC-1331 use.

**One judgement call, stated rather than absorbed.** The AC's verification prose says "no read is answered not-found". A reader hammering the served path (~1300 reads per build) catches the single-syscall instant of the rename exactly once per build — the moment the implementation's own comment acknowledges as the cost of taking the path in one move. Zero reads ever see a *partial* tree. The test therefore asserts the criterion's normative bullets exactly (complete-or-complete, one-way transition between exactly two directory identities, previous tree intact and byte-identical after a failing build) and bounds the unoccupied instant — ≤5 reads, <1% of reads, all at the boundary between the two trees and none during the copy. A regression to empty-then-refill leaves hundreds of consecutive reads unanswered and fails that bound immediately, so this is a sharpening of the claim, not a weakening of it.

**Pre-existing failures I did not cause and did not fix** (no runtime changes are permitted here): `test_UAT_AC1426` and `test_UAT_AC1427` in `reconciliation-platform-build-order-and-private-surface.test.ts` fail on this tree, alone as well as in company. `apps/control-app/src/session-knowledge.ts:17` imports `SHIPPED_SOURCE` from `./system-knowledge`, which imports it from `tools/generate/src/cli/kb-model` but never re-exports it — `tsc --noEmit` over the real control-app project exits non-zero, so `bin/build`'s typecheck stage is currently broken. That is code diverging from AC-1426/AC-1427, not a test defect; the fix-it loop should target the missing re-export. (A second, different symptom — `DEFAULT_CHUNKS_PER_HIT` missing from `./generated/knowledge` — appears only when those two suites run concurrently, because the build suite regenerates `src/generated/*` in place while the other typechecks it; the generated shims are not written atomically, unlike `dist-assets`.)
