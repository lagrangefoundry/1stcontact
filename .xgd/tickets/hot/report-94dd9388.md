---
uid: report-94dd9388
id: REPORT-11549
type: report
title: 'Report: fix_plan for report-49607926'
created_by: xgd
created_at: '2026-11-08T18:54:11.548694+00:00'
updated_at: '2026-11-08T18:54:11.548694+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-49607926
  fix_iteration: 7
  items:
  - index: 0
    tests:
    - tests/reconciliation-builder-workspace-import-graph.test.ts::story-e674c60a
      — a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical
    - tests/reconciliation-builder-workspace-import-graph.test.ts::story-e674c60a
      — a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_fails_1c_assets_naming_the_importer_and_the_specifier
    - tests/reconciliation-builder-workspace-import-graph.test.ts::story-e674c60a
      — a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier
    dependency_tests:
    - test_UAT_AC2464_
    - test_UAT_AC1400_
    - test_UAT_AC1415_
    - test_UAT_AC1416_
    - test_UAT_AC1417_
    - test_UAT_FC_REQ-145_
    - test_UAT_AC1791_
    - test_UAT_AC2421_
    - test_UAT_FC_REQ-209_
    - test_UAT_FC_BUG-71_
    - test_UAT_AC1476_
    - test_UAT_AC1477_
    - test_UAT_AC1485_
    - test_UAT_AC960_
    - test_UAT_AC961_
    hypothesis: Iteration 6 wrapped the AC-2464 mirrored-checkout builds (assetsIn,
      import-graph test :294) in the repo-wide withDistAssetsLock although they write
      only inside their own temp mirror; in the full suite they queue for up to ~4
      min behind the six real-repo builds, against an unchanged 180 s test timeout,
      while mirror() itself still deep-links the real apps/control-app outside any
      lock and can copy a concurrent build's transient dist-assets.staging/.retired
      or a half-written module-assets.ts.
    instructions: 'AC-2464''s refusal UATs in tests/reconciliation-builder-workspace-import-graph.test.ts
      are valid evidence. The dangling-edge test fails only in the full suite, because
      of how iteration 6''s lock was applied to this file. assetsIn (line 294) takes
      withDistAssetsLock(REPO), but the mirrored build never touches the repo''s dist-assets:
      mirror() owns module-assets.ts, src/generated and dist-assets under a mkdtemp
      root. So the lock adds up to minutes of waiting, under 180_000 ms test timeouts,
      and no protection. Remove the REPO lock from the mirrored builds. Then make
      mirror construction independent of concurrent real-repo builds. deepLink of
      apps/control-app (lines 212-220, called via own()) currently walks the real
      repo''s transient dist-assets.staging / dist-assets.retired (which can vanish
      mid-readdir) and copies module-assets.ts while another build may be rewriting
      it. The mirror must not pick up the build''s transient siblings, and its owned
      copies must be read from a stable state. Where this file still legitimately
      takes the REPO lock (the first describe''s beforeAll, line 85, which builds
      the real tree), its hook timeout (line 92) must cover the lock''s wait budget
      (fs-lock.ts staleMs 600 s), as AC-1400''s did in iteration 6. Leave unchanged:
      every AC-2464 assertion, the shared fs-lock helper''s semantics for the other
      six suites and AC-1400, and all production files (tools/generate/src/cli/assets.ts
      behaves as intended). The dependency suites must stay green.'
    test_scope: test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical
      or test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_fails_1c_assets_naming_the_importer_and_the_specifier
      or test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier
      or test_UAT_AC2464_ or test_UAT_AC1400_ or test_UAT_AC1415_ or test_UAT_AC1416_
      or test_UAT_AC1417_ or test_UAT_FC_REQ-145_ or test_UAT_AC1791_ or test_UAT_AC2421_
      or test_UAT_FC_REQ-209_ or test_UAT_FC_BUG-71_ or test_UAT_AC1476_ or test_UAT_AC1477_
      or test_UAT_AC1485_ or test_UAT_AC960_ or test_UAT_AC961_
    ladder:
      rung1: No intent in scope (REQ-210/211/212/213, BUG-69, BUG-71) addresses how
        test suites coordinate concurrent builds; BUG-71 only specifies verify-then-swap
        for a single build.
      rung2: The reference tools/generate/src/cli/assets.ts runs checkImportGraph
        on the staged tree (line 1397) before the swap (lines 1403-1407), which is
        exactly what the AC-2464 assertions describe, so the reference agrees with
        the test.
      rung3: 'Decided here: the AC-2464 tests stand unchanged; the test harness iteration
        6 changed must stop making the mirrored builds wait on an unrelated repo lock
        and stop mirroring a concurrent build''s transient tree.'
---

# Fix Plan — Iteration 7

