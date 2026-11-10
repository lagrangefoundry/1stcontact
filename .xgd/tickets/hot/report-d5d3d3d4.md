---
uid: report-d5d3d3d4
id: REPORT-12076
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-10T00:13:21.722450+00:00'
updated_at: '2026-11-10T00:13:21.722450+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-ed976856
  commit: f20eb214006d453b32dfbe0f6cd3d89aee23076b
---

{
  "timestamp": "2026-11-10T00:08:30.001513Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012745801359415054,
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
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 6.760621333029121,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2540_",
        "test_UAT_AC2541_",
        "test_UAT_AC2542_",
        "test_UAT_AC2543_",
        "test_UAT_AC2544_",
        "test_UAT_AC2545_",
        "test_UAT_AC2546_",
        "test_UAT_AC2547_",
        "test_UAT_AC2548_",
        "test_UAT_AC2549_",
        "test_UAT_AC2550_",
        "test_UAT_AC2551_",
        "test_UAT_AC2552_",
        "test_UAT_AC2590_",
        "test_UAT_AC2591_",
        "test_UAT_AC2592_",
        "test_UAT_AC2593_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "9m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-image-editing-recipe.workers.test.ts\\x1b[2m > \\x1b[22mstory-ed976856 \u2014 the stored bytes are served whenever rendering cannot happen\\x1b[2m > \\x1b[22mtest_UAT_AC2550_no_usable_renderer_or_a_failed_render_serves_the_stored_bytes_with_200\\x1b[32m 31\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-image-editing-recipe.workers.test.ts\\x1b[2m > \\x1b[22mstory-ed976856 \u2014 renditions are content-addressed, per tenant, out of the material keyspace\\x1b[2m > \\x1b[22mtest_UAT_AC2551_a_repeat_request_is_not_re_rendered_and_renditions_live_under_their_own_tenant_prefix\\x1b[32m 66\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-image-editing-recipe.workers.test.ts\\x1b[2m > \\x1b[22mstory-ed976856 \u2014 the assistant sees a stored picture as it stands\\x1b[2m > \\x1b[22mtest_UAT_AC2552_the_default_look_is_the_edited_picture_original_true_is_the_stored_bytes_and_no_renderer_means_stored_bytes\\x1b[32m 67\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 16:08:31\n\\x1b[2m   Duration \\x1b[22m 5.65s\\x1b[2m (transform 2.37s, setup 0ms, import 5.67s, tests 1.58s, environment 1ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-yb_y6hca.json\n\n{\"numTotalTestSuites\":16,\"numPassedTestSuites\":16,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":17,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794269311488,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-ed976856 \u2014 edit_image stores a recipe and keeps the original\"],\"fullName\":\"story-ed976856 \u2014 edit_image stores a recipe and keeps the original test_UAT_AC2540_edit_image_stores_the_recipe_reports_image_edits_original_size_and_leaves_the_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2540_edit_image_stores_the_recipe_reports_image_edits_original_size_and_leaves_the_bytes\",\"duration\":106,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 list_image_edits answers in the edit_image shape\"],\"fullName\":\"story-ed976856 \u2014 list_image_edits answers in the edit_image shape test_UAT_AC2541_an_unedited_picture_lists_no_edits_and_its_size_is_its_original\",\"status\":\"passed\",\"title\":\"test_UAT_AC2541_an_unedited_picture_lists_no_edits_and_its_size_is_its_original\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 a call replaces the recipe whole\"],\"fullName\":\"story-ed976856 \u2014 a call replaces the recipe whole test_UAT_AC2542_omitted_operations_are_removed_an_empty_list_restores_and_no_list_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2542_omitted_operations_are_removed_an_empty_list_restores_and_no_list_is_refused\",\"duration\":113,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 operations apply in the order written\"],\"fullName\":\"story-ed976856 \u2014 operations apply in the order written test_UAT_AC2543_each_operation_is_one_renderer_step_in_order_measured_against_what_came_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2543_each_operation_is_one_renderer_step_in_order_measured_against_what_came_before\",\"duration\":88,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 a malformed recipe is refused with its reason\"],\"fullName\":\"story-ed976856 \u2014 a malformed recipe is refused with its reason test_UAT_AC2544_each_malformed_recipe_is_refused_naming_the_mistake_and_the_recipe_is_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2544_each_malformed_recipe_is_refused_naming_the_mistake_and_the_recipe_is_unchanged\",\"duration\":146,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 a recipe impossible for these pixels is refused before any write\"],\"fullName\":\"story-ed976856 \u2014 a recipe impossible for these pixels is refused before any write test_UAT_AC2545_an_enlarging_resize_and_a_sub_pixel_crop_are_refused_and_nothing_is_written\",\"status\":\"passed\",\"title\":\"test_UAT_AC2545_an_enlarging_resize_and_a_sub_pixel_crop_are_refused_and_nothing_is_written\",\"duration\":107,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 pictures are named in the one picture vocabulary\"],\"fullName\":\"story-ed976856 \u2014 pictures are named in the one picture vocabulary test_UAT_AC2546_unknown_ambiguous_site_asset_and_non_raster_pictures_are_refused_with_distinct_codes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2546_unknown_ambiguous_site_asset_and_non_raster_pictures_are_refused_with_distinct_codes\",\"duration\":75,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 the image surface is offered only where pictures can be rendered\"],\"fullName\":\"story-ed976856 \u2014 the image surface is offered only where pictures can be rendered test_UAT_AC2547_a_rendering_deployment_offers_both_groups_and_says_sizes_are_automatic_and_descriptions_describe_the_original\",\"status\":\"passed\",\"title\":\"test_UAT_AC2547_a_rendering_deployment_offers_both_groups_and_says_sizes_are_automatic_and_descriptions_describe_the_original\",\"duration\":67,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 the material file route serves the picture as it stands\"],\"fullName\":\"story-ed976856 \u2014 the material file route serves the picture as it stands test_UAT_AC2548_edited_by_default_in_its_stored_format_original_on_request_and_unedited_untransformed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2548_edited_by_default_in_its_stored_format_original_on_request_and_unedited_untransformed\",\"duration\":72,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 width= is a delivery size and never an edit\"],\"fullName\":\"story-ed976856 \u2014 width= is a delivery size and never an edit test_UAT_AC2549_width_scales_down_without_touching_the_recipe_never_enlarges_and_never_renders_a_capture_member\",\"status\":\"passed\",\"title\":\"test_UAT_AC2549_width_scales_down_without_touching_the_recipe_never_enlarges_and_never_renders_a_capture_member\",\"duration\":118,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 the stored bytes are served whenever rendering cannot happen\"],\"fullName\":\"story-ed976856 \u2014 the stored bytes are served whenever rendering cannot happen test_UAT_AC2550_no_usable_renderer_or_a_failed_render_serves_the_stored_bytes_with_200\",\"status\":\"passed\",\"title\":\"test_UAT_AC2550_no_usable_renderer_or_a_failed_render_serves_the_stored_bytes_with_200\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 renditions are content-addressed, per tenant, out of the material keyspace\"],\"fullName\":\"story-ed976856 \u2014 renditions are content-addressed, per tenant, out of the material keyspace test_UAT_AC2551_a_repeat_request_is_not_re_rendered_and_renditions_live_under_their_own_tenant_prefix\",\"status\":\"passed\",\"title\":\"test_UAT_AC2551_a_repeat_request_is_not_re_rendered_and_renditions_live_under_their_own_tenant_prefix\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856 \u2014 the assistant sees a stored picture as it stands\"],\"fullName\":\"story-ed976856 \u2014 the assistant sees a stored picture as it stands test_UAT_AC2552_the_default_look_is_the_edited_picture_original_true_is_the_stored_bytes_and_no_renderer_means_stored_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2552_the_default_look_is_the_edited_picture_original_true_is_the_stored_bytes_and_no_renderer_means_stored_bytes\",\"duration\":67,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269316021,\"endTime\":1794269317148,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-image-editing-recipe.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-ed976856: the recipe reaches the site (REQ-229)\"],\"fullName\":\"story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2590_promotion_places_the_current_render_and_records_the_name_actually_written\",\"status\":\"passed\",\"title\":\"test_UAT_AC2590_promotion_places_the_current_render_and_records_the_name_actually_written\",\"duration\":168,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856: the recipe reaches the site (REQ-229)\"],\"fullName\":\"story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2591_a_recipe_change_replaces_the_placed_bytes_at_the_recorded_name_and_reports_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2591_a_recipe_change_replaces_the_placed_bytes_at_the_recorded_name_and_reports_it\",\"duration\":117,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856: the recipe reaches the site (REQ-229)\"],\"fullName\":\"story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2592_promoting_a_recorded_picture_again_overwrites_at_its_name_and_mints_no_duplicate\",\"status\":\"passed\",\"title\":\"test_UAT_AC2592_promoting_a_recorded_picture_again_overwrites_at_its_name_and_mints_no_duplicate\",\"duration\":43,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-ed976856: the recipe reaches the site (REQ-229)\"],\"fullName\":\"story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2593_a_recorded_name_gone_from_the_site_is_reported_and_never_re_added\",\"status\":\"passed\",\"title\":\"test_UAT_AC2593_a_recorded_name_gone_from_the_site_is_reported_and_never_re_added\",\"duration\":80,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269316021,\"endTime\":1794269316429,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-image-recipe-reaches-the-site.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-ed976856 \u2014 edit_image stores a recipe and keeps the original test_UAT_AC2540_edit_image_stores_the_recipe_reports_image_edits_original_size_and_leaves_the_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 list_image_edits answers in the edit_image shape test_UAT_AC2541_an_unedited_picture_lists_no_edits_and_its_size_is_its_original",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 a call replaces the recipe whole test_UAT_AC2542_omitted_operations_are_removed_an_empty_list_restores_and_no_list_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 operations apply in the order written test_UAT_AC2543_each_operation_is_one_renderer_step_in_order_measured_against_what_came_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 a malformed recipe is refused with its reason test_UAT_AC2544_each_malformed_recipe_is_refused_naming_the_mistake_and_the_recipe_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 a recipe impossible for these pixels is refused before any write test_UAT_AC2545_an_enlarging_resize_and_a_sub_pixel_crop_are_refused_and_nothing_is_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 pictures are named in the one picture vocabulary test_UAT_AC2546_unknown_ambiguous_site_asset_and_non_raster_pictures_are_refused_with_distinct_codes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the image surface is offered only where pictures can be rendered test_UAT_AC2547_a_rendering_deployment_offers_both_groups_and_says_sizes_are_automatic_and_descriptions_describe_the_original",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the material file route serves the picture as it stands test_UAT_AC2548_edited_by_default_in_its_stored_format_original_on_request_and_unedited_untransformed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 width= is a delivery size and never an edit test_UAT_AC2549_width_scales_down_without_touching_the_recipe_never_enlarges_and_never_renders_a_capture_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the stored bytes are served whenever rendering cannot happen test_UAT_AC2550_no_usable_renderer_or_a_failed_render_serves_the_stored_bytes_with_200",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 renditions are content-addressed, per tenant, out of the material keyspace test_UAT_AC2551_a_repeat_request_is_not_re_rendered_and_renditions_live_under_their_own_tenant_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the assistant sees a stored picture as it stands test_UAT_AC2552_the_default_look_is_the_edited_picture_original_true_is_the_stored_bytes_and_no_renderer_means_stored_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2590_promotion_places_the_current_render_and_records_the_name_actually_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2591_a_recipe_change_replaces_the_placed_bytes_at_the_recorded_name_and_reports_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2592_promoting_a_recorded_picture_again_overwrites_at_its_name_and_mints_no_duplicate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2593_a_recorded_name_gone_from_the_site_is_reported_and_never_re_added",
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
  }
}