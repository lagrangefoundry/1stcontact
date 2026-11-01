---
uid: report-b52ad731
id: REPORT-662
type: report
title: 'Scoped quality: fail (51 tests, 1 failed, 1 orphan AC(s))'
created_by: xgd
created_at: '2026-07-19T03:42:30.484026+00:00'
updated_at: '2026-07-19T03:42:30.484026+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: report-0e82c093
  commit: 56532e6bf39984dc913b4ccd8d70e2e1f4c56c44
---

{
  "timestamp": "2026-07-19T03:40:07.903059Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00023595895618200302,
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
      "duration_seconds": 40.73435137490742,
      "passed": 50,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 51,
      "deselected": 683,
      "test_filter": [
        "test_UAT_AC629",
        "test_UAT_AC630",
        "test_UAT_AC631",
        "test_UAT_AC632",
        "test_UAT_AC633",
        "test_UAT_AC634",
        "test_UAT_AC635",
        "test_UAT_AC636",
        "test_UAT_AC637",
        "test_UAT_AC638",
        "test_UAT_AC639",
        "test_UAT_AC640",
        "test_UAT_AC641",
        "test_UAT_AC642",
        "test_UAT_AC643",
        "test_UAT_AC644",
        "test_UAT_AC645",
        "test_UAT_AC647",
        "test_UAT_AC648",
        "test_UAT_AC649",
        "test_UAT_AC650",
        "test_UAT_AC651",
        "test_UAT_AC652",
        "test_UAT_AC653",
        "test_UAT_AC654",
        "test_UAT_AC655",
        "test_UAT_AC656",
        "test_UAT_AC657",
        "test_UAT_AC658",
        "test_UAT_AC659",
        "test_UAT_AC660",
        "test_UAT_AC661",
        "test_UAT_AC662",
        "test_UAT_AC663",
        "test_UAT_AC664",
        "test_UAT_AC665",
        "test_UAT_AC666",
        "test_UAT_AC667",
        "test_UAT_AC668",
        "test_UAT_AC669",
        "test_UAT_AC670",
        "test_UAT_AC671",
        "test_UAT_AC673",
        "test_UAT_AC674",
        "test_UAT_AC675",
        "test_UAT_AC676",
        "test_UAT_AC677",
        "test_UAT_AC678",
        "test_UAT_AC679",
        "test_UAT_AC680",
        "test_UAT_AC681",
        "test_UAT_FC_BUNDLE_6",
        "test_UAT_FC_REQ_58",
        "test_UAT_FC_REQ_59",
        "test_UAT_FC_REQ_61",
        "test_UAT_FC_REQ_62"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "tags\":[]},{\"ancestorTitles\":[\"REQ-61 \u2014 --size is a valued flag on the CLI surface\"],\"fullName\":\"REQ-61 \u2014 --size is a valued flag on the CLI surface test_UAT_FC_REQ-61_size_flag_parses_as_value\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_size_flag_parses_as_value\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784432413393,\"endTime\":1784432413393,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/req61-size-diff.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot\"],\"fullName\":\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot\"],\"fullName\":\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot test_UAT_FC_REQ-61_pixel_size_fails_loudly_without_width_screenshot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_pixel_size_fails_loudly_without_width_screenshot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot\"],\"fullName\":\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot test_UAT_FC_REQ-61_pixel_no_size_uses_default_full_screenshot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_pixel_no_size_uses_default_full_screenshot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784432413393,\"endTime\":1784432413393,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/req61-size-pixel-diff.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_textblock_meta_exposes_panel_gradient_field\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_textblock_meta_exposes_panel_gradient_field\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_panel_gradient_renders_background_image\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_panel_gradient_renders_background_image\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_no_panel_gradient_keeps_solid\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_no_panel_gradient_keeps_solid\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 validation\"],\"fullName\":\"REQ-62 gradient panel \u2014 validation test_UAT_FC_REQ-62_validation_accepts_gradient_panel\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_validation_accepts_gradient_panel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 validation\"],\"fullName\":\"REQ-62 gradient panel \u2014 validation test_UAT_FC_REQ-62_validation_rejects_malformed_gradient\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_validation_rejects_malformed_gradient\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 values-diff\"],\"fullName\":\"REQ-62 gradient panel \u2014 values-diff test_UAT_FC_REQ-62_surface_gradient_missing_flags\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_surface_gradient_missing_flags\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 values-diff\"],\"fullName\":\"REQ-62 gradient panel \u2014 values-diff test_UAT_FC_REQ-62_matching_surface_gradient_no_flag\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_matching_surface_gradient_no_flag\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 values-diff\"],\"fullName\":\"REQ-62 gradient panel \u2014 values-diff test_UAT_FC_REQ-62_both_null_surface_gradient_no_flag\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_both_null_surface_gradient_no_flag\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 real Chromium capture\"],\"fullName\":\"REQ-62 gradient panel \u2014 real Chromium capture test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 real Chromium capture\"],\"fullName\":\"REQ-62 gradient panel \u2014 real Chromium capture test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784432413393,\"endTime\":1784432413393,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/req62-gradient-panel.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784432413393,\"endTime\":1784432413393,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784432413393,\"endTime\":1784432413393,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-82eb6908 \u2014 gradients as a first-class value test_UAT_AC634_text_fill_gradient_stop_position_drift_flags",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-82eb6908 \u2014 gradients as a first-class value test_UAT_AC635_positionless_stops_compared_on_colour_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-82eb6908 \u2014 gradients as a first-class value test_UAT_AC636_surface_gradient_present_vs_missing_flags",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-82eb6908 \u2014 gradients as a first-class value test_UAT_AC637_gradient_panel_renders_padded_rounded_panel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-82eb6908 \u2014 gradients as a first-class value test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC629_rendered_text_extent_delta_when_font_values_match",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC630_rendered_text_extent_suppresses_and_honours_tolerant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC632_box_border_delta_cases",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC633_duplicate_text_paired_by_nearest_position",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional test_UAT_AC656_multi_viewport_keeps_slug_positional",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_json_is_exactly_one_parseable_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 stdout is restored after success and after failure test_UAT_AC659_stdout_restored_after_success_and_failure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-660 \u2014 colour dial #hex literal renders verbatim test_UAT_AC660_colour_hex_literal_renders_exact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-661 \u2014 colour dial palette-role resolves to the theme colour test_UAT_AC661_colour_role_resolves_to_palette",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-662 \u2014 absolute length dials render verbatim test_UAT_AC662_absolute_length_dials_render_verbatim",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-663 \u2014 named step resolves to its overlay token test_UAT_AC663_named_step_resolves_to_overlay_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-664 \u2014 malformed length fails site validation loudly test_UAT_AC664_malformed_length_fails_validation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-665 \u2014 radius dial: absolute px verbatim or named shape token test_UAT_AC665_radius_absolute_or_named_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 services-grid card treatments test_UAT_AC674_card_veil_paints_translucent_white_none_keeps_solid_surface",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 services-grid card treatments test_UAT_AC675_card_border_none_drops_hairline_but_accented_card_keeps_left_bar",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 contact-form treatments test_UAT_AC676_field_labels_placeholder_moves_label_into_placeholder_and_hides_label",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 contact-form treatments test_UAT_AC677_submit_inline_lays_field_and_button_on_one_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 contact-form treatments test_UAT_AC678_submit_color_paints_button_fill_with_literal_or_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 footer overrides test_UAT_AC679_copyright_override_renders_verbatim_line_else_generated_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 footer overrides test_UAT_AC680_text_color_renders_footer_body_in_literal_or_role_else_surface_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-46e3b3c7 \u2014 footer overrides test_UAT_AC681_link_color_renders_footer_links_in_literal_or_role_else_surface_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 per-breakpoint length dials test_UAT_AC666_per_breakpoint_dial_applies_override_and_up",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 per-breakpoint length dials test_UAT_AC667_scalar_length_dial_constant_across_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 per-breakpoint length dials test_UAT_AC668_per_breakpoint_form_honoured_across_all_length_dials",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 per-breakpoint length dials test_UAT_AC670_each_entry_accepts_literal_or_named_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 per-breakpoint length dials test_UAT_AC669_per_breakpoint_content_width_cap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 configurable nav collapse test_UAT_AC671_nav_collapse_dial_selects_breakpoint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3569e1a4 \u2014 per-breakpoint dial validation at load test_UAT_AC673_rejects_malformed_per_breakpoint_dial_object",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 responsive-diff produces the N-way table (default sizes) test_UAT_AC648_produces_nway_table_with_default_size_columns",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 --sizes selects and orders the table columns test_UAT_AC649_sizes_flag_selects_and_orders_columns_and_rejects_unknown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 responsive-diff partitions changed vs steady nodes test_UAT_AC650_partitions_changed_steady_and_flags_presence_flips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 repeated identical text aligns occurrence-by-occurrence test_UAT_AC651_aligns_repeated_identical_text_in_document_order",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 --classify labels moves and groups structural first test_UAT_AC652_classify_labels_moves_and_groups_structural_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 responsive-diff terminal-fails on a stale reference test_UAT_AC653_terminal_fails_on_stale_reference_with_recapture_guidance",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 responsive-diff fails on an un-captured requested width test_UAT_AC654_terminal_fails_on_uncaptured_width_listing_available_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-2c7069fe \u2014 --json emits machine-readable output; --ref is required test_UAT_AC655_json_is_parseable_and_ref_is_required",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 values-diff --size compares at the selected width test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 omitting --size keeps the single-width default path test_UAT_AC640_omitting_size_preserves_single_width_path_on_both_commands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 values-diff --size fails loud with no ladder test_UAT_AC641_values_diff_size_fails_loudly_when_bundle_has_no_ladder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 values-diff --size names the widths the ladder carries test_UAT_AC642_values_diff_size_fails_loudly_and_names_available_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 pixel diff --size pairs against the same-width reference test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 pixel diff --size fails loud without a same-width shot test_UAT_AC644_pixel_diff_size_fails_loudly_without_same_width_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 an invalid --size is rejected with the accepted names test_UAT_AC645_invalid_size_rejected_naming_accepted_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-16f2793c \u2014 capture persists per-width reference screenshots test_UAT_AC647_capture_persists_per_width_screenshot_and_matrix_has_no_image_bytes",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour",
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
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 50,
      "failed": 1,
      "total": 51,
      "failures": [
        {
          "test_name": "AC-631 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-631 'Surface fill is compared as the effective alpha-composited colour' (uid=acceptance_criterion-65b5ddd3) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-631.",
          "ac_uid": "acceptance_criterion-65b5ddd3",
          "ac_id": "AC-631",
          "kind": "orphaned_ac"
        }
      ],
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
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}