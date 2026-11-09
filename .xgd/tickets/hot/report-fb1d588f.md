---
uid: report-fb1d588f
id: REPORT-12033
type: report
title: 'Scoped quality: fail (36 tests, 4 failed, 5 orphan AC(s))'
created_by: xgd
created_at: '2026-11-09T22:01:32.841729+00:00'
updated_at: '2026-11-09T22:01:32.841729+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-58b2cec4
  commit: 47f22f5ed17de255bbcddd4a2d806d76856572bf
---

{
  "timestamp": "2026-11-09T21:59:21.377457Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013504084199666977,
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
      "duration_seconds": 7.226348000112921,
      "passed": 32,
      "failed": 4,
      "skipped": 0,
      "errors": 0,
      "total": 36,
      "deselected": 1,
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
        "test_UAT_AC2489_",
        "test_UAT_AC2564_",
        "test_UAT_AC2565_",
        "test_UAT_AC2566_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "_store_and_title\",\"duration\":14.45558300000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an image picture missing its name is refused naming the field\"],\"fullName\":\"an image picture missing its name is refused naming the field test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser\",\"status\":\"passed\",\"title\":\"test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser\",\"duration\":2.318958000000066,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture is named however it is referenced\"],\"fullName\":\"a stored picture is named however it is referenced test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"status\":\"passed\",\"title\":\"test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"duration\":11.578834000000143,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name that means several pictures, or none, is refused\"],\"fullName\":\"a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"status\":\"passed\",\"title\":\"test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"duration\":3.0195840000001226,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture comes back as an image\"],\"fullName\":\"a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"status\":\"failed\",\"title\":\"test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"duration\":12.804583999999977,\"failureMessages\":[\"AssertionError: expected '<!doctype html><meta charset=\\\"utf-8\\\">\u2026' to contain 'src=\\\"data:image/jpeg;base64,/9j/4AMAA\u2026'\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:521:17\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a drawing says how it was photographed, and a stored picture cannot be driven\"],\"fullName\":\"a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"status\":\"failed\",\"title\":\"test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"duration\":19.257458000000042,\"failureMessages\":[\"AssertionError: expected '<!doctype html><meta charset=\\\"utf-8\\\">\u2026' to contain 'src=\\\"data:image/svg+xml;base64,'\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:564:47\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"original is labelled, and each host says which pictures it holds\"],\"fullName\":\"original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"duration\":67.54441599999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"check_fidelity needs a live page\"],\"fullName\":\"check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"status\":\"passed\",\"title\":\"test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"duration\":9.944999999999936,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"compare accepts a stored picture on either side\"],\"fullName\":\"compare accepts a stored picture on either side test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\".gif and .avif site assets carry their image content types\"],\"fullName\":\".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"status\":\"failed\",\"title\":\"test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"duration\":9.642415999999912,\"failureMessages\":[\"AssertionError: expected '<!doctype html><meta charset=\\\"utf-8\\\">\u2026' to contain 'src=\\\"data:image/gif;base64,'\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-sees-a-stored-picture.test.ts:773:47\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794261564413,\"endTime\":1794261564597.6423,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-sees-a-stored-picture.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"an ordinary camera photograph can be looked at\"],\"fullName\":\"an ordinary camera photograph can be looked at test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\",\"status\":\"passed\",\"title\":\"test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\",\"duration\":407.66391699999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a browser failure on the stored-picture path comes back as a sentence\"],\"fullName\":\"a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\",\"status\":\"failed\",\"title\":\"test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\",\"duration\":265.3037499999998,\"failureMessages\":[\"AssertionError: screenshot: expected Error: Protocol error (Page.captureScreen\u2026 to be an instance of ImageNotRenderableError\\n    at Proxy.<anonymous> (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1386:15)\\n    at Proxy.<anonymous> (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1156:15)\\n    at Proxy.methodWrapper (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-stored-picture-delivery.test.ts:340:28\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an absurd picture costs no browser, and a stored media type cannot escape the src\"],\"fullName\":\"an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\",\"duration\":92.12400000000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794261564365,\"endTime\":1794261565130.124,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-stored-picture-delivery.test.ts\"},{\"assertionResults\":[],\"startTime\":1794261563033,\"endTime\":1794261563033,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-ticketing.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-looking-surface-business.workers.test.ts\"},{\"assertionResults\":[],\"startTime\":1794261563033,\"endTime\":1794261563033,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-ticketing.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
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
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_the_five_page_kinds_resolve_to_what_they_name_with_the_defaults",
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
          "status": "failed"
        },
        {
          "name": "a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read",
          "file": "",
          "status": "failed"
        },
        {
          "name": "original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict",
          "file": "",
          "status": "passed"
        },
        {
          "name": ".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif",
          "file": "",
          "status": "failed"
        },
        {
          "name": "an ordinary camera photograph can be looked at test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released",
          "file": "",
          "status": "failed"
        },
        {
          "name": "an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": ".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released",
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
      "passed": 27,
      "failed": 5,
      "total": 30,
      "failures": [
        {
          "test_name": "AC-2485 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2485 'A stored picture comes back as an image: PNG untouched, other formats rasterised to PNG by the browser with bytes inlined, then reduced like a page shot; undecodable refused' (uid=acceptance_criterion-b6e7c9b7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2485.",
          "ac_uid": "acceptance_criterion-b6e7c9b7",
          "ac_id": "AC-2485",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2486 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2486 'An SVG drawing carries a default-face caption pointing to measure_drawing; after on an image picture is refused' (uid=acceptance_criterion-ef95eeef) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2486.",
          "ac_uid": "acceptance_criterion-ef95eeef",
          "ac_id": "AC-2486",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2489 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2489 '.gif and .avif site assets resolve to image/gif and image/avif content types' (uid=acceptance_criterion-23963e43) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2489.",
          "ac_uid": "acceptance_criterion-23963e43",
          "ac_id": "AC-2489",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2372 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2372 'On the Worker the looking surface is bound to the request's business: captures are stored in and adopted from that business's private bucket, and draft pictures come from the preview renderer at the deployment's own origin, with no new HTTP route' (uid=acceptance_criterion-eba77f29) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2372.",
          "ac_uid": "acceptance_criterion-eba77f29",
          "ac_id": "AC-2372",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2025 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2025 'A Worker-hosted consultant with a browser binding is offered the looking surface' (uid=acceptance_criterion-7cb814b7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2025.",
          "ac_uid": "acceptance_criterion-7cb814b7",
          "ac_id": "AC-2025",
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