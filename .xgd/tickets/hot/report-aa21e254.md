---
uid: report-aa21e254
id: REPORT-12042
type: report
title: 'Report: batch_quality_check for story-58b2cec4'
created_by: xgd
created_at: '2026-11-09T22:27:35.925594+00:00'
updated_at: '2026-11-09T22:27:35.925594+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-58b2cec4
  parent_report_uid: report-45273bd1
  batch_index: 1
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T22:23:50.609468Z",
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
      "duration_seconds": 5.333710124716163,
      "passed": 20,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 20,
      "deselected": 20,
      "test_filter": [
        "test_UAT_AC2565_",
        "test_UAT_AC2564_",
        "test_UAT_AC2566_",
        "test_UAT_AC2485_",
        "test_UAT_AC2486_",
        "test_UAT_AC2489_",
        "test_UAT_AC2487_",
        "test_UAT_AC2488_",
        "test_UAT_AC2027_",
        "test_UAT_AC2031_",
        "test_UAT_AC2032_",
        "test_UAT_AC2033_",
        "test_UAT_AC2034_",
        "test_UAT_AC2067_",
        "test_UAT_AC2478_",
        "test_UAT_AC2482_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"duration\":8.109042000000045,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"duration\":1.1085829999999532,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no looking operation changes the site\"],\"fullName\":\"no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the 1c CLI has no browser budget\"],\"fullName\":\"the 1c CLI has no browser budget test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794263033429,\"endTime\":1794263033971.1086,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-looking-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the picture schema the model is shown carries the sixth kind\"],\"fullName\":\"the picture schema the model is shown carries the sixth kind test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an image picture resolves to the stored picture it names\"],\"fullName\":\"an image picture resolves to the stored picture it names test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title\",\"status\":\"passed\",\"title\":\"test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title\",\"duration\":36.30012499999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an image picture missing its name is refused naming the field\"],\"fullName\":\"an image picture missing its name is refused naming the field test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture is named however it is referenced\"],\"fullName\":\"a stored picture is named however it is referenced test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name that means several pictures, or none, is refused\"],\"fullName\":\"a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture comes back as an image\"],\"fullName\":\"a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"duration\":105.1027079999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a drawing says how it was photographed, and a stored picture cannot be driven\"],\"fullName\":\"a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"duration\":7.502958999999919,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"original is labelled, and each host says which pictures it holds\"],\"fullName\":\"original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"duration\":57.62970900000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"check_fidelity needs a live page\"],\"fullName\":\"check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"status\":\"passed\",\"title\":\"test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"duration\":6.717291999999816,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"compare accepts a stored picture on either side\"],\"fullName\":\"compare accepts a stored picture on either side test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\".gif and .avif site assets carry their image content types\"],\"fullName\":\".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"status\":\"passed\",\"title\":\"test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"duration\":8.253124999999955,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794263033392,\"endTime\":1794263033614.2532,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-sees-a-stored-picture.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"an ordinary camera photograph can be looked at\"],\"fullName\":\"an ordinary camera photograph can be looked at test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\",\"status\":\"passed\",\"title\":\"test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\",\"duration\":395.2617500000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a browser failure on the stored-picture path comes back as a sentence\"],\"fullName\":\"a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\",\"status\":\"passed\",\"title\":\"test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\",\"duration\":242.480542,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an absurd picture costs no browser, and a stored media type cannot escape the src\"],\"fullName\":\"an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\",\"duration\":72.76320799999985,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794263033361,\"endTime\":1794263034070.7632,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-stored-picture-delivery.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"on the Worker a screenshot reaches the model as an image, through the Toolbox\"],\"fullName\":\"on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794263036257,\"endTime\":1794263036323,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_the_five_page_kinds_resolve_to_what_they_name_with_the_defaults",
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
          "name": "an image picture resolves to the stored picture it names test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title",
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
          "status": "passed"
        },
        {
          "name": "an ordinary camera photograph can be looked at test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits",
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