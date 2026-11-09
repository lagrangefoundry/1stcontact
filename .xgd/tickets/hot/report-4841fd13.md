---
uid: report-4841fd13
id: REPORT-11866
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T12:52:09.578005+00:00'
updated_at: '2026-11-09T12:52:09.578005+00:00'
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
    hypothesis: AC-688 is orphaned only because its AC-permitted skip (pinned playwright
      1.61.1 needs webkit-2311/firefox-1532; gate cache holds webkit-2336/firefox-1538)
      is counted as an orphan by XGD BUG-1695; per BUG-1067 its test is left out of
      the batches and no repo change is needed.
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
      rung2: 'Rung 2: the reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, so the repo is as the user intends.'
      rung3: 'BUG-1695: AC-688 and test_UAT_AC688_no_layout_divergence_across_three_engines
        stand; stuck on missing pinned webkit/firefox plus XGD BUG-1695 (AC-permitted
        skip counted as orphan); not re-batched per BUG-1067.'
  fix_iteration: 37
---

# Fix Plan — Iteration 37

## Hypothesis
AC-688 is still orphaned for the same reason as in iterations 1–36. Its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips when the browser engines can't launch, which the AC allows. Pinned playwright 1.61.1 needs firefox-1532 and webkit-2311, but the gate machine's cache holds firefox-1538 and webkit-2336. The coverage gate counts that permitted skip as an orphan (XGD tooling defect BUG-1695). No change in the repo can clear it.

## Analysis
- Quality report-06ced0ec (commit 4acea73abe): lint, build and preflight green; 54 tests run, 0 failed. Only finding: AC-688 orphaned.
- Since iteration 36, only xgd change-log metadata and the new quality report have changed. The repo has not moved, so the diagnosis stands.
- Latest assessment (report-dacf5f5d): the builder made no edits. It confirmed the test and the AC are correct, and that the only fix is the operator-side browser install (or a Playwright bump, which rung 2 rules out).
- **BUG-1067 rule applied:** AC-688's test is stuck on XGD BUG-1695 plus a browser install outside the sandbox. It is **left out of the batches**, named here with BUG-1695, and BUG-1695 is recorded in `ladder.rung3`.
- **Rung 2 re-checked:** `git show reconcile-src-BUNDLE-43:tools/generate/package.json` pins `"playwright": "^1.61.1"` at line 21, the same as the working tree. REQ-910's external-cause exception does not apply: the test skips at the reference rather than failing.
- **Hypothesis history:** carried for 36 iterations and confirmed. The blocker is outside the repo, so re-planning cannot change the outcome. The run needs the operator.
- **Operator action that clears AC-688** (run outside the sandbox): `pnpm --filter ./tools/generate exec playwright install webkit firefox`. Fixing BUG-1695 would also clear it.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (skip is silent) — record which engine failed to launch and the launch error when skipping, so the gate report names the missing browser revision.

## Batches
One verification-only batch: re-run `test_UAT_AC687_` (a pure validator test that needs no browser) to confirm the story stays green. No edits. AC-688 is excluded under the BUG-1067 rule.

## Resolution ladder (REQ-938)
- Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) touches the Playwright pin or browser-engine availability, so it does not decide.
- Rung 2 (decides for the repo): the reference pins playwright ^1.61.1 at tools/generate/package.json:21, identical to the working tree, so no code or dependency change.
- Rung 3: AC-688 and its test stand. Stuck on BUG-1695 and the missing pinned webkit/firefox revisions; not re-batched (BUG-1067).
