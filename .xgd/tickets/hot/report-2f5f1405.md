---
uid: report-2f5f1405
id: REPORT-11936
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T15:51:59.180689+00:00'
updated_at: '2026-11-09T15:51:59.180689+00:00'
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
      ^1.61.1 needs webkit-2311/firefox-1532; gate cache re-checked in iteration 51
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
      rung2: The reference pins playwright ^1.61.1 in tools/generate/package.json,
        identical to the working tree, so the repo is as the user intends and the
        earlier code_frozen request stays declined.
      rung3: 'BUG-1695: AC-688 and test_UAT_AC688_no_layout_divergence_across_three_engines
        stand; stuck on missing pinned webkit-2311/firefox-1532 (operator install
        required) plus XGD BUG-1695 (AC-permitted skip counted as orphan); not re-batched
        per BUG-1067.'
  fix_iteration: 51
---

# Fix Plan — Iteration 51

## Hypothesis
AC-688 is orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips. The AC allows that skip when an engine is missing. Pinned playwright ^1.61.1 needs firefox-1532 and webkit-2311, and the gate machine's cache still holds only firefox-1538 and webkit-2336. The coverage gate counts that allowed skip as an orphan, which is XGD BUG-1695. Nothing in the repo is wrong.

## Analysis
- Parent quality report report-d32dcb8f (commit 5655bcb1): lint, build and preflight are green, and 54 tests passed with 0 failed. The one finding is AC-688 (orphaned).
- **Changes since iteration 50:** only `.xgd/_changes/*` and the new quality report. Code, tests, ACs and dependencies are unchanged.
- **Gate environment:** I re-checked it read-only this iteration. `~/Library/Caches/ms-playwright` still lists chromium 1228/1234/1243/1248, `firefox-1538` and `webkit-2336`. It has no firefox-1532 and no webkit-2311. `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts:305`) therefore still returns false for webkit and firefox, and `it.runIf(allEnginesReady)` (`tests/reconciliation-l1-substrate.test.ts:530-537`) skips the test.
- **AC, test and code agree.** AC-688's Verification says the test "Runs only when all three engines are installed; skips cleanly otherwise". Only the gate's counting of an allowed skip disagrees with them.
- **History** (story-d0a8cfad, read by subject uid):
  - Iteration 2 (report-e7c1a640) declined the builder's `blocked_by: code_frozen` request (report-dacf5f5d: bump Playwright to match the cache) on rung 2.
  - The builder's install attempt was refused by the sandbox (`EPERM` on `~/Library/Caches/ms-playwright/__dirlock`, report-d973247a).
  - Iterations 12-50 left AC-688 out of the batches under the BUG-1067 rule, cited BUG-1695 in `ladder.rung3`, and ran a check-only batch on AC-687, which passed each time with no edits.
- **Hypothesis count:** the diagnosis is confirmed and the blocker lies outside the run, so this is not the stuck-planner pattern. Each alternative was rejected earlier and still fails:
  - Playwright bump: rung 2 rules it out, and there is no registry access.
  - `aligned_to_tip`: not valid, because the reference implements three-engine capture.
  - `external_cause`: not valid, because the test skips at the reference rather than failing with an error.
  - Skip markers or weakened assertions: forbidden.
- **No new `blocked_by` request.** The code_frozen request was declined in iteration 2, and that ruling stands.
- **Outside actions that would clear AC-688 (either one is enough):**
  1. The operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox` outside the sandbox.
  2. XGD fixes BUG-1695, so that a skip the AC allows no longer counts as an orphan.
- More iterations of this loop cannot converge. The run needs one of the two actions above.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent skip) — make the skip message name which engine failed to launch and why (the missing browser revision).

## Batches
- **Batch 0 (check only, no edits):** `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message`.
  - It is a pure validator test in the same file and needs no browser.
  - It carries the ladder record (BUG-1695) into the diagnostic report.
  - AC-688 is left out on purpose (BUG-1067 / BUG-1695).

## Resolution ladder (REQ-938)
- **Batch 0, rung 1:** no intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser availability, so rung 1 does not decide.
- **Batch 0, rung 2:** reconcile-src-BUNDLE-43 pins `"playwright": "^1.61.1"` in `tools/generate/package.json`, the same as the working tree, so the code stays.
- **Batch 0, rung 3:** AC-688 and its test stand. They are stuck on XGD BUG-1695 and on the webkit-2311 and firefox-1532 builds missing from the gate machine (operator install required), so per BUG-1067 they are not re-batched.
