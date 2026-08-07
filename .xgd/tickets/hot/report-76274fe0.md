---
uid: report-76274fe0
id: REPORT-1567
type: report
title: 'Scoped quality: pass (28 tests, 0 failed)'
created_by: xgd
created_at: '2026-08-07T05:29:03.139348+00:00'
updated_at: '2026-08-07T05:29:03.139348+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: reconcile-REQ-118
  commit: 61fbbd0ed48b0f339e7c46be30064d908397aebb
---

{
  "timestamp": "2026-08-07T05:26:44.929078Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.000313666183501482,
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
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 32.69546087505296,
      "passed": 28,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 28,
      "deselected": 1269,
      "test_filter": [
        "test_UAT_AC1018",
        "test_UAT_AC1019",
        "test_UAT_AC1020",
        "test_UAT_AC1021",
        "test_UAT_AC1022",
        "test_UAT_AC1023",
        "test_UAT_AC1024",
        "test_UAT_AC1025",
        "test_UAT_AC1026",
        "test_UAT_AC1027",
        "test_UAT_AC980",
        "test_UAT_AC981",
        "test_UAT_AC982",
        "test_UAT_AC983",
        "test_UAT_AC984",
        "test_UAT_AC985",
        "test_UAT_AC986",
        "test_UAT_AC987",
        "test_UAT_AC988",
        "test_UAT_AC989",
        "test_UAT_AC990",
        "test_UAT_AC991",
        "test_UAT_AC992"
      ],
      "coverage": 83.5,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "re test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-97 \u2014 text leaves declare their own measure\"],\"fullName\":\"REQ-97 \u2014 text leaves declare their own measure test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-97 \u2014 text leaves declare their own measure\"],\"fullName\":\"REQ-97 \u2014 text leaves declare their own measure test_UAT_FC_REQ-97_folded_reproductions_are_unaffected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_folded_reproductions_are_unaffected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786080407360,\"endTime\":1786080407360,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-REQ-118/tests/req97-text-measure.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_folded_reproductions_render_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_folded_reproductions_render_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786080407360,\"endTime\":1786080407360,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-REQ-118/tests/req98-uniform-surface-axes.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786080407360,\"endTime\":1786080407360,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-REQ-118/tests/req99-interaction-state.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786080407360,\"endTime\":1786080407360,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-REQ-118/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786080407360,\"endTime\":1786080407360,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-REQ-118/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1024_an_image_region_exposes_a_closed_list_of_the_sites_images_and_its_alt_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1025_a_regions_current_image_is_always_among_the_choices_it_offers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1026_choosing_an_image_updates_the_draft_and_the_rerendered_page_shows_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC988_an_unknown_field_a_non_text_value_or_a_choice_never_offered_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC982_saving_new_words_updates_the_draft_and_re_renders_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC983_a_change_map_is_applied_whole_or_not_at_all",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC985_a_refusal_carries_a_code_a_path_and_a_hint_with_a_failing_exit_status",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC987_a_malformed_address_is_refused_outright_and_never_coerced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC988_an_unknown_field_or_a_non_text_value_is_refused_not_ignored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC989_copy_in_a_module_slot_reads_and_writes_through_the_same_operation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC990_copy_longer_than_its_box_reads_back_in_full",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC991_markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path over the builder origin test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1019_a_declared_asset_contributes_its_identity_and_is_listed_with_no_file",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1021_each_asset_reports_what_it_can_be_used_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1022_the_store_answers_from_the_command_line_with_no_editing_gesture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store over the builder origin test_UAT_AC1023_the_store_answers_from_the_builder_origin_and_refuses_a_missing_site",
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
  }
}