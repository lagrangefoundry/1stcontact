---
uid: report-675d64b6
id: REPORT-967
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-07-24T23:18:21.168703+00:00'
updated_at: '2026-07-24T23:18:21.168703+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-2ec962f5
  commit: 4f7c16a2e7f3712ef7a450304173fc8da13c8b0f
---

{
  "timestamp": "2026-07-24T23:17:02.082055Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010120891965925694,
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
      "duration_seconds": 28.140605207998306,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
      "deselected": 555,
      "test_filter": [
        "test_UAT_AC682",
        "test_UAT_AC683",
        "test_UAT_AC684",
        "test_UAT_AC685",
        "test_UAT_AC686",
        "test_UAT_AC687",
        "test_UAT_AC688",
        "test_UAT_AC697",
        "test_UAT_AC698",
        "test_UAT_AC699",
        "test_UAT_AC700",
        "test_UAT_AC701",
        "test_UAT_AC702",
        "test_UAT_AC703",
        "test_UAT_AC704",
        "test_UAT_AC722",
        "test_UAT_AC723",
        "test_UAT_FC_REQ_87"
      ],
      "coverage": 93.19,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ient_advances_and_wraps_only_when_loop\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_autoplay_client_advances_and_wraps_only_when_loop\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_client_isolation_survives_a_malformed_section\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_client_isolation_survives_a_malformed_section\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 carousel capability \u2014 L1 slot slides\"],\"fullName\":\"REQ-85 carousel capability \u2014 L1 slot slides test_UAT_FC_REQ-85_isolation_malformed_slot_content_degrades_without_throwing\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_isolation_malformed_slot_content_degrades_without_throwing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784935023519,\"endTime\":1784935023519,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-REQ-87/tests/req85-carousel.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_capabilities_declare_the_full_obligation_set\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_capabilities_declare_the_full_obligation_set\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_carousel\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_carousel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_contact_form\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_contact_form\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-85 conformance \u2014 obligations + isolation dimension\"],\"fullName\":\"REQ-85 conformance \u2014 obligations + isolation dimension test_UAT_FC_REQ-85_conformance_isolation_flags_a_capability_that_throws\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-85_conformance_isolation_flags_a_capability_that_throws\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784935023519,\"endTime\":1784935023519,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-REQ-87/tests/req85-conformance.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_sample_fidelity\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_sample_fidelity\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_offsample\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_offsample\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_content_robustness\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_content_robustness\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-86 \u2014 end-to-end reproduction (3-probe gate)\"],\"fullName\":\"REQ-86 \u2014 end-to-end reproduction (3-probe gate) test_UAT_FC_REQ-86_gate\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-86_gate\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784935023519,\"endTime\":1784935023519,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-REQ-87/tests/req86-e2e-repro.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-87 \u2014 behavior-module rename preserves the REQ-85 contract\"],\"fullName\":\"REQ-87 \u2014 behavior-module rename preserves the REQ-85 contract test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-87 \u2014 behavior-module rename preserves the REQ-85 contract\"],\"fullName\":\"REQ-87 \u2014 behavior-module rename preserves the REQ-85 contract test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-87 \u2014 behavior-module rename preserves the REQ-85 contract\"],\"fullName\":\"REQ-87 \u2014 behavior-module rename preserves the REQ-85 contract test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784935023519,\"endTime\":1784935023519,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-REQ-87/tests/req87-behavior-rename.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_draft_assets_load\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_draft_assets_load\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_shot_url\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_shot_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"1c shot \u2014 page screenshot primitive (REQ-13)\"],\"fullName\":\"1c shot \u2014 page screenshot primitive (REQ-13) test_UAT_FC_REQ-13_deterministic_viewport\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-13_deterministic_viewport\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784935023519,\"endTime\":1784935023519,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-REQ-87/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1784935023519,\"endTime\":1784935023519,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-REQ-87/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 behavioural config validation test_UAT_AC697_config_validated_against_typed_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 slot presentation validated as L1 subtrees test_UAT_AC698_slots_validated_as_l1_subtrees",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel L1 slide track test_UAT_AC699_carousel_renders_l1_slide_track_from_config",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel autoplay/loop client behaviour test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 contact-form functional render + L1 slots test_UAT_AC701_contact_form_renders_functional_form_with_l1_slots",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior client behaviour ships once per page test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 isolation conformance dimension test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 full five-dimension conformance obligation set test_UAT_AC704_survivors_declare_the_full_obligation_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 Behavior* contract naming is atomic test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names",
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
          "name": "AC-688 the spike renders equivalently across chromium, webkit, and firefox test_UAT_AC688_no_layout_divergence_across_three_engines",
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