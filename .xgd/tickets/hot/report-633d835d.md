---
uid: report-633d835d
id: REPORT-1125
type: report
title: 'Scoped quality: fail (14 tests, 2 failed, 4 orphan AC(s))'
created_by: xgd
created_at: '2026-08-03T03:01:07.175165+00:00'
updated_at: '2026-08-03T03:01:07.175165+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-24098299
  commit: 1b59af15807c3e99608b7dae03f652f2e50ac3b2
---

{
  "timestamp": "2026-08-03T02:58:24.690275Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.233411401510239e-05,
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
      "duration_seconds": 17.793643082957715,
      "passed": 12,
      "failed": 2,
      "skipped": 0,
      "errors": 0,
      "total": 14,
      "deselected": 835,
      "test_filter": [
        "test_UAT_AC705",
        "test_UAT_AC706",
        "test_UAT_AC707",
        "test_UAT_AC708",
        "test_UAT_AC709",
        "test_UAT_AC710",
        "test_UAT_AC724",
        "test_UAT_AC734",
        "test_UAT_AC735",
        "test_UAT_AC736",
        "test_UAT_AC737",
        "test_UAT_AC779",
        "test_UAT_AC780",
        "test_UAT_AC781"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785725905782,\"endTime\":1785725905782,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/req92-image-box-fold.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785725905782,\"endTime\":1785725905782,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/req93-l1-slot-mounted-behaviors.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785725905782,\"endTime\":1785725905782,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785725905782,\"endTime\":1785725905782,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-24098299 \u2014 analytic evaluator flow model test_UAT_AC734_row_tiles_along_main_axis_with_no_false_overflow",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 half-open breakpoint intervals test_UAT_AC735_reflow_at_a_captured_breakpoint_does_not_cascade",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 painted backing surfaces test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 gate fold-residual channel test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-24098299 \u2014 responsive type axes in the analytic model test_UAT_AC779_type_axis_track_resolves_per_viewport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 ladder / evidence partition test_UAT_AC780_height_probe_is_evidence_not_a_second_ladder_cell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 mounted-behaviour set-aside test_UAT_AC781_mounted_oracle_text_is_set_aside_and_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC707_content_robustness_under_grown_content",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC708_combined_gate_non_vacuous_over_base_overlay_split",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC710_probe_findings_are_diagnostic",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC724_value_render_deterministic_and_per_occurrence_faithful",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-24098299 \u2014 gate fold-residual channel test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-24098299 \u2014 3-probe reproduction acceptance gate test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance",
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
      "tests": [],
      "synthetic": true
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 12,
      "failed": 4,
      "total": 22,
      "failures": [
        {
          "test_name": "AC-705 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-705 'Sample-fidelity probe matches reproduced leaf boxes to the oracle at every captured width within tolerance' (uid=acceptance_criterion-330b48e4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-705.",
          "ac_uid": "acceptance_criterion-330b48e4",
          "ac_id": "AC-705",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-705 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-705 'Sample-fidelity probe matches reproduced leaf boxes to the oracle at every captured width within tolerance' (uid=acceptance_criterion-330b48e4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-705.",
          "ac_uid": "acceptance_criterion-330b48e4",
          "ac_id": "AC-705",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-737 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-737 'Gate report carries fold residuals as a channel distinct from probe residuals and unmatched entries' (uid=acceptance_criterion-fd72d9d4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-737.",
          "ac_uid": "acceptance_criterion-fd72d9d4",
          "ac_id": "AC-737",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-737 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-737 'Gate report carries fold residuals as a channel distinct from probe residuals and unmatched entries' (uid=acceptance_criterion-fd72d9d4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-737.",
          "ac_uid": "acceptance_criterion-fd72d9d4",
          "ac_id": "AC-737",
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
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}