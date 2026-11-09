---
uid: report-f7519c70
id: REPORT-11946
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T16:22:03.358243+00:00'
updated_at: '2026-11-09T16:22:03.358243+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 53
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests: []
    hypothesis: 'AC-688 is skipped because engineAvailable swallows the webkit/firefox
      launch error on the gate machine (cause unconfirmed: revision mismatch webkit-2336/firefox-1538
      vs pinned Playwright, or sandbox launch denial) and XGD BUG-1695 counts the
      AC-allowed skip as an orphan'
    instructions: 'Keep AC-687 green (verify only). Then collect the fact 40 prior
      iterations never captured: from tools/generate, run a one-off node script that
      does what engineAvailable (tools/generate/src/cli/capture/playwright-driver.ts:305)
      does for webkit and for firefox, but prints the caught error message instead
      of discarding it. Report verbatim: each launch error, the playwright and playwright-core
      versions that resolve from tools/generate, and the webkit/firefox revisions
      that version expects versus the ones in ~/Library/Caches/ms-playwright (webkit-2336,
      firefox-1538). Do not install browsers, and do not edit production code, tests,
      ACs or stories. AC-688 is out of scope for edits: it is blocked on XGD BUG-1695
      plus an operator-only browser install. Your report decides which of those the
      operator must act on.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope changes cross-engine rendering; AC-688 explicitly
        allows a skip when engines are absent, so neither AC nor test is wrong.
      rung2: reconcile-src-BUNDLE-43 has the same runIf-guarded test and the same
        Playwright pin, so it gives no ground to align or override.
      rung3: 'Tests stand and no code change is demanded; AC-688 stays orphaned on
        XGD BUG-1695 plus webkit/firefox failing to launch on the gate (operator:
        pnpm --filter ./tools/generate exec playwright install webkit firefox, or
        a sandbox allowance if the launch error shows a denial).'
---

# Fix Plan — Iteration 53

## Hypothesis
AC-688 is orphaned because its only test is skipped by `it.runIf(allEnginesReady)` (the AC allows this skip), the quality gate counts an allowed skip as "no passing test" (XGD BUG-1695), and `engineAvailable('webkit'|'firefox')` returns false on the gate machine. That function swallows every launch error, so nobody has yet seen why the launch fails.

## Analysis
- Quality report REPORT-11945 (report-a399cf9d): lint, build and preflight are green, and 54/54 tests pass. The only finding is orphan AC-688. Nothing in the repo changed since iteration 52, only `.xgd` bookkeeping.
- Test: `tests/reconciliation-l1-substrate.test.ts:530-568`. It is guarded by `engineAvailable` at `tools/generate/src/cli/capture/playwright-driver.ts:305-314`. That function launches the engine and returns `false` on any exception, and it discards the error.
- Browser cache, read this iteration (`~/Library/Caches/ms-playwright`): chromium-1228/1234/1243/1248, firefox-1538, webkit-2336. The iteration-51 diagnosis was that Playwright `^1.61.1` needs webkit-2311 and firefox-1532. That would explain the failed launches, but it has never been confirmed against the actual launch error. Two other causes are just as consistent with the evidence: the builder/gate sandbox (macOS Seatbelt) blocking a WebKit or Firefox launch, or a different resolved playwright-core.
- **Hypothesis-repeat rule:** iterations 12–52 filed the same plan about 40 times: exclude AC-688, verify AC-687 only, and record BUG-1695. It never cleared. This plan still does not re-batch AC-688, because the BUG-1067 rule applies: AC-688 is stuck on XGD tooling defect **BUG-1695** plus an install the operator must run. It does change the batch's work, though. The batch now has to collect the one missing fact: the real launch error for webkit and firefox. With that error the operator can choose the right fix (a browser install, a sandbox allowance, or BUG-1695) instead of the loop repeating.
- No conflicting ACs. No cross-suite contamination (0 failed tests).

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent skip) — the skip should name the engine that failed and its launch error, so a skipped run is diagnosable.
- tools/generate/src/cli/capture/playwright-driver.ts:305 engineAvailable — swallows the launch error — consumers cannot tell a missing build from a sandbox denial.

## Batches
Batch 0 (diagnostic + keep-green): AC-687 keep-green (needs no browser). The builder also runs a one-off launch of `playwright.webkit` and `playwright.firefox` from `tools/generate`, the way `engineAvailable` does, and reports the exact error messages. It also reports which playwright/playwright-core version resolves there and which browser revisions that version expects. No production, test, AC or story edits. AC-688 is deliberately left out (BUG-1067 rule: blocked on XGD BUG-1695 and an operator-only browser install).

## Resolution ladder (REQ-938)
Batch 0: rung 1 decides that AC-688 itself stands. No intent in scope changes cross-engine rendering. The AC explicitly permits the skip when engines are absent, so neither the AC nor the test is wrong. Rung 2: the reference state `reconcile-src-BUNDLE-43` uses the same guarded test and the same Playwright pin, so it gives no reason to align or override. Rung 3: the tests stand and no code change is demanded. The orphan is XGD BUG-1695 (an allowed skip counted as an orphan) together with webkit/firefox failing to launch on the gate machine. The operator clears it with `pnpm --filter ./tools/generate exec playwright install webkit firefox`, or with a sandbox allowance if the launch error collected in this batch shows a sandbox denial.
