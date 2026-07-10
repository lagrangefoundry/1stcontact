---
uid: report-38a12dab
id: REPORT-438
type: report
title: 'Regression success: 6 caught (reconciliation)'
created_by: xgd
created_at: '2026-07-10T02:29:54.190519+00:00'
updated_at: '2026-07-10T02:30:49.479808+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-df065afc
  cycle: reconciliation
  intent_uid: bundle-df065afc
  regression_count: 6
---

The regression suite caught 6 acceptance-criterion breakages during reconciliation of bundle-df065afc, spanning reference capture, the module catalog, theme CSS generation, and the values-diff fidelity report. Each entry below is annotated with the user-facing behavior that was broken and a severity rating; all six were resolved.

[
  {
    "id": "reg-001",
    "capability_uid": "capability-4dd2cf78",
    "capability_name": "Reference Capture: Headless-Browser Vision",
    "story_uid": "story-8f33f14c",
    "ac_uid": "acceptance_criterion-a29a2e0b",
    "ac_human_id": "AC-568",
    "ac_summary": "Additional rendered axes are projected per element: z-order, treatments, media, transform, motion, font-load, viewport",
    "failing_uats": [
      "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"1c capture page \\u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n    ",
    "resolved": true,
    "description": "The reference-capture engine failed to project the full set of per-element rendered axes (z-order, treatments, media, transform, motion, font-load, viewport), so captured references were missing the rendering data needed for accurate fidelity comparison.",
    "severity": "high"
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-4dbbfc15",
    "capability_name": "Website Framework: Theming & Module Catalog",
    "story_uid": "story-903e3e3a",
    "ac_uid": "acceptance_criterion-a0804a3f",
    "ac_human_id": "AC-458",
    "ac_summary": "The three content modules are resolvable from the catalog and each exposes a conforming contract",
    "failing_uats": [
      "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"1c capture page \\u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n    ",
    "resolved": true,
    "description": "The three content modules could not be resolved from the module catalog with a conforming contract, so authors could not compose pages using those modules.",
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
      "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"1c capture page \\u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n    ",
    "resolved": true,
    "description": "Generated theme CSS did not declare a custom property for every token slot with deterministic names, leaving styling tokens undefined or unpredictably named.",
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
      "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"1c capture page \\u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n    ",
    "resolved": true,
    "description": "Omitted token slots were not filled from defaults, so generated theme CSS did not cover the full token surface and left parts of the styling unspecified.",
    "severity": "medium"
  },
  {
    "id": "reg-005",
    "capability_uid": "capability-4dd2cf78",
    "capability_name": "Reference Capture: Headless-Browser Vision",
    "story_uid": "story-f826e5ca",
    "ac_uid": "acceptance_criterion-2224356c",
    "ac_human_id": "AC-525",
    "ac_summary": "Live values-diff produces a severity-ranked delta report against a captured reference",
    "failing_uats": [
      "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC525_report_exposes_counts_and_shaped_deltas"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"1c capture page \\u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n    ",
    "resolved": true,
    "description": "The live values-diff did not produce a severity-ranked delta report against the captured reference, so users could not see or prioritize fidelity differences.",
    "severity": "medium"
  },
  {
    "id": "reg-006",
    "capability_uid": "capability-4dd2cf78",
    "capability_name": "Reference Capture: Headless-Browser Vision",
    "story_uid": "story-f826e5ca",
    "ac_uid": "acceptance_criterion-f369c687",
    "ac_human_id": "AC-535",
    "ac_summary": "Report is emitted as human text or JSON, optionally written to a file, and exit status reflects fidelity",
    "failing_uats": [
      "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC535_output_forms_and_exit_status"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"1c capture page \\u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element\",\n        \"reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract\",\n        \"story-a224111f \\u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names\",\n    ",
    "resolved": true,
    "description": "The values-diff report could not be emitted in the expected human/JSON forms or written to a file, and its exit status did not reflect fidelity, breaking automated fidelity gating.",
    "severity": "medium"
  }
]