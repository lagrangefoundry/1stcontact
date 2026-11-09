---
uid: report-ec1cebe9
id: REPORT-11830
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:13:04.005668+00:00'
updated_at: '2026-11-09T11:13:04.005668+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items: []
  fix_iteration: 27
  excluded_tests:
  - test: tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    ac: AC-688
    reason: 'stuck: XGD tooling defect BUG-1697 + operator-only browser install (pnpm
      --filter @1stcontact/generate exec playwright install webkit firefox)'
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or
        the engine probe; rung 1 does not decide.
      rung2: Reference reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21,
        same as the working tree; no code change warranted.
      rung3: Test and AC-688 stand; blocker is XGD tooling defect BUG-1697 (sanctioned
        env skip counted as orphan) plus mismatched browser cache; not re-batched
        per BUG-1067.
    blocked_by_ruling:
      blocked_by: no_skip_markers
      ruling: declined
      reason: 'Rung 3: the rule stands; no skip marker is added or altered and no
        edit is requested.'
---

# Fix Plan — Iteration 27

## Hypothesis
AC-688's only UAT is skipped because the gate machine's Playwright browser cache (firefox-1538, webkit-2336) does not match playwright-core 1.61.1 (firefox-1532, webkit-2311). AC-688 allows that skip, but the XGD coverage gate counts it as an orphan. This is XGD tooling defect **BUG-1697** plus an operator-only environment fix. There is no product, test or AC defect, so the test is **not re-batched** (BUG-1067 rule).

## Analysis
- The scoped quality run report-0186c9e4 (commit 8af3b45828) ran 54 tests: 54 passed, 0 failed. Lint, build and preflight are clean. The only finding is "AC-688 orphaned acceptance criterion".
- `test_UAT_AC688_no_layout_divergence_across_three_engines` (tests/reconciliation-l1-substrate.test.ts:530-569) is gated by `it.runIf(allEnginesReady)` and came back `skipped`. `engineAvailable` (tools/generate/src/cli/capture/playwright-driver.ts:305) returns false for webkit and firefox because their revisions don't match. Chromium matches, and the chromium-only AC-683 passes.
- **History:** iterations 1–25 declined `code_frozen` and asked for a browser install that the sandbox cannot perform. Every builder came back stuck. Iteration 26 (report-7fe977b3) classed the blocker as XGD tooling defect BUG-1697. The iteration-26 builder (report-fe0b2f9c) confirmed the skip with `vitest run ... -t test_UAT_AC688_` (9 skipped, 0 failed), made no edits, and reported `status: stuck` citing **BUG-1697**. Its `blocked_by` names `no_skip_markers`, which is not an overridable rule. It requested no override and proposed no repo change.
- **Ruling (BUG-1067 stuck reason):** the builder found that the only remaining fix lies outside the story: the XGD coverage gate plus the operator's browser cache. The story's constraints don't allow a skip marker, an engine-free rewrite, retiring a real AC, or a Playwright bump. A Playwright bump is also refused by the ladder, because the reference pins `^1.61.1` at tools/generate/package.json:21. One occurrence is enough, and this is the second. **AC-688's test is left out of the batches. The plan has zero batches.** Re-batching it has produced the same stuck result 26 times.
- `no_skip_markers` (reported `blocked_by`): **declined**. The rule stands at rung 3: no skip marker is added or changed, and nothing is asked of the builder.
- **Operator action that clears it** (outside the sandbox, on the gate machine): `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`. The next gate run then executes the test instead of skipping it.

## Spec Changes Made
None. AC-688 (acceptance_criterion-18356eea) stays active and unchanged. Its behaviour is real, the reference implements it, and its verification clause already allows the skip when engines are absent.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnostic) — when the test skips, the skip should name which engine failed to launch and the launch error, so the gate report points at the missing browser revision.

## Batches
None. The single failure is out of scope for test_fix: XGD tooling defect BUG-1697 plus operator-only browser installation. Following the BUG-1067 stuck-reason rule, it is named here and not re-batched.

## Resolution ladder (REQ-938)
- AC-688 (no batch):
  - Rung 1: no intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) touches Playwright or the engine probe, so rung 1 does not decide.
  - Rung 2: the reference `reconcile-src-BUNDLE-43` pins `"playwright": "^1.61.1"` (tools/generate/package.json:21), the same as the working tree, so no code change is warranted.
  - Rung 3: the test and AC-688 stand. The blocker is **BUG-1697** (the XGD coverage gate counts an AC-sanctioned environment skip as an orphan, and test_fix has no terminal state for operator-only remediation) plus the gate machine's mismatched browser cache. It is excluded from the batches.
