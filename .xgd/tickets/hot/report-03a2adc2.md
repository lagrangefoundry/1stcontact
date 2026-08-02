---
uid: report-03a2adc2
id: REPORT-1075
type: report
title: 'Regression quality: fail (131 tests, 1 failed)'
created_by: xgd
created_at: '2026-08-02T17:52:09.116506+00:00'
updated_at: '2026-08-02T17:52:09.116506+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: dccfa99b
  commit: 77cee82b386f5d26c6360215c7acaf72b461539a
---

{
  "timestamp": "2026-08-02T17:51:40.902654Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 8.845794945955276e-05,
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
      "duration_seconds": 13.71357462508604,
      "passed": 130,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 131,
      "deselected": 0,
      "test_filter": null,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req78-aligned-crops.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req82-l1-substrate.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req83-capture-to-l1-fold.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req84-strip-layout-modules.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req85-capability-contract.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req85-carousel.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req85-conformance.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req86-e2e-repro.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req87-behavior-rename.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req88-l1-repro-pipeline.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req89-astro-lazy.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req90-l1-font-resources.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req91-l1-pixel-mover-axes.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req92-fold-full-language.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/req92-image-box-fold.test.ts\"},{\"assertionResults\":[],\"startTime\":1785693103785,\"endTime\":1785693103785,\"status\":\"failed\",\"message\":\"Failed to resolve entry for package \\\"@1stcontact/site-schema\\\". The package may have incorrect main/module/exports specified in its package.json.\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/shot.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_valid_minimal_site_validates\",\"duration\":3.948959000000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_valid_full_site_validates\",\"duration\":1.350500000000011,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected\",\"duration\":0.44675000000000864,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_invalid_nav_pattern_rejected\",\"duration\":0.21466599999999403,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected\",\"duration\":0.20216699999997445,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_invalid_color_format_rejected\",\"duration\":0.19095799999999485,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_validator_returns_typed_site\",\"duration\":0.20029199999999037,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_catalog_membership_not_validated\",\"duration\":0.1544590000000028,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_duplicate_page_slug_rejected\",\"duration\":0.24687500000001705,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected\",\"duration\":0.3006249999999966,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-23_list_of_object_content_round_trips\",\"duration\":0.32654200000001765,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"@1stcontact/site-schema validateSite\"],\"fullName\":\"@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-23_asset_ref_content_still_validates\",\"duration\":0.12433300000000713,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1785693104728,\"endTime\":1785693104736.1243,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/regression-dccfa99b/tests/site-schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "ci workflow test_UAT_FC_REQ-1_ci_workflow_lints",
          "file": "",
          "status": "passed"
        },
        {
          "name": "control-app worker test_UAT_FC_REQ-1_control_app_returns_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "deploy workflow test_UAT_FC_REQ-1_deploy_workflow_lints",
          "file": "",
          "status": "passed"
        },
        {
          "name": "contact-form client enhancement test_UAT_FC_REQ-5_contact_form_client_enhancement_intercepts_submit_and_posts_json",
          "file": "",
          "status": "passed"
        },
        {
          "name": "contact-form client enhancement test_UAT_FC_REQ-5_contact_form_client_renders_success_message_on_200",
          "file": "",
          "status": "passed"
        },
        {
          "name": "contact-form client enhancement test_UAT_FC_REQ-5_contact_form_client_renders_error_on_non_200",
          "file": "",
          "status": "passed"
        },
        {
          "name": "identifier naming consistency test_UAT_FC_REQ-1_identifiers_use_1stcontact_not_first_contact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "identifier naming consistency test_UAT_FC_REQ-1_worker_names_are_1stcontact_prefixed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "public-site worker test_UAT_FC_REQ-1_public_site_returns_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "public-site routing config test_UAT_FC_REQ-1_public_site_serves_apex_and_wildcard_routes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-664 \u2014 malformed length fails site validation loudly test_UAT_AC664_malformed_length_fails_validation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-20 secondary palette role test_UAT_FC_REQ-20_theme_css_emits_secondary_color_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-20 fidelity \u2014 accent-mid gradient role test_UAT_FC_REQ-20_accent_mid_role_resolves_in_gradient",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-20 fidelity \u2014 accent-mid gradient role test_UAT_FC_REQ-20_theme_emits_accent_mid_custom_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-24 display fonts \u2014 schema test_UAT_FC_REQ-24_schema_accepts_structured_font_declaration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-24 display fonts \u2014 schema test_UAT_FC_REQ-24_schema_rejects_malformed_font_declaration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-24 display fonts \u2014 theme CSS generation test_UAT_FC_REQ-24_generate_css_emits_font_face_for_declared_font",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-24 display fonts \u2014 theme CSS generation test_UAT_FC_REQ-24_generate_css_carries_optional_weight_and_style",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-24 display fonts \u2014 theme CSS generation test_UAT_FC_REQ-24_generate_css_emits_display_family_custom_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-24 display fonts \u2014 theme CSS generation test_UAT_FC_REQ-24_generate_css_omits_font_face_when_no_fonts_declared",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-32 primitive 2 \u2014 callout / left-bar treatment test_UAT_FC_REQ-32_markdown_alert_becomes_semantic_callout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-32 primitive 2 \u2014 callout / left-bar treatment test_UAT_FC_REQ-32_callout_supports_italic_and_any_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-32 primitive 2 \u2014 callout / left-bar treatment test_UAT_FC_REQ-32_plain_blockquote_and_unknown_role_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-32 primitive 4 \u2014 cool-neutral palette role test_UAT_FC_REQ-32_theme_emits_neutral_cool_custom_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-32 cap 5 \u2014 xl shadow token test_UAT_FC_REQ-32_xl_shadow_token_emitted_and_overridable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 verbatim punctuation \u2014 smartypants off (AC1) test_UAT_FC_REQ-33_markdown_keeps_straight_apostrophe",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 verbatim punctuation \u2014 smartypants off (AC1) test_UAT_FC_REQ-33_markdown_keeps_straight_quotes_and_double_hyphen",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 contact-form submit inherits site type (AC2) test_UAT_FC_REQ-33_submit_button_inherits_font",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 callout is medium-weight emphasis (AC9) test_UAT_FC_REQ-33_callout_text_is_medium_weight",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 callout is medium-weight emphasis (AC9) test_UAT_FC_REQ-33_callout_marker_renders_left_bar",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 warm palette roles accent-light / accent-deep (AC4) test_UAT_FC_REQ-33_warm_roles_in_treatment_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-33 warm palette roles accent-light / accent-deep (AC4) test_UAT_FC_REQ-33_warm_roles_emit_color_custom_properties",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-71 styled inline runs in markdown body prose test_UAT_FC_REQ-71_span_carries_colour_size_and_emphasis",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-71 styled inline runs in markdown body prose test_UAT_FC_REQ-71_colour_role_and_bold_emphasis",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-71 styled inline runs in markdown body prose test_UAT_FC_REQ-71_unknown_key_is_left_literal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-71 styled inline runs in markdown body prose test_UAT_FC_REQ-71_span_inside_a_callout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-36 scrim token test_UAT_FC_REQ-36_scrim_token_defaults_to_a_near_black",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-36 extended spacing scale \u2014 airy sections test_UAT_FC_REQ-36_spacing_steps_carry_2xl_3xl",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-36 extralight weight token test_UAT_FC_REQ-36_extralight_weight_token_emitted_as_200",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-36 theme token surface \u2014 container scale, accent-mid, label font test_UAT_FC_REQ-36_accent_mid_declared_out_of_the_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-36 theme token surface \u2014 container scale, accent-mid, label font test_UAT_FC_REQ-36_theme_emits_tailwind_container_scale",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-36 theme token surface \u2014 container scale, accent-mid, label font test_UAT_FC_REQ-36_theme_emits_font_family_label_from_the_label_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "1c launcher \u2014 HMR WebSocket disabled (REQ-37) test_UAT_FC_REQ-37_launcher_does_not_error_on_occupied_hmr_port",
          "file": "",
          "status": "failed"
        },
        {
          "name": "REQ-45 token surface \u2014 tracking custom properties test_UAT_FC_REQ-45_theme_emits_tracking_custom_properties",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-49 token surface \u2014 extended scale backs the dials test_UAT_FC_REQ-49_theme_emits_snug_line_height_and_light_weight",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-49 token surface \u2014 extended scale backs the dials test_UAT_FC_REQ-49_theme_emits_768px_container_measure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-49 token surface \u2014 extended scale backs the dials test_UAT_FC_REQ-49_theme_emits_large_spacing_steps_for_content_offset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-49 token surface \u2014 extended scale backs the dials test_UAT_FC_REQ-49_large_spacing_steps_survive_a_site_supplied_spacing_block",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 accepts literals and known aliases test_UAT_FC_REQ-50_valid_literal_run_passes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 accepts literals and known aliases test_UAT_FC_REQ-50_valid_alias_run_passes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 accepts literals and known aliases test_UAT_FC_REQ-50_gradient_run_matching_report_shape_passes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 rejects unknown aliases test_UAT_FC_REQ-50_unknown_weight_alias_is_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 rejects unknown aliases test_UAT_FC_REQ-50_non_hex_non_role_color_is_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 rejects unknown aliases test_UAT_FC_REQ-50_unknown_gradient_direction_and_bad_stop_are_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 styled-text validation \u2014 rejects unknown aliases test_UAT_FC_REQ-50_missing_required_styled_text_is_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 literal values (reproduction) test_UAT_FC_REQ-50_literals_resolve_verbatim_in_diff_units",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 literal values (reproduction) test_UAT_FC_REQ-50_font_weight_is_an_integer_not_an_enum",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 theme aliases (design) test_UAT_FC_REQ-50_aliases_resolve_to_theme_vars",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 theme aliases (design) test_UAT_FC_REQ-50_camelCase_palette_role_kebabs_to_var",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 partial + absent runs test_UAT_FC_REQ-50_absent_fields_emit_no_declaration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 partial + absent runs test_UAT_FC_REQ-50_absent_run_is_empty",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 text-fill gradient (mirrors report TextGradient) test_UAT_FC_REQ-50_gradient_literal_angle_and_hex_stops_reproduce_verbatim",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 text-fill gradient (mirrors report TextGradient) test_UAT_FC_REQ-50_gradient_direction_and_role_aliases_resolve_to_vars",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 text-fill gradient (mirrors report TextGradient) test_UAT_FC_REQ-50_gradient_supersedes_flat_color_on_the_same_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-50 unified vocabulary \u2014 text-fill gradient (mirrors report TextGradient) test_UAT_FC_REQ-50_under_two_stops_keeps_flat_color",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-70 responsive TextRun typography \u2014 per-breakpoint fontSize/lineHeight/letterSpacing test_UAT_FC_REQ-70_responsive_fontsize_emits_base_and_breakpoint_vars",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-70 responsive TextRun typography \u2014 per-breakpoint fontSize/lineHeight/letterSpacing test_UAT_FC_REQ-70_scalar_axis_is_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-70 responsive TextRun typography \u2014 per-breakpoint fontSize/lineHeight/letterSpacing test_UAT_FC_REQ-70_global_css_repoints_at_breakpoints_with_fallback_chain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 round-trip invariant (DOC-22 \u00a75) test_UAT_FC_REQ-54_roundtrip_invariant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 round-trip invariant (DOC-22 \u00a75) test_UAT_FC_REQ-54_roundtrip_dense_overrides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 block structure (DOC-22 \u00a73) test_UAT_FC_REQ-54_paragraphs_are_blocks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 block structure (DOC-22 \u00a73) test_UAT_FC_REQ-54_markdown_desugars_to_runs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 lists (DOC-22 \u00a73, 1stcontact) test_UAT_FC_REQ-54_ordered_list_covers_1stcontact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 lists (DOC-22 \u00a73, 1stcontact) test_UAT_FC_REQ-54_bullet_list_with_inline_styling",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 lists (DOC-22 \u00a73, 1stcontact) test_UAT_FC_REQ-54_ordered_list_start_offset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 lists (DOC-22 \u00a73, 1stcontact) test_UAT_FC_REQ-54_paragraph_leading_marker_is_guarded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 lists (DOC-22 \u00a73, 1stcontact) test_UAT_FC_REQ-54_list_adjacent_to_paragraphs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 generic attribute-span (DOC-22 \u00a74) test_UAT_FC_REQ-54_attribute_span_overrides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 generic attribute-span (DOC-22 \u00a74) test_UAT_FC_REQ-54_baseline_fence_overrides_block",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 escaping (DOC-22 \u00a74.1) test_UAT_FC_REQ-54_escaping_literal_delimiters",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-54 styled-text markup \u2014 escaping (DOC-22 \u00a74.1) test_UAT_FC_REQ-54_quoted_attribute_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-58 length value model test_UAT_FC_REQ-58_classify_length_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-58 length value model test_UAT_FC_REQ-58_length_field_validates_full_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-55 named layer \u2014 Tailwind `max-w` scale test_UAT_FC_REQ-55_contentWidth_4xl_resolves_to_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-55 named layer \u2014 Tailwind `max-w` scale test_UAT_FC_REQ-55_scale_matches_tailwind_max_w_px",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-55 named layer \u2014 Tailwind `max-w` scale test_UAT_FC_REQ-55_bleed_and_absent_are_no_cap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-55 literal escape hatch test_UAT_FC_REQ-55_contentWidth_literal_px",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-55 migration \u2014 retired width names are gone test_UAT_FC_REQ-55_old_width_names_migrated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-55 migration \u2014 retired width names are gone test_UAT_FC_REQ-55_dial_enum_is_the_tailwind_scale",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 theme subscales test_UAT_FC_REQ-56_badge_type_from_theme",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 theme subscales test_UAT_FC_REQ-56_checklist_leading_from_theme",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 theme subscales test_UAT_FC_REQ-56_subscale_vocabulary_matches_textrun_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 capture reads subscales test_UAT_FC_REQ-56_capture_reads_label_scale",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 capture reads subscales test_UAT_FC_REQ-56_capture_ignores_one_off_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_systemic_gap_is_one_theme_finding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_keep_subscale_deltas_opt_out",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-56 component-owned typography \u2014 values-diff subscale attribution test_UAT_FC_REQ-56_gigabytealchemy_badges_close_via_theme",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 round-trip invariant over the widened space (DOC-22 \u00a75) test_UAT_FC_REQ-57_roundtrip_all_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78) test_UAT_FC_REQ-57_table_roundtrips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 tables (DOC-22 \u00a78) test_UAT_FC_REQ-57_table_cell_holds_blocks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_block_is_raw",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_fence_widens_for_backticks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 code (DOC-22 \u00a78) test_UAT_FC_REQ-57_code_block_without_language",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_heading_levels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_heading_carries_inline_runs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 headings (DOC-22 \u00a78) test_UAT_FC_REQ-57_paragraph_leading_hash_is_guarded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78) test_UAT_FC_REQ-57_nested_list_item",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 nested / multi-block list items (DOC-22 \u00a78) test_UAT_FC_REQ-57_multi_paragraph_list_item",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_rich_blockquote",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_nested_blockquote",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-57 rich text blocks \u2014 rich / nested blockquotes (DOC-22 \u00a78) test_UAT_FC_REQ-57_blockquote_holds_a_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 responsiveContainerWidthVars handles caps + no-cap test_UAT_FC_REQ-61_content_width_scalar_and_bleed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 responsiveContainerWidthVars handles caps + no-cap test_UAT_FC_REQ-61_content_width_per_breakpoint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 breakpoints primitive (override-and-up) test_UAT_FC_REQ-61_override_chain_falls_through_to_base",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 breakpoints primitive (override-and-up) test_UAT_FC_REQ-61_property_rules_emit_media_blocks_per_breakpoint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 responsiveStepVars (scalar path unchanged, object path adds overrides) test_UAT_FC_REQ-61_scalar_emits_only_base_var",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 responsiveStepVars (scalar path unchanged, object path adds overrides) test_UAT_FC_REQ-61_object_emits_base_plus_present_overrides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 responsiveStepVars (scalar path unchanged, object path adds overrides) test_UAT_FC_REQ-61_is_responsive_value_guard",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-61 \u2014 responsiveDialValueSchema accepts the per-breakpoint shape test_UAT_FC_REQ-61_schema_accepts_base_plus_breakpoints",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_minimal_site_validates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_valid_full_site_validates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_module_instance_shape_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_nav_pattern_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_theme_tokens_missing_slot_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_invalid_color_format_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_validator_returns_typed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_catalog_membership_not_validated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_page_slug_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-3_duplicate_module_id_within_page_rejected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_list_of_object_content_round_trips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "@1stcontact/site-schema validateSite test_UAT_FC_REQ-23_asset_ref_content_still_validates",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "1c launcher \u2014 HMR WebSocket disabled (REQ-37) test_UAT_FC_REQ-37_launcher_does_not_error_on_occupied_hmr_port",
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