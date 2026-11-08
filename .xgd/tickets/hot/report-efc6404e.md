---
uid: report-efc6404e
id: REPORT-11589
type: report
title: 'Scoped quality: fail (32 tests, 2 failed, 1 orphan AC(s))'
created_by: xgd
created_at: '2026-11-08T21:53:23.055597+00:00'
updated_at: '2026-11-08T21:53:23.055597+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-58b2cec4
  commit: a70e0941cff7a9fdd96a1e77a5d71d3e6d8d27d3
---

{
  "timestamp": "2026-11-08T21:49:21.064351Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012758327648043633,
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
      "duration_seconds": 7.089216541033238,
      "passed": 30,
      "failed": 2,
      "skipped": 0,
      "errors": 0,
      "total": 32,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2022_",
        "test_UAT_AC2023_",
        "test_UAT_AC2024_",
        "test_UAT_AC2025_",
        "test_UAT_AC2026_",
        "test_UAT_AC2027_",
        "test_UAT_AC2028_",
        "test_UAT_AC2029_",
        "test_UAT_AC2030_",
        "test_UAT_AC2031_",
        "test_UAT_AC2032_",
        "test_UAT_AC2033_",
        "test_UAT_AC2034_",
        "test_UAT_AC2035_",
        "test_UAT_AC2067_",
        "test_UAT_AC2372_",
        "test_UAT_AC2373_",
        "test_UAT_AC2477_",
        "test_UAT_AC2478_",
        "test_UAT_AC2479_",
        "test_UAT_AC2480_",
        "test_UAT_AC2481_",
        "test_UAT_AC2482_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ode_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"status\":\"passed\",\"title\":\"test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"duration\":13.530250000000024,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"status\":\"passed\",\"title\":\"test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"duration\":2.389208999999937,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"status\":\"passed\",\"title\":\"test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"duration\":4.718707999999879,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"duration\":2.0961670000001504,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"duration\":9.88083400000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2031_no_text_carries_the_base64_the_toolbox_audits_and_validates_and_other_results_stay_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_no_text_carries_the_base64_the_toolbox_audits_and_validates_and_other_results_stay_text\",\"duration\":11.6840830000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"duration\":143.5010420000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"duration\":192.83999999999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"duration\":8.779915999999957,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"duration\":9.319541000000072,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"duration\":0.9621250000000146,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no looking operation changes the site\"],\"fullName\":\"no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"duration\":9.01870800000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the 1c CLI has no browser budget\"],\"fullName\":\"the 1c CLI has no browser budget test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks\",\"status\":\"passed\",\"title\":\"test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks\",\"duration\":54.34766599999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794174563961,\"endTime\":1794174564579.3477,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-looking-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"duration\":165,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it\",\"duration\":159,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up\",\"duration\":68,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session has a bounded number of live-page looks\"],\"fullName\":\"a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"status\":\"passed\",\"title\":\"test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"duration\":132,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker with a browser but no private bucket opens no chat at all\"],\"fullName\":\"a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker with a browser but no private bucket opens no chat at all\"],\"fullName\":\"a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794174566520,\"endTime\":1794174567079,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-looking-surface-business.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"on the Worker a screenshot reaches the model as an image, through the Toolbox\"],\"fullName\":\"on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":30,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794174566520,\"endTime\":1794174566656,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased",
          "file": "",
          "status": "passed"
        },
        {
          "name": "steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape",
          "file": "",
          "status": "failed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2031_no_text_carries_the_base64_the_toolbox_audits_and_validates_and_other_results_stay_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the 1c CLI has no browser budget test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape",
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
      "passed": 21,
      "failed": 1,
      "total": 17,
      "failures": [
        {
          "test_name": "AC-2026 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2026 'Every picture is named with one declared shape whose schema the model is shown' (uid=acceptance_criterion-19a996bc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2026.",
          "ac_uid": "acceptance_criterion-19a996bc",
          "ac_id": "AC-2026",
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
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}