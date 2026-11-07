---
uid: report-a887a156
id: REPORT-11092
type: report
title: 'Report: fix_plan for story-179b8c06'
created_by: xgd
created_at: '2026-11-07T06:29:26.640051+00:00'
updated_at: '2026-11-07T06:29:26.640051+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-179b8c06
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - story-179b8c06 — account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
    - REQ-93 — an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension
    dependency_tests:
    - test_UAT_AC2330_
    - test_UAT_AC2331_
    - test_UAT_AC2332_
    - test_UAT_AC1622_
    - test_UAT_AC1623_
    - test_UAT_AC1624_
    - test_UAT_AC1400_
    - test_UAT_FC_REQ-145_
    - test_UAT_FC_REQ-93_
    hypothesis: The two failures come from a stale pre-fix quality run (report-62fc2e2f
      at f18819ec); siteCapabilitiesSchema .strict() and composeModuleAssets per-behavior
      block scoping are both at HEAD and both tests passed in post-fix gate runs (REPORT-11087,
      REPORT-11079), so no further code change is needed.
    instructions: 'Verification only: make no production or test edits. Both iteration-2
      fixes are committed: packages/site-schema/src/schema.ts:920 closes siteCapabilitiesSchema
      with .strict() (AC-2329), and tools/generate/src/cli/module-assets.ts:87,108
      wraps each behavior client.js in its own block via scopeClientJs, so the committed
      MODULE_CLIENT_JS parses (AC-1624). Confirm both are at HEAD and that the REQ-145
      compose-matches-sources check is green, then finish with no changes. The AC-1624
      desktop arm needs Chromium, which the builder sandbox lacks: a local skip is
      expected and is not a failure. The gate runner launches Chromium, and its post-fix
      run (REPORT-11079) passed 28/28 with 0 skipped. Do not add a page-error exception,
      rename ERROR_SELECTOR, or touch the frozen code. Only if the gate run shows
      AC-1624 failing again should the violation texts be read and acted on.'
    test_scope: test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
      or test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension
      or test_UAT_AC2330_ or test_UAT_AC2331_ or test_UAT_AC2332_ or test_UAT_AC1622_
      or test_UAT_AC1623_ or test_UAT_AC1624_ or test_UAT_AC1400_ or test_UAT_FC_REQ-145_
      or test_UAT_FC_REQ-93_
    ladder:
      rung1: 'AC-2329: REQ-200 (in scope) requires a closed capabilities record (a
        typo is a validation error); decided in iteration 2 and now implemented at
        HEAD. AC-1624: no intent in scope speaks to bundle composition.'
      rung2: 'AC-1624: reference tools/generate/src/cli/module-assets.ts:42-75,120-124
        block-scopes each behavior (BUG-75); HEAD now matches it (lines 87,108).'
      rung3: The tests stand; they pass in the post-fix gate runs (REPORT-11087 4/4,
        REPORT-11079 28/28, 0 skipped), so no code change remains.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: Rungs 1 and 2 already decided for the tests in iteration 2, and the
        required changes (schema.ts .strict(), module-assets.ts scopeClientJs plus
        the regenerated bundle) are committed at HEAD. The handoff report-c9644b8c
        proposes no change (builder status no_change_needed), and the only unverified
        item is a local Chromium skip that the gate run covers, so code_frozen stands
        and no production file is edited.
      files: []
---

# Fix Plan — Iteration 3

## Hypothesis
Both failures in the input list are stale: they come from the scoped quality report report-62fc2e2f (commit f18819ec, 2026-11-05T21:39), which ran before either iteration-2 fix landed. Both fixes are now at HEAD and both tests have since passed in gate-run batch_quality_checks, so the iteration-2 code_frozen request is moot and no further production change is needed.

