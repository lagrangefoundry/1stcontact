---
uid: report-24c4fb45
id: REPORT-1140
type: report
title: 'Scoped quality: pass (9 tests, 0 failed)'
created_by: xgd
created_at: '2026-08-03T04:01:02.611083+00:00'
updated_at: '2026-08-03T04:01:02.611083+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-8b2f295c
  commit: 3422ecc8f4c8939ad50b9a8bb682a8ae103e6200
---

{
  "timestamp": "2026-08-03T03:58:21.476542Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.466614574193954e-05,
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
      "duration_seconds": 17.29513704078272,
      "passed": 9,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 9,
      "deselected": 859,
      "test_filter": [
        "test_UAT_AC792",
        "test_UAT_AC793",
        "test_UAT_AC794",
        "test_UAT_AC795",
        "test_UAT_AC796",
        "test_UAT_AC797",
        "test_UAT_AC798",
        "test_UAT_AC799",
        "test_UAT_AC800"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785729502724,\"endTime\":1785729502724,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/req92-image-box-fold.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785729502724,\"endTime\":1785729502724,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/req93-l1-slot-mounted-behaviors.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785729502724,\"endTime\":1785729502724,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785729502724,\"endTime\":1785729502724,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-10/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-8b2f295c \u2014 the imported page serves the site's own mirrored bytes test_UAT_AC792_every_media_handle_resolves_to_the_sites_own_mirror",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 the rendered reproduction names no remote host test_UAT_AC793_rendered_output_is_self_contained_and_origin_free",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 an unmirrored handle fails the import rather than hotlinking test_UAT_AC794_unmirrored_handle_fails_the_import_and_writes_no_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 re-importing is stable and leaves the bundle unchanged test_UAT_AC795_reimport_is_stable_and_the_bundle_artifacts_are_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 mirrored bytes nothing references are reported as a fold gap test_UAT_AC796_unreferenced_image_and_font_bytes_are_reported_not_subresources",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 a part-stale bundle fails the import, naming the mismatch test_UAT_AC797_seam_and_binding_disagreement_fails_naming_each_direction",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 a mounted behaviour's fields come from the captured controls test_UAT_AC798_fields_are_derived_from_captured_name_type_and_name_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 a submission endpoint is never fabricated test_UAT_AC799_endpoint_is_captured_verbatim_absent_or_dropped_with_a_residual",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-8b2f295c \u2014 the import summarises what it produced test_UAT_AC800_summary_reports_nodes_handles_gaps_and_each_behaviour",
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