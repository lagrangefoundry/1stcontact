---
uid: report-c041c3b1
id: REPORT-11839
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:40:48.918637+00:00'
updated_at: '2026-11-09T11:40:48.918637+00:00'
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
    hypothesis: 'AC-688 is orphaned because its three-engine test is a permitted skip:
      the Playwright cache has firefox-1538/webkit-2336 while Playwright 1.61.1 needs
      firefox-1532/webkit-2311, and XGD counts the permitted skip as missing evidence
      (BUG-1695)'
    instructions: 'Make no edits to tests, ACs, stories or code. AC-688 and its test
      are correct; the gap is the gate environment plus XGD tooling defect BUG-1695.
      Check ~/Library/Caches/ms-playwright for firefox-1532 and webkit-2311. If both
      are present, run test_UAT_AC688_ and report the real result. If not, report
      stuck citing BUG-1695 and the operator remedy to run outside the sandbox: pnpm
      --filter @1stcontact/generate exec playwright install webkit firefox. Do not
      retry the install, bump Playwright, deprecate AC-688, or alter the engine probe.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches
        cross-engine rendering or the Playwright version.
      rung2: The reference pins playwright ^1.61.1 at tools/generate/package.json:21
        and keeps the AC-688 test unchanged, so it does not decide against the test.
      rung3: 'Decided at rung 3: the test stands with no code change; it is blocked
        only by the missing webkit-2311/firefox-1532 builds and XGD tooling defect
        BUG-1695.'
  fix_iteration: 30
---

# Fix Plan — Iteration 30

## Hypothesis
AC-688's only test is skipped, not failing. The gate machine has no WebKit or Firefox build that Playwright 1.61.1 can launch: the cache has firefox-1538 and webkit-2336, and that version needs firefox-1532 and webkit-2311. XGD's coverage check then counts that allowed skip as an orphaned AC (BUG-1695). This is an environment and XGD tooling defect, not a product or test defect.

## Analysis
- Scoped quality report-8c46a80f (commit 0d2b269c): 54 tests ran and 54 passed. Lint, build and preflight are clean. The only failure is the AC Coverage entry "AC-688 (orphaned acceptance criterion)", the same as in all 29 previous iterations.
- `test_UAT_AC688_no_layout_divergence_across_three_engines` (`tests/reconciliation-l1-substrate.test.ts`) runs only when chromium, webkit and firefox all launch, and AC-688 itself allows it to skip otherwise. Chromium launches: the chromium-only AC-683 test passes.
- `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts:305`) returns false for webkit and firefox because the installed builds don't match the pinned Playwright 1.61.1 (`"playwright": "^1.61.1"` at `tools/generate/package.json:21` on `reconcile-src-BUNDLE-43`).
- The history is the same every time. The builder has reported stuck with this diagnosis repeatedly (report-dacf5f5d: blocked_by code_frozen; report-d973247a: sandbox_refusal, EPERM on `~/Library/Caches/ms-playwright/__dirlock`). The install cannot run inside the sandbox. The tooling defect, a permitted skip counted as a missing passing test, is filed as **BUG-1695**.
- Under the BUG-1067 rule this test is not given back to the builder as a fix task. The test, the AC and the code are all correct. Only actions outside this story's scope can clear it:
  1. The operator runs, outside the sandbox: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`
  2. Or XGD's coverage check is fixed to accept an AC-permitted, environment-gated skip (BUG-1695).
- Ruling on the old blocked_by request (report-dacf5f5d, rule code_frozen): it stays declined, as in earlier iterations. No intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches Playwright, and the reference pins 1.61.1. Bumping the dependency to match one machine's browser cache is not grounded in any intent. It would also need network access for `pnpm install`, which the sandbox refuses.
- Re-planning the same hypothesis a 30th time cannot converge. The single batch below exists only to record the ladder and the bug ID for the run's diagnostic report. It tells the builder to make no edits.

## Spec Changes Made
None. AC-688 is correct. It must not be deprecated or rewritten.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnostics) — when it skips, it should report which engine failed to launch and the Playwright error, so the gap shows in the report itself.

## Batches
- Batch 0: the AC-688 test alone, with no edits. The builder checks whether firefox-1532 and webkit-2311 now exist in `~/Library/Caches/ms-playwright`. If they do, it runs `test_UAT_AC688_` and reports the real result. If they don't, it reports stuck, citing BUG-1695 and the operator command above. It must not retry the install.

## Resolution ladder (REQ-938)
- Batch 0: decided at rung 3. Rung 1: no intent in scope covers cross-engine rendering or the Playwright version. Rung 2: the reference pins playwright ^1.61.1 and keeps the test unchanged, so it does not decide against the test. Rung 3: the test stands and no code change is needed. It is blocked only by the missing browser builds and XGD tooling defect BUG-1695.
