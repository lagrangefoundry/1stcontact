---
uid: report-9fd26e9c
id: REPORT-11332
type: report
title: 'Scoped quality: pass (14 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T07:13:41.910768+00:00'
updated_at: '2026-11-08T07:13:41.910768+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-39c992d3
  commit: 71f949236904ead38307145e9650ee81b3cac6c7
---

{
  "timestamp": "2026-11-08T07:10:22.278111Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014133332297205925,
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
      "duration_seconds": 4.565482458099723,
      "passed": 14,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 14,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2379_",
        "test_UAT_AC2380_",
        "test_UAT_AC2381_",
        "test_UAT_AC2382_",
        "test_UAT_AC2383_",
        "test_UAT_AC2384_",
        "test_UAT_AC2385_",
        "test_UAT_AC2386_",
        "test_UAT_AC2387_",
        "test_UAT_AC2388_",
        "test_UAT_AC2389_",
        "test_UAT_AC2390_",
        "test_UAT_AC2391_",
        "test_UAT_AC2392_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "vocabulary\\x1b[32m 20\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\\x1b[32m 21\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\\x1b[32m 31\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\\x1b[32m 48\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\\x1b[32m 21\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\\x1b[32m 29\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\\x1b[32m 16\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m14 passed\\x1b[39m\\x1b[22m\\x1b[90m (14)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 23:10:23\n\\x1b[2m   Duration \\x1b[22m 3.75s\\x1b[2m (transform 1.09s, setup 0ms, import 2.90s, tests 774ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-ernx_j4_.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":14,\"numPassedTests\":14,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794121823394,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 deploying never fails for a missing image credential\"],\"fullName\":\"story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did\",\"status\":\"passed\",\"title\":\"test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did\",\"duration\":365.36350000000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794121823836,\"endTime\":1794121824201.3635,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-consultant-image-generation-deploy.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"status\":\"passed\",\"title\":\"test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"duration\":59,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"status\":\"passed\",\"title\":\"test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"duration\":91,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"status\":\"passed\",\"title\":\"test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"status\":\"passed\",\"title\":\"test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"status\":\"passed\",\"title\":\"test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"status\":\"passed\",\"title\":\"test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"status\":\"passed\",\"title\":\"test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794121826763,\"endTime\":1794121827151,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-consultant-image-generation.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown",
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