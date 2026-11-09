---
uid: report-fec9ebb2
id: REPORT-11921
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T15:10:32.482653+00:00'
updated_at: '2026-11-09T15:10:32.482653+00:00'
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
      ^1.61.1 needs webkit-2311/firefox-1532; gate cache unchanged since iteration
      47 holds only webkit-2336/firefox-1538) is counted as an orphan by XGD BUG-1695;
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
  fix_iteration: 48
---

# Fix Plan — Iteration 48

## Hypothesis
AC-688 is orphaned because its only test, `test_UAT_AC688_no_layout_divergence_across_three_engines`, skips. The AC allows that skip when an engine is missing. Pinned playwright ^1.61.1 needs firefox-1532 and webkit-2311, and the gate machine has only firefox-1538 and webkit-2336. The coverage gate then counts that allowed skip as an orphan, which is XGD BUG-1695.

## Analysis
- Quality report-85b098ab (commit 9d68bff81d): lint, build and preflight are green, with 54 passed and 0 failed. The one finding is that AC-688 is orphaned.
- Since iteration 47, only xgd change-log metadata (`.xgd/_changes/*`) and the new quality report have changed. Code, tests, ACs and the gate environment are unchanged, so the cause found in iterations 2–47 still holds.
- AC-688's body says the test "Runs only when all three engines are installed; skips cleanly otherwise." The test does exactly that (`tests/reconciliation-l1-substrate.test.ts:536-569`, gated on `engineAvailable` at `tools/generate/src/cli/capture/playwright-driver.ts:305`). The AC, the test and the code agree. Only the gate's reading of an allowed skip disagrees with them.
- The builder's earlier code_frozen request (report-dacf5f5d: bump Playwright to match the cached browsers) was declined on rung 2 in iteration 2. The reference pins `"playwright": "^1.61.1"` at `tools/generate/package.json:21`, the same as the working tree. That ruling still stands, and no new blocked_by request has been made since.
- **BUG-1067 rule applied:** AC-688's test is stuck on XGD BUG-1695 and on a browser install that only the operator can do outside the sandbox. It is left out of the batches, and BUG-1695 is recorded in batch 0's `ladder.rung3`.
- **Hypothesis history:** this hypothesis has been confirmed in every iteration from 2 to 47, and no different hypothesis fits the evidence. Under the rule, a test stuck on an XGD tooling defect is not re-batched. Re-planning cannot clear it; only the operator can.
- **What clears AC-688:** either the operator runs `pnpm --filter ./tools/generate exec playwright install webkit firefox` outside the sandbox, or XGD BUG-1695 is fixed so that an AC-permitted skip no longer counts as an orphan.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (on skip) — make the skip message name which engine(s) failed to launch and the launch error, so the gate report points straight at the missing browser revision.

## Batches
Batch 0 only checks AC-687 and makes no edits. AC-687 is a pure validator test in the same file that needs no browser. It is there to keep the batch valid and to confirm the file stays green. AC-688 is left out on purpose (BUG-1067 / BUG-1695).

## Resolution ladder (REQ-938)
- Batch 0, rung 1: no intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser-engine availability, so rung 1 does not decide.
- Batch 0, rung 2: the reference pins playwright ^1.61.1 at tools/generate/package.json:21, the same as the working tree. The repo is therefore as the user intends, and the code_frozen request stays declined.
- Batch 0, rung 3: AC-688 and its test stand. They are stuck on XGD BUG-1695 (an AC-permitted skip counted as an orphan) and on the pinned webkit-2311/firefox-1532 browsers missing from the gate machine. Per BUG-1067 they are not re-batched.
