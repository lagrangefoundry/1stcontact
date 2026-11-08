---
uid: report-4f55e936
id: REPORT-11356
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T08:20:31.947973+00:00'
updated_at: '2026-11-08T08:20:31.947973+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  items:
  - index: 0
    tests:
    - AC-1817 (orphaned acceptance criterion)
    - AC-1818 (orphaned acceptance criterion)
    - a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion
    - a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent
    - a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one
    - REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved
    dependency_tests:
    - test_UAT_FC_REQ_209_
    hypothesis: 'All iteration-2 failures are fixed at HEAD: the REQ-209 font-metrics
      failure was a fixture defect (round C overshoots cap height), fixed test-only
      in a5a337c47c and verified in a real browser by gate REPORT-11348 at 11e05a2224
      (0 failed, 0 skipped); the AC1054/AC1817/AC1818 change-signal tests pass.'
    instructions: Verify only; make no edits. Keep a5a337c47c (the flat-capital 'HE'
      cap-height fixture in the REQ-209 browser test). Run tests and dependency_tests
      and confirm they are green. If the REQ-209 browser test skips because Chromium
      cannot launch, report that skip as missing evidence, not as a pass. If any listed
      test fails, report the exact assertion and file:line and do not widen scope.
    ladder:
      rung1: 'Decided here: REQ-209 requires font metrics measured from the face that
        resolved, which HEAD satisfies; the earlier failure was the fixture''s round-glyph
        overshoot, not the measurement.'
      rung2: Not needed; no production behaviour is in question.
      rung3: The tests stand as fixed in a5a337c47c and pass at gate REPORT-11348;
        no production code change is demanded.
    test_scope: test_UAT_AC1054_ or test_UAT_AC1817_ or test_UAT_AC1818_ or test_UAT_FC_REQ_209_
  fell_through:
  - 'the `code_frozen` request cannot be declined: blocked_by_ruling.files must list
    every file the batch edits'
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "AC-1817 (orphaned acceptance criterion)",
        "AC-1818 (orphaned acceptance criterion)",
        "a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion",
        "a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent",
        "a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one",
        "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved"
      ],
      "dependency_tests": [
        "test_UAT_FC_REQ_209_"
      ],
      "hypothesis": "All iteration-2 failures are fixed at HEAD: the REQ-209 font-metrics failure was a fixture defect (round C overshoots cap height), fixed test-only in a5a337c47c and verified in a real browser by gate REPORT-11348 at 11e05a2224 (0 failed, 0 skipped); the AC1054/AC1817/AC1818 change-signal tests pass.",
      "instructions": "Verify only; make no edits. Keep a5a337c47c (the flat-capital 'HE' cap-height fixture in the REQ-209 browser test). Run tests and dependency_tests and confirm they are green. If the REQ-209 browser test skips because Chromium cannot launch, report that skip as missing evidence, not as a pass. If any listed test fails, report the exact assertion and file:line and do not widen scope.",
      "ladder": {
        "rung1": "Decided here: REQ-209 requires font metrics measured from the face that resolved, which HEAD satisfies; the earlier failure was the fixture's round-glyph overshoot, not the measurement.",
        "rung2": "Not needed; no production behaviour is in question.",
        "rung3": "The tests stand as fixed in a5a337c47c and pass at gate REPORT-11348; no production code change is demanded."
      },
      "test_scope": "test_UAT_AC1054_ or test_UAT_AC1817_ or test_UAT_AC1818_ or test_UAT_FC_REQ_209_"
    }
  ]
}