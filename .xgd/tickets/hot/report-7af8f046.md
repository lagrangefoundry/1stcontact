---
uid: report-7af8f046
id: REPORT-6923
type: report
title: 'Report: batch_quality_check for report-00553335'
created_by: xgd
created_at: '2026-10-30T21:05:15.324478+00:00'
updated_at: '2026-10-30T21:05:15.324478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-00553335
  parent_report_uid: report-32f5ff75
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-10-30T21:01:20.827748Z",
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
      "duration_seconds": 6.533936250023544,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2067_",
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
        "test_UAT_AC2035_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "9m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-looking-surface.test.ts\\x1b[2m > \\x1b[22ma picture keeps the untrusted-content frame on its way to the model\\x1b[2m > \\x1b[22mtest_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-looking-surface.test.ts\\x1b[2m > \\x1b[22ma picture keeps the untrusted-content frame on its way to the model\\x1b[2m > \\x1b[22mtest_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-assistant-looking-surface.test.ts\\x1b[2m > \\x1b[22mno looking operation changes the site\\x1b[2m > \\x1b[22mtest_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\\x1b[2m > \\x1b[22ma Worker-hosted consultant with a browser can see\\x1b[2m > \\x1b[22mtest_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\\x1b[32m 45\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\\x1b[2m > \\x1b[22ma Worker-hosted consultant with no browser still edits\\x1b[2m > \\x1b[22mtest_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\\x1b[32m 20\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 14:01:21\n\\x1b[2m   Duration \\x1b[22m 5.64s\\x1b[2m (transform 3.20s, setup 0ms, import 6.56s, tests 767ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-d3szalbp.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":9,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":17,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793394081933,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones\",\"status\":\"passed\",\"title\":\"test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones\",\"duration\":35.87687499999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so\",\"duration\":4.712624999999889,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant\",\"duration\":92.92066599999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape\",\"status\":\"passed\",\"title\":\"test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape\",\"duration\":1.6541669999999158,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"status\":\"passed\",\"title\":\"test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"duration\":28.39170899999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"status\":\"passed\",\"title\":\"test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"duration\":7.9034580000000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"status\":\"passed\",\"title\":\"test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"duration\":19.85962500000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"duration\":8.989667000000054,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"duration\":18.67645800000014,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"duration\":205.54787499999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"duration\":220.51149999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"duration\":12.200333000000228,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"duration\":10.510499999999865,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"duration\":1.3230409999996482,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no looking operation changes the site\"],\"fullName\":\"no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"duration\":9.459249999999884,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793394083500,\"endTime\":1793394084178.4592,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-assistant-looking-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":45,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793394087515,\"endTime\":1793394087580,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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