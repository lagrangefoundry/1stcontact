---
uid: report-8c4b74a6
id: REPORT-11756
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T08:07:40.509296+00:00'
updated_at: '2026-11-09T08:07:40.509296+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 12
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because the gate counts its AC-sanctioned
      environment skip (webkit-2311/firefox-1532 not installed for playwright 1.61.1)
      as no coverage; XGD tooling defect BUG-1696, not product, test or AC.
    instructions: 'Make no edits. AC-688''s test is deliberately excluded from this
      plan: it is correct and skips only because the gate machine lacks the pinned
      webkit/firefox builds, which this sandbox cannot install, and the gate miscounts
      that sanctioned skip (BUG-1696). Confirm the chromium-only sibling test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
      stays green and stop. Do not bump Playwright, alter engineAvailable, or rewrite
      the AC-688 test to run without engines.'
    test_scope: test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    ladder:
      rung1: No intent in scope (REQ-222/221/219/220, BUG-78) changes the Playwright
        pin or AC-688's skip-when-engines-absent precondition.
      rung2: 'Decided here: reconcile-src-BUNDLE-43 pins playwright ^1.61.1 at tools/generate/package.json:21,
        same as the working tree, so the code_frozen rule stands.'
      rung3: Tests stand; AC-688 is blocked by the environment (operator must run
        pnpm --filter @1stcontact/generate exec playwright install webkit firefox)
        and by XGD tooling defect BUG-1696, so it is not re-batched.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2: the reference pins playwright ^1.61.1 (tools/generate/package.json:21),
        identical to the working tree, and no intent in scope demands a bump; the
        blocker is a missing browser install plus gate defect BUG-1696, not code.'
      files:
      - tests/reconciliation-l1-substrate.test.ts
---

# Fix Plan — Iteration 12

## Hypothesis
AC-688 is reported as orphaned because the gate counts the AC's own allowed environment skip as missing coverage. On this machine webkit and firefox can't launch: Playwright 1.61.1 needs firefox-1532 and webkit-2311, but the cache has firefox-1538 and webkit-2336. That is an environment gap plus an XGD coverage-gate defect (BUG-1696), not a defect in the product, the test or the AC.

## Analysis
- The only failure is AC-688, "orphaned acceptance criterion". Its UAT, `test_UAT_AC688_no_layout_divergence_across_three_engines` (tests/reconciliation-l1-substrate.test.ts:536-569), is gated with `it.runIf(allEnginesReady)`. AC-688's Verification says explicitly: "Runs only when all three engines are installed; skips cleanly otherwise." The test does exactly what the AC specifies.
- `~/Library/Caches/ms-playwright` still holds only firefox-1538 and webkit-2336 (checked again this iteration). Chromium matches, and AC-683 passes. node_modules has only playwright@1.61.1, so a bump would also need the network.
- Iterations 1–11: each builder made no edits, and the latest (report-dacf5f5d) reported `blocked_by: code_frozen`, proposing either an operator-run `playwright install` or a Playwright bump. Earlier plans re-batched AC-688 with a "declined" ruling and got the same stuck result. Under the hypothesis-history rule I'm not re-batching it a 12th time.
- **Structurally different decision (BUG-1067 path):** the test can't close inside this story. The test, the AC and the frozen code are all correct. The sandbox can't install browsers. The only in-scope remaining defect is that XGD's coverage gate treats a declared environment-conditional skip as an orphan. I filed this as **BUG-1696**. AC-688's test is left out of the batches and the bug ID is recorded in the batch ladder.
- **Operator action that clears it** (outside the sandbox): `pnpm --filter @1stcontact/generate exec playwright install webkit firefox`. The next gate run then executes the AC-688 test instead of skipping it.

## Spec Changes Made
None. AC-688 stays active and correct. It is not retired: the behaviour is real and the AC already declares its precondition.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (environmental) — when the engines are missing, the skip reason should name which engine failed to launch and the expected and installed revisions, so the gate output is self-diagnosing.

## Batches
- **Batch 0 (keep green, no edits expected):** `test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths`, the chromium-only sibling in the same file and the nearest batch to AC-688. It is the carrier for the ruling on the builder's `blocked_by: code_frozen` and records BUG-1696 in `ladder.rung3`. AC-688's own test is deliberately excluded (BUG-1067 rule).

## Resolution ladder (REQ-938)
- Batch 0: decided at **rung 2**. Rung 1: no intent in scope (REQ-222/221/219/220, BUG-78) changes the Playwright pin or AC-688's skip-when-absent precondition. Rung 2: the reference pins `"playwright": "^1.61.1"` at tools/generate/package.json:21 (reconcile-src-BUNDLE-43), the same as the working tree, so bumping it would contradict what the user runs. `code_frozen` stands, and the builder's request is **declined**. Rung 3: the tests stand. AC-688 is blocked by environment plus XGD tooling defect BUG-1696 and is not re-batched.
