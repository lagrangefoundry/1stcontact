---
uid: report-5c8e6bb9
id: REPORT-429
type: report
title: 'Report: batch_quality_check for report-f8091c08'
created_by: xgd
created_at: '2026-07-10T02:09:12.354965+00:00'
updated_at: '2026-07-10T02:09:12.354965+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-f8091c08
  parent_report_uid: report-1b5dff4f
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-07-10T02:08:29.329655Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 12.460511834011413,
      "passed": 6,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 6,
      "deselected": 547,
      "test_filter": [
        "test_UAT_AC568",
        "test_UAT_AC458",
        "test_UAT_AC433",
        "test_UAT_AC434",
        "test_UAT_AC525",
        "test_UAT_AC535"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_small_rotation_jitter_tolerated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_small_rotation_jitter_tolerated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_missing_motion_flagged_medium\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_missing_motion_flagged_medium\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_matching_transform_and_motion_clean\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_matching_transform_and_motion_clean\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_motion_absent_axis_inert\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_motion_absent_axis_inert\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_every_seeded_defect_fires\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_every_seeded_defect_fires\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_discriminator_reports_calibrated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_discriminator_reports_calibrated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_faithful_baseline_grades_clean\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_faithful_baseline_grades_clean\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_calibration_catches_a_blinded_gate\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_calibration_catches_a_blinded_gate\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 6 \u2014 cross-engine\"],\"fullName\":\"REQ-48 item 6 \u2014 cross-engine test_UAT_FC_REQ-48_cross_engine_subpixel_layout_tolerated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_cross_engine_subpixel_layout_tolerated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 6 \u2014 cross-engine\"],\"fullName\":\"REQ-48 item 6 \u2014 cross-engine test_UAT_FC_REQ-48_engine_driver_factory_and_availability\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_engine_driver_factory_and_availability\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_multistate_loop_projects_every_state_and_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_multistate_loop_projects_every_state_and_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_hover_actuation_changes_projected_geometry\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_hover_actuation_changes_projected_geometry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_multistate_holds_non_actuating_driver_to_rest\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_multistate_holds_non_actuating_driver_to_rest\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_multistate_skips_unavailable_engine_with_note\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_multistate_skips_unavailable_engine_with_note\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing test_UAT_FC_REQ-48_diff_multistate_localizes_hover_delta\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_diff_multistate_localizes_hover_delta\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing test_UAT_FC_REQ-48_diff_multistate_pairs_per_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_diff_multistate_pairs_per_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing test_UAT_FC_REQ-48_diff_multistate_missing_cell_flagged\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_diff_multistate_missing_cell_flagged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783649310461,\"endTime\":1783649310461,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-4/tests/req48-fidelity-axes.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783649310461,\"endTime\":1783649310461,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-4/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783649310461,\"endTime\":1783649310461,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-4/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC525_report_exposes_counts_and_shaped_deltas",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC535_output_forms_and_exit_status",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    }
  },
  "overall": {
    "status": "success",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}