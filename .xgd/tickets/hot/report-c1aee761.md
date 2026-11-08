---
uid: report-c1aee761
id: REPORT-11478
type: report
title: 'Scoped quality: fail (73 tests, 10 failed)'
created_by: xgd
created_at: '2026-11-08T14:34:44.569068+00:00'
updated_at: '2026-11-08T14:34:44.569068+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-99
  commit: 589c64499450d8e1fc917339f1e714fa32505b5e
---

{
  "timestamp": "2026-11-08T14:31:14.817067Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011837529018521309,
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
    "error_list": [],
    "stdout": "No tsconfig.json \u2014 type-check skipped (JS-only project)",
    "stderr": ""
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
      "duration_seconds": 22.68462820816785,
      "passed": 63,
      "failed": 10,
      "skipped": 0,
      "errors": 0,
      "total": 73,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1029_",
        "test_UAT_AC1030_",
        "test_UAT_AC1031_",
        "test_UAT_AC1032_",
        "test_UAT_AC1033_",
        "test_UAT_AC1034_",
        "test_UAT_AC1035_",
        "test_UAT_AC1036_",
        "test_UAT_AC1110_",
        "test_UAT_AC1399_",
        "test_UAT_AC1400_",
        "test_UAT_AC1401_",
        "test_UAT_AC1402_",
        "test_UAT_AC1403_",
        "test_UAT_AC1449_",
        "test_UAT_AC2143_",
        "test_UAT_AC2144_",
        "test_UAT_AC2145_",
        "test_UAT_AC2146_",
        "test_UAT_AC2147_",
        "test_UAT_AC2148_",
        "test_UAT_AC2227_",
        "test_UAT_AC2228_",
        "test_UAT_AC2230_",
        "test_UAT_AC2231_",
        "test_UAT_AC2232_",
        "test_UAT_AC2463_",
        "test_UAT_AC2464_",
        "test_UAT_AC959_",
        "test_UAT_AC960_",
        "test_UAT_AC961_",
        "test_UAT_AC962_",
        "test_UAT_AC963_",
        "test_UAT_AC964_",
        "test_UAT_AC965_",
        "test_UAT_AC966_",
        "test_UAT_AC967_",
        "test_UAT_AC968_",
        "test_UAT_AC969_",
        "test_UAT_AC970_",
        "test_UAT_AC971_",
        "test_UAT_AC972_",
        "test_UAT_AC973_",
        "test_UAT_AC974_",
        "test_UAT_AC975_",
        "test_UAT_AC976_",
        "test_UAT_AC977_",
        "test_UAT_AC978_",
        "test_UAT_AC979_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\\n    at runWithTimeout (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a builder origin\"],\"fullName\":\"story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo\",\"status\":\"passed\",\"title\":\"test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo\",\"duration\":31.283000000000357,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a builder origin\"],\"fullName\":\"story-e674c60a builder origin test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point\",\"status\":\"passed\",\"title\":\"test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point\",\"duration\":33.25495799999953,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component consumption route\"],\"fullName\":\"story-e674c60a component consumption route test_UAT_AC962_absent_component_names_the_component_and_the_install_command\",\"status\":\"passed\",\"title\":\"test_UAT_AC962_absent_component_names_the_component_and_the_install_command\",\"duration\":0.5371670000004087,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a control-app front\"],\"fullName\":\"story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token\",\"duration\":566.5267499999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a origin failure reporting\"],\"fullName\":\"story-e674c60a origin failure reporting test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration\",\"status\":\"passed\",\"title\":\"test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration\",\"duration\":4350.917749999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a measured against a real browser\"],\"fullName\":\"story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls\",\"status\":\"passed\",\"title\":\"test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls\",\"duration\":461.4756249999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794148284292,\"endTime\":1794148295677.4756,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-builder-workspace-origin.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 every text-bearing builder control is one size\"],\"fullName\":\"story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry\",\"status\":\"failed\",\"title\":\"test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry\",\"duration\":246.108209,\"failureMessages\":[\"AssertionError: sized, but not by the control token: <input class=\\\"builder-people__subject\\\"> \u2192 13px \u00b7 <textarea class=\\\"builder-people__tolist\\\"> \u2192 13px \u00b7 <textarea class=\\\"builder-people__body\\\"> \u2192 13px: expected [ \u2026(3) ] to deeply equal []\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-builder-workspace-typography.test.ts:438:86\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the empty detail state is one styled box\"],\"fullName\":\"story-e674c60a \u2014 the empty detail state is one styled box test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box\",\"status\":\"passed\",\"title\":\"test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box\",\"duration\":26.399749999999926,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794148282394,\"endTime\":1794148282667.3997,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-builder-workspace-typography.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_main_checkout_anchors_to_itself\",\"duration\":577.174917,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout\",\"duration\":620.6938329999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory\",\"duration\":568.5271669999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates\",\"duration\":570.3532910000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy\",\"duration\":613.4967920000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794148277670,\"endTime\":1794148280620.4968,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-component-resolution-anchor.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a workspace that cannot start\"],\"fullName\":\"story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"duration\":78.76545899999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794148282202,\"endTime\":1794148282280.7654,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-boot-guard.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the workspace serves what the build wrote\"],\"fullName\":\"story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"duration\":400.4339579999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794148288437,\"endTime\":1794148288837.4338,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-build-artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the builder command is a transport over the one route table\"],\"fullName\":\"story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"duration\":342.53179099999943,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794148283592,\"endTime\":1794148283934.5317,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-transport.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_builder_changed_site_refuses_409_and_is_byte_identical_force_lands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_fresh_slug_and_an_import_only_slug_both_land",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_1c_push_omits_force_unless_asked_and_force_sends_true",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_preview_names_the_control_app_store_and_deletes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_yes_removes_only_the_control_app_store_and_never_storage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_include_public_also_removes_the_public_site_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_listening_port_is_refused_and_nothing_is_deleted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_an_absent_store_is_already_empty_and_a_success",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_paths_resolve_from_the_repo_root_whatever_the_working_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 a business switch moves everything test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 the account surface explains a lapse test_UAT_AC2147_account_surface_states_each_lapse_reason_and_switcher_only_suffixes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the word a person reads is Business test_UAT_AC2148_no_user_facing_string_in_builder_or_public_site_says_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC970_strip_re_derives_when_a_business_switch_or_a_restore_changes_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC974_business_selection_is_remembered_under_a_shell_wide_key_and_falls_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC959_renders_one_panel_per_declared_tab_and_opens_the_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC976_every_option_of_every_declared_tab_reaches_the_chrome",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the asset build emits and verifies the import graph test_UAT_AC2464_asset_build_emits_the_closed_framework_graph_verifies_it_and_refuses_a_tree_that_cannot_load",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component consumption route test_UAT_AC962_absent_component_names_the_component_and_the_install_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a origin failure reporting test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 the empty detail state is one styled box test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry",
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
        "message": "10 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 10
        }
      }
    ]
  }
}