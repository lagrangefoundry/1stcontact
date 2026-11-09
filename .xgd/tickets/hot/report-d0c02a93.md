---
uid: report-d0c02a93
id: REPORT-11941
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T16:06:34.968700+00:00'
updated_at: '2026-11-09T16:06:34.968700+00:00'
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
      ^1.61.1 needs webkit-2311/firefox-1532, absent from the gate machine) is counted
      as an orphan by XGD BUG-1695; per BUG-1067 its test is left out of the batches.
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
      rung2: The reference pins playwright ^1.61.1 in tools/generate/package.json,
        identical to the working tree, so the repo is as the user intends and the
        earlier code_frozen request stays declined.
      rung3: 'BUG-1695: AC-688 and test_UAT_AC688_no_layout_divergence_across_three_engines
        stand; stuck on missing pinned webkit-2311/firefox-1532 (operator install
        required) plus XGD BUG-1695 (AC-permitted skip counted as orphan); not re-batched
        per BUG-1067.'
  fix_iteration: 52
---

# Fix Plan — Iteration 52

## Hypothesis
AC-688 is orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips. The AC allows that skip when an engine is missing. Pinned playwright ^1.61.1 needs webkit-2311 and firefox-1532, and those browsers are not installed on the gate machine. The coverage gate then counts the allowed skip as an orphan, which is XGD BUG-1695. Nothing in the repo is wrong.

## Analysis
- **Parent quality report** report-d11a8019 (commit 48993ce4): lint, build and preflight are green, and 54 tests passed with 0 failed. The only finding is AC-688 (orphaned).
- **Changes since iteration 51:** only `.xgd/_changes/*` and the new quality report. Code, tests, ACs and dependencies are unchanged, so nothing that decided iteration 51 has moved.
- **Last batch** (report-01c821e3, iteration 51): a check-only run of AC-687. It passed with no edits. The builder confirmed that AC-688 was left out on purpose because of BUG-1695 and the missing browsers.
- **Gate environment:** this iteration I could not re-check `~/Library/Caches/ms-playwright`; the session's don't-ask mode refused the read. Iteration 51 checked it and found only firefox-1538 and webkit-2336. The quality report still lists AC-688 as orphaned, which means the test still skips, which means the operator has not yet installed the pinned browsers.
- **AC, test and code agree.** AC-688's Verification text is "Runs only when all three engines are installed; skips cleanly otherwise", and `it.runIf(allEnginesReady)` in `tests/reconciliation-l1-substrate.test.ts` does exactly that.
- **History:**
  - Iteration 2 (report-e7c1a640) declined `blocked_by: code_frozen` on rung 2, because the reference pins the same Playwright version.
  - The builder's install attempt failed: the sandbox refused the write to `~/Library/Caches/ms-playwright` with `EPERM` (report-d973247a).
  - Iterations 12–51 left AC-688 out of the batches under the BUG-1067 rule, cited BUG-1695 in `ladder.rung3`, and ran a check-only batch on AC-687.
- **Hypothesis count:** the diagnosis is confirmed, not refuted. The blocker is outside the story's scope (an XGD tooling defect plus an operator-only install), so the BUG-1067 rule applies and AC-688 is not re-batched. A "structurally different hypothesis" would mean inventing a fault in the repo, and the evidence shows there isn't one.
- **No blocked_by request is pending this iteration:** the last assessment reported `status: pass` with no `blocked_by`.
- **To end the loop, either:**
  1. the operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox` outside the sandbox, or
  2. XGD fixes BUG-1695 so that a skip the AC allows is not counted as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnostics) — when it skips, it should record which engine failed `engineAvailable` and the expected browser revision, so the gate report names the missing install directly.

## Batches
- **Batch 0** is check-only: `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message`, a pure validator test with no browser dependency, kept green as blast radius.
- AC-688 is excluded under the BUG-1067 rule, and BUG-1695 is recorded in `ladder.rung3`.

## Resolution ladder (REQ-938)
- **Batch 0, rung 1:** no intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser availability, so rung 1 does not decide.
- **Batch 0, rung 2:** the reference `reconcile-src-BUNDLE-43` pins playwright ^1.61.1 in `tools/generate/package.json`, identical to the working tree. The repo is as the user intends, and the earlier `code_frozen` request stays declined.
- **Batch 0, rung 3:** AC-688 and its test stand. The test is stuck on an operator-only browser install plus XGD BUG-1695, so it is not re-batched.
