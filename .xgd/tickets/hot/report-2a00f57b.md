---
uid: report-2a00f57b
id: REPORT-11523
type: report
title: 'Report: fix_plan for report-49607926'
created_by: xgd
created_at: '2026-11-08T17:06:26.435461+00:00'
updated_at: '2026-11-08T17:06:26.435461+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-49607926
  fix_iteration: 4
  items:
  - index: 0
    tests:
    - tests/reconciliation-marked-points.test.ts::story-44d0a572 — Marked Points on
      the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends
    - tests/reconciliation-builder-workspace-chrome.test.ts::story-e674c60a naming
      test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site
    - tests/reconciliation-builder-workspace-origin.test.ts::story-e674c60a builder
      origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo
    dependency_tests:
    - test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable
    - test_UAT_FC_BUG-71_
    - test_UAT_FC_REQ-210_
    - test_UAT_FC_BUG-72_
    hypothesis: AC-2418's hover-title block reads controller.list() after controller.expand()
      has marked every point sent, and the AC-960/AC-961 source walkers skip dist-assets
      but not the dist-assets.staging/dist-assets.retired siblings that parallel `1c
      assets` runs fill with copies of the builder config and the webui components.
    instructions: All three are test defects. The product behaviour matches its intents,
      so edit only the three test files named here. (1) In tests/reconciliation-marked-points.test.ts,
      the AC-2418 UAT's hover-title block (`const [moved] = controller.list()` and
      its `title` assertions, around line 557) runs after `controller.expand(box.get())`
      (around line 549). expand() marks every live point sent, and list() returns
      only unsent points, so `moved` is undefined. Move that block to just before
      the expand() call so it observes the dragged, re-resolved, still-live point.
      Keep the expansion assertions and the final 'a sent mark cannot be dragged'
      step after expand(), unchanged. (2) The walk() helpers in tests/reconciliation-builder-workspace-chrome.test.ts
      (around line 526, used by AC-960) and tests/reconciliation-builder-workspace-origin.test.ts
      (around line 1150, used by AC-961) skip only the exact directory name `dist-assets`.
      The `1c assets` build (BUG-71 stage-then-swap) writes into `dist-assets.staging`
      and briefly parks the old tree in `dist-assets.retired`. Several suites run
      run(['assets']) against the real repo in parallel workers, the newest being
      tests/reconciliation-marked-points-served-modules.test.ts. Mid-build, those
      siblings hold a copy of the builder config (a second SITE_TAB label literal,
      which trips AC-960) and of the webui shell (a second mountShell definition,
      which trips AC-961). Make both walkers skip `dist-assets` and any directory
      whose name starts with `dist-assets.`, and extend the existing BUILD OUTPUT
      comment to say why. Do not narrow the source that is scanned otherwise. Verify
      AC-960 and AC-961 in the same run as the asset-building suites, not only in
      isolation.
    ladder:
      rung1: 'Decides: REQ-210 ''Points clear on send'' makes a sent point leave controller.list(),
        so the AC-2418 test''s ordering is wrong; BUG-71''s stage-then-swap makes
        dist-assets.staging/.retired intended build output, so walkers that scan them
        as source are wrong.'
      rung2: 'Agrees at reconcile-src-BUNDLE-41: points.js:178 (live excludes sent),
        :558 (expand sets sent), :566 (list = live); assets.ts:1353-1355 (staging
        dir) and :1403-1407 (retired swap).'
      rung3: The tests' assertions stand unchanged; only the AC-2418 statement order
        and the walkers' build-output exclusion change, and no production file is
        edited.
    test_scope: test_UAT_AC2418_ or test_UAT_AC960_ or test_UAT_AC961_ or test_UAT_AC977_
      or test_UAT_FC_BUG-71_ or test_UAT_FC_REQ-210_ or test_UAT_FC_BUG-72_
---

# Fix Plan — Iteration 4 (re-plan after validator rejection)

## Hypothesis
Two test defects and no product defect. First, AC-2418's hover-title block reads `controller.list()` after `controller.expand()` has marked every point sent. Second, the AC-960 and AC-961 source-tree walkers skip `dist-assets` but not its transient build siblings `dist-assets.staging` and `dist-assets.retired`, which `1c assets` runs in parallel workers fill.

