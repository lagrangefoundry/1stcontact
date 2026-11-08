---
uid: report-e048392e
id: REPORT-11247
type: report
title: 'Scoped quality: pass (16 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T02:52:04.708754+00:00'
updated_at: '2026-11-08T02:52:04.708754+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: STORY-171
  commit: 78f87b38b489c909eb15bfce69d3e4d893bb9a98
---

{
  "timestamp": "2026-11-08T02:47:59.591898Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001788339577615261,
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
      "duration_seconds": 5.304346500430256,
      "passed": 16,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 16,
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
        "test_UAT_AC2355_",
        "test_UAT_AC2365_",
        "test_UAT_AC2366_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "essions at the builder\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-18@example.test subject=Your sign-in link\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-18@example.test subject=Your sign-in link\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-21@example.test subject=Your invitation\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-22@example.test subject=Your invitation\n\n\\x1b[90mstdout\\x1b[2m | tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\n\\x1b[22m\\x1b[39m[mail] not sent (no provider configured): to=pwless-23@example.test subject=Your invitation\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22mtest_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\\x1b[32m 17\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 sessions at the builder\\x1b[2m > \\x1b[22mtest_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\\x1b[32m 24\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_passwordless_sign_in.workers.test.ts\\x1b[2m > \\x1b[22mstory-e0ca0a36 \u2014 the invite carries a token\\x1b[2m > \\x1b[22mtest_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\\x1b[32m 28\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m16 passed\\x1b[39m\\x1b[22m\\x1b[90m (16)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:48:00\n\\x1b[2m   Duration \\x1b[22m 4.42s\\x1b[2m (transform 3.40s, setup 0ms, import 7.04s, tests 534ms, environment 229ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-kwo_r5sj.json\n\n{\"numTotalTestSuites\":10,\"numPassedTestSuites\":10,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":16,\"numPassedTests\":16,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794106080797,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the Account dialog signs out\"],\"fullName\":\"story-e0ca0a36 \u2014 the Account dialog signs out test_UAT_AC2365_the_account_dialog_always_shows_a_sign_out_form_beside_close_posting_to_sign_out\",\"status\":\"passed\",\"title\":\"test_UAT_AC2365_the_account_dialog_always_shows_a_sign_out_form_beside_close_posting_to_sign_out\",\"duration\":13.838707999999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794106081950,\"endTime\":1794106081963.8386,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_sign_out_account_dialog.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"duration\":45,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"status\":\"passed\",\"title\":\"test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"duration\":34,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"status\":\"passed\",\"title\":\"test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"status\":\"passed\",\"title\":\"test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"status\":\"passed\",\"title\":\"test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"status\":\"passed\",\"title\":\"test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the invite carries a token\"],\"fullName\":\"story-e0ca0a36 \u2014 the invite carries a token test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794106084920,\"endTime\":1794106085228,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_passwordless_sign_in.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 signing out with an Access credential\"],\"fullName\":\"story-e0ca0a36 \u2014 signing out with an Access credential test_UAT_AC2366_signing_out_with_an_access_credential_goes_to_the_team_access_logout_returning_here\",\"status\":\"passed\",\"title\":\"test_UAT_AC2366_signing_out_with_an_access_credential_goes_to_the_team_access_logout_returning_here\",\"duration\":50,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the chrome is told nothing about the credential\"],\"fullName\":\"story-e0ca0a36 \u2014 the chrome is told nothing about the credential test_UAT_AC2365_the_businesses_payload_carries_no_session_field\",\"status\":\"passed\",\"title\":\"test_UAT_AC2365_the_businesses_payload_carries_no_session_field\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794106084921,\"endTime\":1794106084990,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_sign_out_destination.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e0ca0a36 \u2014 the Account dialog signs out test_UAT_AC2365_the_account_dialog_always_shows_a_sign_out_form_beside_close_posting_to_sign_out",
          "file": "",
          "status": "passed"
        },
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
        },
        {
          "name": "story-e0ca0a36 \u2014 signing out with an Access credential test_UAT_AC2366_signing_out_with_an_access_credential_goes_to_the_team_access_logout_returning_here",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the chrome is told nothing about the credential test_UAT_AC2365_the_businesses_payload_carries_no_session_field",
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