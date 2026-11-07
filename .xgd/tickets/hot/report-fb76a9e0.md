---
uid: report-fb76a9e0
id: REPORT-11093
type: report
title: 'Report: fix_plan for story-179b8c06'
created_by: xgd
created_at: '2026-11-07T06:38:03.583262+00:00'
updated_at: '2026-11-07T06:38:03.583262+00:00'
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
    hypothesis: The failures are from a stale pre-fix quality run (report-62fc2e2f
      at f18819ec); the closed siteCapabilitiesSchema and per-behavior block scoping
      in composeModuleAssets are at HEAD and both tests passed in post-fix gate runs
      (REPORT-11087, REPORT-11079); the remaining gap is that no browser-free test
      parses MODULE_CLIENT_JS.
    instructions: 'The production fixes for both tests are already committed, so make
      no production edits. siteCapabilitiesSchema is closed with .strict() (AC-2329),
      and composeModuleAssets wraps each behavior''s client.js in its own block via
      scopeClientJs, so the generated MODULE_CLIENT_JS no longer redeclares ERROR_SELECTOR
      (AC-1624). Confirm both are at HEAD. Then close the evidence gap that let the
      duplicate-declaration bug through: in tests/test_UAT_FC_REQ-145_build_artifacts.test.ts,
      add an assertion that MODULE_CLIENT_JS parses as JavaScript (an ES module),
      so a duplicate top-level declaration fails this test without a browser. A local
      skip of the AC-1624 desktop arm when Chromium is unavailable is expected. The
      gate runner has Chromium, and its post-fix run passed 28/28 with 0 skipped.
      Do not add a page-error exception or rename ERROR_SELECTOR.'
    test_scope: test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
      or test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension
      or test_UAT_AC2330_ or test_UAT_AC2331_ or test_UAT_AC2332_ or test_UAT_AC1622_
      or test_UAT_AC1623_ or test_UAT_AC1624_ or test_UAT_AC1400_ or test_UAT_FC_REQ-145_
      or test_UAT_FC_REQ-93_
    ladder:
      rung1: 'AC-2329: REQ-200 (in scope) requires a closed capabilities record (a
        typo is a validation error), decided in iteration 2 and implemented at HEAD;
        AC-1624: no intent in scope speaks to bundle composition.'
      rung2: 'AC-1624: reference tools/generate/src/cli/module-assets.ts:42-75,120-124
        block-scopes each behavior (BUG-75), and HEAD now matches.'
      rung3: The tests stand and pass in the post-fix gate runs (REPORT-11087 4/4,
        REPORT-11079 28/28, 0 skipped); no production change remains.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: Rungs 1 and 2 decided for the tests in iteration 2, and the required
        production changes are committed at HEAD. Handoff report-c9644b8c proposes
        no change (no_change_needed). code_frozen stands, and this batch edits only
        a test file to add a browser-free parse check of the generated bundle.
      files:
      - tests/test_UAT_FC_REQ-145_build_artifacts.test.ts
---

# Fix Plan — Iteration 3

## Hypothesis
Both failures in the input are stale. They come from scoped quality report report-62fc2e2f (commit f18819ec), which ran before either iteration-2 fix landed. Both fixes are now at HEAD (closed siteCapabilitiesSchema; per-behavior block scoping in composeModuleAssets), and both tests have since passed in gate runs. The only remaining gap is test-side: no browser-free check catches a bundle that fails to parse.

## Analysis
This plan resubmits iteration 3. The validator refused the first attempt (report-a887a156) for two reasons: (1) the declined ruling had `files: []`, and (2) its instructions named the frozen production files. This version fixes both. The batch now does real test-only work, and its instructions refer to symbols, not production paths.

History for story-179b8c06:
- **Iteration 1** (report-dd671b22): mechanical plan. The builder (report-7b078d41) blocked on code_frozen for both tests and gave correct diagnoses.
- **Iteration 2** (report-84738adf): granted two code_frozen overrides.
  - **AC-2329** (decided at rung 1, REQ-200 closed record): the builder (report-88761605) added `.strict()`. It is at HEAD, and batch_quality_check REPORT-11087 passed 4/4 (AC2329-AC2332).
  - **AC-1624** (decided at rung 2, reference block-scoping): the builder (report-3c50bfef) added scopeClientJs and regenerated MODULE_CLIENT_JS. It is at HEAD, and batch_quality_check REPORT-11079 passed 28/28 with 0 skipped. That run included AC1624 and AC1400, so the gate runner has Chromium.
- **Re-run** r0568 (no_op_guard report-e49f40e8): no changes. Its blocked_by_handoff (report-c9644b8c, code_frozen) proposes no code change, and the builder's status is no_change_needed.

**Isolation pattern:** both tests failed only in the pre-fix run and passed in the post-fix gate runs. This is a resolved defect, not contamination or flakiness.

**Hypothesis count:** each iteration-2 root cause was proposed once and confirmed, so the anti-repetition rule is not triggered.

**Ruling on report-c9644b8c (code_frozen): declined.** The required production code is already committed, so the rule stands and this batch edits no production file. The batch closes the evidence gap that let the duplicate-declaration bug pass the browser-free tests. The REQ-145 build-artifact test will additionally parse MODULE_CLIENT_JS as JavaScript.

## Spec Changes Made
none. Note for the reconcile review: the story-179b8c06 "Code issue: the capability record is not closed" paragraph is now out of date.

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-145_build_artifacts.test.ts — weak-observation — compares the committed bundle with a fresh compose but never parses it; addressed in batch 0.
- tests/req93-l1-slot-mounted-behaviors.test.ts::test_UAT_AC1624_* — weak-observation (diagnosability) — on ConformanceError, print the violation texts. Also, `it.runIf(HAVE_CHROMIUM)` skips silently; the skip reason should be surfaced.

## Batches
- **Batch 0**: AC-2329 and AC-1624, plus their iteration-2 blast-radius tests as dependency tests. The builder confirms both fixes are present and makes one test-only edit: the REQ-145 build-artifact test also asserts that MODULE_CLIENT_JS parses as JavaScript, so a duplicate top-level declaration fails without a browser. No production edits. A local Chromium skip of AC1624 is expected; the gate run is the evidence.

## Resolution ladder (REQ-938)
- **AC-2329:** rung 1. REQ-200 (in scope) says "so a typo is a validation error", and HEAD implements this.
- **AC-1624:** rung 2. Reference tools/generate/src/cli/module-assets.ts:42-75,120-124 block-scopes each behavior, and HEAD matches.
- **Both:** the tests stand and pass in the gate. code_frozen is declined because no production change remains.