## Analysis
History for story-179b8c06:
- Iteration 1 (report-dd671b22) was the mechanical plan. Builder (report-7b078d41) blocked on code_frozen for both tests, with correct diagnoses.
- Iteration 2 (report-84738adf) granted two code_frozen overrides:
  - **Batch 0 (AC-2329)**: rung 1, REQ-200 closed record. Builder (report-88761605) added `.strict()`; HEAD `packages/site-schema/src/schema.ts:910-920` now ends `}).strict()`. batch_quality_check REPORT-11087 (report-56c9c5a2, 2026-11-07T06:18) passed 4/4: AC2329, AC2330, AC2331, AC2332.
  - **Batch 1 (AC-1624)**: rung 2, reference `scopeBehaviorJs`. Builder (report-3c50bfef) added `scopeClientJs` (HEAD `tools/generate/src/cli/module-assets.ts:87,108`) and regenerated `packages/framework/src/modules/module-assets.ts`. Its sandbox could not launch Chromium, so it reported fixed_unverified_in_browser. However, batch_quality_check REPORT-11079 (report-91dca876, 2026-11-05T22:21, after the fix) **passed 28/28 with 0 skipped**. That run included `test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension` and AC1400, so the gate runner has Chromium and the desktop arm is clean with the parsed bundle.
- The batch-1 re-run (no_op_guard report-e49f40e8, run r0568) made no changes, correctly. Its blocked_by_handoff report-c9644b8c names code_frozen but proposes no change; the builder's status is `no_change_needed`.

Isolation pattern: both tests failed only in the pre-fix scoped run and pass in the post-fix gate runs. This is a resolved code defect, not contamination or flakiness, so I am directing no test deletion or rewrite.

Hypothesis count: the two iteration-2 root causes (non-strict schema; unscoped bundle join) were each proposed once. Both were confirmed and fixed, so the anti-repetition rule is not triggered.

Ruling on blocked_by (report-c9644b8c, code_frozen): **declined**. The rule stands because the code the tests demand is already in place, and the batch edits no production file. The remaining work is verification in the gate, whose runner launches Chromium.

The AC1400 404-vs-302 failure that report-3c50bfef saw locally did not reproduce in REPORT-11079 (AC1400 passed there). I kept it as a dependency test to watch.

## Spec Changes Made
none. Note for the reconcile review: the story-179b8c06 "Code issue: the capability record is not closed (contradicts REQ-200)" paragraph is out of date now that `.strict()` is at HEAD. This plan does not edit it.

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-145_build_artifacts.test.ts — weak-observation — it compares the generated module-assets.ts with a fresh compose but never parses MODULE_CLIENT_JS; add a syntax parse so a duplicate-declaration collision fails without a browser.
- tests/req93-l1-slot-mounted-behaviors.test.ts::test_UAT_AC1624_* — weak-observation (diagnosability) — on ConformanceError, print the violation texts. In builder sandboxes without Chromium, `it.runIf(HAVE_CHROMIUM)` also makes the arm silently skip; the skip reason should be surfaced.

## Batches
- **Batch 0 (verification only)**: AC-2329 and AC-1624 together, with their iteration-2 blast-radius tests as dependency tests. No edits are expected. The builder should confirm HEAD carries `.strict()` on siteCapabilitiesSchema and per-behavior block scoping in composeModuleAssets, and that the committed MODULE_CLIENT_JS matches a fresh compose. It should then end the batch without changes so the gate's browser-capable run is the evidence. I used one batch because there is nothing to edit, and splitting would only duplicate gate runs.

## Superseded blocked_by request (BUG-1535)
Not used. The request was declined, not superseded (no AC wording changed).

## Resolution ladder (REQ-938)
- Batch 0, AC-2329: rung 1 decided in iteration 2. REQ-200 (in scope) says "so a typo is a validation error", and HEAD now implements it.
- Batch 0, AC-1624: rung 2 decided in iteration 2. Reference tools/generate/src/cli/module-assets.ts:42-75,120-124 block-scopes each behavior, and HEAD now does the same (lines 87, 108).
- In both cases the tests stand. They pass in the gate (REPORT-11087, REPORT-11079), and code_frozen is declined because no further code change is required.
