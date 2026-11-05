---
uid: report-093af665
id: REPORT-11077
type: report
title: 'Report: batch_quality_check for story-179b8c06'
created_by: xgd
created_at: '2026-11-05T22:16:00.332006+00:00'
updated_at: '2026-11-05T22:16:00.332006+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: story-179b8c06
  parent_report_uid: report-84738adf
  batch_index: 1
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-05T22:11:58.278879Z",
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
      "duration_seconds": 14.989440999925137,
      "passed": 27,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 28,
      "deselected": 19,
      "test_filter": [
        "test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension",
        "test_UAT_AC1622_",
        "test_UAT_AC1623_",
        "test_UAT_AC1400_",
        "test_UAT_FC_REQ-145_",
        "test_UAT_FC_REQ-93_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "s_committed_and_the_documented_push_echoes_only_the_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793916719509,\"endTime\":1793916719509,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-platform-build-deploy-smoke.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the workspace serves what the build wrote\"],\"fullName\":\"story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"status\":\"failed\",\"title\":\"test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"duration\":387.89979200000016,\"failureMessages\":[\"AssertionError: expected 404 to be 302 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-workspace-build-artifacts.test.ts:253:30\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793916733102,\"endTime\":1793916733489.9,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-workspace-build-artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"duration\":8.753041999999823,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"duration\":3.3271249999997963,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"duration\":5.957000000000335,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"duration\":1.640374999999949,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"duration\":0.9935829999999441,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"duration\":0.9343749999998181,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"duration\":2.1608750000000327,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"duration\":12.644874999999956,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"duration\":3.959292000000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1624_mounting_weakens_no_dimension\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"duration\":8213.626458,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793916722130,\"endTime\":1793916730384.6265,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/req93-l1-slot-mounted-behaviors.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources\",\"duration\":1.7757500000000164,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_render_reaches_no_astro_and_no_filesystem\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_render_reaches_no_astro_and_no_filesystem\",\"duration\":0.46529099999997925,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_production_vars_do_not_carry_the_dev_access_bypass\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_production_vars_do_not_carry_the_dev_access_bypass\",\"duration\":0.12183300000003783,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev\",\"duration\":0.864832999999976,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_every_var_and_binding_is_repeated_under_production\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_every_var_and_binding_is_repeated_under_production\",\"duration\":0.42058399999996254,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_worker_runs_before_the_assets_binding\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_worker_runs_before_the_assets_binding\",\"duration\":0.34770800000001145,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_migrations_dir_sits_on_the_database_not_the_top_level\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_migrations_dir_sits_on_the_database_not_the_top_level\",\"duration\":0.2980840000000171,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_proxy_and_its_origin_var_are_gone\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_proxy_and_its_origin_var_are_gone\",\"duration\":0.3569169999999531,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793916720570,\"endTime\":1793916720574.357,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_UAT_FC_REQ-145_build_artifacts.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "failed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension",
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
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
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