---
uid: report-81a2a2f8
id: REPORT-6885
type: report
title: 'Scoped quality: fail (22 tests, 1 failed)'
created_by: xgd
created_at: '2026-10-30T19:13:35.639588+00:00'
updated_at: '2026-10-30T19:13:35.639588+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-e15a19ef
  commit: 92403805256ef6c3f575327dd819fccaeaefc64c
---

{
  "timestamp": "2026-10-30T19:08:15.358019Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0004901660140603781,
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
      "duration_seconds": 19.864057334139943,
      "passed": 21,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 22,
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
      "stdout": "rangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:198:20)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:208:19\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793387300154,\"endTime\":1793387300161.5413,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean\"],\"fullName\":\"story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\",\"status\":\"passed\",\"title\":\"test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr\",\"duration\":10440.663708,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148)\"],\"fullName\":\"story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148) test_UAT_AC739_astro_container_never_created_for_any_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC739_astro_container_never_created_for_any_page\",\"duration\":43.23500000000058,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387298816,\"endTime\":1793387309300.235,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-astro-free-render.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional\"],\"fullName\":\"story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional test_UAT_AC656_multi_viewport_keeps_slug_positional\",\"status\":\"passed\",\"title\":\"test_UAT_AC656_multi_viewport_keeps_slug_positional\",\"duration\":1.1565410000002885,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document\"],\"fullName\":\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_json_is_exactly_one_parseable_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC657_json_is_exactly_one_parseable_document\",\"duration\":3311.9478750000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document\"],\"fullName\":\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document\",\"duration\":2892.685707999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document\"],\"fullName\":\"story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document\",\"duration\":4501.9752499999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr\"],\"fullName\":\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output\",\"status\":\"passed\",\"title\":\"test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output\",\"duration\":5234.291957999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr\"],\"fullName\":\"story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr\",\"status\":\"passed\",\"title\":\"test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr\",\"duration\":0.5368750000016007,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 stdout is restored after success and after failure\"],\"fullName\":\"story-e15a19ef \u2014 stdout is restored after success and after failure test_UAT_AC659_stdout_restored_after_success_and_failure\",\"status\":\"passed\",\"title\":\"test_UAT_AC659_stdout_restored_after_success_and_failure\",\"duration\":1.9766249999993306,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387299544,\"endTime\":1793387315488.9766,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-cli-output-hygiene.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 1c crop is an offline verb\"],\"fullName\":\"story-e15a19ef \u2014 1c crop is an offline verb test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree\",\"duration\":10621.745665999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387299545,\"endTime\":1793387310166.7456,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-crop-offline-verb.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency\"],\"fullName\":\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gated_command_refuses_before_doing_any_work\",\"status\":\"passed\",\"title\":\"test_UAT_AC1013_gated_command_refuses_before_doing_any_work\",\"duration\":11.35004200000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency\"],\"fullName\":\"story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent\",\"status\":\"passed\",\"title\":\"test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent\",\"duration\":6182.5974160000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 an install that lags the committed lockfile is its own fault\"],\"fullName\":\"story-e15a19ef \u2014 an install that lags the committed lockfile is its own fault test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve\",\"status\":\"passed\",\"title\":\"test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve\",\"duration\":3.1058329999996204,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 both install faults arrive in a single refusal\"],\"fullName\":\"story-e15a19ef \u2014 both install faults arrive in a single refusal test_UAT_AC1015_both_faults_reported_in_one_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC1015_both_faults_reported_in_one_refusal\",\"duration\":1.7047079999993002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 the refusal travels the CLI failure contract\"],\"fullName\":\"story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope\",\"status\":\"passed\",\"title\":\"test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope\",\"duration\":2.1166250000005675,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 the refusal travels the CLI failure contract\"],\"fullName\":\"story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package\",\"status\":\"passed\",\"title\":\"test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package\",\"duration\":4495.543874999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 the gate is scoped to what each command loads\"],\"fullName\":\"story-e15a19ef \u2014 the gate is scoped to what each command loads test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads\",\"status\":\"passed\",\"title\":\"test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads\",\"duration\":5.198124999998981,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387299549,\"endTime\":1793387310251.1982,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-install-preflight.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server\"],\"fullName\":\"story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself\",\"duration\":3608.773458,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 Astro has left the repository\"],\"fullName\":\"story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"status\":\"passed\",\"title\":\"test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk\",\"duration\":75.64979200000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel\"],\"fullName\":\"story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document\",\"duration\":2957.019917,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793387297315,\"endTime\":1793387303957.02,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-1c-launcher-bootstrap.test.ts\"}]}",
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
          "status": "failed"
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
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs",
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