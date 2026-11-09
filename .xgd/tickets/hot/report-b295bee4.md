---
uid: report-b295bee4
id: REPORT-11906
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T14:30:01.151796+00:00'
updated_at: '2026-11-09T14:37:33.003961+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 45
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests: []
    hypothesis: AC-688 orphan signal is XGD BUG-1695 (sanctioned skip counted as no
      test) plus missing webkit-2311/firefox-1532 binaries; no product or test defect
      remains
    instructions: 'Re-run test_UAT_AC687_ and confirm it stays green. Make no edits
      to tests, ACs, stories or production code. Do not touch AC-688: it is stuck
      on XGD BUG-1695 and missing Playwright browsers that only the operator can install
      outside the sandbox.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope requires AC-688 to pass without its sanctioned skip
        when WebKit/Firefox cannot launch.
      rung2: reconcile-src-BUNDLE-43 pins the same Playwright 1.61.1 at tools/generate/package.json:21,
        so the reference gives no reason to change code.
      rung3: 'Tests stand; AC-688 is excluded as stuck on XGD BUG-1695 plus missing
        browser binaries (operator: pnpm --filter ./tools/generate exec playwright
        install webkit firefox).'
  batches_pending: false
---

# Fix Plan — Iteration 45

## Hypothesis
AC-688 is reported orphaned because its only UAT (`test_UAT_AC688_no_layout_divergence_across_three_engines`) takes its AC-sanctioned skip when WebKit/Firefox cannot launch, and XGD's coverage check counts a sanctioned skip as "no passing test" (XGD BUG-1695) — a tooling defect, not a product or test defect.

## Analysis
- Quality report-cce66423 (commit e7407a23): 54 tests, 0 failed, lint/build/preflight clean. The only failure is the orphan-AC signal for AC-688.
- Nothing changed since iteration 44: the only changed files are `.xgd/_changes/*` and the quality report itself. No code, test, AC or story edits.
- Iteration 44 builder (report-ee5588c9) confirmed `test_UAT_AC687_` passes, made no edits, raised no `blocked_by`.
- Root cause is unchanged across 44 iterations: pinned Playwright 1.61.1 (`tools/generate/package.json:21`, identical at `reconcile-src-BUNDLE-43`) needs `firefox-1532` / `webkit-2311`; the gate machine cache holds only `firefox-1538` / `webkit-2336`. Installing browsers is outside the sandbox and outside this story's scope.
- Per the BUG-1067 stuck-reason rule, AC-688 is NOT re-batched. It is named here with XGD BUG-1695 and recorded in the batch's `ladder.rung3`.
- Hypothesis-history rule: the same diagnosis has been confirmed (not merely re-proposed) every iteration; there is no structurally different hypothesis — the blocker is environmental + XGD tooling, which rung 3 cannot reach from inside this story.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0: keep-green re-run of `test_UAT_AC687_` (validator test, no browser) so the gate has a real, runnable selector. No edits.

## Resolution ladder (REQ-938)
- Batch 0: rung 3 decides — the tests stand. Rung 1: no intent in scope demands AC-688 pass without a skip in an environment missing the engines. Rung 2: the reference state pins the same Playwright version as the working tree (`tools/generate/package.json:21`), so it gives no reason to change code. Rung 3: AC-688's test stands and is correct; its non-pass is caused by missing browser binaries plus XGD BUG-1695.

## Operator action required
Either clears AC-688:
1. Outside the sandbox: `pnpm --filter ./tools/generate exec playwright install webkit firefox`
2. Fix XGD BUG-1695 so an AC-sanctioned skip is not counted as an orphan.