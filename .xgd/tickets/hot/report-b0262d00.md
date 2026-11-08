---
uid: report-b0262d00
id: REPORT-11538
type: report
title: 'Report: fix_plan for report-49607926'
created_by: xgd
created_at: '2026-11-08T18:00:08.051320+00:00'
updated_at: '2026-11-08T18:45:47.535236+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-49607926
  items:
  - index: 0
    tests:
    - tests/reconciliation-workspace-build-artifacts.test.ts::story-e674c60a — the
      workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate
    dependency_tests:
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
    - test_UAT_AC2464_
    - test_UAT_AC960_
    - test_UAT_AC961_
    hypothesis: Six node suites run `1c assets` against the shared apps/control-app/dist-assets
      while AC-1400's UAT is reading it over startBuilder. The build's rename-out/rename-in
      swap (and its shared .staging dir) leaves the tree absent or partial mid-read,
      so AC-1400 fails by cross-suite contamination, not a product defect.
    instructions: AC-1400's UAT (tests/reconciliation-workspace-build-artifacts.test.ts)
      is valid evidence. It fails because other suites rebuild the shared apps/control-app/dist-assets
      tree while it is reading that tree. The writers are reconciliation-1c-launcher-bootstrap,
      reconciliation-platform-asset-tree-swap, reconciliation-marked-points-served-modules,
      test_UAT_FC_BUG-71_framework_import_graph, reconciliation-product-ticket-store-schema
      and reconciliation-builder-workspace-import-graph, each via run(['assets'])
      or buildControlAppAssets(REPO). The build renames dist-assets to dist-assets.retired,
      then renames dist-assets.staging into place, and every run shares one .staging
      folder. So a concurrent reader sees no tree (503 'not built' / 404) or a half-written
      one, and two concurrent builds clear each other's staging (the ENOTEMPTY reported
      in REPORT-11524). Establish mutual exclusion over that tree across Vitest workers,
      in test infrastructure only. Every suite-initiated `1c assets` build holds one
      exclusive cross-process lock for its whole duration. AC-1400's UAT holds the
      same lock across its reads of the served tree. Reuse the mkdir-lock pattern
      already in tests/support/local-d1.ts (withLock, ~lines 104-128) by lifting it
      into a shared tests/support helper with an async form; do not write a second
      lock mechanism. Its stale threshold must exceed the longest holder (AC-1400
      runs up to 120 s; the current 120 s stale limit would let a waiter break a live
      lock). Do not change tools/generate/src/cli/assets.ts, builder.ts or any production
      file, and do not change AC-1400's assertions. The dependency suites must stay
      green with the lock in place.
    test_scope: test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate
      or test_UAT_AC1415_ or test_UAT_AC1416_ or test_UAT_AC1417_ or test_UAT_FC_REQ-145_
      or test_UAT_AC1791_ or test_UAT_AC2421_ or test_UAT_FC_REQ-209_ or test_UAT_FC_BUG-71_
      or test_UAT_AC1476_ or test_UAT_AC1477_ or test_UAT_AC1485_ or test_UAT_AC2464_
      or test_UAT_AC960_ or test_UAT_AC961_
    ladder:
      rung1: No intent in scope (REQ-210/211/212/213, BUG-69, BUG-71) requires `1c
        assets` to tolerate concurrent runs; BUG-71 specifies stage-then-swap for
        a single build.
      rung2: 'Decided here: the reference tools/generate/src/cli/assets.ts:1403-1407
        has the same rename-out/rename-in swap with a shared .staging, so the shipped
        build is as intended and the concurrency belongs to the test harness.'
      rung3: AC-1400's test stands unchanged; the shared test infrastructure must
        serialize builders and AC-1400's reads of dist-assets.
  fix_iteration: 6
  batches_pending: false
---

# Fix Plan — Iteration 6

## Hypothesis
AC-1400's UAT reads the shared `apps/control-app/dist-assets` tree over `startBuilder` for most of its 120 s run. At the same time, six other node suites run `1c assets`, which removes and replaces that same tree (`rename outDir→.retired`, then `rename .staging→outDir`, sharing one `.staging` folder). The AC-1400 reads land in the gap or in a half-written tree and fail. This is cross-suite contamination in the test harness, not a product defect.

