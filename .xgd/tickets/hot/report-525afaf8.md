---
uid: report-525afaf8
id: REPORT-11876
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T13:16:33.369762+00:00'
updated_at: '2026-11-09T13:16:33.369762+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 39
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because its AC-permitted skip (pinned playwright
      1.61.1 needs webkit-2311/firefox-1532; gate cache re-checked in iteration 39
      still holds only webkit-2336/firefox-1538) is counted as an orphan by XGD BUG-1695;
      per BUG-1067 its test is left out of the batches.
    instructions: 'Verification only; make no edits to tests, ACs, stories or production
      code. Run test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
      (a pure validator test needing no browser engine) and confirm it passes. AC-688
      is deliberately excluded: it is stuck on XGD BUG-1695 and on browser revisions
      missing from the gate machine, which only the operator can install outside the
      sandbox (pnpm --filter ./tools/generate exec playwright install webkit firefox).
      Report the AC-687 result and stop.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser-engine availability, so rung 1 does not decide.
      rung2: The reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, so the repo is as the user intends and the
        earlier code_frozen request stays declined.
      rung3: 'BUG-1695: AC-688 and test_UAT_AC688_no_layout_divergence_across_three_engines
        stand; stuck on missing pinned webkit-2311/firefox-1532 plus XGD BUG-1695
        (AC-permitted skip counted as orphan); not re-batched per BUG-1067.'
---

# Fix Plan — Iteration 39

## Hypothesis
AC-688 is still orphaned for the same reason as iterations 1–38, and the cause is outside the repo. Its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips when an engine can't launch, which the AC allows. Pinned playwright 1.61.1 needs firefox-1532 and webkit-2311, but the gate machine's browser cache still holds only firefox-1538 and webkit-2336. The coverage gate counts the permitted skip as an orphan (XGD BUG-1695).

## Analysis
- Quality report-4bd05bb9 (commit 8c2bee5397): lint, build and preflight are green, with 54 tests passed and 0 failed. The only finding is that AC-688 is orphaned.
- Since iteration 38, only xgd change-log metadata and the new quality report have changed. Repo code, tests and ACs are the same.
- I checked the environment again this iteration. `~/Library/Caches/ms-playwright` contains chromium-1228/1234/1243/1248, firefox-1538 and webkit-2336. firefox-1532 and webkit-2311 are still missing, so `engineAvailable` (tools/generate/src/cli/capture/playwright-driver.ts:305) still returns false for webkit and firefox.
- No new `blocked_by` report arrived this iteration. The earlier code_frozen request (report-dacf5f5d) was declined in iteration 2 on rung 2, because the reference pins playwright ^1.61.1 at tools/generate/package.json:21. That ruling stands.
- **BUG-1067 rule applied:** AC-688's test is stuck on XGD BUG-1695 plus a browser install outside the sandbox. It is left out of the batches, named here, and BUG-1695 is recorded in batch 0's `ladder.rung3`.
- **Hypothesis history:** carried for 38 iterations and confirmed every time. Re-planning cannot change the outcome. The run needs the operator.
- **Operator action that clears AC-688** (outside the sandbox): `pnpm --filter ./tools/generate exec playwright install webkit firefox`. Fixing BUG-1695, so that an AC-permitted skip is not counted as an orphan, would also clear it.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none new (flags from earlier iterations still apply)

## Batches
- Batch 0 is verification only. It re-runs `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message`, a validator test in the same file that needs no browser, and makes no edits. AC-688 is excluded under BUG-1067.

## Resolution ladder (REQ-938)
- Batch 0:
  - Rung 1 does not decide: no intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) addresses the Playwright pin or which browser engines are installed.
  - Rung 2 shows the repo is as intended: the reference pins playwright ^1.61.1 at tools/generate/package.json:21, the same as the working tree.
  - Rung 3: AC-688 and its test stand. They are stuck on the missing pinned browsers and on XGD BUG-1695, and are not re-batched.
