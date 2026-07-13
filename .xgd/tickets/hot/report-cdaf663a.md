---
uid: report-cdaf663a
id: REPORT-530
type: report
title: 'Report: batch_quality_check for report-29765550'
created_by: xgd
created_at: '2026-07-13T21:25:11.448508+00:00'
updated_at: '2026-07-13T21:25:11.448508+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-29765550
  parent_report_uid: report-b9bf2fb0
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-07-13T21:24:19.323549Z",
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
      "duration_seconds": 11.88984854100272,
      "passed": 54,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 54,
      "deselected": 591,
      "test_filter": [
        "test_UAT_AC575",
        "test_UAT_AC576",
        "test_UAT_AC577",
        "test_UAT_AC578",
        "test_UAT_AC579",
        "test_UAT_AC580",
        "test_UAT_AC581",
        "test_UAT_AC582",
        "test_UAT_AC583",
        "test_UAT_AC584",
        "test_UAT_AC585",
        "test_UAT_AC586",
        "test_UAT_AC587",
        "test_UAT_AC588",
        "test_UAT_AC589",
        "test_UAT_AC590",
        "test_UAT_AC591",
        "test_UAT_AC592",
        "test_UAT_AC593",
        "test_UAT_AC594",
        "test_UAT_AC595",
        "test_UAT_AC596",
        "test_UAT_AC597",
        "test_UAT_AC598",
        "test_UAT_AC599",
        "test_UAT_AC600",
        "test_UAT_AC601",
        "test_UAT_AC602",
        "test_UAT_AC603",
        "test_UAT_AC604",
        "test_UAT_AC605",
        "test_UAT_AC606",
        "test_UAT_AC607",
        "test_UAT_AC608",
        "test_UAT_AC609",
        "test_UAT_AC610",
        "test_UAT_AC611",
        "test_UAT_AC612",
        "test_UAT_AC613",
        "test_UAT_AC614",
        "test_UAT_AC615",
        "test_UAT_AC616",
        "test_UAT_AC617",
        "test_UAT_AC618",
        "test_UAT_AC619",
        "test_UAT_AC620",
        "test_UAT_AC621",
        "test_UAT_AC622",
        "test_UAT_AC623",
        "test_UAT_AC624",
        "test_UAT_AC625",
        "test_UAT_AC626",
        "test_UAT_AC627",
        "test_UAT_AC628"
      ],
      "coverage": 96.4,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "itles\":[\"REQ-56 component-owned typography \u2014 values-diff subscale attribution\"],\"fullName\":\"REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_keep_subscale_deltas_opt_out\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-56_keep_subscale_deltas_opt_out\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-56 component-owned typography \u2014 values-diff subscale attribution\"],\"fullName\":\"REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_gigabytealchemy_badges_close_via_theme\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-56_gigabytealchemy_badges_close_via_theme\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783977860641,\"endTime\":1783977860641,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/req56-component-typography.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 round-trip invariant over the widened space (DOC-22 \u00a75)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 round-trip invariant over the widened space (DOC-22 \u00a75) test_UAT_FC_REQ-57_roundtrip_all_kinds\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_roundtrip_all_kinds\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78) test_UAT_FC_REQ-57_table_roundtrips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_table_roundtrips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78) test_UAT_FC_REQ-57_table_cell_holds_blocks\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_table_cell_holds_blocks\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_block_is_raw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_code_block_is_raw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_fence_widens_for_backticks\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_code_fence_widens_for_backticks\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_block_without_language\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_code_block_without_language\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_heading_levels\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_heading_levels\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_heading_carries_inline_runs\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_heading_carries_inline_runs\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_paragraph_leading_hash_is_guarded\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_paragraph_leading_hash_is_guarded\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78) test_UAT_FC_REQ-57_nested_list_item\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_nested_list_item\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78) test_UAT_FC_REQ-57_multi_paragraph_list_item\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_multi_paragraph_list_item\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_rich_blockquote\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_rich_blockquote\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_nested_blockquote\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_nested_blockquote\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78)\"],\"fullName\":\"REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_blockquote_holds_a_list\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-57_blockquote_holds_a_list\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783977860641,\"endTime\":1783977860641,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/req57-rich-text-blocks.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783977860641,\"endTime\":1783977860641,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783977860641,\"endTime\":1783977860641,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-5/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-79e068e5 \u2014 capture resolves modern-CSS colours test_UAT_AC589_modern_css_colours_resolve_to_srgb_hex_not_inferred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-79e068e5 \u2014 capture resolves modern-CSS colours test_UAT_AC590_transparent_colour_falls_back_to_sentinel_and_is_inferred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-79e068e5 \u2014 colour resolution degrades gracefully without a canvas test_UAT_AC591_rgb_colours_resolve_to_hex_without_a_rendering_surface",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-79e068e5 \u2014 value-diff flags one-sided box geometry test_UAT_AC592_one_sided_box_geometry_is_flagged_not_silently_passed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-79e068e5 \u2014 value-diff flags one-sided box geometry test_UAT_AC593_report_prints_loud_stale_reference_warning_with_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 theme subscales drive rendered type test_UAT_AC610_theme_badge_subscale_drives_every_badge_label",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 theme subscales drive rendered type test_UAT_AC611_theme_checklist_subscale_drives_every_checklist_item",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 subscale px vocabulary (zero translation) test_UAT_AC612_subscale_uses_render_px_vocabulary_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 per-instance escape hatch test_UAT_AC613_per_instance_style_overrides_theme_subscale_single_card",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 capture reads subscales from page semantics test_UAT_AC614_capture_reads_component_subscales_from_semantics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 values-diff subscale attribution test_UAT_AC615_systemic_subscale_gap_is_one_theme_finding_rolling_up_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 values-diff subscale attribution test_UAT_AC616_keep_subscale_detail_opt_out_restores_rolled_up_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 reconciliation \u2014 values-diff subscale attribution test_UAT_AC617_setting_theme_subscale_to_reference_closes_the_gap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d555b990 content-width scale test_UAT_AC604_named_step_caps_to_tailwind_measure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d555b990 content-width scale test_UAT_AC605_literal_value_renders_exact_off_scale_measure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d555b990 content-width scale test_UAT_AC606_bleed_or_absent_leaves_column_uncapped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d555b990 content-width scale test_UAT_AC607_rowWidth_boxes_grouped_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d555b990 content-width scale test_UAT_AC608_contentWidth_honored_uniformly_across_modules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d555b990 content-width scale test_UAT_AC609_retired_width_names_removed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-582 directly-authored axes require an exact match by default test_UAT_AC582_directly_authored_axes_exact_by_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-583 element position is exact by default with a 1px rounding allowance test_UAT_AC583_position_exact_1px_allowance",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-584 box width exact by default while box height keeps a wrapping tolerance test_UAT_AC584_width_exact_height_wrapping_tolerance",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-585 art-directed axes remain tolerant by default test_UAT_AC585_art_directed_axes_tolerant_by_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-586 the tolerant opt-out restores loose matching on every default-exact axis test_UAT_AC586_tolerant_optout_restores_loose_matching",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-587 a per-axis tolerance override loosens one axis and overrides both modes test_UAT_AC587_per_axis_override_loosens_one_axis",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-dadb8475 \u2014 AC-588 no legacy strict/exact toggle; exact is the default with a single opt-out test_UAT_AC588_no_strict_exact_toggle_single_optout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 hero objects placed by the shared band-coordinate model test_UAT_AC594_positioned_hero_object_placed_by_band_coordinates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 hero objects placed by the shared band-coordinate model test_UAT_AC595_unpositioned_hero_renders_normal_flow_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 hero objects placed by the shared band-coordinate model test_UAT_AC596_mixed_positioned_and_flowed_hero_objects_split_per_object",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 the overlay-header wordmark shares the hero coordinate space test_UAT_AC597_overlay_wordmark_shares_hero_coordinate_space",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 the overlay-header wordmark shares the hero coordinate space test_UAT_AC598_overlay_chrome_spans_full_band_and_pointer_transparent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 the overlay-header wordmark shares the hero coordinate space test_UAT_AC599_unpositioned_wordmark_stays_in_flow_row_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d70a0264 \u2014 a run's typography style and position combine losslessly test_UAT_AC600_run_typography_style_and_position_combine_losslessly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-575 object-grouped comparison \u2014 one card per object, worst first test_UAT_AC575_groups_deltas_into_one_card_per_object_worst_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-576 every card shows the box position as a first-class param test_UAT_AC576_box_is_present_and_flagged_on_every_card",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-577 unpaired objects surfaced loudly in both directions test_UAT_AC577_reports_both_unpaired_directions_with_counts_and_labels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-578 expected column prints spec field names and units test_UAT_AC578_expected_column_is_pasteable_spec_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-579 image and control cards carry kind-appropriate params test_UAT_AC579_image_and_control_carry_own_tables",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-580 clean count, non-object tail, and the no-value-deltas line test_UAT_AC580_clean_count_tail_section_and_no_deltas",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-581 machine-readable report carries object cards and unpaired list test_UAT_AC581_structured_report_has_cards_and_unpaired_collection",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8a42499e \u2014 prose fills the content container by default, narrow measure is opt-in test_UAT_AC601_default_prose_block_is_full_container_width_centred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8a42499e \u2014 prose fills the content container by default, narrow measure is opt-in test_UAT_AC602_contentWidth_narrows_a_plain_non_panelled_block",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8a42499e \u2014 prose fills the content container by default, narrow measure is opt-in test_UAT_AC603_prose_block_not_narrowed_unless_contentWidth_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC618_roundtrip_invariant_over_all_block_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC619_per_run_overrides_via_attribute_span",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC620_markdown_shorthands_desugar_to_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC621_literal_delimiters_and_leading_markers_are_escaped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC622_bullet_and_ordered_lists_one_kind_ordinals_and_start",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC623_adjacent_same_type_lists_merge_on_normalization",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC624_headings_map_atx_levels_and_carry_inline_runs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC625_code_blocks_preserve_verbatim_text_and_language",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC626_blockquotes_are_containers_of_child_blocks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC627_tables_roundtrip_as_grid_of_block_cells",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b5ebbf7 styled-text block-document \u2014 round-trip & notation test_UAT_AC628_list_items_hold_child_blocks",
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