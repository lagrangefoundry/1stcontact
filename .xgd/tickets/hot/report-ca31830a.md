---
uid: report-ca31830a
id: REPORT-11926
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T15:24:27.993311+00:00'
updated_at: '2026-11-09T15:32:28.898811+00:00'
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
      ^1.61.1 needs webkit-2311/firefox-1532; gate cache re-checked this iteration
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
        stand; stuck on missing pinned webkit-2311/firefox-1532 (operator install
        required) plus XGD BUG-1695 (AC-permitted skip counted as orphan); not re-batched
        per BUG-1067.'
  fix_iteration: 49
  batches_pending: false
---

# Fix Plan — Iteration 49

## Hypothesis
AC-688 is orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips. The AC allows that skip when an engine is missing. Pinned playwright ^1.61.1 needs firefox-1532 and webkit-2311, and the gate machine's cache still holds only firefox-1538 and webkit-2336. The coverage gate counts that allowed skip as an orphan, which is XGD BUG-1695. Nothing in the repo is wrong.

## Analysis
- Parent quality report report-12638cb7 (commit cfdba220): lint, build and preflight are green, and 54 tests passed with 0 failed. The one finding is AC-688 (orphaned).
- **Changes since iteration 48:** only `.xgd/_changes/*` and the new quality report. Code, tests, ACs and dependencies are unchanged.
- **Gate environment:** I re-checked it read-only this iteration. `~/Library/Caches/ms-playwright` still lists chromium 1228/1234/1243/1248, `firefox-1538` and `webkit-2336`. It has no firefox-1532 and no webkit-2311. `engineAvailable` (`tools/generate/src/cli/capture/playwright-driver.ts:305`) therefore still returns false for webkit and firefox.
- **AC, test and code agree.** AC-688's Verification says the test "Runs only when all three engines are installed; skips cleanly otherwise". The test (`tests/reconciliation-l1-substrate.test.ts:536-569`, `it.runIf(allEnginesReady)`) does exactly that. Only the gate's counting of an allowed skip disagrees with them.
- **History** (story-d0a8cfad, read by subject uid):
  - Iterations 2-11 batched the AC-688 test. The builder made no edits each time.
  - The builder's install attempt was refused with `EPERM: mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'` (report-d973247a).
  - Its `blocked_by: code_frozen` request (report-dacf5f5d: bump Playwright to match the cache) was declined on rung 2, because the reference pins `"playwright": "^1.61.1"` at `tools/generate/package.json:21`.
  - Iterations 12-48 left AC-688 out of the batches under the BUG-1067 rule and carried the bug ID in `ladder.rung3`. Iterations 12-48 cited BUG-1695, BUG-1696 and BUG-1697 for the same defect; I use BUG-1695, the ID iteration 48 used.
  - BUG-1695 is not in this project's ticket store (`xgd ticket get BUG-1695`: not found). Earlier plans say it was filed against XGD itself.
- **Hypothesis count:** this hypothesis has been confirmed in 47 consecutive iterations. No structurally different hypothesis fits the evidence, and the earlier alternatives were each rejected:
  - Playwright bump: blocked by rung 2, and there is no registry access.
  - Sandbox-writable `PLAYWRIGHT_BROWSERS_PATH`: the gate process would not see it.
  - `aligned_to_tip`: not valid, because the reference implements three-engine capture.
  - `external_cause`: not valid, because the test skips at the reference rather than failing with an error.
  - Skip markers or weakened assertions: forbidden.
- Per the BUG-1067 rule, AC-688 is **not re-batched**. Re-planning cannot clear it. Only one of two outside actions can:
  1. The operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox` outside the sandbox.
  2. XGD fixes BUG-1695, so that a skip the AC allows no longer counts as an orphan.
- **No new `blocked_by` request** since report-dacf5f5d, which was declined in iteration 2. That ruling stands.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (silent skip) — make the skip message name which engine failed to launch and why (the missing browser revision), so the gate report points straight at it.

## Batches
- **Batch 0 (check only, no edits):** `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message`.
  - It is a pure validator test in the same file and needs no browser.
  - It keeps the plan valid, confirms the file stays green, and carries the ladder record (BUG-1695) into the diagnostic report.
  - AC-688 is left out on purpose (BUG-1067 / BUG-1695).

## Resolution ladder (REQ-938)
- **Batch 0, rung 1:** no intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser availability, so rung 1 does not decide.
- **Batch 0, rung 2 decides the code stays:** reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21, the same as the working tree, with the same AC-688 skip precondition.
- **Batch 0, rung 3:** AC-688 and its test stand. They are stuck on XGD BUG-1695 and on the webkit-2311 and firefox-1532 builds missing from the gate machine (operator install required), so per BUG-1067 they are not re-batched.