---
uid: report-3dc5fc57
id: REPORT-313
type: report
title: 'Regression quality: pass (43 tests, 0 failed)'
created_by: xgd
created_at: '2026-07-09T19:49:30.701107+00:00'
updated_at: '2026-07-09T19:49:30.701107+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-16f09dc5
  commit: a9cf8bcfc78e841285b0ebf9a66947243d2d4209
---

{
  "timestamp": "2026-07-09T19:49:16.526633Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.39579913392663e-05,
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
      "duration_seconds": 11.726515042013489,
      "passed": 43,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 43,
      "deselected": 48,
      "test_filter": [
        "test_UAT_AC416",
        "test_UAT_AC417",
        "test_UAT_AC418",
        "test_UAT_AC419",
        "test_UAT_AC420",
        "test_UAT_AC421",
        "test_UAT_AC422",
        "test_UAT_AC423",
        "test_UAT_AC424",
        "test_UAT_AC425",
        "test_UAT_AC426",
        "test_UAT_AC427",
        "test_UAT_AC428",
        "test_UAT_AC429",
        "test_UAT_AC430",
        "test_UAT_AC431",
        "test_UAT_AC432",
        "test_UAT_AC433",
        "test_UAT_AC434",
        "test_UAT_AC435",
        "test_UAT_AC436",
        "test_UAT_AC437",
        "test_UAT_AC438",
        "test_UAT_AC439",
        "test_UAT_AC440",
        "test_UAT_AC441",
        "test_UAT_AC442",
        "test_UAT_AC443",
        "test_UAT_AC444",
        "test_UAT_AC445",
        "test_UAT_AC446",
        "test_UAT_AC447",
        "test_UAT_AC448",
        "test_UAT_AC449",
        "test_UAT_AC450",
        "test_UAT_AC451",
        "test_UAT_AC452",
        "test_UAT_AC453",
        "test_UAT_AC454",
        "test_UAT_AC455",
        "test_UAT_AC456",
        "test_UAT_AC457",
        "test_UAT_AC458",
        "test_UAT_FC_BUNDLE_1",
        "test_UAT_FC_REQ_1",
        "test_UAT_FC_REQ_10",
        "test_UAT_FC_REQ_3",
        "test_UAT_FC_REQ_4",
        "test_UAT_FC_REQ_5"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " rendering test_UAT_AC443_footer_renders_deterministic_build_time_copyright\",\"status\":\"passed\",\"title\":\"test_UAT_AC443_footer_renders_deterministic_build_time_copyright\",\"duration\":0.4680419999995138,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a224111f \u2014 chrome module rendering\"],\"fullName\":\"story-a224111f \u2014 chrome module rendering test_UAT_AC444_footer_renders_optional_link_row_one_link_per_entry\",\"status\":\"passed\",\"title\":\"test_UAT_AC444_footer_renders_optional_link_row_one_link_per_entry\",\"duration\":0.4906670000000304,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783626565710,\"endTime\":1783626565733.4907,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-1/tests/reconciliation-framework-theme-modules.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-416 public-site apex placeholder\"],\"fullName\":\"AC-416 public-site apex placeholder test_UAT_AC416_public_site_serves_apex_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC416_public_site_serves_apex_placeholder\",\"duration\":23.050208000000566,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-417 control-app builder placeholder\"],\"fullName\":\"AC-417 control-app builder placeholder test_UAT_AC417_control_app_serves_builder_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC417_control_app_serves_builder_placeholder\",\"duration\":34.67262499999924,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-418 public-site apex and wildcard routes\"],\"fullName\":\"AC-418 public-site apex and wildcard routes test_UAT_AC418_public_site_claims_apex_and_wildcard_routes\",\"status\":\"passed\",\"title\":\"test_UAT_AC418_public_site_claims_apex_and_wildcard_routes\",\"duration\":0.6794580000005226,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-419 control-app reserved app route\"],\"fullName\":\"AC-419 control-app reserved app route test_UAT_AC419_control_app_claims_reserved_app_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC419_control_app_claims_reserved_app_route\",\"duration\":0.21016700000109267,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-420 deploy pipeline\"],\"fullName\":\"AC-420 deploy pipeline test_UAT_AC420_deploy_pipeline_ships_both_workers\",\"status\":\"passed\",\"title\":\"test_UAT_AC420_deploy_pipeline_ships_both_workers\",\"duration\":3.8528749999986758,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-421 CI pipeline\"],\"fullName\":\"AC-421 CI pipeline test_UAT_AC421_ci_pipeline_validates_pull_requests\",\"status\":\"passed\",\"title\":\"test_UAT_AC421_ci_pipeline_validates_pull_requests\",\"duration\":0.6445839999996679,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-422 version-bump advances the manifest\"],\"fullName\":\"AC-422 version-bump advances the manifest test_UAT_AC422_version_bump_advances_root_manifest\",\"status\":\"passed\",\"title\":\"test_UAT_AC422_version_bump_advances_root_manifest\",\"duration\":78.64616600000045,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-423 version-bump check and list-paths\"],\"fullName\":\"AC-423 version-bump check and list-paths test_UAT_AC423_version_bump_check_and_list_paths\",\"status\":\"passed\",\"title\":\"test_UAT_AC423_version_bump_check_and_list_paths\",\"duration\":130.73212500000045,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-424 identifier naming\"],\"fullName\":\"AC-424 identifier naming test_UAT_AC424_identifiers_normalized_to_1stcontact\",\"status\":\"passed\",\"title\":\"test_UAT_AC424_identifiers_normalized_to_1stcontact\",\"duration\":0.3370410000006814,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783626567867,\"endTime\":1783626568316.3372,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-1/tests/reconciliation-platform-scaffold.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC425_valid_site_validates_and_returns_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC425_valid_site_validates_and_returns_value\",\"duration\":5.2270000000003165,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC426_invalid_module_rejected_with_json_pointer_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC426_invalid_module_rejected_with_json_pointer_path\",\"duration\":0.5121249999997417,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC427_unrecognized_nav_pattern_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_AC427_unrecognized_nav_pattern_rejected\",\"duration\":0.212833000000046,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC428_missing_theme_token_slot_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_AC428_missing_theme_token_slot_rejected\",\"duration\":0.18466599999965183,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC429_non_hex_color_token_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_AC429_non_hex_color_token_rejected\",\"duration\":0.19108299999970768,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC430_duplicate_structural_identifiers_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_AC430_duplicate_structural_identifiers_rejected\",\"duration\":0.37608300000010786,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC431_catalog_membership_not_validated\",\"status\":\"passed\",\"title\":\"test_UAT_AC431_catalog_membership_not_validated\",\"duration\":0.15708399999994072,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6fc151b1 \u2014 structural validation of site definitions\"],\"fullName\":\"story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC432_nav_targets_accepted_for_each_kind\",\"status\":\"passed\",\"title\":\"test_UAT_AC432_nav_targets_accepted_for_each_kind\",\"duration\":0.26499999999987267,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783626562870,\"endTime\":1783626562877.265,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-1/tests/reconciliation-site-schema.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1783626558860,\"endTime\":1783626558860,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/https___github.com_martinwesthead_1stcontact/reconcile-BUNDLE-1/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "reconciliation: contact-form client enhancement (story-903e3e3a) test_UAT_AC454_enhancement_intercepts_submit_and_posts_json_to_action",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: contact-form client enhancement (story-903e3e3a) test_UAT_AC455_enhancement_swaps_in_success_message_on_2xx",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: contact-form client enhancement (story-903e3e3a) test_UAT_AC456_enhancement_surfaces_inline_error_on_failed_response",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC458_content_modules_resolvable_with_conforming_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC457_content_rejected_for_missing_field_or_list_bound_violation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC445_text_block_renders_markdown_body_with_lazy_images",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC446_text_block_width_fixed_by_variant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC447_text_block_heading_only_when_provided",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC448_services_grid_renders_one_card_per_item",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC449_services_grid_single_column_below_md_multi_from_md",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC450_contact_form_renders_one_labelled_control_per_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC451_contact_form_posts_to_action_without_js",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC452_contact_form_includes_hidden_honeypot_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "reconciliation: content module catalog (story-903e3e3a) test_UAT_AC453_contact_form_renders_turnstile_mount_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC433_declares_one_custom_property_per_token_slot_with_deterministic_names",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC434_fills_omitted_slots_from_defaults_covering_the_full_surface",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 theme CSS generation test_UAT_AC435_emits_dark_mode_block_only_for_supplied_dark_roles",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 module catalog test_UAT_AC436_resolves_known_module_returning_contract_and_component",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 module catalog test_UAT_AC437_unknown_module_throws_catalog_miss_naming_request_and_known_entries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 module catalog test_UAT_AC438_each_chrome_module_exposes_a_conforming_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC439_header_renders_logo_nav_links_and_below_md_collapse",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC440_hero_bg_color_renders_heading_subhead_no_image_clamp_sized",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC441_hero_bg_image_renders_background_image_with_src_and_alt",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC442_hero_renders_cta_only_when_provided",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC443_footer_renders_deterministic_build_time_copyright",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a224111f \u2014 chrome module rendering test_UAT_AC444_footer_renders_optional_link_row_one_link_per_entry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-416 public-site apex placeholder test_UAT_AC416_public_site_serves_apex_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-417 control-app builder placeholder test_UAT_AC417_control_app_serves_builder_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-418 public-site apex and wildcard routes test_UAT_AC418_public_site_claims_apex_and_wildcard_routes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-419 control-app reserved app route test_UAT_AC419_control_app_claims_reserved_app_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-420 deploy pipeline test_UAT_AC420_deploy_pipeline_ships_both_workers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-421 CI pipeline test_UAT_AC421_ci_pipeline_validates_pull_requests",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-422 version-bump advances the manifest test_UAT_AC422_version_bump_advances_root_manifest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-423 version-bump check and list-paths test_UAT_AC423_version_bump_check_and_list_paths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-424 identifier naming test_UAT_AC424_identifiers_normalized_to_1stcontact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC425_valid_site_validates_and_returns_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC426_invalid_module_rejected_with_json_pointer_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC427_unrecognized_nav_pattern_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC428_missing_theme_token_slot_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC429_non_hex_color_token_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC430_duplicate_structural_identifiers_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC431_catalog_membership_not_validated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6fc151b1 \u2014 structural validation of site definitions test_UAT_AC432_nav_targets_accepted_for_each_kind",
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