## Analysis
This plan carries the same diagnosis as the previous attempt at iteration 4 (REPORT-11522). That plan was rejected by the frozen-path filter, not for its diagnosis. Its instructions quoted a production file's full path to explain *why* the staging siblings exist, and the filter read the citation as an edit. This re-plan edits no production file. The instructions name only test files, and the production evidence moves to the ladder's rung 2.

The 5 reported failures are 3 tests. AC-2418 and AC-961 are orphaned only because their single tests fail. Iterations 1–3 addressed the REQ-211 flow tests, which are now green. These three tests first failed in REPORT-11521 (commit 7b55c333), so each hypothesis here has been tried once.

**AC-2418** (`tests/reconciliation-marked-points.test.ts`). Reproduced earlier this iteration with `TypeError: Cannot read properties of undefined (reading 'drawing')` at `formatMarkedPoint`, reached from test line ~559.
- Line ~549 calls `controller.expand(box.get())`, which marks every live mark sent.
- Line ~557 then calls `controller.list()`, which returns only unsent marks, so `moved` is undefined.
- REQ-210 requires "Points clear on send", so the code is right and the test's ordering is wrong.

**AC-960 and AC-961**: cross-suite contamination.
- The `walk()` helpers in `tests/reconciliation-builder-workspace-chrome.test.ts:526` and `tests/reconciliation-builder-workspace-origin.test.ts:1150` skip only the exact name `dist-assets`.
- The `1c assets` build (BUG-71's stage-then-swap) writes into `dist-assets.staging` and briefly moves the old tree to `dist-assets.retired`.
- Several suites run `run(['assets'])` against the real repo in parallel workers:
  - `reconciliation-marked-points-served-modules.test.ts`, added in fc268d3051, after which these failures appeared
  - `test_UAT_FC_BUG-71_framework_import_graph.test.ts`
  - `reconciliation-builder-workspace-import-graph.test.ts`
  - `reconciliation-platform-asset-tree-swap.test.ts`
  - `reconciliation-1c-launcher-bootstrap.test.ts`
- While one of those builds is running, the sibling folders hold:
  - a copy of the builder config module, a second `SITE_TAB` label literal, which trips AC-960;
  - a copy of the webui shell, a second `mountShell` definition, which trips AC-961.
- AC-960 passes alone. The polluting suites are correct, because BUG-71 requires the staging and swap design. The walkers are wrong, and their own comment ("it is BUILD OUTPUT") already gives the reason to exclude the siblings as well.

None of these ACs conflict with each other. The three fixes are test-only edits in one window that share the polluter context, so they go in one batch. No `blocked_by` report is open.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-builder-workspace-origin.test.ts::test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` — inter-test-dependency — reads the live `apps/control-app/dist-assets`, which briefly does not exist mid-swap while a parallel `1c assets` runs. It should serve a tree it controls.
- `tests/reconciliation-builder-workspace-origin.test.ts` (assets-binding helper near :835) — inter-test-dependency — serves the real `dist-assets` from disk while other workers rewrite it. Same remedy.
- `tests/reconciliation-marked-points-served-modules.test.ts`, `tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts`, `tests/reconciliation-builder-workspace-import-graph.test.ts` — inter-test-dependency — concurrent `1c assets` builds share one staging path, and each removes the other's. They should build into a temp output dir or run sequentially.

## Batches
**Batch 0: the three tests, all test-only edits.**
- AC-2418: move the hover-title block to before `expand()`.
- AC-960 and AC-961: the walkers skip `dist-assets` and every `dist-assets.*` sibling, and the BUILD OUTPUT comment is extended.
- No production file is edited, and no assertion is weakened.

## Resolution ladder (REQ-938)
**Batch 0 is decided at rung 1.**
- REQ-210 ("Points clear on send") makes the AC-2418 test's ordering wrong.
- BUG-71's stage-then-swap design makes the siblings intended build output, so the walkers that read them as source are wrong.
- Rung 2 agrees at reconcile-src-BUNDLE-41:
  - `points.js`: 178 (`live` excludes sent), 558 (`expand` sets sent), 566 (`list` = `live`)
  - `assets.ts`: 1353-1355 (staging dir), 1403-1407 (retired swap)
- Rung 3: the tests' assertions stand. Only their statement order and their build-output exclusion change.