## Hypothesis
Iteration 6 wrapped the AC-2464 mirrored-checkout builds (`assetsIn` in `tests/reconciliation-builder-workspace-import-graph.test.ts:294`) in the repo-wide `withDistAssetsLock(REPO, …)`. Those builds write only inside their own temp mirror, so they don't need that lock. In the full suite, though, they now queue behind the six real-repo `1c assets` builds, each of which holds the lock for up to about 4 minutes, and the wait counts against the test's unchanged 180 s timeout. The first refusal test is the one that meets the queue. This is a regression in the test harness from iteration 6's fix, not a product defect.

## Analysis
- **The failure.** Only one test failed: `test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical`, with 280 of 281 passing (REPORT-11548). There is no traceback ("JUnit XML missing"). It passed in iteration 6's direct vitest batch run (REPORT-11540 says "AC2464 and BUG-71 pass"), and it fails only in the scoped full-suite run. That pass-alone, fail-in-suite pattern is cross-suite interaction, not a defective test.
- **What changed (last commit to the file, 26b7caed82).** Both `beforeAll` (line 85) and `assetsIn` (line 294) were changed from `run(['assets'])` to `withDistAssetsLock(REPO, () => run(['assets']))`. `tests/support/fs-lock.ts` lets a waiter wait up to `staleMs` = 600 s (lines 13, 92, 117). Iteration 6 raised AC-1400's timeout to 600 s for exactly this reason. It left this file's `beforeAll` and all three refusal tests at `180_000` (lines 92, 329, 347, 369).
- **Why the mirrored builds don't need the REPO lock.** `mirror()` (lines 256-272) owns every path the build writes: `module-assets.ts`, `src/generated` and `dist-assets` with its `.staging`/`.retired` siblings, all under a `mkdtemp` root. The build never writes the real repo's `dist-assets`. The REPO lock adds a wait and no protection.
- **The real exposure is mirror construction, outside any lock.** `own(root, 'apps/control-app/dist-assets', 'dir')` deep-links `apps/control-app` (`deepLink`, lines 212-220). That walk copies whatever is in the real repo at that moment, including a concurrent build's `dist-assets.staging` / `dist-assets.retired`, which can vanish mid-walk (ENOENT from `readdirSync`). It also copies `module-assets.ts`, which a concurrent real build may be rewriting. Iterations 4 and 6 hit the same class of problem: the AC-960/961 walkers had to skip `dist-assets.*` siblings.
- **Why the first test.** The refusal describe runs right after this file's own `beforeAll` build, while the other suites' `beforeAll` builds are still queued for the lock. That makes the first `assetsIn` the most likely to wait the longest. The later two tests usually get the lock immediately.
- **History.** This is the first time this test has failed under this subject, and the hypothesis is new. Iteration 6's lock hypothesis was about AC-1400 and is confirmed fixed. This plan corrects a side effect of that fix and doesn't repeat it.
- **Builder blocks.** The latest assessment (REPORT-11540 and its comment COMMENT-8023) reports `fixed` with no `blocked_by`, so there is nothing to rule on.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-builder-workspace-import-graph.test.ts::…test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_…` and `…resolves_outside_the_repository_…` — inter-test-dependency — they share the same `mirror()`/`assetsIn` exposure as the failing test and pass only because they usually find the lock free. Fix them in the same change.
- `tests/reconciliation-workspace-build-artifacts.test.ts::…test_UAT_AC1400_…` — weak-observation (still open from iteration 6) — the "unbuilt" tail accepts any non-404 status.

## Batches
**Batch 0 (one batch).** The failing AC-2464 refusal test, plus the rest of AC-2464 and every suite that shares the `dist-assets` lock, as blast radius. The fix stays in this test file's harness. Concretely:
- Mirrored builds must not take the REPO lock.
- Building the mirror must not depend on whether a real-repo build is running at that moment.
- Wherever the REPO lock remains (this file's `beforeAll`), the hook's time limit must cover the lock wait.

## Resolution ladder (REQ-938)
- **Batch 0: decided at rung 3. The test stands, and only the test harness changes.**
  - Rung 1: no intent in scope (REQ-210/211/212/213, BUG-69, BUG-71) addresses how test suites coordinate concurrent builds. BUG-71 only specifies stage-then-swap for a single build.
  - Rung 2: the reference `tools/generate/src/cli/assets.ts` (`checkImportGraph(stageDir, …)` at line 1397, then the swap at lines 1403-1407) refuses a dangling edge before the swap. The test's assertions describe exactly that, so the reference agrees with the test.
  - Rung 3: the AC-2464 test is valid evidence and its assertions stay. The harness that iteration 6 changed must stop making it wait on an unrelated lock, and must stop it copying another build's half-written tree.
