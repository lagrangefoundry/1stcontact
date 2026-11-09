---
uid: report-e7c1a640
id: REPORT-11730
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T06:45:14.719386+00:00'
updated_at: '2026-11-09T06:45:14.719386+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: The gate machine browser cache holds firefox-1538/webkit-2336 while
      the pinned playwright-core@1.61.1 requires firefox-1532/webkit-2311, so engineAvailable
      (playwright-driver.ts:305) returns false and AC-688 skips; the cause is the
      environment, not repo code.
    instructions: 'AC-688 is orphaned only because its correct, AC-conformant test
      skips: webkit and firefox cannot launch since the installed browser revisions
      do not match playwright 1.61.1. Do not touch the test, the AC, the engineAvailable
      probe, tools/generate/package.json or the lockfile. Make the pinned Playwright
      browsers available by running `pnpm --filter ./tools/generate exec playwright
      install webkit firefox` (installs firefox-1532 and webkit-2311), then re-run
      test_UAT_AC688_no_layout_divergence_across_three_engines and confirm it runs
      and passes rather than skips. If the sandbox refuses the download or the write
      to ~/Library/Caches/ms-playwright, report stuck quoting the exact refusal so
      the operator runs that command; that is the expected end of this batch.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser-engine availability, so rung 1 does not decide.
      rung2: The reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, so the user intends the current dependency
        and nothing in the repo is wrong; the reference skips AC-688 identically on
        this machine.
      rung3: The test stands and matches AC-688 verbatim; it demands no code change,
        only that the pinned browsers are installed on the gate machine.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decided: the reference keeps playwright ^1.61.1 (tools/generate/package.json:21),
        so bumping playwright and the lockfile to fit the stale browser cache on one
        machine contradicts the user pin; the fix is installing the matching browsers,
        which edits no repo file.'
      files: []
  fix_iteration: 2
---

# Fix Plan — Iteration 2

## Hypothesis
AC-688 is orphaned because the gate machine's Playwright browser cache (firefox-1538, webkit-2336) does not match the revisions playwright-core@1.61.1 requires (firefox-1532, webkit-2311), so `engineAvailable` returns false for webkit/firefox and the test skips. The fault is in the environment, not the product code, the test or the AC.

## Analysis
- The only failure is AC-688 (orphan). Its sole test, `test_UAT_AC688_no_layout_divergence_across_three_engines` (`tests/reconciliation-l1-substrate.test.ts:536-569`), is gated by `it.runIf(allEnginesReady)` (lines 530-534). report-37999b07 recorded it as `skipped`, and the coverage check does not count a skip as a pass.
- Chromium launches (AC-683 passes). The webkit and firefox probes in `tools/generate/src/cli/capture/playwright-driver.ts:305` fail on the browser revision mismatch, as the builder diagnosed in report-dacf5f5d and report-96c98564. I have no evidence against that diagnosis.
- AC-688's own Verification text says: "Runs only when all three engines are installed; skips cleanly otherwise." The test matches the AC, and the AC describes real behaviour, so neither is wrong.
- The reference state (`git show reconcile-src-BUNDLE-43:tools/generate/package.json`, line 21) pins `"playwright": "^1.61.1"`, the same as the working tree. The reference therefore skips this test the same way on this machine. The cause sits outside the repo, in the machine's `~/Library/Caches/ms-playwright`.
- Iteration 1's plan had empty instructions, and the builder made no edits. This iteration rules on the builder's `blocked_by: code_frozen` request instead of repeating that plan.
- I am not filing this as an XGD tooling defect (BUG-1067 path). Requiring a passing test for an active AC is correct gate behaviour. The defect is the missing browser install.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent environment skip) — record which engine's probe failed, and why, when `allEnginesReady` is false, so the next orphan report names the missing browser revision without a manual diagnosis.

## Batches
One batch, containing AC-688's single test. The work is environmental. Inside `code_frozen`, the builder's only legitimate move is to make the pinned Playwright's own browsers available: run `pnpm --filter ./tools/generate exec playwright install webkit firefox`, which installs firefox-1532 and webkit-2311 into the default cache, then re-run the test. If the sandbox refuses the download or the write to `~/Library/Caches/ms-playwright`, the builder reports `stuck` with that exact refusal, and the run ends for the operator to run the command. The builder must not edit the test, the AC, the probe, the manifest or the lockfile.

## Resolution ladder (REQ-938)
- Batch 0, decided at rung 2, then rung 3. Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches the Playwright pin or engine availability. Rung 2: the reference pins `playwright ^1.61.1` (`tools/generate/package.json:21`), identical to the working tree, so the user's intended dependency is unchanged and nothing in the repo is wrong. Rung 3: the test stands, and it demands no code change, only an installed environment.

## blocked_by ruling
`code_frozen`: **declined**. Neither the ladder nor the reference supports bumping Playwright (and changing the lockfile) to fit one machine's stale cache. That would move every other environment off the browsers the user's pin expects. Installing the matching browsers is the fix and needs no repo file.
