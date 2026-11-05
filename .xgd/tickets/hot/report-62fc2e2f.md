---
uid: report-62fc2e2f
id: REPORT-11063
type: report
title: 'Scoped quality: fail (28 tests, 2 failed)'
created_by: xgd
created_at: '2026-11-05T21:39:11.637139+00:00'
updated_at: '2026-11-05T21:39:11.637139+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-179b8c06
  commit: f18819ecddcff50ee573a9e3edde46b3fc3a695c
---

{
  "timestamp": "2026-11-05T21:33:47.796648Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017741601914167404,
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
      "duration_seconds": 13.345139833167195,
      "passed": 26,
      "failed": 2,
      "skipped": 0,
      "errors": 0,
      "total": 28,
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
      "stdout": "play/loop client behaviour test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour\",\"status\":\"passed\",\"title\":\"test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour\",\"duration\":2.8677499999998872,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 contact-form functional render + L1 controls\"],\"fullName\":\"story-179b8c06 \u2014 contact-form functional render + L1 controls test_UAT_AC701_contact_form_renders_functional_form_with_l1_controls\",\"status\":\"passed\",\"title\":\"test_UAT_AC701_contact_form_renders_functional_form_with_l1_controls\",\"duration\":0.9636669999999867,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 contact-form functional render + L1 controls\"],\"fullName\":\"story-179b8c06 \u2014 contact-form functional render + L1 controls test_UAT_FC_REQ-96_a_control_node_binds_only_to_a_declared_element\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-96_a_control_node_binds_only_to_a_declared_element\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 behavior client behaviour ships once per page\"],\"fullName\":\"story-179b8c06 \u2014 behavior client behaviour ships once per page test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset\",\"status\":\"passed\",\"title\":\"test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset\",\"duration\":48.83916700000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 isolation conformance dimension\"],\"fullName\":\"story-179b8c06 \u2014 isolation conformance dimension test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core\",\"status\":\"passed\",\"title\":\"test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core\",\"duration\":39.28283300000021,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 full five-dimension conformance obligation set\"],\"fullName\":\"story-179b8c06 \u2014 full five-dimension conformance obligation set test_UAT_AC704_survivors_declare_the_full_obligation_set\",\"status\":\"passed\",\"title\":\"test_UAT_AC704_survivors_declare_the_full_obligation_set\",\"duration\":0.1746669999997721,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 Behavior* contract naming is atomic\"],\"fullName\":\"story-179b8c06 \u2014 Behavior* contract naming is atomic test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names\",\"status\":\"passed\",\"title\":\"test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names\",\"duration\":5.430333000000246,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793914432170,\"endTime\":1793914432275.4304,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-behavior-modules.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit\"],\"fullName\":\"story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit\",\"status\":\"passed\",\"title\":\"test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit\",\"duration\":91.45591699999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before\"],\"fullName\":\"story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial\",\"status\":\"passed\",\"title\":\"test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial\",\"duration\":37.19837500000017,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793914430863,\"endTime\":1793914430992.1985,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-contact-form-enhancement-gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page\",\"duration\":9.372415999999703,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path\",\"duration\":3.158292000000074,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_real_capture_strands_no_form_control\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_config_is_derived_never_invented\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations\",\"duration\":9.49487500000032,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width\",\"duration\":1.653124999999818,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension\",\"status\":\"passed\",\"title\":\"test_UAT_AC1624_mounting_weakens_no_dimension\",\"duration\":49.64466700000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots\"],\"fullName\":\"REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"status\":\"failed\",\"title\":\"test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension\",\"duration\":8760.328667,\"failureMessages\":[\"Error: promise rejected \\\"ConformanceError: Module conformance fail\u2026 { violations: [ \u2026(4) ] }\\\" instead of resolving\\n    at _Assertion.__VITEST_RESOLVES__ (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1710:17)\\n    at _Assertion.propertyGetter (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)\\n    at Reflect.get (<anonymous>)\\n    at Object.proxyGetter [as get] (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/req93-l1-slot-mounted-behaviors.test.ts:760:8\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793914432662,\"endTime\":1793914441495.3286,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/req93-l1-slot-mounted-behaviors.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "failed"
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
          "status": "failed"
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
          "test_name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension",
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
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}