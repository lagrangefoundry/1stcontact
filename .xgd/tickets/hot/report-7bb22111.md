---
uid: report-7bb22111
id: REPORT-11467
type: report
title: 'Report: fix_plan for STORY-144'
created_by: xgd
created_at: '2026-11-08T14:05:53.545979+00:00'
updated_at: '2026-11-08T14:05:53.545979+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: STORY-144
  items:
  - index: 0
    tests:
    - AC-1717 — the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on
    - AC-2086 — a capture states its file count in place of *File*, and downloads
      the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot
    - AC-1718 — the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC1717 or test_UAT_AC2086 or test_UAT_AC1718
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
        "AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot",
        "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC1717 or test_UAT_AC2086 or test_UAT_AC1718"
    }
  ]
}