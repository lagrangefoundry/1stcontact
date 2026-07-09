---
uid: report-bc9fabc1
id: REPORT-353
type: report
title: 'Regression success: 3 caught (reconciliation)'
created_by: xgd
created_at: '2026-07-09T21:40:56.919987+00:00'
updated_at: '2026-07-09T21:41:52.082045+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-f39884d2
  cycle: reconciliation
  intent_uid: bundle-f39884d2
  regression_count: 3
---

Regression harness caught 3 acceptance criteria in the "Website Framework: Theming & Module Catalog" capability (story-a224111f) that regressed and were subsequently fixed during reconciliation. Each entry below is annotated with a one-line description of the user-facing breakage and a severity rating.

[
  {
    "id": "reg-001",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-a224111f",
    "ac_uid": "acceptance_criterion-38c65ed5",
    "ac_human_id": "AC-433",
    "ac_summary": "Theme CSS declares a custom property for every token slot with deterministic names",
    "failing_uats": [
      "story-a224111f — theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface\",\n        \"story-a224111f \\u2014 module catalog test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract\"\n      ],\n      \"dependency_tests\": [],\n      \"instructions\": \"\",\n ",
    "resolved": true,
    "description": "Generated theme CSS was missing a custom property for one or more token slots (or used non-deterministic names), so every component referencing those variables would lose its theme styling site-wide.",
    "severity": "high"
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-a224111f",
    "ac_uid": "acceptance_criterion-36a1eebf",
    "ac_human_id": "AC-434",
    "ac_summary": "Omitted token slots are filled from defaults so CSS always covers the full surface",
    "failing_uats": [
      "story-a224111f — theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface\",\n        \"story-a224111f \\u2014 module catalog test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract\"\n      ],\n      \"dependency_tests\": [],\n      \"instructions\": \"\",\n ",
    "resolved": true,
    "description": "When a theme omitted some token slots, the generated CSS left those slots empty instead of filling them from defaults, so pages using partial theme configs rendered with unstyled gaps.",
    "severity": "medium"
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-a224111f",
    "ac_uid": "acceptance_criterion-46a9c79b",
    "ac_human_id": "AC-438",
    "ac_summary": "Each chrome module exposes a conforming contract of variants, dials, and content schema",
    "failing_uats": [
      "story-a224111f — module catalog test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface\",\n        \"story-a224111f \\u2014 module catalog test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract\"\n      ],\n      \"dependency_tests\": [],\n      \"instructions\": \"\",\n ",
    "resolved": true,
    "description": "Chrome modules failed to expose their required contract of variants, dials, and content schema, so the builder could not reliably configure or render those modules.",
    "severity": "high"
  }
]