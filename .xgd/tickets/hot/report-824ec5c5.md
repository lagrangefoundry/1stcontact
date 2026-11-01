---
uid: report-824ec5c5
id: REPORT-7257
type: report
title: 'Report: fix_plan for report-06a89294'
created_by: xgd
created_at: '2026-11-01T03:50:28.275731+00:00'
updated_at: '2026-11-01T04:24:59.893045+00:00'
completed_at: null
last_field_updated: batches_pending
fields:
  report_kind: fix_plan
  subject_uid: report-06a89294
  items:
  - index: 0
    tests:
    - AC-1809 (orphaned acceptance criterion)
    - AC-1678 (orphaned acceptance criterion)
    - AC-1687 (orphaned acceptance criterion)
    - story-6ccaedd5 — the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value
    - story-6ccaedd5 — a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description
    - story-6ccaedd5 — a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so
    dependency_tests: []
    instructions: ''
    test_scope: AC-1809 (orphaned acceptance criterion) or AC-1678 (orphaned acceptance
      criterion) or AC-1687 (orphaned acceptance criterion) or test_UAT_AC1809 or
      test_UAT_AC1678 or test_UAT_AC1687
  batches_pending: false
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "AC-1809 (orphaned acceptance criterion)",
        "AC-1678 (orphaned acceptance criterion)",
        "AC-1687 (orphaned acceptance criterion)",
        "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value",
        "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description",
        "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "AC-1809 (orphaned acceptance criterion) or AC-1678 (orphaned acceptance criterion) or AC-1687 (orphaned acceptance criterion) or test_UAT_AC1809 or test_UAT_AC1678 or test_UAT_AC1687"
    }
  ]
}