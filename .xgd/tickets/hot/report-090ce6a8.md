---
uid: report-090ce6a8
id: REPORT-387
type: report
title: 'Report: fix_plan for report-84adbb17'
created_by: xgd
created_at: '2026-07-09T23:31:36.403028+00:00'
updated_at: '2026-07-09T23:36:07.734513+00:00'
completed_at: null
last_field_updated: batches_pending
fields:
  report_kind: fix_plan
  subject_uid: report-84adbb17
  items:
  - index: 0
    tests:
    - 'reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract'
    - 'reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item'
    - story-a224111f — theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names
    - story-a224111f — theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC458 or test_UAT_AC448 or test_UAT_AC433 or test_UAT_AC434
  batches_pending: false
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract",
        "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item",
        "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names",
        "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC458 or test_UAT_AC448 or test_UAT_AC433 or test_UAT_AC434"
    }
  ]
}