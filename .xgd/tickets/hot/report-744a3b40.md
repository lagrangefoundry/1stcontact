---
uid: report-744a3b40
id: REPORT-11165
type: report
title: 'Report: batch_quality_check for story-e0ca0a36'
created_by: xgd
created_at: '2026-11-07T20:40:35.664310+00:00'
updated_at: '2026-11-07T20:40:35.664310+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e0ca0a36
  parent_report_uid: report-2ffc351d
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-07T20:36:40.503651Z",
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
      "duration_seconds": 4.635136915836483,
      "passed": 35,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 35,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2347_",
        "test_UAT_AC2348_",
        "test_UAT_AC2349_",
        "test_UAT_AC2350_",
        "test_UAT_AC2351_",
        "test_UAT_AC2352_",
        "test_UAT_AC2353_",
        "test_UAT_AC2354_",
        "test_UAT_FC_REQ-202_",
        "test_UAT_AC2343_",
        "test_UAT_AC2344_",
        "test_UAT_AC2345_",
        "test_UAT_AC2346_",
        "test_UAT_AC2355_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "EQ-202_issuing_for_a_known_and_an_unknown_address_are_indistinguishable\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_issuing_for_a_known_and_an_unknown_address_are_indistinguishable\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 issuing a link\"],\"fullName\":\"REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_a_link_is_rendered_recorded_and_sent_as_one_message\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_a_link_is_rendered_recorded_and_sent_as_one_message\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 issuing a link\"],\"fullName\":\"REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_sign_in_mail_is_capped_per_subject\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_sign_in_mail_is_capped_per_subject\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 issuing a link\"],\"fullName\":\"REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_a_withdrawn_contact_is_sent_nothing_and_holds_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_a_withdrawn_contact_is_sent_nothing_and_holds_nothing\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 the Sign In control posts from another origin\"],\"fullName\":\"REQ-202 \u2014 the Sign In control posts from another origin test_UAT_FC_REQ-202_the_apex_may_post_an_address_and_a_stranger_may_not\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_the_apex_may_post_an_address_and_a_stranger_may_not\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 the Sign In control posts from another origin\"],\"fullName\":\"REQ-202 \u2014 the Sign In control posts from another origin test_UAT_FC_REQ-202_redeeming_refuses_a_cross_site_post\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_redeeming_refuses_a_cross_site_post\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 the emailed link\"],\"fullName\":\"REQ-202 \u2014 the emailed link test_UAT_FC_REQ-202_a_get_of_the_link_serves_a_continue_control_and_consumes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_a_get_of_the_link_serves_a_continue_control_and_consumes_nothing\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 the emailed link\"],\"fullName\":\"REQ-202 \u2014 the emailed link test_UAT_FC_REQ-202_pressing_continue_signs_them_in_on_a_cookie_the_apex_can_read\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_pressing_continue_signs_them_in_on_a_cookie_the_apex_can_read\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 the emailed link\"],\"fullName\":\"REQ-202 \u2014 the emailed link test_UAT_FC_REQ-202_expired_used_and_unknown_all_offer_a_fresh_link\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_expired_used_and_unknown_all_offer_a_fresh_link\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 a session is a second producer of a verified identity\"],\"fullName\":\"REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_a_session_reaches_the_builder_with_no_access_challenge\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_a_session_reaches_the_builder_with_no_access_challenge\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 a session is a second producer of a verified identity\"],\"fullName\":\"REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_access_still_admits_when_there_is_no_session\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_access_still_admits_when_there_is_no_session\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 a session is a second producer of a verified identity\"],\"fullName\":\"REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_signing_out_ends_the_session_and_clears_the_cookie\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_signing_out_ends_the_session_and_clears_the_cookie\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 a session is a second producer of a verified identity\"],\"fullName\":\"REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_a_stale_cookie_falls_through_to_access_rather_than_locking_anyone_out\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_a_stale_cookie_falls_through_to_access_rather_than_locking_anyone_out\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-202 \u2014 the invite carries a token\"],\"fullName\":\"REQ-202 \u2014 the invite carries a token test_UAT_FC_REQ-202_an_invites_cta_url_is_a_redeemable_link_and_never_the_bare_origin\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-202_an_invites_cta_url_is_a_redeemable_link_and_never_the_bare_origin\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794083805170,\"endTime\":1794083805343,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_UAT_FC_REQ-202_sign_in.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"duration\":62,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"status\":\"passed\",\"title\":\"test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"status\":\"passed\",\"title\":\"test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"status\":\"passed\",\"title\":\"test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"status\":\"passed\",\"title\":\"test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"status\":\"passed\",\"title\":\"test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the invite carries a token\"],\"fullName\":\"story-e0ca0a36 \u2014 the invite carries a token test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794083805143,\"endTime\":1794083805439,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_passwordless_sign_in.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-202 \u2014 the component is a declared dependency of the build test_UAT_FC_REQ-202_the_shared_store_preflight_names_the_component",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the migration carries the component schema test_UAT_FC_REQ-202_the_baseline_creates_login_tokens_and_sessions",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the migration carries the component schema test_UAT_FC_REQ-202_every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the session cookie is configured on both halves and both Workers test_UAT_FC_REQ-202_control_app_names_the_session_cookie_in_both_environments",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the session cookie is configured on both halves and both Workers test_UAT_FC_REQ-202_the_builder_and_the_apex_agree_about_the_cookie",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the session cookie is configured on both halves and both Workers test_UAT_FC_REQ-202_the_cookie_domain_reaches_the_builder_and_the_apex",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the sign-in paths are the ones the operator has to bypass test_UAT_FC_REQ-202_ACCESS_md_records_the_bypass_the_deployment_needs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_FC_REQ-202_the_passwordless_contract_holds_against_this_deployments_d1",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_issuing_for_a_known_and_an_unknown_address_are_indistinguishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_a_link_is_rendered_recorded_and_sent_as_one_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_sign_in_mail_is_capped_per_subject",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 issuing a link test_UAT_FC_REQ-202_a_withdrawn_contact_is_sent_nothing_and_holds_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the Sign In control posts from another origin test_UAT_FC_REQ-202_the_apex_may_post_an_address_and_a_stranger_may_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the Sign In control posts from another origin test_UAT_FC_REQ-202_redeeming_refuses_a_cross_site_post",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the emailed link test_UAT_FC_REQ-202_a_get_of_the_link_serves_a_continue_control_and_consumes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the emailed link test_UAT_FC_REQ-202_pressing_continue_signs_them_in_on_a_cookie_the_apex_can_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the emailed link test_UAT_FC_REQ-202_expired_used_and_unknown_all_offer_a_fresh_link",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_a_session_reaches_the_builder_with_no_access_challenge",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_access_still_admits_when_there_is_no_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_signing_out_ends_the_session_and_clears_the_cookie",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 a session is a second producer of a verified identity test_UAT_FC_REQ-202_a_stale_cookie_falls_through_to_access_rather_than_locking_anyone_out",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-202 \u2014 the invite carries a token test_UAT_FC_REQ-202_an_invites_cta_url_is_a_redeemable_link_and_never_the_bare_origin",
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