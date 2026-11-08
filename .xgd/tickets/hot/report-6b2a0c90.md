---
uid: report-6b2a0c90
id: REPORT-11611
type: report
title: 'Scoped quality: fail (42 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T23:14:09.847472+00:00'
updated_at: '2026-11-08T23:14:09.847472+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-58b2cec4
  commit: f28d69af2d0f31f8765bdd390318c0a884793bdf
---

{
  "timestamp": "2026-11-08T23:09:47.705378Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011199992150068283,
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
      "duration_seconds": 6.76295483391732,
      "passed": 41,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 42,
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
        "test_UAT_AC2482_",
        "test_UAT_AC2483_",
        "test_UAT_AC2484_",
        "test_UAT_AC2485_",
        "test_UAT_AC2486_",
        "test_UAT_AC2487_",
        "test_UAT_AC2488_",
        "test_UAT_AC2489_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ed test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"status\":\"passed\",\"title\":\"test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"duration\":7.263584000000037,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name that means several pictures, or none, is refused\"],\"fullName\":\"a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"status\":\"passed\",\"title\":\"test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"duration\":4.232291999999916,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture comes back as an image\"],\"fullName\":\"a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"duration\":83.9809160000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a drawing says how it was photographed, and a stored picture cannot be driven\"],\"fullName\":\"a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"duration\":5.940499999999929,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"original is labelled, and each host says which pictures it holds\"],\"fullName\":\"original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"status\":\"failed\",\"title\":\"test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"duration\":57.31708299999991,\"failureMessages\":[\"AssertionError: expected 'Error: screenshot failed. this deploy\u2026' to match /^Error: screenshot failed \\\\(ENVIRONME\u2026/\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:617:22\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\",\"AssertionError: expected 'Error: screenshot failed. no stored p\u2026' to match /no Library/i\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:636:29\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\",\"AssertionError: expected 'Error: screenshot failed. no stored p\u2026' to match /only the site's own assets/i\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:637:29\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\",\"AssertionError: expected 'Error: screenshot failed. no stored p\u2026' not to contain 'the name it appears under in the Libr\u2026'\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:638:33\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"check_fidelity needs a live page\"],\"fullName\":\"check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"status\":\"passed\",\"title\":\"test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"duration\":8.298958000000084,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\".gif and .avif site assets carry their image content types\"],\"fullName\":\".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"status\":\"passed\",\"title\":\"test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"duration\":13.87416600000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794179390430,\"endTime\":1794179390650.8743,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-sees-a-stored-picture.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"duration\":149,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it\",\"duration\":135,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session has a bounded number of live-page looks\"],\"fullName\":\"a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"status\":\"passed\",\"title\":\"test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"duration\":128,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker with a browser but no private bucket opens no chat at all\"],\"fullName\":\"a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker with a browser but no private bucket opens no chat at all\"],\"fullName\":\"a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794179392720,\"endTime\":1794179393232,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-looking-surface-business.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":59,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"on the Worker a screenshot reaches the model as an image, through the Toolbox\"],\"fullName\":\"on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794179392716,\"endTime\":1794179392839,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
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
          "status": "passed"
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
          "status": "passed"
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
          "name": "the picture schema the model is shown carries the sixth kind test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an image picture resolves to the stored picture it names test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an image picture missing its name is refused naming the field test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a stored picture is named however it is referenced test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment",
          "file": "",
          "status": "failed"
        },
        {
          "name": "check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict",
          "file": "",
          "status": "passed"
        },
        {
          "name": ".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif",
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
          "test_name": "original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment",
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