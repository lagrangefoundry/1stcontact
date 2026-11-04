---
uid: report-15de9048
id: REPORT-8996
type: report
title: 'Report: fix_plan for story-c4f329d3'
created_by: xgd
created_at: '2026-11-02T19:02:02.969227+00:00'
updated_at: '2026-11-04T15:52:02.836481+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-c4f329d3
  items:
  - index: 0
    tests:
    - AC-2236 (orphaned acceptance criterion)
    - AC-2235 (orphaned acceptance criterion)
    - AC-1632 (orphaned acceptance criterion)
    - AC-1633 (orphaned acceptance criterion)
    - AC-1305 (orphaned acceptance criterion)
    - AC-1304 (orphaned acceptance criterion)
    - AC-1303 (orphaned acceptance criterion)
    - AC-1302 (orphaned acceptance criterion)
    - AC-1301 (orphaned acceptance criterion)
    - AC-1300 (orphaned acceptance criterion)
    - AC-1299 (orphaned acceptance criterion)
    - AC-1298 (orphaned acceptance criterion)
    - AC-1297 (orphaned acceptance criterion)
    - AC-1296 (orphaned acceptance criterion)
    - AC-1295 (orphaned acceptance criterion)
    - AC-1294 (orphaned acceptance criterion)
    - AC-1293 (orphaned acceptance criterion)
    - AC-1292 (orphaned acceptance criterion)
    - AC-1291 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_AC1306_
    - test_UAT_AC1647_
    - test_UAT_AC1648_
    - test_UAT_AC1649_
    - test_UAT_AC2058_
    - test_UAT_AC2059_
    - test_UAT_AC2099_
    - test_UAT_AC2100_
    - test_UAT_AC2101_
    - test_UAT_AC2102_
    - test_UAT_AC2103_
    - test_UAT_AC1427_
    hypothesis: The node vitest project has no globalSetup that writes the gitignored
      apps/control-app/src/generated/ shims, so in a fresh reconcile worktree tests/reconciliation-system-knowledge-base.test.ts
      and tests/reconciliation-system-knowledge-base-read-seam.test.ts fail to collect
      on './generated/ai-workers.js' (imported by apps/control-app/src/ai.ts via tools/generate/src/cli)
      and their ACs register as orphaned.
    instructions: 'These 19 ACs are orphaned, not failing. Their two test files (tests/reconciliation-system-knowledge-base.test.ts
      for AC-1291..1305/1632/1633, and tests/reconciliation-system-knowledge-base-read-seam.test.ts
      for AC-2235/2236) never load, because importing tools/generate/src/cli reaches
      apps/control-app/src/ai.ts, which imports the gitignored ./generated/ai-workers.js.
      Only `1c assets` (buildControlAppAssets, tools/generate/src/cli/assets.ts:612-622)
      writes that file, and nothing runs it before the quality run. Iteration 2''s
      builder diagnosed exactly this and resolved without edits, so the same orphans
      came back. This time, close the gap: give the node vitest project (vitest.node.config.mts)
      a globalSetup module under tests/. Before collection, it generates the real
      shims into apps/control-app/src/generated/ with the real generator (buildControlAppAssets
      or bin/1c assets, not a hand-written stub) when they are missing. If the generator
      cannot run, it fails the run loudly and names the missing out-of-band install;
      it does not skip. It must leave generated/ untracked and ignored (AC-1427 asserts
      this). This is test infrastructure outside the quality source_dirs, so no production
      code changes. Prove it: delete apps/control-app/src/generated/, run the scoped
      filter, and confirm both files collect and every test_UAT_AC in them passes
      alongside the rest of the story''s ACs.'
    test_scope: test_UAT_AC2236_ or test_UAT_AC2235_ or test_UAT_AC1632_ or test_UAT_AC1633_
      or test_UAT_AC1305_ or test_UAT_AC1304_ or test_UAT_AC1303_ or test_UAT_AC1302_
      or test_UAT_AC1301_ or test_UAT_AC1300_ or test_UAT_AC1299_ or test_UAT_AC1298_
      or test_UAT_AC1297_ or test_UAT_AC1296_ or test_UAT_AC1295_ or test_UAT_AC1294_
      or test_UAT_AC1293_ or test_UAT_AC1292_ or test_UAT_AC1291_ or test_UAT_AC1306_
      or test_UAT_AC1647_ or test_UAT_AC1648_ or test_UAT_AC1649_ or test_UAT_AC2058_
      or test_UAT_AC2059_ or test_UAT_AC2099_ or test_UAT_AC2100_ or test_UAT_AC2101_
      or test_UAT_AC2102_ or test_UAT_AC2103_ or test_UAT_AC1427_
    ladder:
      rung1: No intent in scope addresses how the test environment obtains generated
        shims; STORY-117 and BUG-55 define kb build and the indexes seam, which the
        tests assert and which pass when collected.
      rung2: At reconcile-src-BUNDLE-37, apps/control-app/src/generated/ is gitignored
        and produced only by 1c assets, so the production import chain is intended
        and does not change.
      rung3: 'Decided here: the tests stand; the fix is a node-project globalSetup
        that generates the shims before collection.'
  fix_iteration: 3
  batches_pending: false
---

# Fix Plan — Iteration 3

