---
uid: report-6000d2f1
id: REPORT-425
type: report
title: 'Regression quality: fail (96 tests, 6 failed)'
created_by: xgd
created_at: '2026-07-10T02:00:44.650262+00:00'
updated_at: '2026-07-10T02:00:44.650262+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: report-f8091c08
  commit: 612bac8d6e7a8c64bef068ace33cc98e51970316
---

{
  "timestamp": "2026-07-10T01:59:50.856062Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010779208969324827,
    "errors": 0,
    "warnings": 0,
    "error_list": [],
    "warning_list": []
  },
  "build": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0,
    "errors": 0,
    "error_list": []
  },
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 24.907422207994387,
      "passed": 90,
      "failed": 6,
      "skipped": 0,
      "errors": 0,
      "total": 96,
      "deselected": 457,
      "test_filter": [
        "test_UAT_AC433",
        "test_UAT_AC434",
        "test_UAT_AC435",
        "test_UAT_AC436",
        "test_UAT_AC437",
        "test_UAT_AC438",
        "test_UAT_AC439",
        "test_UAT_AC440",
        "test_UAT_AC441",
        "test_UAT_AC442",
        "test_UAT_AC443",
        "test_UAT_AC444",
        "test_UAT_AC445",
        "test_UAT_AC446",
        "test_UAT_AC447",
        "test_UAT_AC448",
        "test_UAT_AC449",
        "test_UAT_AC450",
        "test_UAT_AC451",
        "test_UAT_AC452",
        "test_UAT_AC453",
        "test_UAT_AC454",
        "test_UAT_AC455",
        "test_UAT_AC456",
        "test_UAT_AC457",
        "test_UAT_AC458",
        "test_UAT_AC459",
        "test_UAT_AC460",
        "test_UAT_AC461",
        "test_UAT_AC462",
        "test_UAT_AC463",
        "test_UAT_AC464",
        "test_UAT_AC465",
        "test_UAT_AC466",
        "test_UAT_AC467",
        "test_UAT_AC468",
        "test_UAT_AC498",
        "test_UAT_AC499",
        "test_UAT_AC500",
        "test_UAT_AC501",
        "test_UAT_AC502",
        "test_UAT_AC503",
        "test_UAT_AC504",
        "test_UAT_AC505",
        "test_UAT_AC506",
        "test_UAT_AC507",
        "test_UAT_AC508",
        "test_UAT_AC509",
        "test_UAT_AC510",
        "test_UAT_AC511",
        "test_UAT_AC512",
        "test_UAT_AC513",
        "test_UAT_AC514",
        "test_UAT_AC522",
        "test_UAT_AC523",
        "test_UAT_AC524",
        "test_UAT_AC525",
        "test_UAT_AC526",
        "test_UAT_AC527",
        "test_UAT_AC528",
        "test_UAT_AC529",
        "test_UAT_AC530",
        "test_UAT_AC531",
        "test_UAT_AC532",
        "test_UAT_AC533",
        "test_UAT_AC534",
        "test_UAT_AC535",
        "test_UAT_AC548",
        "test_UAT_AC549",
        "test_UAT_AC550",
        "test_UAT_AC551",
        "test_UAT_AC552",
        "test_UAT_AC553",
        "test_UAT_AC554",
        "test_UAT_AC555",
        "test_UAT_AC556",
        "test_UAT_AC557",
        "test_UAT_AC558",
        "test_UAT_AC559",
        "test_UAT_AC560",
        "test_UAT_AC561",
        "test_UAT_AC562",
        "test_UAT_AC563",
        "test_UAT_AC564",
        "test_UAT_AC565",
        "test_UAT_AC566",
        "test_UAT_AC567",
        "test_UAT_AC568",
        "test_UAT_AC569",
        "test_UAT_AC570",
        "test_UAT_AC571",
        "test_UAT_AC572",
        "test_UAT_AC573",
        "test_UAT_AC574",
        "test_UAT_FC_BUNDLE_4",
        "test_UAT_FC_REQ_39",
        "test_UAT_FC_REQ_40",
        "test_UAT_FC_REQ_45",
        "test_UAT_FC_REQ_46",
        "test_UAT_FC_REQ_47",
        "test_UAT_FC_REQ_48"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_small_rotation_jitter_tolerated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_small_rotation_jitter_tolerated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_missing_motion_flagged_medium\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_missing_motion_flagged_medium\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_matching_transform_and_motion_clean\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_matching_transform_and_motion_clean\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 1 \u2014 motion / transform\"],\"fullName\":\"REQ-48 item 1 \u2014 motion / transform test_UAT_FC_REQ-48_motion_absent_axis_inert\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_motion_absent_axis_inert\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_every_seeded_defect_fires\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_every_seeded_defect_fires\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_discriminator_reports_calibrated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_discriminator_reports_calibrated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_faithful_baseline_grades_clean\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_faithful_baseline_grades_clean\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 11 \u2014 discriminator calibration\"],\"fullName\":\"REQ-48 item 11 \u2014 discriminator calibration test_UAT_FC_REQ-48_calibration_catches_a_blinded_gate\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_calibration_catches_a_blinded_gate\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 6 \u2014 cross-engine\"],\"fullName\":\"REQ-48 item 6 \u2014 cross-engine test_UAT_FC_REQ-48_cross_engine_subpixel_layout_tolerated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_cross_engine_subpixel_layout_tolerated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 item 6 \u2014 cross-engine\"],\"fullName\":\"REQ-48 item 6 \u2014 cross-engine test_UAT_FC_REQ-48_engine_driver_factory_and_availability\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_engine_driver_factory_and_availability\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_multistate_loop_projects_every_state_and_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_multistate_loop_projects_every_state_and_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_hover_actuation_changes_projected_geometry\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_hover_actuation_changes_projected_geometry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_multistate_holds_non_actuating_driver_to_rest\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_multistate_holds_non_actuating_driver_to_rest\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 multi-state capture orchestration test_UAT_FC_REQ-48_multistate_skips_unavailable_engine_with_note\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_multistate_skips_unavailable_engine_with_note\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing test_UAT_FC_REQ-48_diff_multistate_localizes_hover_delta\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_diff_multistate_localizes_hover_delta\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing test_UAT_FC_REQ-48_diff_multistate_pairs_per_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_diff_multistate_pairs_per_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing\"],\"fullName\":\"REQ-48 items 1/5/6 \u2014 diffMultiState pairing test_UAT_FC_REQ-48_diff_multistate_missing_cell_flagged\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-48_diff_multistate_missing_cell_flagged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783648793797,\"endTime\":1783648793797,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-4/tests/req48-fidelity-axes.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783648793797,\"endTime\":1783648793797,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-4/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783648793797,\"endTime\":1783648793797,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-4/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC567_per_element_geometry_shape_a11y_and_text_free_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element",
          "file": "",
          "status": "failed"
        },
        {
          "name": "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC569_fonts_ready_and_reduced_motion_preconditions",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC570_multistate_matrix_across_viewports_engines_states_with_notes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 per-element value manifest (story-8f33f14c / REQ-31 / REQ-35) test_UAT_AC522_content_runs_record_computed_per_element_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 per-element value manifest (story-8f33f14c / REQ-31 / REQ-35) test_UAT_AC523_section_scrim_overlay_and_content_anchor_captured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 per-element value manifest (story-8f33f14c / REQ-31 / REQ-35) test_UAT_AC524_unresolvable_colour_flagged_and_new_fields_optional",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC459_capture_writes_complete_self_contained_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC460_theme_colors_are_painted_with_var_resolved",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC461_section_background_image_captured_with_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC462_hidden_content_is_excluded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC463_visible_text_verbatim_with_painted_styling",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC464_pages_segmented_by_style_signature",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC465_rendered_and_raw_html_both_retained",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC466_bundle_reextracts_offline_with_no_network",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC467_capture_runs_against_injectable_driver",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c capture page \u2014 rendered-only reference capture (story-8f33f14c / REQ-12) test_UAT_AC468_browser_failure_retries_then_errors_no_static_fallback",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: contact-form client enhancement (story-903e3e3a) test_UAT_AC454_enhancement_intercepts_submit_and_posts_json_to_action",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: contact-form client enhancement (story-903e3e3a) test_UAT_AC455_enhancement_swaps_in_success_message_on_2xx",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: contact-form client enhancement (story-903e3e3a) test_UAT_AC456_enhancement_surfaces_inline_error_on_failed_response",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Content-safety render boundary (story-38de5800) test_UAT_AC555_unsafe_url_scheme_in_sink_fails_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Content-safety render boundary (story-38de5800) test_UAT_AC556_safe_urls_render_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Content-safety render boundary (story-38de5800) test_UAT_AC557_injectable_html_in_markdown_fails_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Content-safety render boundary (story-38de5800) test_UAT_AC558_clean_markdown_and_content_render_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Content-safety render boundary (story-38de5800) test_UAT_AC559_rejection_error_names_field_and_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Content-safety render boundary (story-38de5800) test_UAT_AC560_real_module_passes_security_by_rejecting",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC457_content_validation_recurses_item_schema_reporting_nested_paths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC508_cards_render_structured_accent_badge_checklist_and_surface",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC509_stacked_variant_and_grid_and_per_card_size_dials",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC510_checklist_tick_is_real_text_run_keyed_to_card_status_colour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC511_consecutive_half_width_forms_group_into_one_shared_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC512_submit_button_carries_treatment_dial_and_inherits_font",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC513_markdown_alert_blockquotes_render_as_semantic_callouts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-3 upgrade (story-903e3e3a) test_UAT_AC514_markdown_renders_verbatim_with_smartypants_disabled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-4 upgrade (story-903e3e3a) test_UAT_AC446_variant_sets_frame_width_content_fills_when_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-4 upgrade (story-903e3e3a) test_UAT_AC564_text_block_and_services_grid_content_width_caps_at_left_gutter",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-4 upgrade (story-903e3e3a) test_UAT_AC565_submit_foreground_paints_label_palette_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog \u2014 BUNDLE-4 upgrade (story-903e3e3a) test_UAT_AC566_subhead_and_caption_sizes_and_caption_slot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract",
          "file": "",
          "status": "failed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC457_content_rejected_for_missing_field_or_list_bound_violation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC445_text_block_renders_markdown_body_with_lazy_images",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC446_text_block_width_fixed_by_variant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC447_text_block_heading_only_when_provided",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC449_services_grid_single_column_below_md_multi_from_md",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC450_contact_form_renders_one_labelled_control_per_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC451_contact_form_posts_to_action_without_js",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC452_contact_form_includes_hidden_honeypot_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC453_contact_form_renders_turnstile_mount_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-2) \u2014 module component CSS folding (BUG-1) test_UAT_AC498_theme_css_folds_module_component_styles_so_pages_are_styled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-2) \u2014 display fonts + display-font slot (REQ-24) test_UAT_AC499_emits_font_face_per_display_font_and_always_a_display_family",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-2) \u2014 header wordmark dials (REQ-24) test_UAT_AC500_header_logo_dials_style_text_wordmark_with_finite_enums",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-2) \u2014 header overlay variant (REQ-25) test_UAT_AC501_overlay_header_composited_over_following_band_as_one_shared_band",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-3) \u2014 hero headingTreatment dial (REQ-28) test_UAT_AC502_hero_headingTreatment_colours_heading_independently_of_surface",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-3) \u2014 hero height / subhead / scrim / anchor dials test_UAT_AC503_hero_exposes_height_markdown_subhead_colour_size_scrim_anchor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-3) \u2014 header align / logoSize / xl spacing / display wordmark test_UAT_AC504_header_exposes_align_logoSize_xl_spacing_and_display_wordmark",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-3) \u2014 footer layout dial (REQ-33) test_UAT_AC505_footer_layout_dial_spreads_or_stacks_copyright_and_links",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-3) \u2014 generalized gradient text treatment (REQ-32) test_UAT_AC506_structured_gradient_treatment_clips_multistop_any_direction_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-3) \u2014 expanded palette roles (REQ-33 / REQ-20) test_UAT_AC507_palette_accepts_optional_expanded_roles_emitted_as_colour_props",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-4) \u2014 hero heading + header wordmark tracking dial (REQ-45) test_UAT_AC561_hero_and_header_expose_token_backed_tracking_dial",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-4) \u2014 theme CSS --tracking-* tokens (REQ-45) test_UAT_AC562_theme_css_emits_tracking_tokens_backfilled_for_old_themes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f (BUNDLE-4) \u2014 hero subheadLeading dial (REQ-45) test_UAT_AC563_hero_subhead_leading_sets_line_height_independently",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC435_emits_dark_mode_block_only_for_supplied_dark_roles",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 module catalog test_UAT_AC436_resolves_known_module_returning_contract_and_component",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 module catalog test_UAT_AC437_unknown_module_throws_catalog_miss_naming_request_and_known_entries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 module catalog test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC439_header_renders_logo_nav_links_and_below_md_collapse",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC440_hero_bg_color_renders_heading_subhead_no_image_clamp_sized",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC441_hero_bg_image_renders_background_image_with_src_and_alt",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC442_hero_renders_cta_only_when_provided",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC443_footer_renders_deterministic_build_time_copyright",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC444_footer_renders_optional_link_row_one_link_per_entry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 conformance no-browser advisory no-op (story-a6962b23) test_UAT_AC554_advisory_noop_without_browser_runs_with_explicit_driver",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 module conformance harness (story-a6962b23) test_UAT_AC548_isolation_single_module_no_site_pollution",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 module conformance harness (story-a6962b23) test_UAT_AC549_safety_flags_broken_render_by_category",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 module conformance harness (story-a6962b23) test_UAT_AC550_wellformed_module_passes_both_dimensions",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 module conformance harness (story-a6962b23) test_UAT_AC551_declared_exemption_suppresses_only_its_category",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 module conformance harness (story-a6962b23) test_UAT_AC552_security_flags_injection_from_schema_payloads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Reconciliation \u2014 module conformance harness (story-a6962b23) test_UAT_AC553_content_safety_refusal_is_conformant_safe_rejection",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff enriched projection (reconciliation UATs) test_UAT_AC571_new_axis_preconditions_and_multistate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff enriched projection (reconciliation UATs) test_UAT_AC572_systemic_aggregation_escalates_capped_at_high",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff enriched projection (reconciliation UATs) test_UAT_AC573_ignore_masks_year_fold_and_suppressed_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff enriched projection (reconciliation UATs) test_UAT_AC574_calibration_oracle_names_blind_axis",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC525_report_exposes_counts_and_shaped_deltas",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC526_per_element_fields_flagged_by_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC527_casing_flagged_whitespace_ignored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC528_section_overlay_and_anchor_by_index",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC529_deltas_ranked_most_severe_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC530_colour_compared_perceptually",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC531_jitter_tolerances_strict_and_per_metric",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC532_inferred_reference_colour_never_hard_delta",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC533_offline_actual_short_circuits_and_slug_required",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC534_repeated_texts_pair_fifo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC535_output_forms_and_exit_status",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "1c capture page \u2014 per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48) test_UAT_AC568_additional_rendered_axes_projected_per_element",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC525_report_exposes_counts_and_shaped_deltas",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-f826e5ca \u2014 1c values-diff (reconciliation UATs) test_UAT_AC535_output_forms_and_exit_status",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": []
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "test_failure",
        "field": "test results",
        "message": "6 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 6
        }
      }
    ]
  }
}