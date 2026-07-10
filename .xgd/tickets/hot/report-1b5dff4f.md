---
uid: report-1b5dff4f
id: REPORT-426
type: report
title: 'Report: fix_plan for report-f8091c08'
created_by: xgd
created_at: '2026-07-10T02:00:48.545324+00:00'
updated_at: '2026-07-10T02:00:48.545324+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: report-f8091c08
  items:
  - index: 0
    tests:
    - 1c capture page — per-element projection & multi-state (story-8f33f14c / REQ-47
      / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element
    - 'reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract'
    - story-a224111f — theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names
    - story-a224111f — theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface
    - story-f826e5ca — 1c values-diff (reconciliation UATs) test_UAT_AC525_report_exposes_counts_and_shaped_deltas
    - story-f826e5ca — 1c values-diff (reconciliation UATs) test_UAT_AC535_output_forms_and_exit_status
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC568 or test_UAT_AC458 or test_UAT_AC433 or test_UAT_AC434
      or test_UAT_AC525 or test_UAT_AC535
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element",
        "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract",
        "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names",
        "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface",
        "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC525_report_exposes_counts_and_shaped_deltas",
        "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC535_output_forms_and_exit_status"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC568 or test_UAT_AC458 or test_UAT_AC433 or test_UAT_AC434 or test_UAT_AC525 or test_UAT_AC535"
    }
  ]
}