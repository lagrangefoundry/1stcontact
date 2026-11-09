---
uid: report-cb88ecc9
id: REPORT-11856
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T12:27:30.364435+00:00'
updated_at: '2026-11-09T12:27:30.364435+00:00'
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
      (a pure validator test that needs no browser engine) and confirm it passes.
      AC-688 is deliberately excluded: it is stuck on XGD BUG-1695 and on browser
      revisions missing from the gate machine, which only the operator can install
      outside the sandbox. Report the AC-687 result and stop.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser-engine availability, so rung 1 does not decide.
      rung2: 'Rung 2: the reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, so the repo is as the user intends.'
      rung3: 'BUG-1695: AC-688 and test_UAT_AC688_no_layout_divergence_across_three_engines
        stand; stuck on missing pinned webkit/firefox plus XGD BUG-1695 (AC-permitted
        skip counted as orphan); not re-batched per BUG-1067.'
  fix_iteration: 35
---

# Fix Plan — Iteration 35

## Hypothesis
AC-688 is still orphaned for the same reason as in iterations 1–34. Its one test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips when the browsers can't launch, which the AC allows. The gate machine's Playwright cache holds firefox-1538 and webkit-2336, but the pinned playwright 1.61.1 needs firefox-1532 and webkit-2311, so the test skips. XGD's coverage gate then counts that permitted skip as an orphan (XGD tooling defect BUG-1695). No change in the repo can clear it.

## Analysis
- Quality report-c69e8439 (commit fe3f6020): lint, build and preflight are green. 54 tests ran and 0 failed. The only finding is AC-688 orphaned.
- Iteration 34's single verification batch (report-6b74c96b) ran clean: the assessment (report-c3eddd72) has status `pass`. `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message` passed and no edits were made. Since that plan, only xgd change-log metadata and the new quality report have changed. Nothing in the repo moved, so the diagnosis stands.
- **BUG-1067 rule applied (as in iterations 31–34).** AC-688's test is stuck on XGD BUG-1695, and the only other fix is outside the repo and the sandbox: installing the pinned browser revisions on the gate machine. The test is therefore **left out of the batches** and named here with BUG-1695, which is also recorded in `ladder.rung3`.
- **No dependency or code change.** Bumping Playwright to match the cached browsers is ruled out at rung 2. The reference pins `playwright ^1.61.1` at `tools/generate/package.json:21`, the same as the working tree. The external-cause exception (REQ-910) does not apply either: the test skips at the reference, it does not fail.
- The batch below is a verification-only placeholder. Like iteration 34's, it names no production file and uses a test that needs no browser. Chromium cannot launch in the builder sandbox (BUG-1685).
- Operator action that would clear AC-688 (outside the sandbox): `pnpm --filter ./tools/generate exec playwright install webkit firefox`. Fixing XGD BUG-1695 would also clear it.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0: verification only. Run AC-687, a pure validator test in the same file as AC-688, and confirm it is still green. Make no edits. AC-688 is excluded under BUG-1067 / BUG-1695.

## Resolution ladder (REQ-938)
- Batch 0:
  - Rung 1 does not decide: no intent in scope (REQ-219/220/221/222, BUG-78) touches the Playwright pin or browser availability.
  - Rung 2 confirms the repo is as the user intends: the reference pins playwright ^1.61.1 (`tools/generate/package.json:21`), the same as now.
  - Rung 3: AC-688 and its test stand. They are stuck on XGD BUG-1695 and on browser revisions missing from the gate machine, and are not re-batched.
