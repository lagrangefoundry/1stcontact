---
uid: report-01b792e0
id: REPORT-11844
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:52:59.426085+00:00'
updated_at: '2026-11-09T11:52:59.426085+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 31
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: 'Environment, not repo: the cached Playwright browsers (firefox-1538,
      webkit-2336) do not match the revisions playwright 1.61.1 needs (firefox-1532,
      webkit-2311), so the AC-688 test skips as the AC permits, and the gate counts
      that skip as an orphan (XGD BUG-1695).'
    instructions: Check only; make no edits. Find out whether webkit-2311 and firefox-1532
      are now in the Playwright browser cache. If they are, run test_UAT_AC688_no_layout_divergence_across_three_engines
      and report the real result. If they are not, or the sandbox refuses the check,
      report stuck citing BUG-1695 and the operator command `pnpm --filter ./tools/generate
      exec playwright install webkit firefox`. Do not edit the test, AC-688, the engineAvailable
      probe (playwright-driver.ts:305), tools/generate/package.json or the lockfile.
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser-engine availability, so rung 1 does not decide.
      rung2: 'Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        the same as the working tree, so the repo is as intended and the reference
        skips AC-688 identically on this machine.'
      rung3: The test stands and matches AC-688; it is stuck on the gate machine missing
        the pinned browsers plus XGD BUG-1695 (an AC-permitted skip counted as an
        orphan), and is not re-batched for a fix.
---

# Fix Plan — Iteration 31

## Hypothesis
AC-688 is orphaned because its only test skips: the machine's Playwright browser cache (firefox-1538, webkit-2336) does not match the revisions the pinned playwright 1.61.1 needs (firefox-1532, webkit-2311), so webkit and firefox never launch. The coverage gate then counts the AC-permitted skip as "no passing test" (XGD tooling bug BUG-1695). Nothing in the repo is wrong.

## Analysis
- Quality report-e72d7c43: 54 tests, 0 failed; the only failure is AC-688 orphaned.
- `tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines` runs only when chromium, webkit and firefox all launch. AC-688's own Verification text says "Runs only when all three engines are installed; skips cleanly otherwise." The test matches the AC.
- Chromium works (AC-683 passes). Webkit and firefox fail the `engineAvailable` probe (`tools/generate/src/cli/capture/playwright-driver.ts:305`) because of the revision mismatch. Builder assessments report-dacf5f5d and report-96c98564 diagnosed this, and every plan from iteration 2 on (report-e7c1a640, report-cc3ca007, ...) agreed.
- The reference `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, the same as the working tree, so the reference skips this test the same way on this machine.
- History: 30 iterations, one hypothesis, no change in outcome. Prior builders reported stuck, citing BUG-1695 (the gate treats an AC-permitted skip as an orphan). Under the BUG-1067 rule, this test is not batched for another fix attempt. The run cannot converge until an operator, outside the sandbox, installs the pinned browsers: `pnpm --filter ./tools/generate exec playwright install webkit firefox`.
- This planner could not check the browser cache this turn: the session's permission mode refused reading `~/Library/Caches/ms-playwright`.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnostics) — when it skips, record which engine failed to launch and the launch error, so the gate report names the missing browser.

## Batches
One check-only batch for the AC-688 test. It does not ask for a fix. The builder confirms whether webkit-2311 and firefox-1532 are now installed. If they are, it runs the test and reports the real result. If not, it reports stuck citing BUG-1695 and the install command, and makes no edits. It must not edit the test, the AC, the probe, `package.json` or the lockfile.

## Resolution ladder (REQ-938)
- Batch 0: rung 2 decided. No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or engine availability. The reference pins playwright ^1.61.1 (`tools/generate/package.json:21`), as the working tree does. The test stands, and the blocker is an environmental issue tracked as XGD BUG-1695.
