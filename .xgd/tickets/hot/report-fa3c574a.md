---
uid: report-fa3c574a
id: REPORT-1656
type: report
title: 'Scoped quality: fail (12 tests, 0 failed, 9 orphan AC(s))'
created_by: xgd
created_at: '2026-08-07T23:25:08.281633+00:00'
updated_at: '2026-08-07T23:25:08.281633+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: branch-BUG-32
  commit: e1c0bc0aaaaf7459b2ea31516285f21fb8ed96e2
---

{
  "timestamp": "2026-08-07T23:23:46.969459Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0004114159382879734,
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
      "duration_seconds": 27.29078304208815,
      "passed": 12,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 12,
      "deselected": 1285,
      "test_filter": [
        "test_UAT_AC959",
        "test_UAT_AC960",
        "test_UAT_AC961",
        "test_UAT_AC962",
        "test_UAT_AC963",
        "test_UAT_AC964",
        "test_UAT_AC965",
        "test_UAT_AC966",
        "test_UAT_AC967",
        "test_UAT_AC968",
        "test_UAT_AC969",
        "test_UAT_AC970",
        "test_UAT_AC971",
        "test_UAT_AC972",
        "test_UAT_AC973",
        "test_UAT_AC974",
        "test_UAT_AC975",
        "test_UAT_AC976",
        "test_UAT_AC977",
        "test_UAT_AC978",
        "test_UAT_AC979"
      ],
      "coverage": 83.5,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "lare their own measure test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-97 \u2014 text leaves declare their own measure\"],\"fullName\":\"REQ-97 \u2014 text leaves declare their own measure test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-97 \u2014 text leaves declare their own measure\"],\"fullName\":\"REQ-97 \u2014 text leaves declare their own measure test_UAT_FC_REQ-97_folded_reproductions_are_unaffected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_folded_reproductions_are_unaffected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786145030970,\"endTime\":1786145030970,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/branch-BUG-32/tests/req97-text-measure.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_folded_reproductions_render_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_folded_reproductions_render_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786145030970,\"endTime\":1786145030970,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/branch-BUG-32/tests/req98-uniform-surface-axes.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786145030970,\"endTime\":1786145030970,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/branch-BUG-32/tests/req99-interaction-state.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786145030970,\"endTime\":1786145030970,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/branch-BUG-32/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1786145030970,\"endTime\":1786145030970,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/branch-BUG-32/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component consumption route test_UAT_AC962_absent_component_names_the_component_and_the_install_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a control-app front test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a origin failure reporting test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 12,
      "failed": 9,
      "total": 21,
      "failures": [
        {
          "test_name": "AC-959 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-959 'Workspace opens as a single tab hosting the display panel, addressed by a stable id' (uid=acceptance_criterion-6f87920c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-959.",
          "ac_uid": "acceptance_criterion-6f87920c",
          "ac_id": "AC-959",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-967 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-967 'The site selector lists exactly the sites the store holds, and choosing one changes the displayed site' (uid=acceptance_criterion-92c52943) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-967.",
          "ac_uid": "acceptance_criterion-92c52943",
          "ac_id": "AC-967",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-968 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-968 'Switching modes changes what is displayed without rebuilding the pane' (uid=acceptance_criterion-4c720b7e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-968.",
          "ac_uid": "acceptance_criterion-4c720b7e",
          "ac_id": "AC-968",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-969 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-969 'Registering a mode is an added entry: a mode the panel has never heard of works end to end' (uid=acceptance_criterion-04c4b09e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-969.",
          "ac_uid": "acceptance_criterion-04c4b09e",
          "ac_id": "AC-969",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-970 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-970 'The toolbar renders exactly the controls the active mode declares, and re-derives them when the mode changes' (uid=acceptance_criterion-60683857) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-970.",
          "ac_uid": "acceptance_criterion-60683857",
          "ac_id": "AC-970",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-971 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-971 '\"Open in a new tab\" always targets the exact document the pane is displaying' (uid=acceptance_criterion-91914cc2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-971.",
          "ac_uid": "acceptance_criterion-91914cc2",
          "ac_id": "AC-971",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-973 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-973 'The workspace shows the display panel beside a secondary pane with a divider that drags, collapses to a rail and reopens to its previous width' (uid=acceptance_criterion-e1acae35) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-973.",
          "ac_uid": "acceptance_criterion-e1acae35",
          "ac_id": "AC-973",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-974 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-974 'Workspace layout state survives closing and reopening, and every stored value is namespaced to this workspace' (uid=acceptance_criterion-2bf97625) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-974.",
          "ac_uid": "acceptance_criterion-2bf97625",
          "ac_id": "AC-974",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-976 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-976 'Every option declared for a tab reaches the workspace chrome intact' (uid=acceptance_criterion-922c2d11) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-976.",
          "ac_uid": "acceptance_criterion-922c2d11",
          "ac_id": "AC-976",
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
  }
}