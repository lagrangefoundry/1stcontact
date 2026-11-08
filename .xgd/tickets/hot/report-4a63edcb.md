---
uid: report-4a63edcb
id: REPORT-11542
type: report
title: 'Report: batch_quality_check for report-49607926'
created_by: xgd
created_at: '2026-11-08T18:19:04.247698+00:00'
updated_at: '2026-11-08T18:19:04.247698+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: report-49607926
  parent_report_uid: report-b0262d00
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T18:14:53.220799Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 12.516004959121346,
      "passed": 37,
      "failed": 6,
      "skipped": 0,
      "errors": 0,
      "total": 43,
      "deselected": 65,
      "test_filter": [
        "test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
        "test_UAT_AC1415_",
        "test_UAT_AC1416_",
        "test_UAT_AC1417_",
        "test_UAT_FC_REQ-145_",
        "test_UAT_AC1791_",
        "test_UAT_AC2421_",
        "test_UAT_FC_REQ-209_",
        "test_UAT_FC_BUG-71_",
        "test_UAT_AC1476_",
        "test_UAT_AC1477_",
        "test_UAT_AC1485_",
        "test_UAT_AC2464_",
        "test_UAT_AC960_",
        "test_UAT_AC961_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "e anchor vocabulary test_UAT_FC_REQ_209_a_shape_has_no_ink_or_baseline\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_shape_has_no_ink_or_baseline\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 the anchor vocabulary\"],\"fullName\":\"REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_node_reference_may_contain_a_dot\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_node_reference_may_contain_a_dot\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 the anchor vocabulary\"],\"fullName\":\"REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_relation_is_read_from_the_same_sentence_either_way\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_relation_is_read_from_the_same_sentence_either_way\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_measure_reports_the_primitives_and_the_font_once\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_measure_reports_the_primitives_and_the_font_once\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_answers_one_number\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_relate_answers_one_number\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 measuring, relating and solving through the surface\"],\"fullName\":\"REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-209 asserting on the write\"],\"fullName\":\"REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794161694427,\"endTime\":1794161694427,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-209_measure_a_drawing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_a_pure_l1_site_renders_its_draft_and_edit_channels\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_a_pure_l1_site_renders_its_draft_and_edit_channels\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_an_unconfigured_access_gate_still_refuses_without_the_dev_var\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_an_unconfigured_access_gate_still_refuses_without_the_dev_var\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794161705020,\"endTime\":1794161705057,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts\"}]}",
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
          "name": "story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the asset build emits and verifies the import graph test_UAT_AC2464_asset_build_emits_the_closed_framework_graph_verifies_it_and_refuses_a_tree_that_cannot_load",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the asset build emits and verifies the import graph test_UAT_AC2464_type_only_imports_are_not_emitted_and_an_import_quoted_in_a_comment_is_left_as_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_fails_1c_assets_naming_the_importer_and_the_specifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 the builder is served the anchor and measurement modules the tools run test_UAT_AC2421_the_builder_entry_loads_the_served_anchor_and_measure_modules_and_they_answer_as_the_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 the builder is served the anchor and measurement modules the tools run test_UAT_AC2421_in_a_browser_the_default_measure_path_gives_near_equal_to_measure_drawing_and_nearest_anchors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-ab1ecd62 \u2014 the ticket store schema is applied as a migration in sequence test_UAT_AC1476_the_step_is_declared_in_the_migration_sequence_and_applies_after_the_site_stores",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-ab1ecd62 \u2014 the schema step stays in agreement with the component test_UAT_AC1477_every_published_statement_is_present_and_a_missing_one_is_named",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-ab1ecd62 \u2014 the shared component resolves, is reported, and its absence is named test_UAT_AC1485_the_build_emits_an_absolute_re_export_reports_it_and_names_a_stale_install",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_report_states_the_graph_it_verified",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_render_reaches_no_astro_and_no_filesystem",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_production_vars_do_not_carry_the_dev_access_bypass",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_every_var_and_binding_is_repeated_under_production",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_worker_runs_before_the_assets_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_migrations_dir_sits_on_the_database_not_the_top_level",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_proxy_and_its_origin_var_are_gone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_a_pure_l1_site_renders_its_draft_and_edit_channels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_an_unconfigured_access_gate_still_refuses_without_the_dev_var",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-ab1ecd62 \u2014 the ticket store schema is applied as a migration in sequence test_UAT_AC1476_the_step_is_declared_in_the_migration_sequence_and_applies_after_the_site_stores",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-ab1ecd62 \u2014 the schema step stays in agreement with the component test_UAT_AC1477_every_published_statement_is_present_and_a_missing_one_is_named",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-ab1ecd62 \u2014 the shared component resolves, is reported, and its absence is named test_UAT_AC1485_the_build_emits_an_absolute_re_export_reports_it_and_names_a_stale_install",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    }
  },
  "overall": {
    "status": "failure",
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