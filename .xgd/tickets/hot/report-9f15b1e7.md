---
uid: report-9f15b1e7
id: REPORT-398
type: report
title: 'Regression success: 4 caught (reconciliation)'
created_by: xgd
created_at: '2026-07-09T23:57:31.860583+00:00'
updated_at: '2026-07-09T23:58:25.109889+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-adc60ee8
  cycle: reconciliation
  intent_uid: bundle-adc60ee8
  regression_count: 4
---

This regression run caught 4 previously-passing acceptance criteria that broke under reconciliation of bundle-adc60ee8, all within the Website Framework theming and module-catalog capability. Each entry below is annotated with the user-facing behavior that was broken and a severity rating; all four were resolved by the fix loop.

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
    "description": "The site builder could not resolve the hero, text-block, and services-grid content modules from the catalog (or they exposed a non-conforming contract), so any page composed from these modules would fail to build or render.",
    "severity": "critical"
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
    "description": "The services-grid module rendered the wrong number of service cards for a given list of items, so visitors saw missing or duplicated services on the page.",
    "severity": "high"
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
      "story-a224111f — theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generatio",
    "resolved": true,
    "description": "Generated theme CSS was missing a custom property for one or more token slots (or used non-deterministic names), leaving parts of a site unstyled or inconsistently themed.",
    "severity": "high"
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
      "story-a224111f — theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generatio",
    "resolved": true,
    "description": "When a theme omitted some token slots, the generated CSS did not fall back to defaults, so those slots yielded undefined CSS variables and produced visual gaps across the site.",
    "severity": "medium"
  }
]