---
uid: report-ed586484
id: REPORT-12038
type: report
title: 'Report: batch_quality_check for story-58b2cec4'
created_by: xgd
created_at: '2026-11-09T22:22:18.415010+00:00'
updated_at: '2026-11-09T22:22:18.415010+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-58b2cec4
  parent_report_uid: report-45273bd1
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T22:18:44.599045Z",
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
      "duration_seconds": 2.7072303746826947,
      "passed": 10,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 10,
      "deselected": 4,
      "test_filter": [
        "test_UAT_AC2485_",
        "test_UAT_AC2486_",
        "test_UAT_AC2489_",
        "test_UAT_AC2490_",
        "test_UAT_AC2483_",
        "test_UAT_AC2484_",
        "test_UAT_AC2487_",
        "test_UAT_AC2488_",
        "test_UAT_AC2564_",
        "test_UAT_AC2566_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "efore_any_read\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-sees-a-stored-picture.test.ts\\x1b[2m > \\x1b[22moriginal is labelled, and each host says which pictures it holds\\x1b[2m > \\x1b[22mtest_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\\x1b[32m 68\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-sees-a-stored-picture.test.ts\\x1b[2m > \\x1b[22mcheck_fidelity needs a live page\\x1b[2m > \\x1b[22mtest_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-sees-a-stored-picture.test.ts\\x1b[2m > \\x1b[22mcompare accepts a stored picture on either side\\x1b[2m > \\x1b[22mtest_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-sees-a-stored-picture.test.ts\\x1b[2m > \\x1b[22m.gif and .avif site assets carry their image content types\\x1b[2m > \\x1b[22mtest_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-stored-picture-delivery.test.ts\\x1b[2m > \\x1b[22man ordinary camera photograph can be looked at\\x1b[2m > \\x1b[22mtest_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\\x1b[33m 330\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-stored-picture-delivery.test.ts\\x1b[2m > \\x1b[22ma browser failure on the stored-picture path comes back as a sentence\\x1b[2m > \\x1b[22mtest_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-stored-picture-delivery.test.ts\\x1b[2m > \\x1b[22man absurd picture costs no browser, and a stored media type cannot escape the src\\x1b[2m > \\x1b[22mtest_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\\x1b[32m 76\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m10 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m4 skipped\\x1b[39m\\x1b[90m (14)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 14:18:46\n\\x1b[2m   Duration \\x1b[22m 1.58s\\x1b[2m (transform 846ms, setup 0ms, import 1.38s, tests 631ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-pds9wtlh.json\n\n{\"numTotalTestSuites\":16,\"numPassedTestSuites\":16,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":14,\"numPassedTests\":10,\"numFailedTests\":0,\"numPendingTests\":4,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794262726109,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the picture schema the model is shown carries the sixth kind\"],\"fullName\":\"the picture schema the model is shown carries the sixth kind test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an image picture resolves to the stored picture it names\"],\"fullName\":\"an image picture resolves to the stored picture it names test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an image picture missing its name is refused naming the field\"],\"fullName\":\"an image picture missing its name is refused naming the field test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture is named however it is referenced\"],\"fullName\":\"a stored picture is named however it is referenced test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"status\":\"passed\",\"title\":\"test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded\",\"duration\":39.935249999999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name that means several pictures, or none, is refused\"],\"fullName\":\"a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"status\":\"passed\",\"title\":\"test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets\",\"duration\":3.3761670000000095,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a stored picture comes back as an image\"],\"fullName\":\"a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused\",\"duration\":88.29758399999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a drawing says how it was photographed, and a stored picture cannot be driven\"],\"fullName\":\"a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read\",\"duration\":3.8612920000000486,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"original is labelled, and each host says which pictures it holds\"],\"fullName\":\"original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment\",\"duration\":67.77808299999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"check_fidelity needs a live page\"],\"fullName\":\"check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"status\":\"passed\",\"title\":\"test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict\",\"duration\":7.085124999999948,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"compare accepts a stored picture on either side\"],\"fullName\":\"compare accepts a stored picture on either side test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\",\"status\":\"passed\",\"title\":\"test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical\",\"duration\":4.35329200000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\".gif and .avif site assets carry their image content types\"],\"fullName\":\".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"status\":\"passed\",\"title\":\"test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif\",\"duration\":8.110042000000021,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794262727301,\"endTime\":1794262727524.11,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-sees-a-stored-picture.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"an ordinary camera photograph can be looked at\"],\"fullName\":\"an ordinary camera photograph can be looked at test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\",\"status\":\"passed\",\"title\":\"test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries\",\"duration\":330.28541699999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a browser failure on the stored-picture path comes back as a sentence\"],\"fullName\":\"a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an absurd picture costs no browser, and a stored media type cannot escape the src\"],\"fullName\":\"an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\",\"status\":\"passed\",\"title\":\"test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal\",\"duration\":76.13829200000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794262727287,\"endTime\":1794262727694.1382,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-stored-picture-delivery.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "status": "passed"
        },
        {
          "name": "check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict",
          "file": "",
          "status": "passed"
        },
        {
          "name": "compare accepts a stored picture on either side test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical",
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
          "name": "an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal",
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