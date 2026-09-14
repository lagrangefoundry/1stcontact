---
uid: report-1275cebf
id: REPORT-857
type: report
title: 'Report: batch_quality_check for 973fcaec'
created_by: xgd
created_at: '2026-07-23T12:06:54.257180+00:00'
updated_at: '2026-07-23T12:06:54.257180+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: 973fcaec
  parent_report_uid: report-043e9a68
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-07-23T12:03:55.627589Z",
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
      "duration_seconds": 46.075924624921754,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 566,
      "test_filter": [
        "test_UAT_AC631"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "the_contract\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_no_layout_dials_remain_on_the_contract\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_carousel_slots_renders_scroll_snap_track_with_one_slide_per_subtree\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_carousel_slots_renders_scroll_snap_track_with_one_slide_per_subtree\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_view_and_dots_config_drive_scroll_and_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_view_and_dots_config_drive_scroll_and_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_autoplay_loop_config_surface_as_behaviour_hooks\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_autoplay_loop_config_surface_as_behaviour_hooks\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_autoplay_client_advances_and_wraps_only_when_loop\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_autoplay_client_advances_and_wraps_only_when_loop\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_client_isolation_survives_a_malformed_section\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_client_isolation_survives_a_malformed_section\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_isolation_malformed_slot_content_degrades_without_throwing\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_isolation_malformed_slot_content_degrades_without_throwing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784808239219,\"endTime\":1784808239219,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/regression-973fcaec/tests/req85-carousel.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_capabilities_declare_the_full_obligation_set\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_capabilities_declare_the_full_obligation_set\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_carousel\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_carousel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_contact_form\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_contact_form\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_conformance_isolation_flags_a_capability_that_throws\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_conformance_isolation_flags_a_capability_that_throws\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784808239219,\"endTime\":1784808239219,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/regression-973fcaec/tests/req85-conformance.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_sample_fidelity\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_sample_fidelity\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_offsample\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_offsample\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_content_robustness\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_content_robustness\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_gate\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_gate\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784808239219,\"endTime\":1784808239219,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/regression-973fcaec/tests/req86-e2e-repro.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784808239219,\"endTime\":1784808239219,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/regression-973fcaec/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784808239219,\"endTime\":1784808239219,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/regression-973fcaec/tests/site-schema.test.ts\"}]}",
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