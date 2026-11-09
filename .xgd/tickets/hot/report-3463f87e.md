---
uid: report-3463f87e
id: REPORT-11846
type: report
title: 'Report: fix_plan for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T12:05:47.513182+00:00'
updated_at: '2026-11-09T12:05:47.513182+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: story-d0a8cfad
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
  fell_through:
  - 'batch 0: the instructions name production files that `code_frozen` freezes in
    reconcile mode (tools/generate/package.json, tools/generate/src/cli/capture/playwright-driver.ts)
    and the batch grants no `code_frozen` override naming them. Grant the override
    (the rule is overridable), or change the plan so the batch does not edit them'
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "tests/reconciliation-l1-substrate.test.ts::test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths"
      ],
      "dependency_tests": [],
      "hypothesis": "AC-688 is orphaned only because its AC-permitted skip (webkit-2311/firefox-1532 absent from the Playwright cache; firefox-1538/webkit-2336 present) is counted as an orphan by XGD BUG-1695; per the BUG-1067 rule its test is left out of the batches.",
      "instructions": "Verification only; make no edits. Run test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths and confirm the chromium capture path stays green. Do not touch AC-688, its test, the engineAvailable probe (tools/generate/src/cli/capture/playwright-driver.ts:305), tools/generate/package.json or the lockfile. AC-688 is stuck on XGD BUG-1695 plus the missing pinned browsers; the operator fix is `pnpm --filter ./tools/generate exec playwright install webkit firefox` outside the sandbox.",
      "test_scope": "test_UAT_AC683_",
      "ladder": {
        "rung1": "No intent in scope (REQ-219/220/221/222, BUG-78) addresses the Playwright pin or browser availability, so rung 1 does not decide.",
        "rung2": "Rung 2 decides: the reference pins playwright ^1.61.1 at tools/generate/package.json:21, identical to the working tree, so the repo is as intended.",
        "rung3": "BUG-1695: test_UAT_AC688_no_layout_divergence_across_three_engines and AC-688 stand; stuck on missing pinned webkit/firefox plus XGD BUG-1695 (AC-permitted skip counted as orphan); not re-batched per BUG-1067."
      }
    }
  ]
}