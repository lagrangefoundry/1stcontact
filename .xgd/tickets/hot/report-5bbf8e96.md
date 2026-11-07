---
uid: report-5bbf8e96
id: REPORT-11105
type: report
title: 'Scoped quality: pass (12 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-07T07:16:21.901940+00:00'
updated_at: '2026-11-07T07:16:21.901940+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-d34eccd8
  commit: 5264ed90be217384daae47c99e8a618f296911c7
---

{
  "timestamp": "2026-11-07T07:12:42.013171Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001934159081429243,
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
      "duration_seconds": 5.249067957978696,
      "passed": 12,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 12,
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
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form\\x1b[32m 22\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC908_the_served_type_follows_the_key_that_answered\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site\\x1b[2m > \\x1b[22mtest_UAT_AC912_the_server_is_read_only_and_head_is_bodiless\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC903_a_published_url_serves_the_live_revision_whole\\x1b[32m 71\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\\x1b[32m 27\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\\x1b[32m 19\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-published-site-serving.workers.test.ts\\x1b[2m > \\x1b[22mstory-d34eccd8 \u2014 serving a published site, over real bindings\\x1b[2m > \\x1b[22mtest_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\\x1b[32m 35\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m12 passed\\x1b[39m\\x1b[22m\\x1b[90m (12)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 23:12:43\n\\x1b[2m   Duration \\x1b[22m 4.41s\\x1b[2m (transform 1.84s, setup 0ms, import 4.04s, tests 213ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-pcwfb6vp.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":12,\"numPassedTests\":12,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794035563130,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form\",\"status\":\"passed\",\"title\":\"test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form\",\"duration\":21.62512499999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach\",\"status\":\"passed\",\"title\":\"test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach\",\"duration\":2.5413750000000164,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes\",\"status\":\"passed\",\"title\":\"test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes\",\"duration\":2.5168330000000196,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read\",\"duration\":3.1492090000000417,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC908_the_served_type_follows_the_key_that_answered\",\"status\":\"passed\",\"title\":\"test_UAT_AC908_the_served_type_follows_the_key_that_answered\",\"duration\":2.384707999999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable\",\"status\":\"passed\",\"title\":\"test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable\",\"duration\":1.218166999999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained\",\"status\":\"passed\",\"title\":\"test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained\",\"duration\":2.6038749999999595,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless\",\"status\":\"passed\",\"title\":\"test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless\",\"duration\":1.279833999999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794035563891,\"endTime\":1794035563928.2798,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-published-site-serving.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC903_a_published_url_serves_the_live_revision_whole\",\"status\":\"passed\",\"title\":\"test_UAT_AC903_a_published_url_serves_the_live_revision_whole\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794035567395,\"endTime\":1794035567547,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-published-site-serving.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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