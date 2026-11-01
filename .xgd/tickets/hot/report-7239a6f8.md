---
uid: report-7239a6f8
id: REPORT-7183
type: report
title: 'Report: fix_plan for STORY-106'
created_by: xgd
created_at: '2026-11-01T01:21:39.981612+00:00'
updated_at: '2026-11-01T01:21:39.981612+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: STORY-106
  items:
  - index: 0
    tests:
    - the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates
    - a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC2069 or test_UAT_AC2072
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates",
        "a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC2069 or test_UAT_AC2072"
    }
  ]
}