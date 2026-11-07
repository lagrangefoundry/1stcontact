---
uid: report-52d0e8fb
id: REPORT-11100
type: report
title: 'Scoped quality: fail (13 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-07T07:04:58.718278+00:00'
updated_at: '2026-11-07T07:04:58.718278+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-d34eccd8
  commit: f1924c2ed0bfaa11f2167e277e39ef0a196df770
---

{
  "timestamp": "2026-11-07T07:00:54.610350Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014108396135270596,
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
      "duration_seconds": 5.692356917075813,
      "passed": 12,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 13,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1423_",
        "test_UAT_AC1424_",
        "test_UAT_AC2244_",
        "test_UAT_AC2333_",
        "test_UAT_AC2334_",
        "test_UAT_AC2335_",
        "test_UAT_AC903_",
        "test_UAT_AC904_",
        "test_UAT_AC905_",
        "test_UAT_AC906_",
        "test_UAT_AC907_",
        "test_UAT_AC908_",
        "test_UAT_AC909_",
        "test_UAT_AC911_",
        "test_UAT_AC912_",
        "test_UAT_AC913_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC912_the_server_is_read_only_and_head_is_bodiless\\x1b[32m 4\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC903_a_published_url_serves_the_live_revision_whole\\x1b[32m 74\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\\x1b[32m 27\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\\x1b[32m 23\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\\x1b[32m 35\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC913_the_apex_holds_and_never_serves_a_site\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: expected 404 to be 200 // Object.is equality\\x1b[39m\n\n\\x1b[32m- Expected\\x1b[39m\n\\x1b[31m+ Received\\x1b[39m\n\n\\x1b[32m- 200\\x1b[39m\n\\x1b[31m+ 404\\x1b[39m\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-published-site-serving.test.ts:\\x1b[2m149:25\\x1b[22m\\x1b[39m\n    \\x1b[90m147|\\x1b[39m\n    \\x1b[90m148|\\x1b[39m     \\x1b[35mconst\\x1b[39m apex \\x1b[33m=\\x1b[39m \\x1b[35mawait\\x1b[39m \\x1b[35mget\\x1b[39m(\\x1b[32m'/'\\x1b[39m)\n    \\x1b[90m149|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(apex\\x1b[33m.\\x1b[39mstatus)\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[34m200\\x1b[39m)\n    \\x1b[90m   |\\x1b[39m                         \\x1b[31m^\\x1b[39m\n    \\x1b[90m150|\\x1b[39m     expect(apex.headers.get('content-type')).toBe('text/plain; charset\u2026\n    \\x1b[90m151|\\x1b[39m     \\x1b[35mconst\\x1b[39m body \\x1b[33m=\\x1b[39m \\x1b[35mawait\\x1b[39m apex\\x1b[33m.\\x1b[39m\\x1b[34mtext\\x1b[39m()\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m12 passed\\x1b[39m\\x1b[22m\\x1b[90m (13)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 23:00:55\n\\x1b[2m   Duration \\x1b[22m 4.67s\\x1b[2m (transform 1.84s, setup 0ms, import 4.09s, tests 234ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-vza6ean_.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":2,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":13,\"numPassedTests\":12,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794034855919,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC913_the_apex_holds_and_never_serves_a_site\",\"status\":\"failed\",\"title\":\"test_UAT_AC913_the_apex_holds_and_never_serves_a_site\",\"duration\":23.131875000000036,\"failureMessages\":[\"AssertionError: expected 404 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-published-site-serving.test.ts:149:25\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form\",\"status\":\"passed\",\"title\":\"test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form\",\"duration\":5.240249999999946,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach\",\"status\":\"passed\",\"title\":\"test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach\",\"duration\":2.309833000000026,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes\",\"status\":\"passed\",\"title\":\"test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes\",\"duration\":1.8903329999999983,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read\",\"duration\":2.317916000000025,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC908_the_served_type_follows_the_key_that_answered\",\"status\":\"passed\",\"title\":\"test_UAT_AC908_the_served_type_follows_the_key_that_answered\",\"duration\":2.7772079999999733,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable\",\"status\":\"passed\",\"title\":\"test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable\",\"duration\":1.873041999999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained\",\"status\":\"passed\",\"title\":\"test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained\",\"duration\":6.450792000000035,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless\",\"status\":\"passed\",\"title\":\"test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless\",\"duration\":3.7975419999999644,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794034856715,\"endTime\":1794034856764.7976,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-published-site-serving.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC903_a_published_url_serves_the_live_revision_whole\",\"status\":\"passed\",\"title\":\"test_UAT_AC903_a_published_url_serves_the_live_revision_whole\",\"duration\":74,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794034860434,\"endTime\":1794034860593,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-published-site-serving.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC913_the_apex_holds_and_never_serves_a_site",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC908_the_served_type_follows_the_key_that_answered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC903_a_published_url_serves_the_live_revision_whole",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC913_the_apex_holds_and_never_serves_a_site",
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