## Hypothesis
The node vitest project has no setup step that writes the gitignored shims in `apps/control-app/src/generated/`. A fresh reconcile worktree reaches the quality run without them, so every test file that imports `tools/generate/src/cli` (via `router.ts`, then `ai.ts`, then `./generated/ai-workers.js`) fails at collection, and its ACs are reported as orphaned.

## Analysis
- The 19 "failures" are not failing tests. They are ACs with no collected test. Scoped quality report-0a9f70aa shows 5 files: 2 failed at load and 3 passed (11 tests, 0 failed).
- The output contains `Cannot find module './generated/ai-workers.js' imported from …/apps/control-app/src/ai.ts` three times.
- The two files that failed to load:
  - `tests/reconciliation-system-knowledge-base.test.ts`: AC-1291…AC-1305, AC-1632, AC-1633.
  - `tests/reconciliation-system-knowledge-base-read-seam.test.ts`: AC-2235 (`test_UAT_AC2235_build_completes_all_four_stages_with_the_map_search_keyed_by_source`, line 200) and AC-2236 (`test_UAT_AC2236_preflight_checks_the_index_seam_and_reports_it_on_its_own_line`, line 253). These ACs are new in this iteration and come from BUG-55.
  - Both files statically import `../tools/generate/src/cli`.
- This repeats iteration 2 exactly. In REPORT-7529 (report-e3e18a83) the builder found the same import failure, made no edits (`blocked_by: null`, `resolved_without_edits`), and wrote this prescription: "the quality setup has no step that generates the shims before tests … adding a pre-test `1c assets` run (or a vitest `globalSetup` that does it) would stop it."
- Re-running the same orphan list unchanged produces the same result, so this plan acts on that prescription.
- Timing evidence repeats. In iteration 2 the vitest pass ended at 01:08:57 and the shims were written at 01:09:32. This time the quality run is stamped 18:55:37Z and the shims in this worktree have mtime 18:56:45Z. Both times the shims appeared after the run, so they were absent during it.
- The shims are gitignored (`.gitignore:196 /apps/control-app/src/generated/`) and written only by `buildControlAppAssets` (`tools/generate/src/cli/assets.ts:612-622`, reached via `1c assets`). The writers (`writeAiWorkersShim`, etc.) are module-private.
- `vitest.node.config.mts` has no `globalSetup`, and `.xgd/quality.yaml` has no pre-test step.
- This is not cross-suite contamination. Both files pass once the shims exist: the builder ran 18/18 and then 29/29 across the four story files. No test deletes the real `generated/` directory; the tests that touch it use tmpdirs.
- Iteration 1 had a different hypothesis (test-side `withStore`/`paging` defects), which was fixed. Iteration 2 had this hypothesis, but the builder made no change. This is the first iteration that directs a change for it, so the 3-repeat rule does not apply.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-system-knowledge-base.test.ts::test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document` — weak-observation — iteration 1 dropped the non-empty check on the real store's read-back, so against the real store the test passes vacuously while no doc carries `doc_kind: system_kb`. Keep the seeded-corpus assertion as the guarantee that something is checked, and make the real-store half state explicitly that it is a shape-only check.
- `tests/reconciliation-system-knowledge-base*.test.ts` (whole family) — inter-test-dependency — they depend on an untracked, out-of-band build artifact in the real worktree (`apps/control-app/src/generated/`). The globalSetup in this batch is what removes that hidden ordering dependency.

## Batches
One batch. All 19 orphans share a single cause, and the fix is one piece of test infrastructure that both files depend on. The batch also carries the story's other ACs (which passed) and AC-1427, which asserts the generation-before-typecheck ordering and the untracked status of `generated/`, so the setup cannot break them.

Directed change: add a vitest `globalSetup` to the node project (`vitest.node.config.mts`, plus a setup module under `tests/`). Before any test file is collected, it ensures the `apps/control-app/src/generated/` shims exist in the repository under test by running the real generator (`buildControlAppAssets` or `bin/1c assets`), never a hand-written stub.
- It runs only when the shims are missing.
- When the generator cannot run, it fails the whole run loudly and names the missing out-of-band install. It does not skip silently.
- It must not commit or track anything under `generated/` (AC-1427 checks this).

This is test infrastructure outside `.xgd/quality.yaml` `source_dirs`, not runtime code, so the reconcile no-runtime-change rule is not engaged. No production file changes.

Acceptance:
1. Delete `apps/control-app/src/generated/`.
2. Run the scoped AC filter.
3. Both files collect, and all their `test_UAT_AC*` tests pass, including AC-2235 and AC-2236.

## Resolution ladder (REQ-938)
Batch 0, decided at rung 3: the tests stand, and the evidence gap is closed by test infrastructure.
- Rung 1: no intent in scope says anything about how the test environment gets its generated shims. STORY-117 and BUG-55 define the kb build and the `indexes` search seam, which the tests already assert and which pass when collected.
- Rung 2: the reference keeps `generated/` gitignored and produced only by `1c assets`. The production import chain is intended, so the code is not what changes.
- Rung 3: the tests are correct. What needs to change is that the shims must exist before collection.
- No `blocked_by` was reported (REPORT-7529 `blocked_by: null`), so no ruling or override is issued.