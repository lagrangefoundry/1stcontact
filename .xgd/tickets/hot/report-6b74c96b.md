---
uid: report-6b74c96b
id: REPORT-11851
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T12:15:33.935698+00:00'
updated_at: '2026-11-09T12:22:49.346217+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 34
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because its AC-permitted skip (pinned playwright
      1.61.1 needs webkit-2311/firefox-1532; cache holds webkit-2336/firefox-1538)
      is counted as an orphan by XGD BUG-1695; per the BUG-1067 rule its test is left
      out of the batches and no repo change is needed.
    instructions: 'Verification only; make no edits to tests, ACs, stories or production
      code. Run test_UAT_AC687_multiple_violations_all_reported_with_path_and_message
      (a pure validator test, no browser engine required) and confirm it passes. AC-688
      is deliberately excluded from this batch: it is stuck on XGD BUG-1695 and on
      browser revisions missing from the gate machine, which only the operator can
      install outside the sandbox. Report the AC-687 result and stop.'
    test_scope: test_UAT_AC687_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser-engine availability, so rung 1 does not decide.
      rung2: 'Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, so the repo is as the user intends.'
      rung3: 'BUG-1695: AC-688 and test_UAT_AC688_no_layout_divergence_across_three_engines
        stand; stuck on missing pinned webkit/firefox plus XGD BUG-1695 (AC-permitted
        skip counted as orphan); not re-batched per BUG-1067.'
  batches_pending: false
---

# Fix Plan — Iteration 34

## Hypothesis
AC-688 is orphaned only because its single test skips, which the AC allows, when WebKit and Firefox cannot launch. The gate machine's Playwright browser cache holds firefox-1538 and webkit-2336, but the pinned playwright 1.61.1 needs firefox-1532 and webkit-2311. XGD's coverage gate counts that permitted skip as an orphaned AC (XGD tooling defect BUG-1695). Nothing in the repo is wrong, and no batch can clear the orphan.

## Analysis
- Quality report-b37a54fd: lint, build and preflight all green; 54 tests run, 0 failed. The only finding is AC-688 orphaned. `test_UAT_AC688_no_layout_divergence_across_three_engines` was reported `skipped`.
- The test runs only when all three engines launch. AC-688's Verification text says it "skips cleanly otherwise", so the test conforms to the AC, and the AC describes real behaviour.
- The diagnosis is settled and unchanged since iteration 1 (report-dacf5f5d): the installed browser revisions do not match the pinned Playwright. Every assessment since has ended `stuck` or `fixed_unverified` on the same cause.
- **BUG-1067 rule applied (unchanged from iterations 31–33).** The builder named an XGD tooling defect, BUG-1695 (an AC-permitted skip is counted as an orphan), and the only other fix lies outside the repo and the sandbox. AC-688's test is therefore **left out of the batches**. It is named here with BUG-1695, and the bug ID is recorded in `ladder.rung3`. Re-batching it cannot change the outcome.
- **What this iteration does differently.** Iteration 33's plan (report-3463f87e) fell through: its instructions named frozen production files, even though only to forbid touching them, and the validator read that as an edit without a `code_frozen` override. This plan's instructions name **no production file**.
- **Verification test changed.** Its verification batch used AC-683, which needs Chromium. Chromium cannot launch inside the builder sandbox (BUG-1685), so the builder could only report `fixed_unverified` (report-36277a10). This batch uses AC-687 instead. It is a pure validator test in the same file and needs no browser engine, so the builder can actually run it.
- Overrides considered and rejected:
  - A `code_frozen` override to bump Playwright fails condition 3. The reference pins `"playwright": "^1.61.1"` (`reconcile-src-BUNDLE-43:tools/generate/package.json:21`), the same as the working tree, so rung 2 already settles the pin.
  - The REQ-910 `external_cause` path is unavailable: the test *skips* at the reference rather than failing with an error, and the mechanical check requires a failure.
  - `aligned_to_tip` does not apply: the reference implements the behaviour, and it is the environment that cannot exercise it.
- **Operator action that clears AC-688** (outside the sandbox): `pnpm --filter ./tools/generate exec playwright install webkit firefox`. Alternatively, fix BUG-1695 so that a skip the AC allows does not count as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent environment skip) — when the engines aren't all ready, record which engine's probe failed and why (the revision mismatch), so the orphan report names the missing browser without a manual diagnosis.

## Batches
One batch, verification only, with no edits. It holds `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message`, which shares AC-688's test file but needs no browser, so it keeps the file's non-browser evidence green. AC-688's test is excluded under BUG-1067, and BUG-1695 is recorded in `ladder.rung3`.

## Resolution ladder (REQ-938)
- Batch 0 was decided at rung 2:
  - Rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser-engine availability.
  - Rung 2: the reference pins playwright ^1.61.1 at `tools/generate/package.json:21`, identical to the working tree, so the repo is as the user intends.
  - Rung 3: AC-688 and its test stand. The orphan is stuck on the missing pinned WebKit/Firefox plus XGD BUG-1695 and is not re-batched (BUG-1067).