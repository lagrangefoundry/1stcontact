---
uid: report-5c5e9f1b
id: REPORT-11379
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T09:20:11.438523+00:00'
updated_at: '2026-11-08T09:24:07.303715+00:00'
completed_at: null
last_field_updated: batches_pending
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  items:
  - index: 0
    tests:
    - tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session
    - tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order
    dependency_tests: []
    hypothesis: Nothing fails; the code_frozen handoff REPORT-11375 is a historical
      misjudged override (report-7519d965) whose production change is correct and
      already at HEAD, so the block is declined and only the AC-2097/AC-2378 evidence
      it served is re-confirmed.
    instructions: 'Verification only. Run the AC-2097 and AC-2378 UATs in tests/reconciliation-material-description-session.workers.test.ts,
      together with tests/test_UAT_FC_REQ-207_image_describer_session.test.ts, which
      imports systemText() from tests/support/scripted-model-client.ts. They pass
      at HEAD (REPORT-11376: 224 passed, 0 failed). Make no edits if they are green.
      Production code is frozen and no production change is demanded. Keep systemText()
      in tests/support/scripted-model-client.ts: the REQ-206, REQ-207 and REQ-208
      FC suites import it. Do not touch tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts.
      If a workers UAT cannot bind a local port (listen EPERM), report that and leave
      its verdict to the gate. Do not count it as passed. The remaining review FAIL,
      the misjudged override report-7519d965, needs an operator waiver and is not
      the builder''s to clear.'
    ladder:
      rung1: 'Decided here: REQ-207 requires the describer to run through the host
        session factory and each describer to register under its own name (AC-2097,
        AC-2378). The production change delivering that is at HEAD and was judged
        correct by the review, so no code change is demanded and code_frozen stands.'
      rung2: Not needed; the behaviour is undisputed and the scoped gate passes 224/224
        at HEAD.
      rung3: The AC-2097 and AC-2378 tests stand unchanged; no production code changes.
    test_scope: test_UAT_AC2097_ or test_UAT_AC2378_
  fell_through:
  - 'the `code_frozen` request cannot be declined: blocked_by_ruling.files must list
    every file the batch edits'
  batches_pending: false
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session",
        "tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order"
      ],
      "dependency_tests": [],
      "hypothesis": "Nothing fails; the code_frozen handoff REPORT-11375 is a historical misjudged override (report-7519d965) whose production change is correct and already at HEAD, so the block is declined and only the AC-2097/AC-2378 evidence it served is re-confirmed.",
      "instructions": "Verification only. Run the AC-2097 and AC-2378 UATs in tests/reconciliation-material-description-session.workers.test.ts, together with tests/test_UAT_FC_REQ-207_image_describer_session.test.ts, which imports systemText() from tests/support/scripted-model-client.ts. They pass at HEAD (REPORT-11376: 224 passed, 0 failed). Make no edits if they are green. Production code is frozen and no production change is demanded. Keep systemText() in tests/support/scripted-model-client.ts: the REQ-206, REQ-207 and REQ-208 FC suites import it. Do not touch tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts. If a workers UAT cannot bind a local port (listen EPERM), report that and leave its verdict to the gate. Do not count it as passed. The remaining review FAIL, the misjudged override report-7519d965, needs an operator waiver and is not the builder's to clear.",
      "ladder": {
        "rung1": "Decided here: REQ-207 requires the describer to run through the host session factory and each describer to register under its own name (AC-2097, AC-2378). The production change delivering that is at HEAD and was judged correct by the review, so no code change is demanded and code_frozen stands.",
        "rung2": "Not needed; the behaviour is undisputed and the scoped gate passes 224/224 at HEAD.",
        "rung3": "The AC-2097 and AC-2378 tests stand unchanged; no production code changes."
      },
      "test_scope": "test_UAT_AC2097_ or test_UAT_AC2378_"
    }
  ]
}