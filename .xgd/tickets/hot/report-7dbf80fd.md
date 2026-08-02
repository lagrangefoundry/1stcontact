---
uid: report-7dbf80fd
id: REPORT-1078
type: report
title: 'Report: batch_quality_check for dccfa99b'
created_by: xgd
created_at: '2026-08-02T17:55:59.320430+00:00'
updated_at: '2026-08-02T17:55:59.320430+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: dccfa99b
  parent_report_uid: report-0d908354
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-08-02T17:55:24.418921Z",
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
      "duration_seconds": 13.498516666237265,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 0,
      "deselected": 668,
      "test_filter": [
        "1c launcher \u2014 HMR WebSocket disabled (REQ-37) test_UAT_FC_REQ-37_launcher_does_not_error_on_occupied_hmr_port"
      ],
      "coverage": 94.05,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "e_collector\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 fold populates more of the L1 language + signals residuals\"],\"fullName\":\"REQ-92 \u2014 fold populates more of the L1 language + signals residuals test_UAT_FC_REQ-92_geometryless_text_run_signalled\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_geometryless_text_run_signalled\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 fold populates more of the L1 language + signals residuals\"],\"fullName\":\"REQ-92 \u2014 fold populates more of the L1 language + signals residuals test_UAT_FC_REQ-92_covered_pixel_mover_not_a_residual\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_covered_pixel_mover_not_a_residual\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 fold populates more of the L1 language + signals residuals\"],\"fullName\":\"REQ-92 \u2014 fold populates more of the L1 language + signals residuals test_UAT_FC_REQ-92_text_shadow_fold_is_idempotent\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_text_shadow_fold_is_idempotent\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785693325610,\"endTime\":1785693325610,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req92-fold-full-language.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_real_capture_images_become_leaves\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_real_capture_images_become_leaves\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_real_capture_image_leaves_reproduce_oracle\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_real_capture_image_leaves_reproduce_oracle\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_form_controls_stay_residuals\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_form_controls_stay_residuals\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_image_fold_is_idempotent\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_image_fold_is_idempotent\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_image_axes_folded_and_rendered\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_image_axes_folded_and_rendered\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_surface_box_leaf_from_standalone_panel\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_surface_box_leaf_from_standalone_panel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_snap_reflow_reproduces_at_the_breakpoint_width\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_snap_reflow_reproduces_at_the_breakpoint_width\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree\"],\"fullName\":\"REQ-92 \u2014 image + surface (box) leaves fold into the L1 tree test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785693325610,\"endTime\":1785693325610,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req92-image-box-fold.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785693325610,\"endTime\":1785693325610,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785693325610,\"endTime\":1785693325610,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/site-schema.test.ts\"}]}",
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
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}