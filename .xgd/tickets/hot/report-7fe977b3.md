---
uid: report-7fe977b3
id: REPORT-11826
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:00:50.349283+00:00'
updated_at: '2026-11-09T11:07:49.196726+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    dependency_tests: []
    hypothesis: XGD coverage gate counts the AC-sanctioned environment skip (webkit/firefox
      browser revisions missing for playwright-core 1.61.1) as an orphan; this is
      tooling defect BUG-1697, not a product, test or AC defect.
    instructions: 'Do not try to make AC-688 pass in this sandbox: the test, the AC
      and the code are correct. The only blocker is the missing webkit-2311/firefox-1532
      browser revisions, which only the operator can install, plus XGD tooling defect
      BUG-1697. Confirm that the test still skips for that reason. You may optionally
      make the skip name which engine failed to launch and why; leave the runIf gating
      and every assertion unchanged. Then report status stuck citing BUG-1697 and
      the operator command pnpm --filter @1stcontact/generate exec playwright install
      webkit firefox. Do not request another override.'
    test_scope: test_UAT_AC688_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) touches Playwright or
        the engine probe, so rung 1 does not decide.
      rung2: The reference reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21,
        the same as the working tree, so code_frozen stands.
      rung3: The test and AC-688 stand; the skip comes from the environment and XGD
        tooling defect BUG-1697 (sanctioned skip counted as orphan), which is outside
        the scope of this story and must not be re-batched.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2 decided: the reference pins playwright ^1.61.1 (tools/generate/package.json:21),
        the same as the working tree, and no intent in scope asks for a bump. The
        blocker is the operator browser cache plus XGD defect BUG-1697, not frozen
        code.'
      files:
      - tests/reconciliation-l1-substrate.test.ts
  fix_iteration: 26
  batches_pending: false
---

# Fix Plan — Iteration 26

## Hypothesis
The failure is in XGD's coverage tooling, not in the product: AC-688's only UAT is skipped by a precondition that the AC itself sanctions ("Runs only when all three engines are installed; skips cleanly otherwise"), because the gate machine's Playwright browser cache (firefox-1538, webkit-2336) does not match playwright-core 1.61.1 (firefox 1532, webkit 2311). The coverage gate counts that sanctioned skip as an orphan. Filed as **BUG-1697**.

## Analysis
- The scoped quality run (report-c8e74989) passes 54 tests with 0 failures. The only finding is "AC-688 orphaned".
- `test_UAT_AC688_no_layout_divergence_across_three_engines` (tests/reconciliation-l1-substrate.test.ts:536-569) is `it.runIf(allEnginesReady)`. `engineAvailable` (tools/generate/src/cli/capture/playwright-driver.ts:305) returns false for webkit and firefox because their browser revisions don't match. Chromium matches, and the chromium-only AC-683 passes.
- Iterations 1–25 tried the same thing: decline `code_frozen` and ask for a browser install the sandbox cannot perform. Every builder assessment (most recently report-dacf5f5d) reached the same diagnosis and stopped as `stuck` / `blocked_by: code_frozen`. Under the hypothesis-history rule this cannot be planned the same way again.
- New hypothesis: the blocker is not in this story's scope. It is an environment precondition plus an XGD coverage-gate defect: a sanctioned environment skip is treated as missing evidence, and test_fix has no terminal state for operator-only remediation. This is the BUG-1067 class. I filed it as **BUG-1697** and recorded it in `ladder.rung3`. Re-batching will not change the outcome.
- No product, test or AC defect. The AC is correct, the test is correct, and the reference implements the behaviour.
- **Operator action that clears it:** `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` on the gate machine.

## Spec Changes Made
None. AC-688 stays active and unchanged, because its behaviour is real and its verification clause already allows the skip.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (diagnostic) — when it skips, the skip should name which engine failed to launch and the launch error, so the gate report points straight at the missing browser revision.

## Batches
One batch carries AC-688's single test so the `blocked_by: code_frozen` report can be ruled on. The builder does not attempt a fix. It confirms the skip cause and reports stuck citing BUG-1697. Its only permitted edit is the skip-reason diagnostic in the test file. Gating and assertions stay unchanged.

## Resolution ladder (REQ-938)
- Batch 0: no rung yields a code change. Rung 1: none of REQ-219/220/221/222 or BUG-78 touches Playwright or the engine probe. Rung 2: the reference `reconcile-src-BUNDLE-43` pins `"playwright": "^1.61.1"` (tools/generate/package.json:21), the same as the working tree, so the code freeze stands (`code_frozen` is **declined**). Rung 3: the test and the AC stand. The remaining blocker is environmental plus the XGD tooling defect **BUG-1697**, so this is out of the story's scope and must not be re-batched.