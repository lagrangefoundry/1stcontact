---
uid: report-b2ebc42b
id: REPORT-7842
type: report
title: 'Scoped quality: fail (57 tests, 1 failed, 1 orphan AC(s))'
created_by: xgd
created_at: '2026-11-01T20:35:33.180497+00:00'
updated_at: '2026-11-01T20:35:33.180497+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e674c60a
  commit: 8d5d684103c864415fb34038b545ca13c263ded0
---

{
  "timestamp": "2026-11-01T20:32:10.968094Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015287497080862522,
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
      "duration_seconds": 16.009553499985486,
      "passed": 56,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 57,
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
      "stdout": "\"duration\":589.3316249999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory\",\"duration\":546.948416,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates\",\"duration\":550.9436250000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a component resolution anchors at the repository, not the location\"],\"fullName\":\"story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy\",\"duration\":561.5494160000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565132420,\"endTime\":1793565135271.5493,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-component-resolution-anchor.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a workspace that cannot start\"],\"fullName\":\"story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"duration\":72.09012499999972,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565134823,\"endTime\":1793565134895.09,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-boot-guard.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the workspace serves what the build wrote\"],\"fullName\":\"story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"duration\":244.70958299999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565142842,\"endTime\":1793565143086.7095,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-build-artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the builder command is a transport over the one route table\"],\"fullName\":\"story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"duration\":282.6789170000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565138778,\"endTime\":1793565139060.679,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-transport.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the businesses endpoint\"],\"fullName\":\"story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\",\"status\":\"failed\",\"title\":\"test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call\",\"duration\":2,\"failureMessages\":[\"TypeError: (0 , __vite_ssr_import_4__.provisionInvite) is not a function\\n    at invite (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-builder-businesses-endpoint.workers.test.ts:107:24)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-builder-businesses-endpoint.workers.test.ts:132:24\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\\n    at runWithTimeout (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793565142999,\"endTime\":1793565143001,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-builder-businesses-endpoint.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565143000,\"endTime\":1793565143013,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed workspace, with nothing running locally\"],\"fullName\":\"story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself\",\"duration\":97,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed workspace, with nothing running locally\"],\"fullName\":\"story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store\",\"duration\":107,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565142924,\"endTime\":1793565143128,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-edge-origin.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a deployment with only the schema serves\"],\"fullName\":\"story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves\",\"duration\":78,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the two unserveable deployments are reported distinguishably\"],\"fullName\":\"story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably\",\"status\":\"passed\",\"title\":\"test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565142925,\"endTime\":1793565143007,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-tenant-bootstrap.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed runtime answers the one route table\"],\"fullName\":\"story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers\",\"duration\":95,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793565142925,\"endTime\":1793565143020,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/reconciliation-workspace-transport.workers.test.ts\"}]}",
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
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
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
          "status": "failed"
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
      "passed": 41,
      "failed": 1,
      "total": 42,
      "failures": [
        {
          "test_name": "AC-2144 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2144 'GET /api/businesses answers the account and every admissible business in one call, lapsed ones included and marked unselectable' (uid=acceptance_criterion-76d82fd2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2144.",
          "ac_uid": "acceptance_criterion-76d82fd2",
          "ac_id": "AC-2144",
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