---
uid: report-9f15b1e7
id: REPORT-398
type: report
title: 'Regression success: 4 caught (reconciliation)'
created_by: xgd
created_at: '2026-07-09T23:57:31.860583+00:00'
updated_at: '2026-07-09T23:57:31.860583+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: regression_success
  subject_uid: bundle-adc60ee8
  cycle: reconciliation
  intent_uid: bundle-adc60ee8
  regression_count: 4
---

[
  {
    "id": "reg-001",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-903e3e3a",
    "ac_uid": "acceptance_criterion-a0804a3f",
    "ac_human_id": "AC-458",
    "ac_summary": "The three content modules are resolvable from the catalog and each exposes a conforming contract",
    "failing_uats": [
      "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generatio",
    "resolved": true,
    "description": null,
    "severity": null
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-903e3e3a",
    "ac_uid": "acceptance_criterion-05952d09",
    "ac_human_id": "AC-448",
    "ac_summary": "services-grid renders one card per provided item",
    "failing_uats": [
      "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generatio",
    "resolved": true,
    "description": null,
    "severity": null
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-a224111f",
    "ac_uid": "acceptance_criterion-38c65ed5",
    "ac_human_id": "AC-433",
    "ac_summary": "Theme CSS declares a custom property for every token slot with deterministic names",
    "failing_uats": [
      "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generatio",
    "resolved": true,
    "description": null,
    "severity": null
  },
  {
    "id": "reg-004",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-a224111f",
    "ac_uid": "acceptance_criterion-36a1eebf",
    "ac_human_id": "AC-434",
    "ac_summary": "Omitted token slots are filled from defaults so CSS always covers the full surface",
    "failing_uats": [
      "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generatio",
    "resolved": true,
    "description": null,
    "severity": null
  }
]