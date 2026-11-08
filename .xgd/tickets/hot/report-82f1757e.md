---
uid: report-82f1757e
id: REPORT-11280
type: report
title: 'Report: batch_quality_check for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T05:04:18.523883+00:00'
updated_at: '2026-11-08T05:04:18.523883+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-58b2cec4
  parent_report_uid: report-ed5966c2
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T05:01:06.459677Z",
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
      "duration_seconds": 4.63865187484771,
      "passed": 6,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 6,
      "deselected": 14,
      "test_filter": [
        "test_UAT_AC2025_",
        "test_UAT_AC2024_",
        "test_UAT_AC2372_",
        "test_UAT_AC2373_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "tant-looking-surface-business.workers.test.ts\\x1b[2m > \\x1b[22ma session has a bounded number of live-page looks\\x1b[2m > \\x1b[22mtest_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\\x1b[32m 175\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-assistant-looking-surface-business.workers.test.ts\\x1b[2m > \\x1b[22ma Worker with a browser but no private bucket still edits\\x1b[2m > \\x1b[22mtest_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes\\x1b[32m 27\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m6 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m14 skipped\\x1b[39m\\x1b[90m (20)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 21:01:07\n\\x1b[2m   Duration \\x1b[22m 3.71s\\x1b[2m (transform 2.82s, setup 0ms, import 6.34s, tests 604ms, environment 1ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-9xoqza90.json\n\n{\"numTotalTestSuites\":13,\"numPassedTestSuites\":13,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":20,\"numPassedTests\":6,\"numFailedTests\":0,\"numPendingTests\":14,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794114067757,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant\",\"duration\":124.23195899999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no looking operation changes the site\"],\"fullName\":\"no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114069385,\"endTime\":1794114069509.232,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"duration\":141,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session has a bounded number of live-page looks\"],\"fullName\":\"a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"status\":\"passed\",\"title\":\"test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"duration\":175,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker with a browser but no private bucket still edits\"],\"fullName\":\"a Worker with a browser but no private bucket still edits test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114071132,\"endTime\":1794114071475,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface-business.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":53,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114071152,\"endTime\":1794114071232,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket still edits test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
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