## Analysis
- **The two failures are one failure.** The orphaned AC-1400 is orphaned only because its single test, `test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate` (`tests/reconciliation-workspace-build-artifacts.test.ts`), failed. The quality report (REPORT-11537) gives no traceback ("JUnit XML missing").
- **New failure; iterations 1–5 cleared their own targets.** This test is not in any earlier fix_plan for report-49607926. Iteration 4's batch (AC-2418, AC-960, AC-961) passed per REPORT-11524. This hypothesis is new for AC-1400; this is its first attempt.
- **Not a stale build.** The working tree's `dist-assets/builder/main.js` is byte-identical to `src/builder/main.js` now (checked with `cmp`). The last commit, 92d63d8ac9 (fix_review_free_coded), changed `main.js` and `points.js`, and added `site-schema-svg` to `FRAMEWORK_SOURCES` in `tools/generate/src/cli/assets.ts`. That makes each `1c assets` run larger. It also gave `reconciliation-marked-points-served-modules.test.ts` another framework module to load, and that suite itself calls `run(['assets'])` in its `beforeAll`.
- **Who writes the shared tree.** These suites call `run(['assets'])` or `buildControlAppAssets(REPO)` against the repository's own `dist-assets`:
  - `reconciliation-1c-launcher-bootstrap`
  - `reconciliation-platform-asset-tree-swap`
  - `reconciliation-marked-points-served-modules`
  - `test_UAT_FC_BUG-71_framework_import_graph`
  - `reconciliation-product-ticket-store-schema`
  - `reconciliation-builder-workspace-import-graph`
  
  The swap (`assets.ts:1403-1407` at the reference) is atomic for one builder, not for several at once: while it runs, `dist-assets` briefly does not exist. Two concurrent runs also clear each other's `.staging` folder. REPORT-11524 had already seen this happen (`ENOTEMPTY` on `dist-assets.staging`, "12 file(s) that were not built" when BUG-71 ran next to other builds) and called it out of scope then.
- **Why AC-1400 is the reader that loses.** AC-1400 is the long reader of that tree. Over the real HTTP origin it fetches `/`, every import-map component, every stylesheet, `/builder/main.js` and three framework bridges, and it byte-compares `main.js` with its source. A fetch during the swap gets a 503 "not built" or a 404. A fetch from a tree another build is still filling gets missing or partial bytes. Any of these fails it.
- **Isolation history.** There isn't enough history for a pass/fail pattern on this test (first failure). But the mechanism is the same class REPORT-11524 already saw. So direct the fix at the polluters' coordination, not at the test's assertions.
- **I could not run it locally.** In this planning sandbox, `startBuilder` fails with `listen EPERM` because local port binding is off. The diagnosis above is static, from the code and the build-race evidence in REPORT-11524.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-builder-workspace-chrome.test.ts::story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site` — inter-test-dependency — iteration 4 made its walker skip `dist-assets.*` siblings, which treats the symptom of the same shared-tree race. Once builds are serialized, that skip can stay, but it should not be the only protection.
- `tests/reconciliation-builder-workspace-origin.test.ts::story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo` — inter-test-dependency — same as AC-960: it reads the shared tree another suite may be swapping.
- `tests/reconciliation-workspace-build-artifacts.test.ts::…test_UAT_AC1400_…` — weak-observation (the "unbuilt" tail, lines ~305-320) — the closing check accepts any non-404 status and only asserts 503 when the answer isn't 200. With a built tree present, the "not built" message is never exercised. Worth tightening while the builder is in the file, without weakening anything else.

## Batches
**Batch 0 (one batch).** AC-1400's UAT, plus every suite that writes or reads the shared `dist-assets` tree as dependency tests. The fix is in the shared test infrastructure that all of them use, so splitting them would hide the interaction this batch has to fix.

The builder should make access to `apps/control-app/dist-assets` mutually exclusive across Vitest workers, in test infrastructure only:
- Each `1c assets` run a suite starts (its `run(['assets'])` / `buildControlAppAssets(REPO)`) holds an exclusive cross-process lock for the whole build.
- AC-1400's UAT holds the same lock across its reads of the served tree, so no swap can happen mid-read.
- The repository already has this pattern: the `mkdir` lock in `tests/support/local-d1.ts:104-128`. Lift it into a shared `tests/support` helper rather than writing a second one. It needs an async form, and its stale timeout must be longer than the longest holder (AC-1400's test runs up to 120 s, and the current 120 s stale limit would let another worker break a live lock).
- No production file changes: `assets.ts`, `builder.ts` and the swap behaviour stay as they are.
- AC-1400's assertions stay as they are.

## Resolution ladder (REQ-938)
- **Batch 0: decided at rung 2, with the test standing (rung 3 for the test).**
  - Rung 1: no intent in scope (REQ-210/211/212/213, BUG-69, BUG-71) requires `1c assets` to be safe under concurrent runs. BUG-71 specifies stage-then-swap for one build.
  - Rung 2: the reference `tools/generate/src/cli/assets.ts:1403-1407` shows the same rename-out/rename-in swap with a shared `.staging`. So the shipped build is what the user intends, and the concurrency is a property of the test harness.
  - Rung 3: AC-1400's test is valid evidence and stays. Its harness, and the suites that rebuild the tree, must stop interleaving.