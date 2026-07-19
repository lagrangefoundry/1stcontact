---
uid: report-bf0d8815
id: REPORT-669
type: report
title: 'Report: batch_quality_check for report-0e82c093'
created_by: xgd
created_at: '2026-07-19T04:02:14.449424+00:00'
updated_at: '2026-07-19T04:02:14.449424+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-0e82c093
  parent_report_uid: report-b75b74eb
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-07-19T04:01:06.624706Z",
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
      "duration_seconds": 17.640024499967694,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 733,
      "test_filter": [
        "AC-631 (orphaned acceptance criterion)",
        "test_UAT_AC631"
      ],
      "coverage": 96.67,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "tags\":[]},{\"ancestorTitles\":[\"REQ-61 \u2014 --size is a valued flag on the CLI surface\"],\"fullName\":\"REQ-61 \u2014 --size is a valued flag on the CLI surface test_UAT_FC_REQ-61_size_flag_parses_as_value\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_size_flag_parses_as_value\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784433668039,\"endTime\":1784433668039,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/req61-size-diff.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot\"],\"fullName\":\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot\"],\"fullName\":\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot test_UAT_FC_REQ-61_pixel_size_fails_loudly_without_width_screenshot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_pixel_size_fails_loudly_without_width_screenshot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot\"],\"fullName\":\"REQ-61 \u2014 diff --size pairs against the same-width reference screenshot test_UAT_FC_REQ-61_pixel_no_size_uses_default_full_screenshot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-61_pixel_no_size_uses_default_full_screenshot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784433668039,\"endTime\":1784433668039,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/req61-size-pixel-diff.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_textblock_meta_exposes_panel_gradient_field\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_textblock_meta_exposes_panel_gradient_field\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_panel_gradient_renders_background_image\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_panel_gradient_renders_background_image\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 framework\"],\"fullName\":\"REQ-62 gradient panel \u2014 framework test_UAT_FC_REQ-62_no_panel_gradient_keeps_solid\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_no_panel_gradient_keeps_solid\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 validation\"],\"fullName\":\"REQ-62 gradient panel \u2014 validation test_UAT_FC_REQ-62_validation_accepts_gradient_panel\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_validation_accepts_gradient_panel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 validation\"],\"fullName\":\"REQ-62 gradient panel \u2014 validation test_UAT_FC_REQ-62_validation_rejects_malformed_gradient\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_validation_rejects_malformed_gradient\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 values-diff\"],\"fullName\":\"REQ-62 gradient panel \u2014 values-diff test_UAT_FC_REQ-62_surface_gradient_missing_flags\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_surface_gradient_missing_flags\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 values-diff\"],\"fullName\":\"REQ-62 gradient panel \u2014 values-diff test_UAT_FC_REQ-62_matching_surface_gradient_no_flag\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_matching_surface_gradient_no_flag\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 values-diff\"],\"fullName\":\"REQ-62 gradient panel \u2014 values-diff test_UAT_FC_REQ-62_both_null_surface_gradient_no_flag\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_both_null_surface_gradient_no_flag\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 real Chromium capture\"],\"fullName\":\"REQ-62 gradient panel \u2014 real Chromium capture test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-62 gradient panel \u2014 real Chromium capture\"],\"fullName\":\"REQ-62 gradient panel \u2014 real Chromium capture test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784433668039,\"endTime\":1784433668039,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/req62-gradient-panel.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784433668039,\"endTime\":1784433668039,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784433668039,\"endTime\":1784433668039,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-6/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour",
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