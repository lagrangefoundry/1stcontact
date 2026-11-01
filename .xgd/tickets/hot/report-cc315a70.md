---
uid: report-cc315a70
id: REPORT-7281
type: report
title: 'Regression success: 3 caught (reconciliation)'
created_by: xgd
created_at: '2026-11-01T05:10:08.923205+00:00'
updated_at: '2026-11-01T05:10:08.923205+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: regression_success
  subject_uid: bundle-fd009b93
  cycle: reconciliation
  intent_uid: bundle-fd009b93
  regression_count: 3
  dropped_scope_members: []
  left_for_regression: []
  aligned_to_running_code: []
---

[
  {
    "id": "reg-001",
    "capability_uid": "capability-20802191",
    "capability_name": "Material Ingestion: How A File Becomes Stored, Described, Findable Material",
    "story_uid": "story-6ccaedd5",
    "ac_uid": "acceptance_criterion-236187a6",
    "ac_human_id": "AC-1809",
    "ac_summary": "A content type the sender did not state is settled once from the filename, and classification, description and the stored-bytes record all read that one value",
    "failing_uats": [
      "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-1809 (orphaned acceptance criterion)\",\n        \"AC-1678 (orphaned acceptance criterion)\",\n        \"AC-1687 (orphaned acceptance criterion)\",\n        \"story-6ccaedd5 \\u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\n        \"story-6ccaedd5 \\u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_become",
    "resolved": true,
    "description": null,
    "severity": null
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-20802191",
    "capability_name": "Material Ingestion: How A File Becomes Stored, Described, Findable Material",
    "story_uid": "story-6ccaedd5",
    "ac_uid": "acceptance_criterion-7e29a2bc",
    "ac_human_id": "AC-1678",
    "ac_summary": "An ingested file becomes a stored material record whose body is its description, and the answer reports what was stored",
    "failing_uats": [
      "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-1809 (orphaned acceptance criterion)\",\n        \"AC-1678 (orphaned acceptance criterion)\",\n        \"AC-1687 (orphaned acceptance criterion)\",\n        \"story-6ccaedd5 \\u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\n        \"story-6ccaedd5 \\u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_become",
    "resolved": true,
    "description": null,
    "severity": null
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-20802191",
    "capability_name": "Material Ingestion: How A File Becomes Stored, Described, Findable Material",
    "story_uid": "story-6ccaedd5",
    "ac_uid": "acceptance_criterion-c1ab33b4",
    "ac_human_id": "AC-1687",
    "ac_summary": "With no indexer configured the file is still stored, and both the answer and the deployment log say it cannot be found",
    "failing_uats": [
      "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-1809 (orphaned acceptance criterion)\",\n        \"AC-1678 (orphaned acceptance criterion)\",\n        \"AC-1687 (orphaned acceptance criterion)\",\n        \"story-6ccaedd5 \\u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\n        \"story-6ccaedd5 \\u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_become",
    "resolved": true,
    "description": null,
    "severity": null
  }
]