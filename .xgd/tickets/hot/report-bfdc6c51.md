---
uid: report-bfdc6c51
id: REPORT-11517
type: report
title: 'Report: fix_plan for report-49607926'
created_by: xgd
created_at: '2026-11-08T16:36:14.427476+00:00'
updated_at: '2026-11-08T16:36:14.427476+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-49607926
  items:
  - index: 0
    tests:
    - tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts::test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow
    - tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts::test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence
    dependency_tests: []
    hypothesis: The code_frozen block was raised on a test already fixed test-only
      in 3ef55bf62c; extract.ts records a flow only for multi-run groups, which matches
      AC-2449, so no code change is needed.
    instructions: 'Nothing is failing. Both tests pass at HEAD after the test-only
      fix in 3ef55bf62c, and AC-2449 already states the behaviour they assert: a <br>
      and a blockified child each end a flow, so one-run segments carry no flow id.
      Confirm that both tests stay green on the real capture path. Do not edit production
      code. code_frozen stands and none is needed.'
    test_scope: test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow or test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence
    ladder:
      rung1: REQ-211 (in scope) says a <br> and a blockified child end a flow, and
        AC-2449 says neither line carries a flow id; this decides.
      rung2: At reconcile-src-BUNDLE-41, tools/generate/src/cli/capture/extract.ts
        line 3112 records a flow only when flowGroup.length > 1, which agrees with
        the intent.
      rung3: The tests stand as rewritten in 3ef55bf62c and pass (scoped suite 275/0);
        no code changes.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1 decided that the code is right: REQ-211 and AC-2449 require
        a <br> to end a flow, and extract.ts already does this. The fix belonged to
        the test and was already made inside the rule (test-only commit 3ef55bf62c,
        gate passing). code_frozen therefore stands and no production file needs to
        change.'
      files:
      - tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts
  fix_iteration: 2
---

# Fix Plan — Iteration 2

## Hypothesis
There is no open failure: the builder's `code_frozen` block (REPORT-11515, `report-6468fc6d`) was raised on a test that the test-only fix in `3ef55bf62c` had already turned green, so the rule stands and nothing further needs to change.

## Analysis
- The latest scoped quality report, `report-bdf4c87b`, ran 275 tests with 0 failed. This iteration's failure summary is empty.
- Iteration 1 (`report-b688435f`) batched `test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow`. Its expectation was wrong: it asserted that each `<br>`-split line carries a flow group. The builder rewrote the test so both lines are separate runs with no flow group or flow text (commit `3ef55bf62c`, test file only). The gate at 2026-11-08T16:07:05Z shows it passing, and its companion `test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence` passes too.
- On the re-run the builder had nothing left to fix, and reported `blocked_by: code_frozen` with no proposed change (REPORT-11515, batch_index 0). That report needs a ruling. The previous attempt at this iteration's plan (REPORT-11516) had no batches and stated that no `blocked_by` report existed, so `test_fix_validate_plan` refused it.
- Tooling note: the `blocked_by` report did not appear at the top of this planner prompt, even though REPORT-11515 exists for this subject. This is probably why the previous attempt missed it, and it may be a defect in how the prompt is filled.
- Checked: `3ef55bf62c` is an ancestor of HEAD, and neither the test file nor `tools/generate/src/cli/capture/` has changed since. The only changes since iteration 1 are XGD bookkeeping files.
- No cross-suite contamination pattern: the test passes in both the batch gate and the scoped suite.

## Spec Changes Made
none. AC-2449 already says neither line carries a flow id.

## Weak Evidence Flags (preventative — best effort)
none

## Batches
One batch: the previously blocked REQ-211 flow-boundary test plus its companion in the same `describe` group, kept green as blast radius. It exists to carry the ruling on REPORT-11515. The builder makes no production edits. Both tests already pass, so the expected outcome is a confirming gate run.

## Resolution ladder (REQ-938)
- Batch 0: decided at **rung 1**. REQ-211 (in scope) says "The capture records which runs share an inline flow; a `<br>` and a blockified child end one". AC-2449 says neither line carries a flow id. The reference state agrees (rung 2): `git show reconcile-src-BUNDLE-41:tools/generate/src/cli/capture/extract.ts` line 3112 records a flow only when `flowGroup.length > 1`, so a one-run segment carries none. The tests stand as rewritten (rung 3). The code is right, so `code_frozen` stands.

## Blocked_by ruling
Batch 0, rule `code_frozen`, ruling **declined**. The rule stands. The fix belonged to the test and was already made inside the rule (test-only commit `3ef55bf62c`). No production file needs to change. `superseded` does not apply because nothing changed after the report: the fix predates it.
