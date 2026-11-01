---
uid: report-45f53e05
id: REPORT-7594
type: report
title: 'Scoped quality: pass (28 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T12:41:12.123940+00:00'
updated_at: '2026-11-01T12:41:12.123940+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-e15a19ef
  commit: 30e87badbc5b33ae7936a18dd4c95669ea5137d2
---

{
  "timestamp": "2026-11-01T12:38:13.280894Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013933377340435982,
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
      "exit_code": 0,
      "duration_seconds": 9.929820750141516,
      "passed": 28,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 28,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1013_",
        "test_UAT_AC1014_",
        "test_UAT_AC1015_",
        "test_UAT_AC1016_",
        "test_UAT_AC1017_",
        "test_UAT_AC1415_",
        "test_UAT_AC1416_",
        "test_UAT_AC1417_",
        "test_UAT_AC1790_",
        "test_UAT_AC2064_",
        "test_UAT_AC2065_",
        "test_UAT_AC2162_",
        "test_UAT_AC2163_",
        "test_UAT_AC2164_",
        "test_UAT_AC656_",
        "test_UAT_AC657_",
        "test_UAT_AC658_",
        "test_UAT_AC659_",
        "test_UAT_AC720_",
        "test_UAT_AC738_",
        "test_UAT_AC739_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "llName\":\"story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2164_builder_argv_is_cwd_independent_and_port_remote_keep_meaning\",\"status\":\"passed\",\"title\":\"test_UAT_AC2164_builder_argv_is_cwd_independent_and_port_remote_keep_meaning\",\"duration\":1.7945839999999862,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536696136,\"endTime\":1793536696147.7947,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-1c-builder-env-layering.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional\"],\"fullName\":\"story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional test_UAT_AC656_multi_viewport_keeps_slug_positional\",\"status\":\"passed\",\"title\":\"test_UAT_AC656_multi_viewport_keeps_slug_positional\",\"duration\":2.529083000000128,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document\"],\"fullName\":\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_json_is_exactly_one_parseable_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC657_json_is_exactly_one_parseable_document\",\"duration\":2279.4416659999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document\"],\"fullName\":\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document\",\"duration\":1472.47075,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document\"],\"fullName\":\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document\",\"duration\":1388.6890830000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr\"],\"fullName\":\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output\",\"status\":\"passed\",\"title\":\"test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output\",\"duration\":2137.0545,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr\"],\"fullName\":\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr\",\"status\":\"passed\",\"title\":\"test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr\",\"duration\":0.3317909999987023,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 stdout is restored after success and after failure\"],\"fullName\":\"story-e15a19ef \u2014 stdout is restored after success and after failure test_UAT_AC659_stdout_restored_after_success_and_failure\",\"status\":\"passed\",\"title\":\"test_UAT_AC659_stdout_restored_after_success_and_failure\",\"duration\":0.5364160000008269,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536696138,\"endTime\":1793536703419.5364,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-1c-cli-output-hygiene.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 1c crop is an offline verb\"],\"fullName\":\"story-e15a19ef \u2014 1c crop is an offline verb test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree\",\"duration\":5211.147958,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536696132,\"endTime\":1793536701343.148,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-1c-crop-offline-verb.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency\"],\"fullName\":\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gated_command_refuses_before_doing_any_work\",\"status\":\"passed\",\"title\":\"test_UAT_AC1013_gated_command_refuses_before_doing_any_work\",\"duration\":14.273124999999936,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency\"],\"fullName\":\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent\",\"status\":\"passed\",\"title\":\"test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent\",\"duration\":3760.494334,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 an install that lags the committed lockfile is its own fault\"],\"fullName\":\"story-e15a19ef \u2014 an install that lags the committed lockfile is its own fault test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve\",\"status\":\"passed\",\"title\":\"test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve\",\"duration\":3.2006250000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 both install faults arrive in a single refusal\"],\"fullName\":\"story-e15a19ef \u2014 both install faults arrive in a single refusal test_UAT_AC1015_both_faults_reported_in_one_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC1015_both_faults_reported_in_one_refusal\",\"duration\":2.0385830000004717,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 the refusal travels the CLI failure contract\"],\"fullName\":\"story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope\",\"status\":\"passed\",\"title\":\"test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope\",\"duration\":2.530499999999847,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 the refusal travels the CLI failure contract\"],\"fullName\":\"story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package\",\"status\":\"passed\",\"title\":\"test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package\",\"duration\":1362.6272079999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 the gate is scoped to what each command loads\"],\"fullName\":\"story-e15a19ef \u2014 the gate is scoped to what each command loads test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads\",\"status\":\"passed\",\"title\":\"test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads\",\"duration\":5.738833000000341,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536696132,\"endTime\":1793536701282.7388,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-1c-install-preflight.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server\"],\"fullName\":\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"duration\":2099.913541,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro has left the repository\"],\"fullName\":\"story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"status\":\"passed\",\"title\":\"test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"duration\":58.086917000000085,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel\"],\"fullName\":\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"duration\":1805.0527080000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536694686,\"endTime\":1793536698649.0527,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-1c-launcher-bootstrap.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-177 \u2014 1c serve is discontinued\"],\"fullName\":\"REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_serve_is_refused_as_an_unknown_command\",\"status\":\"passed\",\"title\":\"test_UAT_AC2064_serve_is_refused_as_an_unknown_command\",\"duration\":6.341708000000153,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-177 \u2014 1c serve is discontinued\"],\"fullName\":\"REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_help_offers_only_the_worker_based_builder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2064_help_offers_only_the_worker_based_builder\",\"duration\":0.244666000000052,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-177 \u2014 1c serve is discontinued\"],\"fullName\":\"REQ-177 \u2014 1c serve is discontinued test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin\",\"status\":\"passed\",\"title\":\"test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin\",\"duration\":34.38154099999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793536696133,\"endTime\":1793536696173.3816,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/req177-discontinue-raw-server.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148) test_UAT_AC739_astro_container_never_created_for_any_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2162_builder_and_dev_control_share_one_env_file_layering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2163_missing_env_files_are_named_with_resolved_path_and_consequence_and_server_still_starts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2164_builder_argv_is_cwd_independent_and_port_remote_keep_meaning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional test_UAT_AC656_multi_viewport_keeps_slug_positional",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_json_is_exactly_one_parseable_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 stdout is restored after success and after failure test_UAT_AC659_stdout_restored_after_success_and_failure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 1c crop is an offline verb test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gated_command_refuses_before_doing_any_work",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 an install that lags the committed lockfile is its own fault test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 both install faults arrive in a single refusal test_UAT_AC1015_both_faults_reported_in_one_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the gate is scoped to what each command loads test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads",
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
          "status": "passed"
        },
        {
          "name": "REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_serve_is_refused_as_an_unknown_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_help_offers_only_the_worker_based_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-177 \u2014 1c serve is discontinued test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin",
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