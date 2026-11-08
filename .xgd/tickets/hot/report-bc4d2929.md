---
uid: report-bc4d2929
id: REPORT-11275
type: report
title: 'Scoped quality: fail (20 tests, 2 failed, 1 orphan AC(s))'
created_by: xgd
created_at: '2026-11-08T04:46:07.022687+00:00'
updated_at: '2026-11-08T04:46:07.022687+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-58b2cec4
  commit: d3d415928ae9dfa4f20c43a4f085a9d573447db4
---

{
  "timestamp": "2026-11-08T04:42:52.402129Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015408266335725784,
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
      "duration_seconds": 4.6522116251289845,
      "passed": 18,
      "failed": 2,
      "skipped": 0,
      "errors": 0,
      "total": 20,
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
        "test_UAT_AC2373_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "d\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794112973597,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones\",\"status\":\"passed\",\"title\":\"test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones\",\"duration\":31.81533300000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so\",\"duration\":4.702624999999898,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the consultant is offered a separate, read-only looking surface\"],\"fullName\":\"the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant\",\"duration\":67.26412500000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape\",\"status\":\"passed\",\"title\":\"test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape\",\"duration\":1.347041999999874,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"status\":\"passed\",\"title\":\"test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults\",\"duration\":13.89108299999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"status\":\"passed\",\"title\":\"test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found\",\"duration\":2.6177499999998872,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"status\":\"passed\",\"title\":\"test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays\",\"duration\":8.029667000000018,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"every picture is named one way, and resolves to what it names\"],\"fullName\":\"every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site\",\"duration\":2.265083000000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn\",\"duration\":9.05487499999981,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so\",\"duration\":179.10908300000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead\",\"duration\":202.68595800000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a screenshot reaches the model as an image\"],\"fullName\":\"a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes\",\"duration\":8.72204099999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame\",\"duration\":7.342916999999943,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a picture keeps the untrusted-content frame on its way to the model\"],\"fullName\":\"a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"status\":\"passed\",\"title\":\"test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame\",\"duration\":0.9777090000000044,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no looking operation changes the site\"],\"fullName\":\"no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone\",\"duration\":8.590875000000096,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112975252,\"endTime\":1794112975800.5908,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the Worker binds the looking surface to the request business\"],\"fullName\":\"the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route\",\"duration\":116,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a session has a bounded number of live-page looks\"],\"fullName\":\"a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"status\":\"passed\",\"title\":\"test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working\",\"duration\":126,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker with a browser but no private bucket still edits\"],\"fullName\":\"a Worker with a browser but no private bucket still edits test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794112977132,\"endTime\":1794112977397,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface-business.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"failed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":8,\"failureMessages\":[\"AssertionError: expected 500 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts:164:27\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"failed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":3,\"failureMessages\":[\"AssertionError: expected 500 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts:232:27\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794112977133,\"endTime\":1794112977144,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"}]}",
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
          "status": "failed"
        },
        {
          "name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
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
      "passed": 16,
      "failed": 1,
      "total": 15,
      "failures": [
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
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}