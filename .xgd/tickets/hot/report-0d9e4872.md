---
uid: report-0d9e4872
id: REPORT-11832
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:20:49.259594+00:00'
updated_at: '2026-11-09T11:20:49.259594+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items: []
  fix_iteration: 28
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
      rung3: Test and AC-688 stand; blocker is XGD tooling defect BUG-1697 (AC-sanctioned
        env skip counted as orphan) plus mismatched browser cache; not re-batched
        per BUG-1067.
    blocked_by_ruling:
      blocked_by: no_skip_markers
      ruling: declined
      reason: 'Rung 3: the rule stands; no skip marker is added or altered and no
        edit is requested.'
---

# Fix Plan — Iteration 28

## Hypothesis
AC-688's only UAT (`test_UAT_AC688_no_layout_divergence_across_three_engines`) is still skipped, not failed. The gate machine's Playwright browser cache (firefox-1538, webkit-2336) does not match the revisions playwright-core 1.61.1 expects (firefox-1532, webkit-2311), so `it.runIf(allEnginesReady)` skips the test. AC-688 allows that skip, but the XGD coverage gate counts it as an orphan. This is XGD tooling defect **BUG-1697** plus an operator-only browser install. It is **not re-batched** (BUG-1067 stuck-reason rule).

## Analysis
- Quality report-54366299 (commit ed0796d158) ran 54 tests: 54 passed, 0 failed, 13 deselected. Lint, build and preflight are clean. The only finding is "1 orphan AC", AC-688, which is the same as iterations 26 and 27.
- No product, test or AC file changed since iteration 27. The only changes are `.xgd/_changes/*` and the new quality report, so nothing could have changed the outcome.
- **The most recent builder assessment** (report-fe0b2f9c, from iteration 26) confirmed the skip, made no edits, and reported `status: stuck` citing **BUG-1697**. Its `blocked_by: no_skip_markers` names a rule that can't be overridden, and it proposed no change in the repo. Iteration 27 (report-ec1cebe9) correctly left the test out with no batches. Its run produced the same quality result, which confirms that re-running changes nothing.
- **Hypothesis count:** across iterations 1–25, the hypothesis "browser cache mismatch, ask builder to install or align" ran about 25 times without clearing. Iterations 26–27 replaced it with the BUG-1067 exclusion. Re-batching would repeat a hypothesis already tried more than 3 times.
- **Ruling (BUG-1067):** the fix is outside this story's scope. It needs XGD's coverage gate to treat an AC-sanctioned env skip as non-orphan (BUG-1697), or the operator to run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` on the gate machine. The ladder refuses a Playwright version bump: the reference `reconcile-src-BUNDLE-43` pins `^1.61.1` at tools/generate/package.json:21, and no intent in scope asks for an upgrade. Retiring AC-688 would delete real cross-engine intent, and adding a skip or rewriting the test without the engines is forbidden.
- No isolation or contamination pattern applies. The test is deterministically skipped by an environment probe (`engineAvailable`, tools/generate/src/cli/capture/playwright-driver.ts:305), in both the full suite and isolated runs.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (environmental) — the gate should report an env-gated skip explicitly (BUG-1697), not as a silent orphan, so the AC is visibly unproven on machines whose browsers don't match.

## Batches
None. The only open item, AC-688, is excluded under the BUG-1067 rule and recorded in `excluded_tests` with its ladder. No other failure exists.

## Resolution ladder (REQ-938)
- AC-688 (excluded): rung 1 does not decide, because none of REQ-219/220/221/222 or BUG-78 touches Playwright or the engine probe. Rung 2: the reference pins playwright ^1.61.1 (tools/generate/package.json:21), the same as the working tree, so no code change is warranted. Rung 3: the test and AC-688 stand. The blocker is XGD tooling defect **BUG-1697** plus the operator-only browser install, so it is not re-batched. The builder's `blocked_by: no_skip_markers` is **declined**: the rule stands and no edit is requested.
