---
uid: report-35a5eb9d
id: REPORT-11741
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:34:24.976585+00:00'
updated_at: '2026-11-09T07:34:24.976585+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 7
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: AC-688 is orphaned because the XGD coverage gate counts the AC-sanctioned
      environment skip (webkit/firefox builds absent for Playwright 1.61.1) as no
      passing test; filed as XGD tooling defect BUG-1695, not fixable within the story
    instructions: Verify-only; make no edits to tests, ACs, stories, manifests or
      production code. Check whether ~/Library/Caches/ms-playwright now contains firefox-1532
      and webkit-2311 (the revisions playwright-core 1.61.1 requires). If both are
      present, run test_UAT_AC688_no_layout_divergence_across_three_engines and report
      its real result. If not, report status=stuck citing BUG-1695 and the operator
      action `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`;
      do not retry the install (the sandbox refused it with EPERM on __dirlock in
      an earlier iteration) and do not request a Playwright bump again.
    test_scope: test_UAT_AC688_
    ladder:
      rung1: Intents in scope (REQ-219/220/221/222, BUG-78) do not address Playwright
        or browser versions, so rung 1 is silent.
      rung2: 'Decided here: reconcile-src-BUNDLE-43:tools/generate/package.json:21
        pins playwright ^1.61.1, identical to the working tree, so the code freeze
        stands and no version bump is warranted.'
      rung3: Test and AC-688 stand unchanged; the orphan is XGD tooling defect BUG-1695
        (gate treats an AC-sanctioned environment skip as orphaned) and clears only
        when the operator installs firefox-1532/webkit-2311.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21
        and no intent in scope moves it; the test is correct and blocked only by the
        host browser cache plus XGD tooling defect BUG-1695, so the batch makes no
        production edit.'
      files:
      - tests/reconciliation-l1-substrate.test.ts
---

# Fix Plan — Iteration 7

## Hypothesis
AC-688 is orphaned because XGD's coverage gate counts the skip that the AC itself allows (the engines are not installed on the gate host) as "no passing test". Nothing the story is allowed to change can clear that. Filed as XGD tooling defect **BUG-1695 (bug-9093c69f)**.

## Analysis
- The only failure is AC-688 (orphaned AC). Scoped quality report-37999b07 shows 54 passed, 0 failed and 1 orphan.
- `test_UAT_AC688_no_layout_divergence_across_three_engines` (tests/reconciliation-l1-substrate.test.ts:530-569) is gated by `it.runIf(allEnginesReady)`. AC-688's Verification says: "Runs only when all three engines are installed; skips cleanly otherwise." The test and the AC agree with each other and with the code.
- Re-checked this iteration: ~/Library/Caches/ms-playwright still holds only firefox-1538 and webkit-2336 (plus chromium builds). node_modules/.pnpm holds only playwright@1.61.1 / playwright-core@1.61.1, which need firefox-1532 and webkit-2311. Nothing has changed since iterations 2-6.
- Hypothesis history: "browser builds don't match Playwright 1.61.1; operator must install them" has been the diagnosis in every plan since iteration 2 (5+ times). In iteration 3 the builder tried the install and the sandbox refused it (`EPERM mkdir ~/Library/Caches/ms-playwright/__dirlock`). In iteration 6 (report-dacf5f5d) the builder again reported `blocked_by: code_frozen`, asking to bump Playwright.
- Following the anti-repetition rule, this plan does not repeat that hypothesis as a fix. The structural cause is in XGD's own tooling: the gate has no state for "skipped because the environment lacks something, as the AC allows". So the loop can't converge no matter what the story does. Following the BUG-1067 guidance, it was filed with `xgd report-bug` as **BUG-1695** and is recorded in `ladder.rung3`. The test is **not re-batched for a fix**. The single batch below exists only so the plan can rule on the outstanding `blocked_by` request. It makes no edits and only checks the environment.
- The operator action that clears it outside the loop: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`, then re-run the gate for `test_UAT_AC688_`.
- The other two options were checked and rejected. Rung-3 code change: the only in-repo change is moving Playwright off the reference pin, and the matching version isn't installed and can't be fetched offline. aligned_to_tip: the reference implements the three-engine capture, so AC-688 is not ahead of the reference state.

## Spec Changes Made
None. Filed XGD tooling bug BUG-1695 (bug-9093c69f).

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnosability) — when skipped, the test does not record which engine failed `engineAvailable` or why. Logging the engine and the expected vs. found revision would make the next gate report name the fix directly.

## Batches
- **Batch 0 (verify-only, no edits):** `test_UAT_AC688_`. It rules on the iteration-6 `blocked_by: code_frozen` request: **declined**. The builder edits nothing. It checks whether firefox-1532 and webkit-2311 are now in ~/Library/Caches/ms-playwright. If they are, it runs the test and reports the real result. If not, it reports stuck and cites BUG-1695 with the operator command. It does not retry the install, which the sandbox refused before.

## Resolution ladder (REQ-938)
- Batch 0: decided at **rung 2**, so the code freeze stands. Of the intents in scope, REQ-219/220/221/222 and BUG-78 don't address Playwright or browser versions, so rung 1 is silent. The reference `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, the same as the working tree. That pin is what the user runs, so moving it to fit one host's stale browser cache contradicts the reference. Rung 3: the test and AC-688 stand unchanged. They can't be made to pass by any change the story is allowed to make, which is tooling defect BUG-1695.
