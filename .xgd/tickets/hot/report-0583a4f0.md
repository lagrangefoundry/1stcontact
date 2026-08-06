---
uid: report-0583a4f0
id: REPORT-1390
type: report
title: 'Scoped quality: pass (empty scope)'
created_by: xgd
created_at: '2026-08-06T04:46:55.323263+00:00'
updated_at: '2026-08-06T04:46:55.323263+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: reconcile-BUNDLE-11
  commit: af8b05888235e8d80565c2819aef73f0adf81fc6
---

{
  "timestamp": "2026-08-06T04:46:05.899469Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00030745798721909523,
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
      "duration_seconds": 19.490089625120163,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 0,
      "deselected": 998,
      "test_filter": [
        "BUNDLE-11"
      ],
      "coverage": 94.79,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "T_FC_REQ-97_measured_run_needs_no_wrapper_container\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-97 \u2014 text leaves declare their own measure\"],\"fullName\":\"REQ-97 \u2014 text leaves declare their own measure test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-97 \u2014 text leaves declare their own measure\"],\"fullName\":\"REQ-97 \u2014 text leaves declare their own measure test_UAT_FC_REQ-97_folded_reproductions_are_unaffected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-97_folded_reproductions_are_unaffected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785991567937,\"endTime\":1785991567937,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-11/tests/req97-text-measure.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-98 \u2014 one shared surface group across every node kind\"],\"fullName\":\"REQ-98 \u2014 one shared surface group across every node kind test_UAT_FC_REQ-98_folded_reproductions_render_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-98_folded_reproductions_render_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785991567937,\"endTime\":1785991567937,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-11/tests/req98-uniform-surface-axes.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-99 \u2014 typed interaction state on an L1 node\"],\"fullName\":\"REQ-99 \u2014 typed interaction state on an L1 node test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785991567937,\"endTime\":1785991567937,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-11/tests/req99-interaction-state.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785991567937,\"endTime\":1785991567937,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-11/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785991567937,\"endTime\":1785991567937,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-11/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [],
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
  "quality_config_validation": {
    "issues": [
      {
        "severity": "info",
        "category": "scope_empty",
        "field": "suite: javascript-vitest",
        "message": "Suite 'javascript-vitest' ran with an empty scope: 998 tests were collected and all were deselected by the -k filter. No tests to execute.",
        "suggestion": "This is a legitimate skip \u2014 the scope resolves to ACs whose tests don't exist yet (e.g. a refactor running before feature/upgrade work has produced UATs). The workflow should route past quality_check via @skipped.",
        "context": {
          "actual": 0,
          "deselected": 998,
          "test_filter_expression": null
        }
      }
    ]
  }
}