---
uid: report-4cbb931f
id: REPORT-11896
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T14:05:16.056757+00:00'
updated_at: '2026-11-09T14:12:42.782264+00:00'
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
    hypothesis: AC-688 is orphaned only because its AC-permitted skip (pinned playwright
      1.61.1 needs webkit-2311/firefox-1532; gate cache re-checked in iteration 43
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
  fix_iteration: 43
  batches_pending: false
---

# Fix Plan — Iteration 43

## Hypothesis
AC-688 is orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips, and the AC permits that skip when an engine cannot launch. The pinned playwright 1.61.1 needs firefox-1532 and webkit-2311, but the gate machine has only firefox-1538 and webkit-2336. The coverage gate counts the permitted skip as an orphan, which is XGD BUG-1695.

## Analysis
- Quality report-866d7442 (commit 0046782d0e) shows lint, build and preflight green, with 54 passed and 0 failed. The one finding is that AC-688 is orphaned.
- Only xgd change-log metadata and the new quality report have changed since iteration 42. Code, tests and ACs are unchanged.
- I checked the environment again this iteration. `~/Library/Caches/ms-playwright` holds chromium-1228/1234/1243/1248, firefox-1538 and webkit-2336. firefox-1532 and webkit-2311 are still missing.
- Iteration 42's builder (report-c3c8e081) returned `status: fixed`: AC-687 passed with no edits, and it raised no `blocked_by`. The earlier code_frozen request (report-dacf5f5d) was declined on rung 2, because the reference pins playwright ^1.61.1 at tools/generate/package.json:21. That ruling stands.
- **BUG-1067 rule applied:** AC-688's test is stuck on XGD BUG-1695 and on a browser install that can only be done outside the sandbox. It is left out of the batches and named here, and BUG-1695 is recorded in batch 0's `ladder.rung3`.
- **Hypothesis history:** this is the 42nd consecutive iteration with the same confirmed hypothesis. Re-planning cannot clear it.
- **What clears AC-688:** either the operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox` outside the sandbox, or BUG-1695 is fixed so that an AC-permitted skip is not counted as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0 is verification only. It re-runs `test_UAT_AC687_` (a pure validator, with no browser) to keep the scoped suite green, and makes no edits. AC-688 is excluded under BUG-1067.

## Resolution ladder (REQ-938)
- Batch 0: rung 1 does not decide, because no intent in scope addresses the playwright pin or browser availability. Rung 2 shows that the reference pins playwright ^1.61.1 at tools/generate/package.json:21, the same as the working tree. Rung 3: the tests stand. AC-688 is stuck on BUG-1695 plus the missing pinned browsers, and it is not re-batched.