---
uid: report-fff8d22d
id: REPORT-11318
type: report
title: 'Scoped quality: fail (14 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T06:51:30.290424+00:00'
updated_at: '2026-11-08T06:51:30.290424+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-39c992d3
  commit: 2530f84d7c249da680943c389929b396e89c3fe1
---

{
  "timestamp": "2026-11-08T06:48:15.612719Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010404223576188087,
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
      "duration_seconds": 4.9475754997693,
      "passed": 13,
      "failed": 1,
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
      "stdout": "\"remaining\\\":3,\\\"size\\\":33,\\\"ticket\\\":\\\"material-fa33c6b7\\\",\\\"tier\\\":\\\"final\\\",\\\"width\\\":3}\"\\x1b[39m\n\\x1b[31m+ \"{\\\"aspect_ratio\\\":\\\"1:1\\\",\\\"attachment\\\":\\\"attachment-e1d3a55e\\\",\\\"content_type\\\":\\\"image/png\\\",\\\"filename\\\":\\\"try-5.png\\\",\\\"height\\\":2,\\\"remaining\\\":2,\\\"size\\\":33,\\\"ticket\\\":\\\"material-1c55e675\\\",\\\"tier\\\":\\\"final\\\",\\\"width\\\":3}\"\\x1b[39m\n\\x1b[31m+ \"{\\\"aspect_ratio\\\":\\\"1:1\\\",\\\"attachment\\\":\\\"attachment-22147c72\\\",\\\"content_type\\\":\\\"image/png\\\",\\\"filename\\\":\\\"try-6.png\\\",\\\"height\\\":2,\\\"remaining\\\":1,\\\"size\\\":33,\\\"ticket\\\":\\\"material-25945b86\\\",\\\"tier\\\":\\\"final\\\",\\\"width\\\":3}\"\\x1b[39m\n\\x1b[31m+ \"{\\\"aspect_ratio\\\":\\\"1:1\\\",\\\"attachment\\\":\\\"attachment-fe3bd78b\\\",\\\"content_type\\\":\\\"image/png\\\",\\\"filename\\\":\\\"try-7.png\\\",\\\"height\\\":2,\\\"remaining\\\":0,\\\"size\\\":33,\\\"ticket\\\":\\\"material-f4ff9ae2\\\",\\\"tier\\\":\\\"final\\\",\\\"width\\\":3}\"\\x1b[39m\n\\x1b[31m+ \"Error: CreateImage failed (budget_exhausted). This session has generated as many images as it is allowed. No more can be made, and nothing else you can do here changes that \u2014 say so plainly rather than trying again. Every other tool still works. The host reports: 10 of 10 images made\"\\x1b[39m\n\\x1b[31m+ \"Error: CreateImage failed (budget_exhausted). This session has generated as many images as it is allowed. No more can be made, and nothing else you can do here changes that \u2014 say so plainly rather than trying again. Every other tool still works. The host reports: 10 of 10 images made\"\\x1b[39m\n\\x1b[31m+ \"Error: CreateImage failed (budget_exhausted). This session has generated as many images as it is allowed. No more can be made, and nothing else you can do here changes that \u2014 say so plainly rather than trying again. Every other tool still works. The host reports: 10 of 10 images made\"\\x1b[39m\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-consultant-image-generation.workers.test.ts:\\x1b[2m322:24\\x1b[22m\\x1b[39m\n    \\x1b[90m320|\\x1b[39m     \\x1b[35mconst\\x1b[39m text \\x1b[33m=\\x1b[39m readable\\x1b[33m.\\x1b[39m\\x1b[34mjoin\\x1b[39m(\\x1b[32m'\\n'\\x1b[39m)\n    \\x1b[90m321|\\x1b[39m     for (const vendor of ['openai', 'OpenAI', 'gpt-image', 'Google', '\u2026\n    \\x1b[90m322|\\x1b[39m       \\x1b[34mexpect\\x1b[39m(text)\\x1b[33m.\\x1b[39mnot\\x1b[33m.\\x1b[39m\\x1b[34mtoContain\\x1b[39m(vendor)\n    \\x1b[90m   |\\x1b[39m                        \\x1b[31m^\\x1b[39m\n    \\x1b[90m323|\\x1b[39m     }\n    \\x1b[90m324|\\x1b[39m     const schema = success.client.seen[0].tools.find((t) => t.name ===\u2026\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-a7woxeb9.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":2,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":14,\"numPassedTests\":13,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794120496772,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 deploying never fails for a missing image credential\"],\"fullName\":\"story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did\",\"status\":\"passed\",\"title\":\"test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did\",\"duration\":259.177458,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794120497224,\"endTime\":1794120497483.1775,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-consultant-image-generation-deploy.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"status\":\"passed\",\"title\":\"test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"status\":\"failed\",\"title\":\"test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"duration\":109,\"failureMessages\":[\"AssertionError: expected 'You are a design consultant, and the \u2026' not to contain 'openai'\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-consultant-image-generation.workers.test.ts:322:24\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"status\":\"passed\",\"title\":\"test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"status\":\"passed\",\"title\":\"test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"status\":\"passed\",\"title\":\"test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"status\":\"passed\",\"title\":\"test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"status\":\"passed\",\"title\":\"test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"duration\":62,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794120500427,\"endTime\":1794120500871,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-consultant-image-generation.workers.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor",
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