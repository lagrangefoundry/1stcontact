---
uid: report-23c5d96b
id: REPORT-11947
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T16:30:13.193992+00:00'
updated_at: '2026-11-09T16:38:42.691046+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests: []
    hypothesis: 'AC-688 is skipped because the engine-availability probe swallows
      the webkit/firefox launch error on the gate machine (unconfirmed cause: browser
      revision mismatch or sandbox launch denial), and XGD BUG-1695 counts that AC-allowed
      skip as an orphan'
    instructions: 'Keep AC-687 green (verify only). Then collect the fact 40 prior
      iterations never captured: write a throwaway node script under .xgd/tmp/ that,
      from the tools/generate package, launches webkit and firefox with Playwright
      exactly as the capture driver engine-availability probe does, and prints the
      caught error instead of discarding it. Report verbatim: each launch error, the
      playwright and playwright-core versions that resolve from tools/generate, and
      the webkit/firefox revisions that version expects versus those in ~/Library/Caches/ms-playwright
      (webkit-2336, firefox-1538). Do not install browsers and do not edit any tracked
      file (no production code, tests, ACs or stories). AC-688 is out of scope for
      edits: it is blocked on XGD BUG-1695 plus an operator-only browser install or
      sandbox allowance, and your report decides which the operator must act on.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope changes cross-engine rendering; AC-688 explicitly
        allows a skip when engines are absent, so neither AC nor test is wrong.
      rung2: reconcile-src-BUNDLE-43 has the same runIf-guarded test and the same
        Playwright pin, so it gives no ground to align or override.
      rung3: 'Tests stand and no code change is demanded; AC-688 stays orphaned on
        XGD BUG-1695 plus webkit/firefox failing to launch on the gate (operator:
        pnpm --filter ./tools/generate exec playwright install webkit firefox, or
        a sandbox allowance if the error shows a denial).'
  fix_iteration: 53
  batches_pending: false
---

# Fix Plan — Iteration 53 (attempt 2)

## Hypothesis
AC-688's only test is skipped by its all-engines-ready guard, which the AC explicitly allows. The quality gate counts that allowed skip as an orphan (XGD BUG-1695). WebKit and Firefox fail to launch on the gate machine, and the cause has never been observed, because the engine-availability helper discards the launch error.

## Analysis
- Quality report REPORT-11945 (report-a399cf9d): lint, build and preflight are green, and 54/54 tests pass. The only finding is orphan AC-688. Nothing in the repo changed since iteration 52, only `.xgd` bookkeeping.
- The AC-688 test lives in `tests/reconciliation-l1-substrate.test.ts` (around lines 530-568). It is wrapped in `it.runIf(allEnginesReady)`. The guard is computed by the capture driver's engine-availability helper, which launches each engine and returns false on any exception, without keeping the error.
- Browser cache (`~/Library/Caches/ms-playwright`): chromium-1228/1234/1243/1248, firefox-1538 and webkit-2336. Two explanations fit the evidence equally well: a revision mismatch with the pinned Playwright, or the macOS Seatbelt sandbox denying the WebKit and Firefox launches. Neither has been confirmed against a real error.
- **Hypothesis-repeat rule:** iterations 12–52 repeated the plan "exclude AC-688, verify AC-687, record BUG-1695" about 40 times. The BUG-1067 rule still keeps AC-688 out of the batches, because it is blocked on the XGD tooling defect **BUG-1695** plus an operator-only browser install or sandbox allowance. What changes is the batch's work: it now collects the one missing fact, the real launch error.
- **Plan validation (attempt 1 of iteration 53) was refused** because the instructions named a production file that `code_frozen` freezes. The batch only reads; it never edits that file, so no override is warranted. This attempt removes production paths from the instructions. The diagnostic is a throwaway script under `.xgd/tmp/` and changes no tracked file.
- There are no conflicting ACs and no isolation pattern: AC-687 passes in every batch check and every scoped quality run.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_* — weak-observation — when the engines are absent the guard skips silently. The test should surface the swallowed launch reason (for example, log it) so a skip is diagnosable.

## Batches
- **Batch 0** (`test_UAT_AC687_`): verify only that AC-687 stays green, then run the read-only diagnostic. The diagnostic reproduces the engine-availability probe for webkit and firefox in a throwaway script under `.xgd/tmp/`, and records the verbatim launch errors together with the resolved playwright and playwright-core versions and the browser revisions they expect. No edits to production code, tests, ACs or stories.
- **AC-688 is excluded**: it is stuck on XGD BUG-1695 plus an action only the operator can take. The operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox`, or grants a sandbox allowance if the launch error shows a denial.

## Resolution ladder (REQ-938)
- Batch 0: decided at **rung 3**. Rung 1: no intent in scope changes cross-engine rendering, and AC-688 itself allows the skip. Rung 2: `reconcile-src-BUNDLE-43` has the same guarded test and the same Playwright pin, so it gives no ground to align or override. Rung 3: the tests stand and no code change is demanded. AC-688's orphan status is recorded against XGD BUG-1695 plus the missing WebKit/Firefox launch on the gate.