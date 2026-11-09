---
uid: report-4fb0d034
id: REPORT-11911
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T14:42:34.455761+00:00'
updated_at: '2026-11-09T14:42:34.455761+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests: []
    hypothesis: AC-688 orphan signal is XGD BUG-1695 (sanctioned skip counted as no
      test) plus missing webkit-2311/firefox-1532 binaries for pinned Playwright 1.61.1;
      no product or test defect remains
    instructions: 'Re-run test_UAT_AC687_ and confirm it stays green. Make no edits
      to tests, ACs, stories or production code. Leave AC-688 alone: it is stuck on
      XGD BUG-1695 and on Playwright browsers that only the operator can install outside
      the sandbox.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) requires AC-688 to pass
        without its sanctioned skip when WebKit/Firefox cannot launch.
      rung2: reconcile-src-BUNDLE-43 pins the same Playwright 1.61.1 at tools/generate/package.json:21,
        so the reference gives no reason to change code.
      rung3: 'Tests stand; AC-688 is excluded as stuck on XGD BUG-1695 plus missing
        browser binaries (operator: pnpm --filter ./tools/generate exec playwright
        install webkit firefox).'
  fix_iteration: 46
---

# Fix Plan — Iteration 46

## Hypothesis
AC-688 shows as orphaned for two reasons. Its only UAT, `test_UAT_AC688_no_layout_divergence_across_three_engines`, takes the skip its AC allows when WebKit and Firefox cannot launch, because the pinned Playwright 1.61.1 needs firefox-1532 and webkit-2311 and the gate machine has only firefox-1538 and webkit-2336. XGD's coverage check then counts that allowed skip as "no passing test" (XGD BUG-1695). Neither cause is a defect in the product code or the test.

## Analysis
- Quality report-56a8e737 (commit 61990a95): 54 tests, 0 failed; lint, build and preflight are clean. The only failure is the orphan-AC signal for AC-688.
- Nothing changed since iteration 45. The only changed files are `.xgd/_changes/*` and the quality report. No code, test, AC or story was edited.
- In iteration 45 the builder (report-990bddef) confirmed that `test_UAT_AC687_` passes. It made no edits and raised no `blocked_by`, so there is nothing to rule on.
- The root cause has been confirmed every iteration since iteration 2 (report-e7c1a640). The pinned Playwright (`tools/generate/package.json:21`, the same at `reconcile-src-BUNDLE-43`) needs browser revisions the machine does not have. Installing them means writing to `~/Library/Caches/ms-playwright` and downloading from the network. Both are outside the sandbox and outside this story's scope.
- AC-688's Verification text says: "Runs only when all three engines are installed; skips cleanly otherwise." The test matches the AC exactly. Counting that skip as an orphan is the XGD tooling defect BUG-1695.
- Under the BUG-1067 stuck-reason rule, AC-688 is NOT re-batched. It is named here with XGD BUG-1695 and recorded in the batch's `ladder.rung3`.
- Hypothesis history: this diagnosis has been confirmed, not just re-proposed. No structurally different hypothesis exists, and no mode rule is blocking a fix, so there is no override to grant. The repeat-hypothesis rule is met through option (c): rung 3 decides, the tests stand, and the code change is "none", because the remedy is to install the browsers and fix the XGD tooling.
- Operator action that would clear this: `pnpm --filter ./tools/generate exec playwright install webkit firefox` on the gate machine, plus a fix for XGD BUG-1695 so that an allowed environmental skip is not counted as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0: re-run `test_UAT_AC687_` (a validator test that needs no browser) so the gate has a real selector it can run. No edits. AC-688 is left out on purpose (stuck on XGD BUG-1695 and missing browser binaries).

## Resolution ladder (REQ-938)
- Batch 0: rung 3 decides, and the tests stand. Rung 1: no intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) requires AC-688 to pass without its skip in an environment that lacks the engines. Rung 2: the reference pins the same Playwright 1.61.1 as the working tree (`tools/generate/package.json:21`), so the reference gives no reason to change code. Rung 3: the tests stand. AC-688 is stuck on XGD BUG-1695 plus missing webkit-2311/firefox-1532 binaries that only the operator can install.
