---
uid: report-5c3cbedf
id: REPORT-12050
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T22:48:31.412022+00:00'
updated_at: '2026-11-09T22:48:31.412022+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-39c992d3
  commit: 503ee11be1ef6f294eec659f64ccda89066b6d77
---

{
  "timestamp": "2026-11-09T22:44:29.639175Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012204237282276154,
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
      "duration_seconds": 5.994479916989803,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
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
        "test_UAT_AC2392_",
        "test_UAT_AC2567_",
        "test_UAT_AC2568_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\\x1b[32m 28\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-consultant-image-generation.workers.test.ts\\x1b[2m > \\x1b[22mstory-39c992d3 \u2014 the consultant can generate a picture as ordinary material\\x1b[2m > \\x1b[22mtest_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\\x1b[32m 29\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 14:44:31\n\\x1b[2m   Duration \\x1b[22m 4.94s\\x1b[2m (transform 2.40s, setup 0ms, import 5.35s, tests 991ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-w3dfdvu9.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":6,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":17,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794264271001,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 a generated picture is shown in the turn that made it\"],\"fullName\":\"story-39c992d3 \u2014 a generated picture is shown in the turn that made it test_UAT_AC2567_a_generated_picture_result_carries_a_business_scoped_line_that_fetches_its_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2567_a_generated_picture_result_carries_a_business_scoped_line_that_fetches_its_bytes\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 a generated picture is shown in the turn that made it\"],\"fullName\":\"story-39c992d3 \u2014 a generated picture is shown in the turn that made it test_UAT_AC2568_without_a_material_url_factory_the_result_has_no_display_and_generation_still_succeeds\",\"status\":\"passed\",\"title\":\"test_UAT_AC2568_without_a_material_url_factory_the_result_has_no_display_and_generation_still_succeeds\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794264275486,\"endTime\":1794264275565,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-consultant-image-generation-display.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"status\":\"passed\",\"title\":\"test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"duration\":73,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"status\":\"passed\",\"title\":\"test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"duration\":111,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"status\":\"passed\",\"title\":\"test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"status\":\"passed\",\"title\":\"test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"status\":\"passed\",\"title\":\"test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_its_vocabulary_before_its_bytes_are_attached\",\"status\":\"passed\",\"title\":\"test_UAT_AC2383_a_generated_picture_carries_its_vocabulary_before_its_bytes_are_attached\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"status\":\"passed\",\"title\":\"test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"status\":\"passed\",\"title\":\"test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794264275486,\"endTime\":1794264275946,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-consultant-image-generation.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 deploying never fails for a missing image credential\"],\"fullName\":\"story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did\",\"status\":\"passed\",\"title\":\"test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did\",\"duration\":400.696708,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794264272453,\"endTime\":1794264272853.6968,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-consultant-image-generation-deploy.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-39c992d3 \u2014 a generated picture is shown in the turn that made it test_UAT_AC2567_a_generated_picture_result_carries_a_business_scoped_line_that_fetches_its_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 a generated picture is shown in the turn that made it test_UAT_AC2568_without_a_material_url_factory_the_result_has_no_display_and_generation_still_succeeds",
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
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_its_vocabulary_before_its_bytes_are_attached",
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
        },
        {
          "name": "story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did",
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