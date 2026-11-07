---
uid: report-91cf0afb
id: REPORT-11096
type: report
title: 'Report: batch_quality_check for story-179b8c06'
created_by: xgd
created_at: '2026-11-07T06:49:52.038836+00:00'
updated_at: '2026-11-07T06:49:52.038836+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-179b8c06
  parent_report_uid: report-fb76a9e0
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-07T06:46:05.790255Z",
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
      "duration_seconds": 11.010542958043516,
      "passed": 35,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 35,
      "deselected": 16,
      "test_filter": [
        "test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
        "test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_AC1622_",
        "test_UAT_AC1623_",
        "test_UAT_AC1624_",
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
      "stdout": "ta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"duration\":0.2763749999999163,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"passed\",\"title\":\"test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"duration\":1.9657079999999496,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"duration\":9.417042000000038,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"duration\":2.563416999999845,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"duration\":4.585708000000068,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"duration\":0.40762500000005275,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounting_weakens_no_dimension\",\"duration\":33.345083999999815,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"duration\":7717.569750000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794033968757,\"endTime\":1794033976542.5698,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/req93-l1-slot-mounted-behaviors.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources\",\"duration\":54.570042,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_render_reaches_no_astro_and_no_filesystem\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_render_reaches_no_astro_and_no_filesystem\",\"duration\":0.5758749999999964,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_production_vars_do_not_carry_the_dev_access_bypass\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_production_vars_do_not_carry_the_dev_access_bypass\",\"duration\":0.1667089999999689,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_dev_access_bypass_is_reachable_from_wrangler_dev\",\"duration\":0.532291999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_every_var_and_binding_is_repeated_under_production\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_every_var_and_binding_is_repeated_under_production\",\"duration\":0.1690409999999929,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_worker_runs_before_the_assets_binding\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_worker_runs_before_the_assets_binding\",\"duration\":0.13545799999997143,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_migrations_dir_sits_on_the_database_not_the_top_level\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_migrations_dir_sits_on_the_database_not_the_top_level\",\"duration\":0.1263330000000451,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 build artifacts and the config that must match them\"],\"fullName\":\"REQ-145 \u2014 build artifacts and the config that must match them test_UAT_FC_REQ-145_the_proxy_and_its_origin_var_are_gone\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_proxy_and_its_origin_var_are_gone\",\"duration\":0.16258299999992687,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794033967723,\"endTime\":1794033967779.1626,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_UAT_FC_REQ-145_build_artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_a_pure_l1_site_renders_its_draft_and_edit_channels\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_a_pure_l1_site_renders_its_draft_and_edit_channels\",\"duration\":33,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_an_unconfigured_access_gate_still_refuses_without_the_dev_var\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_an_unconfigured_access_gate_still_refuses_without_the_dev_var\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-145 \u2014 the builder runs in workerd\"],\"fullName\":\"REQ-145 \u2014 the builder runs in workerd test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794033976134,\"endTime\":1794033976192,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "passed"
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
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension",
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