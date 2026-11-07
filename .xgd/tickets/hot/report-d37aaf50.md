---
uid: report-d37aaf50
id: REPORT-11150
type: report
title: 'Scoped quality: pass (13 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-07T19:56:28.906278+00:00'
updated_at: '2026-11-07T19:56:28.906278+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-e0ca0a36
  commit: 65547bcee3718b0a81b562fda2387c080a3848f4
---

{
  "timestamp": "2026-11-07T19:52:50.069083Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001477501355111599,
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
      "duration_seconds": 5.0635459162294865,
      "passed": 13,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 13,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2343_",
        "test_UAT_AC2344_",
        "test_UAT_AC2345_",
        "test_UAT_AC2346_",
        "test_UAT_AC2347_",
        "test_UAT_AC2348_",
        "test_UAT_AC2349_",
        "test_UAT_AC2350_",
        "test_UAT_AC2351_",
        "test_UAT_AC2352_",
        "test_UAT_AC2353_",
        "test_UAT_AC2354_",
        "test_UAT_AC2355_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "-17@example.test subject=Your sign-in link\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-18@example.test subject=Your sign-in link\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-18@example.test subject=Your sign-in link\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-21@example.test subject=Your invitation\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-22@example.test subject=Your invitation\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-23@example.test subject=Your invitation\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 requesting a link\\x1b[2m > \\x1b[22mtest_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 the emailed link\\x1b[2m > \\x1b[22mtest_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 the emailed link\\x1b[2m > \\x1b[22mtest_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 the emailed link\\x1b[2m > \\x1b[22mtest_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\\x1b[32m 17\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 the emailed link\\x1b[2m > \\x1b[22mtest_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22mtest_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22mtest_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\\x1b[32m 14\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22mtest_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\\x1b[32m 24\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\\x1b[32m 31\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m13 passed\\x1b[39m\\x1b[22m\\x1b[90m (13)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 11:52:51\n\\x1b[2m   Duration \\x1b[22m 4.19s\\x1b[2m (transform 1.55s, setup 0ms, import 3.62s, tests 334ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-jndbcs7e.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":5,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":13,\"numPassedTests\":13,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794081171288,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"duration\":59,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"status\":\"passed\",\"title\":\"test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"status\":\"passed\",\"title\":\"test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"status\":\"passed\",\"title\":\"test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"status\":\"passed\",\"title\":\"test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"status\":\"passed\",\"title\":\"test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the invite carries a token\"],\"fullName\":\"story-e0ca0a36 \u2014 the invite carries a token test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794081175208,\"endTime\":1794081175478,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_passwordless_sign_in.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e0ca0a36 \u2014 requesting a link test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 requesting a link test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 requesting a link test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 requesting a link test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 requesting a link test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the emailed link test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the emailed link test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the emailed link test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the emailed link test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the invite carries a token test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access",
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