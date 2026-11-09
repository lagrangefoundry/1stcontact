---
uid: report-7526f59b
id: REPORT-11731
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T06:57:02.236593+00:00'
updated_at: '2026-11-09T06:57:02.236593+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: The machine browser cache holds firefox-1538/webkit-2336 while the
      pinned playwright-core@1.61.1 needs firefox-1532/webkit-2311, so the webkit
      and firefox launch probes fail and AC-688 is skipped; the cause is the environment,
      not repo code.
    instructions: 'AC-688 is orphaned only because its correct, AC-conformant test
      is skipped: webkit and firefox cannot launch, because the installed browser
      revisions do not match the pinned Playwright 1.61.1. The repo dependency pin
      is correct and stays as it is. Make the pinned browsers available by running
      `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`,
      then re-run test_UAT_AC688_no_layout_divergence_across_three_engines and confirm
      it runs and passes rather than skips. The only edit allowed in this batch is
      in the test file itself: you may make the skip name which engine failed to launch,
      without changing its gating or assertions. If the sandbox refuses the download
      or the write to the Playwright browser cache, report stuck and quote the exact
      refusal, so the operator can run that command outside the sandbox.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser availability, so rung 1 does not decide.
      rung2: 'Decided here: the reference pins playwright ^1.61.1, identical to the
        working tree, so the user intends the current dependency; the reference skips
        AC-688 identically on this machine.'
      rung3: The test stands and matches AC-688 verbatim; it demands the pinned browsers
        installed, not a code change.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decided: the reference state pins playwright ^1.61.1 exactly
        as the working tree does, so bumping the dependency to match one machine stale
        browser cache would contradict the user intent; the gap is closed within the
        rule by installing the pinned browser revisions in the environment.'
      files:
      - tests/reconciliation-l1-substrate.test.ts
---

# Fix Plan — Iteration 2 (re-plan after validator refusal)

## Hypothesis
AC-688 is orphaned because the machine's Playwright browser cache holds firefox-1538 and webkit-2336, while the pinned playwright-core@1.61.1 needs firefox-1532 and webkit-2311. The webkit and firefox launch probes fail, so `test_UAT_AC688_no_layout_divergence_across_three_engines` is skipped. The cause is the environment, not the repo.

## Analysis
- The only failure is the orphaned AC-688. Its single test, `tests/reconciliation-l1-substrate.test.ts:536-569`, is gated by `it.runIf(allEnginesReady)` (lines 530-534). report-37999b07 recorded it as skipped, and the coverage gate does not count a skip.
- Chromium launches, because the chromium-only AC-683 passed. webkit and firefox do not, because of the revision mismatch the builder diagnosed in report-dacf5f5d and report-96c98564 (blocked_by_handoff, rule `code_frozen`). I have no evidence against that diagnosis.
- AC-688's verification text says the test runs only when all three engines are installed and skips cleanly otherwise. So the test matches the AC, and the AC describes real behaviour.
- At the reference, `git show reconcile-src-BUNDLE-43:tools/generate/package.json` line 21 pins `"playwright": "^1.61.1"`, the same as the working tree. The user intends the current dependency. The reference skips the test the same way on this machine, so it does not fail with an external error, and the REQ-910 external-cause exception does not apply.
- **Why this re-plan exists:** the validator refused the earlier iteration-2 plan (report-e7c1a640) for two reasons. (1) The `declined` ruling's `files` did not list every file the batch edits. (2) Its instructions named a frozen production manifest, even though they named it only to forbid editing it. This plan names no production file in the batch fields and lists the batch's one editable file, the test file, in `blocked_by_ruling.files`. The diagnosis and ruling are unchanged.
- This is not a BUG-1067 XGD tooling defect. Requiring a passing test for an active AC is correct gate behaviour.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (the skip is silent) — when the engine gate is false, record which engine failed to launch and why, so a future orphan report names the missing browser directly.

## Batches
- **Batch 0** (AC-688 only, scope `test_UAT_AC688_`). The builder makes the pinned browser revisions available with `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`, re-runs the test and confirms it runs rather than skips. The only repo file the builder may edit is the test file, and only to make the skip name the unavailable engine, without changing the gating or the assertions. If the sandbox refuses the download or the write to the user's Playwright browser cache, the builder reports stuck and quotes the exact refusal. The operator then runs that command once, outside the sandbox.

## Superseded blocked_by request (BUG-1535)
Not applicable. The `code_frozen` request is **declined** (see the ladder below).

## Resolution ladder (REQ-938)
- **Batch 0: rung 2 decided.**
  - Rung 1: none of the intents in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser availability.
  - Rung 2: the reference pins playwright ^1.61.1 (`tools/generate/package.json:21` at `reconcile-src-BUNDLE-43`), the same as the working tree. Bumping the dependency to match one machine's stale browser cache would go against the reference, so the `code_frozen` rule stands.
  - Rung 3: the test stands unchanged. It needs the pinned browsers installed, not a code change.
