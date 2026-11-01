---
uid: report-84bd42b9
id: REPORT-7850
type: report
title: 'Scoped quality: fail (59 tests, 0 failed, 3 orphan AC(s))'
created_by: xgd
created_at: '2026-11-01T20:58:42.814334+00:00'
updated_at: '2026-11-01T20:58:42.814334+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e674c60a
  commit: 4dedc76cfa0df1b394f358343b8e4a6f111a7a75
---

{
  "timestamp": "2026-11-01T20:55:31.438947Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014504208229482174,
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
      "status": "success",
      "exit_code": 1,
      "duration_seconds": 15.439977374859154,
      "passed": 59,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 59,
      "deselected": 1,
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
      "stdout": "meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a origin failure reporting\"],\"fullName\":\"story-e674c60a origin failure reporting test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration\",\"status\":\"passed\",\"title\":\"test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration\",\"duration\":3305.2605000000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a measured against a real browser\"],\"fullName\":\"story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls\",\"status\":\"passed\",\"title\":\"test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls\",\"duration\":459.60883300000023,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566540170,\"endTime\":1793566547060.609,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-builder-workspace-origin.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_main_checkout_anchors_to_itself\",\"duration\":649.213333,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout\",\"duration\":615.042584,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory\",\"duration\":564.6294580000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates\",\"duration\":559.2886670000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy\",\"duration\":580.0867920000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566533057,\"endTime\":1793566536025.087,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-component-resolution-anchor.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a workspace that cannot start\"],\"fullName\":\"story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"duration\":74.24479199999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566534196,\"endTime\":1793566534270.2449,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-boot-guard.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the workspace serves what the build wrote\"],\"fullName\":\"story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566532695,\"endTime\":1793566532695,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-build-artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the builder command is a transport over the one route table\"],\"fullName\":\"story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"duration\":298.90450000000055,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566540097,\"endTime\":1793566540395.9045,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-transport.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the businesses endpoint\"],\"fullName\":\"story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566546687,\"endTime\":1793566546708,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-builder-businesses-endpoint.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566546624,\"endTime\":1793566546637,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed workspace, with nothing running locally\"],\"fullName\":\"story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed workspace, with nothing running locally\"],\"fullName\":\"story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store\",\"duration\":59,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566546609,\"endTime\":1793566546704,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-edge-origin.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a deployment with only the schema serves\"],\"fullName\":\"story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the two unserveable deployments are reported distinguishably\"],\"fullName\":\"story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably\",\"status\":\"passed\",\"title\":\"test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566546609,\"endTime\":1793566546637,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-tenant-bootstrap.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed runtime answers the one route table\"],\"fullName\":\"story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793566546608,\"endTime\":1793566546647,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-transport.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a business switch moves everything test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "file": "",
          "status": "passed"
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
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "file": "",
          "status": "passed"
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
          "status": "passed"
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
          "name": "story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
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
          "status": "passed"
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
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 44,
      "failed": 3,
      "total": 44,
      "failures": [
        {
          "test_name": "AC-2227 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2227 'An import into a site with builder-recorded changes is refused 409 naming the slug and change count, and the stored site is byte-identical afterwards; the same import with force lands' (uid=acceptance_criterion-d795f91c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2227.",
          "ac_uid": "acceptance_criterion-d795f91c",
          "ac_id": "AC-2227",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2228 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2228 '1c reset previews without --yes, removes only the local state directories with --yes (public-site only with --include-public), never touches storage/, refuses while the dev port is listening, reports an absent store as already empty, and resolves paths from the repo root' (uid=acceptance_criterion-e6a15c54) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2228.",
          "ac_uid": "acceptance_criterion-e6a15c54",
          "ac_id": "AC-2228",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1400 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1400 'The browser client, the shared components and the framework bridges are build artifacts, served behind the gate and never resolved per request' (uid=acceptance_criterion-2131e298) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1400.",
          "ac_uid": "acceptance_criterion-2131e298",
          "ac_id": "AC-1400",
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
  }
}