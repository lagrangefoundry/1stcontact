---
uid: report-228d98de
id: REPORT-1112
type: report
title: 'Scoped quality: fail (19 tests, 1 failed, 2 orphan AC(s))'
created_by: xgd
created_at: '2026-08-03T01:49:27.505851+00:00'
updated_at: '2026-08-03T01:49:27.505851+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-d0a8cfad
  commit: bf7489388567428ddee14615bbc8eeb5ff2aeb55
---

{
  "timestamp": "2026-08-03T01:46:46.110561Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.250035509467125e-05,
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
      "duration_seconds": 17.87675387505442,
      "passed": 18,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 19,
      "deselected": 815,
      "test_filter": [
        "test_UAT_AC682",
        "test_UAT_AC683",
        "test_UAT_AC684",
        "test_UAT_AC685",
        "test_UAT_AC686",
        "test_UAT_AC687",
        "test_UAT_AC688",
        "test_UAT_AC723",
        "test_UAT_AC725",
        "test_UAT_AC726",
        "test_UAT_AC727",
        "test_UAT_AC728",
        "test_UAT_AC759",
        "test_UAT_AC760",
        "test_UAT_AC761",
        "test_UAT_AC762",
        "test_UAT_AC763",
        "test_UAT_AC764",
        "test_UAT_AC765",
        "test_UAT_AC766"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785721607231,\"endTime\":1785721607231,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/req92-image-box-fold.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785721607231,\"endTime\":1785721607231,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/req93-l1-slot-mounted-behaviors.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785721607231,\"endTime\":1785721607231,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785721607231,\"endTime\":1785721607231,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-725 typed pixel-mover axes render as CSS re-derived from their typed fields test_UAT_AC725_structured_axes_emit_derived_css_and_identity_values_are_omitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-726 malformed structured axes are rejected by the envelope test_UAT_AC726_structured_axis_violations_rejected_with_offending_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-727 a document font resource table binds a family handle to its served face test_UAT_AC727_resource_table_emits_font_face_rules_ahead_of_use_and_binds_the_face",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-728 font resource entries are scheme-checked and weight-bounded by the envelope test_UAT_AC728_font_entry_scheme_and_weight_violations_rejected_with_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-759 per-side padding insets content inside the pinned box test_UAT_AC759_padding_insets_content_without_moving_the_pinned_border_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-760 a varying numeric axis carries a per-width track that owns it test_UAT_AC760_track_owns_its_axis_while_an_invariant_axis_stays_scalar",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-761 a text leaf paints its own chip surface under the box axes bounds test_UAT_AC761_chip_axes_paint_on_the_run_itself_and_take_the_box_bounds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-762 a box carries a typed left accent rule distinct from a full border test_UAT_AC762_left_accent_rule_paints_one_edge_and_coexists_with_a_border",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-763 a run declares the width from which it is unbreakable test_UAT_AC763_unbreakable_from_width_pins_above_it_and_holds_in_every_engine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-764 viewport-height response is a derivative resolved against each capture height test_UAT_AC764_height_factor_grows_from_its_own_capture_height_and_pushes_content_down",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-765 a document column plus a per-node anchor place x and width independently test_UAT_AC765_each_horizontal_axis_anchors_or_keyframes_on_its_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-766 anchored placement is emitted as a valid expression test_UAT_AC766_every_anchored_node_lands_at_its_column_rule_position",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-682 well-formed L1 document accepted as a typed layout tree test_UAT_AC682_valid_document_and_optional_primitives_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_varies_continuously_and_snap_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-685 injection payloads in content values are inert in the rendered output test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope test_UAT_AC686_envelope_boundary_is_the_range_not_the_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-687 a rejected document returns the full list of per-field errors test_UAT_AC687_multiple_violations_all_reported_with_path_and_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-723 a slot leaf renders as an inert placeholder naming its behavior module test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "AC-762 a box carries a typed left accent rule distinct from a full border test_UAT_AC762_left_accent_rule_paints_one_edge_and_coexists_with_a_border",
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
      "passed": 18,
      "failed": 2,
      "total": 24,
      "failures": [
        {
          "test_name": "AC-688 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-688 'The spike renders equivalently across chromium, webkit, and firefox' (uid=acceptance_criterion-18356eea) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-688.",
          "ac_uid": "acceptance_criterion-18356eea",
          "ac_id": "AC-688",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-688 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-688 'The spike renders equivalently across chromium, webkit, and firefox' (uid=acceptance_criterion-18356eea) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-688.",
          "ac_uid": "acceptance_criterion-18356eea",
          "ac_id": "AC-688",
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