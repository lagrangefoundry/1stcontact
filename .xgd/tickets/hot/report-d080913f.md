---
uid: report-d080913f
id: REPORT-11845
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T11:59:57.984947+00:00'
updated_at: '2026-11-09T11:59:57.984947+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
  fix_iteration: 31
  items:
  - index: 0
    tests:
    - tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
    dependency_tests: []
    hypothesis: AC-688 is orphaned only because its AC-permitted skip (webkit-2311/firefox-1532
      absent from the Playwright cache; firefox-1538/webkit-2336 present) is counted
      as an orphan by XGD BUG-1695; per the BUG-1067 rule its test is left out of
      the batches.
    instructions: Verification only; make no edits. Run test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths
      and confirm the chromium capture path stays green. Do not touch AC-688, its
      test, the engineAvailable probe (tools/generate/src/cli/capture/playwright-driver.ts:305),
      tools/generate/package.json or the lockfile. AC-688 is stuck on XGD BUG-1695
      plus the missing pinned browsers; the operator fix is `pnpm --filter ./tools/generate
      exec playwright install webkit firefox` outside the sandbox.
    test_scope: test_UAT_AC683_
    ladder:
      rung1: No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright
        pin or browser availability, so rung 1 does not decide.
      rung2: 'Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21,
        identical to the working tree, so the repo is as intended.'
      rung3: 'BUG-1695: test_UAT_AC688_no_layout_divergence_across_three_engines and
        AC-688 stand; stuck on missing pinned webkit/firefox plus XGD BUG-1695 (AC-permitted
        skip counted as orphan); not re-batched per BUG-1067.'
---

# Fix Plan — Iteration 31 (re-plan)

## Hypothesis
AC-688 is orphaned only because its single test skips, as the AC allows, when WebKit and Firefox cannot launch. The gate machine's Playwright cache holds firefox-1538 and webkit-2336, but the pinned playwright 1.61.1 needs firefox-1532 and webkit-2311. XGD's coverage gate then counts that permitted skip as an orphan (XGD tooling bug BUG-1695). Nothing in the repo is wrong.

## Analysis
- Quality report-e72d7c43 shows 54 tests and 0 failed. The only finding is that AC-688 is orphaned.
- `tests/reconciliation-l1-substrate.test.ts:538` `test_UAT_AC688_no_layout_divergence_across_three_engines` runs only when chromium, webkit and firefox all launch. If any one fails the `engineAvailable` probe (`tools/generate/src/cli/capture/playwright-driver.ts:305`), the test skips. AC-688's Verification text allows this ("skips cleanly otherwise"), so the test matches its AC.
- Chromium launches: `test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths` passes.
- Builder assessments (report-dacf5f5d and the earlier ones) reported the test stuck: the fix needs either an environment change outside the sandbox or a change to frozen code/ACs. They cite **BUG-1695**, an XGD tooling defect in which an AC-permitted skip counts as an orphaned AC.
- **BUG-1067 rule applied.** In 30 previous iterations every plan, including the previous iteration-31 plan report-01b792e0, re-batched this test as "check only", and each time the result was stuck. This plan is structurally different: **AC-688's test is left out of the batches.** It is named here with BUG-1695, and the bug ID is recorded in `ladder.rung3` of the only batch.
- Overrides considered and rejected:
  - A `code_frozen` override to bump playwright to match the cached browsers is refused under condition 3. The reference `reconcile-src-BUNDLE-43:tools/generate/package.json:21` pins `"playwright": "^1.61.1"`, the same as the working tree, so rung 2 already settles the pin as intended.
  - REQ-910 `external_cause` does not apply. The test skips at the reference; it does not fail with an error, so the mechanical check cannot pass.
  - `aligned_to_tip` does not apply. The reference implements the cross-engine check, and only the environment is missing.
- This planner could not check the browser cache again: the session's permission mode refused reads under `~/Library/Caches/ms-playwright`.
- **Operator action required to converge.** Run this outside the sandbox: `pnpm --filter ./tools/generate exec playwright install webkit firefox`. Otherwise XGD must fix BUG-1695.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines — weak-observation (skip path) — the skip message should name which engine failed to launch and the expected revision, so a gate log shows the cause without a builder investigation.

## Batches
- Batch 0 (verification only, no edits): keep AC-683, the chromium-only sibling in the same file and the same capture driver, green. Its purpose is to carry the BUG-1695 ladder record for AC-688 required by the BUG-1067 rule. AC-688's test is deliberately not in the batch.

## Resolution ladder (REQ-938)
- Batch 0 / AC-688:
  - Rung 1: no intent in scope (REQ-219, REQ-220, REQ-221, REQ-222, BUG-78) addresses the Playwright pin or browser availability.
  - Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21, identical to the working tree, so the repo is as intended.
  - Rung 3: the test and AC stand. AC-688 is stuck on the gate machine missing the pinned browsers plus XGD BUG-1695, and it is not re-batched.
