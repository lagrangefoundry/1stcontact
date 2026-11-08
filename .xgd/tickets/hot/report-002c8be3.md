---
uid: report-002c8be3
id: REPORT-11561
type: report
title: 'Report: batch_quality_check for report-49607926'
created_by: xgd
created_at: '2026-11-08T20:06:21.579012+00:00'
updated_at: '2026-11-08T20:06:21.579012+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-49607926
  parent_report_uid: report-9eb72198
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T20:00:39.943238Z",
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
      "duration_seconds": 38.79503170913085,
      "passed": 36,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 36,
      "deselected": 14,
      "test_filter": [
        "test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error",
        "test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
        "test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence",
        "test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow",
        "test_UAT_AC2228_",
        "test_UAT_AC2449_",
        "test_UAT_FC_REQ_211_",
        "test_UAT_AC2464_",
        "test_UAT_AC1400_",
        "test_UAT_FC_BUG-71_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "es\":[\"AC-2457 text-height estimation over runs\"],\"fullName\":\"AC-2457 text-height estimation over runs test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794168045161,\"endTime\":1794168060788.8857,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-multi-variate-text-runs.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the workspace serves what the build wrote\"],\"fullName\":\"story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"duration\":510.4397089999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794168059715,\"endTime\":1794168060225.4397,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-build-artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten\",\"duration\":31.04583300000013,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end\",\"duration\":23.29458399999976,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url\",\"duration\":2.089625000000069,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_report_states_the_graph_it_verified\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_report_states_the_graph_it_verified\",\"duration\":16.193709000000126,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 a tree that cannot load is refused\"],\"fullName\":\"BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses\",\"duration\":1.5250419999997575,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 a tree that cannot load is refused\"],\"fullName\":\"BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size\",\"duration\":3.94800000000032,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794168045608,\"endTime\":1794168045687.948,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-211 the substrate accepts inline variation\"],\"fullName\":\"REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_plain_string_validates_and_renders_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_plain_string_validates_and_renders_as_before\",\"duration\":5.491125000000011,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the substrate accepts inline variation\"],\"fullName\":\"REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_each_run_renders_carrying_its_own_axes\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_each_run_renders_carrying_its_own_axes\",\"duration\":2.8450000000000273,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the substrate accepts inline variation\"],\"fullName\":\"REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_the_plain_text_of_runs_is_the_same_copy\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_the_plain_text_of_runs_is_the_same_copy\",\"duration\":0.4226250000001528,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the substrate accepts inline variation\"],\"fullName\":\"REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_run_rejects_nesting_and_unpermitted_axes\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_run_rejects_nesting_and_unpermitted_axes\",\"duration\":5.4061669999998685,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the substrate accepts inline variation\"],\"fullName\":\"REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_single_run_array_is_not_a_spelling_of_a_string\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_single_run_array_is_not_a_spelling_of_a_string\",\"duration\":0.6539580000001024,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the substrate accepts inline variation\"],\"fullName\":\"REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_run_axes_are_bounded_by_the_envelope\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_run_axes_are_bounded_by_the_envelope\",\"duration\":0.4112920000000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the editor exposes multi-run copy as plain strings\"],\"fullName\":\"REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_a_multi_run_node_opens_as_one_field_per_run\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_multi_run_node_opens_as_one_field_per_run\",\"duration\":0.7426249999998618,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the editor exposes multi-run copy as plain strings\"],\"fullName\":\"REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_editing_one_run_disturbs_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_editing_one_run_disturbs_nothing_else\",\"duration\":0.44137499999987995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the editor exposes multi-run copy as plain strings\"],\"fullName\":\"REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_a_run_field_outside_the_derivation_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_run_field_outside_the_derivation_is_refused\",\"duration\":0.10804200000006858,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 measuring a multi-run node\"],\"fullName\":\"REQ-211 measuring a multi-run node test_UAT_FC_REQ_211_runs_measure_as_the_same_copy_written_once\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_runs_measure_as_the_same_copy_written_once\",\"duration\":0.4049159999999574,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 measuring a multi-run node\"],\"fullName\":\"REQ-211 measuring a multi-run node test_UAT_FC_REQ_211_a_smaller_run_consumes_less_of_the_line\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_smaller_run_consumes_less_of_the_line\",\"duration\":0.1041250000000673,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794168043372,\"endTime\":1794168043389.405,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-211 the fold rejoins a varying inline flow\"],\"fullName\":\"REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node\",\"duration\":10.477167000000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the fold rejoins a varying inline flow\"],\"fullName\":\"REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone\",\"duration\":1.633708000000297,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the fold rejoins a varying inline flow\"],\"fullName\":\"REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once\",\"duration\":0.3054579999998168,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the capture records which runs are one flow\"],\"fullName\":\"REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence\",\"duration\":15483.541042,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-211 the capture records which runs are one flow\"],\"fullName\":\"REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow\",\"duration\":14420.321209000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794168044950,\"endTime\":1794168074877.3213,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "status": "passed"
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
          "name": "AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
          "file": "",
          "status": "passed"
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
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_plain_string_validates_and_renders_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_each_run_renders_carrying_its_own_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_the_plain_text_of_runs_is_the_same_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_run_rejects_nesting_and_unpermitted_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_single_run_array_is_not_a_spelling_of_a_string",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_run_axes_are_bounded_by_the_envelope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_a_multi_run_node_opens_as_one_field_per_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_editing_one_run_disturbs_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_a_run_field_outside_the_derivation_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 measuring a multi-run node test_UAT_FC_REQ_211_runs_measure_as_the_same_copy_written_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 measuring a multi-run node test_UAT_FC_REQ_211_a_smaller_run_consumes_less_of_the_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow",
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