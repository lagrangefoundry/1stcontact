---
uid: report-d053dd7a
id: REPORT-11834
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:28:37.052140+00:00'
updated_at: '2026-11-09T11:28:37.052140+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 29
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: 'AC-688 is reported orphaned because its three-engine test skips:
      the Playwright cache has firefox-1538 and webkit-2336, Playwright 1.61.1 needs
      firefox-1532 and webkit-2311, and XGD counts the permitted skip as missing evidence
      (BUG-1695)'
    instructions: 'Make no edits to tests, ACs, stories or code. AC-688 and its test
      are correct; the gap is the gate environment plus XGD tooling defect BUG-1695.
      Check ~/Library/Caches/ms-playwright for firefox-1532 and webkit-2311. If both
      are present, run test_UAT_AC688_ and report the real result. If not, report
      stuck citing BUG-1695 and the remedy the user must run outside the sandbox:
      pnpm --filter @1stcontact/generate exec playwright install webkit firefox. Do
      not retry the install, bump Playwright, deprecate AC-688, or alter the engine
      probe.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-222, REQ-221, REQ-219, REQ-220, BUG-78) touches
        cross-engine rendering or the Playwright version.
      rung2: The reference pins playwright ^1.61.1 at tools/generate/package.json:21
        and keeps the AC-688 test unchanged, so it does not decide against the test.
      rung3: 'Decided at rung 3: the test stands and needs no code change. It is blocked
        only by missing webkit-2311/firefox-1532 builds and XGD tooling defect BUG-1695.'
---

# Fix Plan — Iteration 29

## Hypothesis
AC-688's only test is skipped, not failing: the gate machine has no Playwright build of WebKit or Firefox that Playwright 1.61.1 can launch. XGD's coverage check then counts that allowed skip as an orphaned AC (BUG-1695). It is an environment and tooling defect, not a product or test defect.

## Analysis
- Scoped quality report-f8566bb5: 54 tests ran and 54 passed, with no failures. Lint and build are clean. The only failure is the AC Coverage entry "AC-688 (orphaned acceptance criterion)".
- `test_UAT_AC688_no_layout_divergence_across_three_engines` (`tests/reconciliation-l1-substrate.test.ts`) runs only when chromium, webkit and firefox all launch, and AC-688 itself allows it to skip otherwise. Chromium launches (the AC-683 and AC-684 real-browser tests pass).
- Checked again this iteration: `~/Library/Caches/ms-playwright` holds only `firefox-1538` and `webkit-2336`. The reference pins `"playwright": "^1.61.1"` (`tools/generate/package.json:21` at `reconcile-src-BUNDLE-43`), and that version needs firefox-1532 and webkit-2311. `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts:305`) therefore returns false for both, and the test skips.
- The builder's assessments (most recently report-dacf5f5d) mark this as stuck with the same diagnosis every time. The tooling defect, a permitted skip being counted as a missing passing test, is already filed as **BUG-1695**. Under the BUG-1067 rule this test is not handed back to the builder to fix: the test, the AC and the code are all correct. The only ways to clear it are outside this story's scope. Either fix XGD's coverage check (BUG-1695), or install the matching browsers outside the sandbox: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`.
- No intent in scope (REQ-222, REQ-221, REQ-219, REQ-220, BUG-78) touches Playwright or AC-688. So there is no basis for a version bump or a `code_frozen` override.
- This is iteration 29. Retrying with the same instructions cannot change the outcome. The run should end with BUG-1695 in its diagnostic report.

## Spec Changes Made
none. AC-688 is correct and describes real behaviour, so it is not deprecated or rewritten.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (environmental) — this AC's only evidence depends on the gate having all three engines installed. A chromium/webkit/firefox revision check in the gate's preflight would show the gap as an environment error, not an orphaned AC.

## Batches
- Batch 0 (check only, no edits): `test_UAT_AC688_`. The builder makes no edits to tests, ACs or code. It checks whether firefox-1532 and webkit-2311 are now in the Playwright cache. If they are, it runs `test_UAT_AC688_` and reports the result. If they are not, it reports stuck, citing BUG-1695 and the install command, without trying the install again (the sandbox refused it before).

## Resolution ladder (REQ-938)
- Batch 0: rung 3 decides. The test stands, and no code change is called for. Rung 1: no intent in scope covers cross-engine rendering or Playwright. Rung 2: the reference pins playwright ^1.61.1 (`tools/generate/package.json:21`) and keeps the AC-688 test unchanged. Rung 3: the test is correct and blocked only by the environment and by XGD tooling defect BUG-1695.
