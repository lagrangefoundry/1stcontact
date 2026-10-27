---
uid: report-a5579bab
id: REPORT-6785
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-10-27T19:57:27.526811+00:00'
updated_at: '2026-10-27T19:57:27.526811+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  items:
  - index: 0
    tests:
    - every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found
    - a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn
    - a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead
    - a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes
    - a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC2028 or test_UAT_AC2031 or test_UAT_AC2033 or test_UAT_AC2034
      or test_UAT_AC2025
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found",
        "a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn",
        "a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead",
        "a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes",
        "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC2028 or test_UAT_AC2031 or test_UAT_AC2033 or test_UAT_AC2034 or test_UAT_AC2025"
    }
  ]
}