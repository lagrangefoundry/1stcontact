---
uid: report-f14669eb
id: REPORT-12053
type: report
title: 'Scoped quality: fail (35 tests, 4 failed, 2 orphan AC(s))'
created_by: xgd
created_at: '2026-11-09T23:00:58.267251+00:00'
updated_at: '2026-11-09T23:00:58.267251+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-179b8c06
  commit: 0c632881447f0228c208b5112186c0811981ebd8
---

{
  "timestamp": "2026-11-09T22:56:57.011204Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010695820674300194,
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
      "duration_seconds": 12.992621291894466,
      "passed": 31,
      "failed": 4,
      "skipped": 0,
      "errors": 0,
      "total": 35,
      "deselected": 8,
      "test_filter": [
        "test_UAT_AC1412_",
        "test_UAT_AC1413_",
        "test_UAT_AC1414_",
        "test_UAT_AC1623_",
        "test_UAT_AC1624_",
        "test_UAT_AC2329_",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_AC2476_",
        "test_UAT_AC2573_",
        "test_UAT_AC2574_",
        "test_UAT_AC2575_",
        "test_UAT_AC697_",
        "test_UAT_AC698_",
        "test_UAT_AC699_",
        "test_UAT_AC700_",
        "test_UAT_AC701_",
        "test_UAT_AC702_",
        "test_UAT_AC703_",
        "test_UAT_AC704_",
        "test_UAT_AC722_",
        "test_UAT_AC808_",
        "test_UAT_AC809_",
        "test_UAT_AC810_",
        "test_UAT_AC811_",
        "test_UAT_AC877_",
        "test_UAT_AC878_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "omically_under_behavior_names\",\"status\":\"passed\",\"title\":\"test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names\",\"duration\":6.8741659999996045,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265021959,\"endTime\":1794265022035.8743,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-behavior-modules.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome v2 address prompt\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome v2 address prompt test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully\",\"status\":\"passed\",\"title\":\"test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully\",\"duration\":52.41387499999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 behavior config and slots are closed at the write boundary\"],\"fullName\":\"story-179b8c06 \u2014 behavior config and slots are closed at the write boundary test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders\",\"status\":\"passed\",\"title\":\"test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders\",\"duration\":35.24274999999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 a refused write names every fault precisely\"],\"fullName\":\"story-179b8c06 \u2014 a refused write names every fault precisely test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error\",\"status\":\"passed\",\"title\":\"test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error\",\"duration\":12.875708000000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind\",\"status\":\"passed\",\"title\":\"test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind\",\"duration\":52.009457999999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome v2 on the behavior contract\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome v2 on the behavior contract test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint\",\"status\":\"passed\",\"title\":\"test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint\",\"duration\":31.220125000000053,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265021261,\"endTime\":1794265021445.2202,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-behavior-strict-contract.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit\"],\"fullName\":\"story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit\",\"status\":\"passed\",\"title\":\"test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit\",\"duration\":89.373875,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before\"],\"fullName\":\"story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial\",\"status\":\"passed\",\"title\":\"test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial\",\"duration\":30.004083000000037,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265021001,\"endTime\":1794265021121.0042,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-contact-form-enhancement-gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"duration\":7.868915999999899,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"duration\":2.4962500000001455,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"duration\":7.6750419999998485,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"duration\":1.1633749999996326,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounting_weakens_no_dimension\",\"duration\":37.26154100000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"duration\":7940.8854169999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265022346,\"endTime\":1794265030343.8855,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/req93-l1-slot-mounted-behaviors.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime\"],\"fullName\":\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed\",\"status\":\"passed\",\"title\":\"test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime\"],\"fullName\":\"story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts\",\"status\":\"passed\",\"title\":\"test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794265024711,\"endTime\":1794265024747,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-behavior-edge-runtime.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-179b8c06 \u2014 the composed client-behaviour asset (BUG-75) test_UAT_AC702_shipped_asset_loads_as_an_es_module_with_one_scoped_block_per_behavior_in_catalog_order",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the composed client-behaviour asset (BUG-75) test_UAT_AC2476_behaviors_sharing_a_top_level_name_each_run_against_their_own_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 control bindings are validated in both directions test_UAT_AC808_control_bindings_validated_in_both_directions",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior modules paint only their invariant elements test_UAT_AC809_modules_ship_no_css_beyond_declared_invariant_elements",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the generated stylesheet carries chrome, not source test_UAT_AC810_generated_stylesheet_carries_module_chrome_and_no_component_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the relocated default look is an L2 preset test_UAT_AC811_l2_preset_supplies_a_vetted_default_look",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the module escapes its own config, and refuses an unsafe endpoint test_UAT_AC1414_module_escapes_both_sinks_and_refuses_an_unsafe_endpoint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavioural config validation test_UAT_AC697_config_validated_against_typed_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 slot presentation validated as L1 subtrees test_UAT_AC698_slots_validated_as_l1_subtrees",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel L1 slide track test_UAT_AC699_carousel_renders_l1_slide_track_from_config",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel autoplay/loop client behaviour test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 contact-form functional render + L1 controls test_UAT_AC701_contact_form_renders_functional_form_with_l1_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior client behaviour ships once per page test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 isolation conformance dimension test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 full five-dimension conformance obligation set test_UAT_AC704_survivors_declare_the_full_obligation_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 Behavior* contract naming is atomic test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 address prompt test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior config and slots are closed at the write boundary test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a refused write names every fault precisely test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 on the behavior contract test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial",
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
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-179b8c06 \u2014 account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
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
      "passed": 26,
      "failed": 2,
      "total": 25,
      "failures": [
        {
          "test_name": "AC-2329 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2329 'A site that declares accounts carries account-chrome with every state in its published bytes; a site that does not carries none' (uid=acceptance_criterion-598ae471) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2329.",
          "ac_uid": "acceptance_criterion-598ae471",
          "ac_id": "AC-2329",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2332 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2332 'A behavior module may declare a link control, emitted as a real anchor carrying an allowlisted href' (uid=acceptance_criterion-489eafdc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2332.",
          "ac_uid": "acceptance_criterion-489eafdc",
          "ac_id": "AC-2332",
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
        "message": "4 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 4
        }
      }
    ]
  }
}