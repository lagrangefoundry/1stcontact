---
uid: report-f6ec5c10
id: REPORT-11259
type: report
title: 'Scoped quality: pass (169 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T03:33:35.515452+00:00'
updated_at: '2026-11-08T03:33:35.515452+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-2bebccf7
  commit: ae1f5c4f81dbd41460fbd3369799e981363ec51d
---

{
  "timestamp": "2026-11-08T03:29:58.960350Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011562509462237358,
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
      "duration_seconds": 22.679435499943793,
      "passed": 169,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 169,
      "deselected": 18,
      "test_filter": [
        "test_UAT_AC1062_",
        "test_UAT_AC1063_",
        "test_UAT_AC1064_",
        "test_UAT_AC1065_",
        "test_UAT_AC1066_",
        "test_UAT_AC1067_",
        "test_UAT_AC1068_",
        "test_UAT_AC1069_",
        "test_UAT_AC1070_",
        "test_UAT_AC1330_",
        "test_UAT_AC1331_",
        "test_UAT_AC1332_",
        "test_UAT_AC1333_",
        "test_UAT_AC1334_",
        "test_UAT_AC1335_",
        "test_UAT_AC1336_",
        "test_UAT_AC1337_",
        "test_UAT_AC1338_",
        "test_UAT_AC1339_",
        "test_UAT_AC1340_",
        "test_UAT_AC1341_",
        "test_UAT_AC1342_",
        "test_UAT_AC1375_",
        "test_UAT_AC1376_",
        "test_UAT_AC1377_",
        "test_UAT_AC1378_",
        "test_UAT_AC1379_",
        "test_UAT_AC1380_",
        "test_UAT_AC1381_",
        "test_UAT_AC1382_",
        "test_UAT_AC1383_",
        "test_UAT_AC1384_",
        "test_UAT_AC1425_",
        "test_UAT_AC1426_",
        "test_UAT_AC1427_",
        "test_UAT_AC1450_",
        "test_UAT_AC1451_",
        "test_UAT_AC1452_",
        "test_UAT_AC1453_",
        "test_UAT_AC1454_",
        "test_UAT_AC1455_",
        "test_UAT_AC1740_",
        "test_UAT_AC1741_",
        "test_UAT_AC1742_",
        "test_UAT_AC1743_",
        "test_UAT_AC1744_",
        "test_UAT_AC1745_",
        "test_UAT_AC1746_",
        "test_UAT_AC1747_",
        "test_UAT_AC1748_",
        "test_UAT_AC1749_",
        "test_UAT_AC1750_",
        "test_UAT_AC1751_",
        "test_UAT_AC1752_",
        "test_UAT_AC1753_",
        "test_UAT_AC1754_",
        "test_UAT_AC1755_",
        "test_UAT_AC1756_",
        "test_UAT_AC1757_",
        "test_UAT_AC1758_",
        "test_UAT_AC1759_",
        "test_UAT_AC1760_",
        "test_UAT_AC1761_",
        "test_UAT_AC1791_",
        "test_UAT_AC1795_",
        "test_UAT_AC1796_",
        "test_UAT_AC1797_",
        "test_UAT_AC1798_",
        "test_UAT_AC1799_",
        "test_UAT_AC1800_",
        "test_UAT_AC1801_",
        "test_UAT_AC1802_",
        "test_UAT_AC1803_",
        "test_UAT_AC1804_",
        "test_UAT_AC1805_",
        "test_UAT_AC1806_",
        "test_UAT_AC1807_",
        "test_UAT_AC1808_",
        "test_UAT_AC1816_",
        "test_UAT_AC1819_",
        "test_UAT_AC2075_",
        "test_UAT_AC2076_",
        "test_UAT_AC2077_",
        "test_UAT_AC2078_",
        "test_UAT_AC2079_",
        "test_UAT_AC2092_",
        "test_UAT_AC2093_",
        "test_UAT_AC2094_",
        "test_UAT_AC2112_",
        "test_UAT_AC2113_",
        "test_UAT_AC2114_",
        "test_UAT_AC2115_",
        "test_UAT_AC2116_",
        "test_UAT_AC2169_",
        "test_UAT_AC2170_",
        "test_UAT_AC2171_",
        "test_UAT_AC2172_",
        "test_UAT_AC2173_",
        "test_UAT_AC2174_",
        "test_UAT_AC2175_",
        "test_UAT_AC2176_",
        "test_UAT_AC2237_",
        "test_UAT_AC2247_",
        "test_UAT_AC2248_",
        "test_UAT_AC2253_",
        "test_UAT_AC2254_",
        "test_UAT_AC2257_",
        "test_UAT_AC2305_",
        "test_UAT_AC2306_",
        "test_UAT_AC2307_",
        "test_UAT_AC2308_",
        "test_UAT_AC2309_",
        "test_UAT_AC2310_",
        "test_UAT_AC2311_",
        "test_UAT_AC2312_",
        "test_UAT_AC2313_",
        "test_UAT_AC2314_",
        "test_UAT_AC2315_",
        "test_UAT_AC2316_",
        "test_UAT_AC2317_",
        "test_UAT_AC2318_",
        "test_UAT_AC2319_",
        "test_UAT_AC2320_",
        "test_UAT_AC2321_",
        "test_UAT_AC2322_",
        "test_UAT_AC2336_",
        "test_UAT_AC2337_",
        "test_UAT_AC2338_",
        "test_UAT_AC2339_",
        "test_UAT_AC2340_",
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
        "test_UAT_AC2356_",
        "test_UAT_AC2357_",
        "test_UAT_AC2358_",
        "test_UAT_AC2359_",
        "test_UAT_AC2360_",
        "test_UAT_AC2361_",
        "test_UAT_AC2362_",
        "test_UAT_AC2363_",
        "test_UAT_AC2364_",
        "test_UAT_AC2365_",
        "test_UAT_AC2366_",
        "test_UAT_AC2367_",
        "test_UAT_AC2368_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"duration\":88,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 who may add and invite\"],\"fullName\":\"story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"duration\":51,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"status\":\"passed\",\"title\":\"test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"duration\":52,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"duration\":56,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794108618380,\"endTime\":1794108618896,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_contacts_add_invite.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a contact who is signing up is admitted with nothing\"],\"fullName\":\"a contact who is signing up is admitted with nothing test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused\",\"duration\":130,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the refusal the visitor reads\"],\"fullName\":\"the refusal the visitor reads test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the refusal the operator reads\"],\"fullName\":\"the refusal the operator reads test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag\",\"status\":\"passed\",\"title\":\"test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag\",\"duration\":61,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794108618352,\"endTime\":1794108618606,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_identity_signup_admission_refusal.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"duration\":74,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"duration\":137,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"status\":\"passed\",\"title\":\"test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"duration\":51,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"status\":\"passed\",\"title\":\"test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"status\":\"passed\",\"title\":\"test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"status\":\"passed\",\"title\":\"test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"status\":\"passed\",\"title\":\"test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the invite carries a token\"],\"fullName\":\"story-e0ca0a36 \u2014 the invite carries a token test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"duration\":50,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794108618454,\"endTime\":1794108619016,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_passwordless_sign_in.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 signing out with an Access credential\"],\"fullName\":\"story-e0ca0a36 \u2014 signing out with an Access credential test_UAT_AC2366_signing_out_with_an_access_credential_goes_to_the_team_access_logout_returning_here\",\"status\":\"passed\",\"title\":\"test_UAT_AC2366_signing_out_with_an_access_credential_goes_to_the_team_access_logout_returning_here\",\"duration\":72,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the chrome is told nothing about the credential\"],\"fullName\":\"story-e0ca0a36 \u2014 the chrome is told nothing about the credential test_UAT_AC2365_the_businesses_payload_carries_no_session_field\",\"status\":\"passed\",\"title\":\"test_UAT_AC2365_the_businesses_payload_carries_no_session_field\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794108618358,\"endTime\":1794108618458,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/test_reconciliation_sign_out_destination.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an arrival notice above its budget truncates titles and never the count test_UAT_AC1800_forty_one_arrivals_keep_an_exact_count_and_lose_only_titles",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a single title longer than the whole budget is clipped and still named test_UAT_AC1801_one_oversized_title_is_clipped_rather_than_dropped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Node CLI host sends the model the whole priming test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_one_control_chooses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 replay waits for the engines test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 the engines belong to the workspace test_UAT_AC1816_the_engines_start_once_for_the_workspace_and_readiness_settles_either_way",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 the page follows the writes test_UAT_AC1819_the_displayed_page_is_refetched_per_write_and_a_failed_refetch_keeps_the_reply",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a settled conversation opens idle test_UAT_AC2368_a_settled_conversation_opens_idle_and_a_typed_message_is_sent_and_answered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1375_a_granted_identity_is_not_refused_by_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC1761_the_gate_reports_the_verified_identity_rather_than_a_yes_or_no",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2312_the_seed_creates_no_platform_operator",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2313_seed_targets_local_unless_remote_is_typed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2314_success_report_and_help_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2316_applying_migrations_never_applies_the_fixture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2318_a_minted_token_passes_the_real_verifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 ACCESS.md test_UAT_AC2322_access_md_points_to_seed_and_simulator",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the credential scan exempts the identity mapping, and only from the name shape test_UAT_AC1342_identity_mapping_is_exempt_from_the_name_shape_only_held_to_name_address_and_listed_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the environment preflight test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the build discovers every Worker and bundles it for production test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a rehearsal is the same path as a real deploy test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 hooks are discovered by executability and run before the upload test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a hook that fails stops the code that assumes it ran test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 deploy targets come from what is discovered test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the smoke check against an origin that serves correctly test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_rather_than_forbidden",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 each way a deploy is silently broken fails the smoke check test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a check with nothing to test against is skipped test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 every same-origin asset a published site references resolves test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 an unpublished site is indistinguishable from an unknown one test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 every named environment repeats every var and binding test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 no secret value is committed, and the push is piped test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the smoke check asserts the operator surface is private test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the build refuses a Worker type program that reaches the filesystem test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the derived artifacts are generated before the typecheck test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the operator surface retains every invocation log test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the retention declaration joins no binding set test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-57 \u2014 every smoke check is reachable test_UAT_AC2357_control_origin_is_derived_from_the_default_apex",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-57 \u2014 every smoke check is reachable test_UAT_AC2357_a_non_default_origin_derives_nothing_and_skips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-57 \u2014 every smoke check is reachable test_UAT_AC2356_the_published_cache_policy_matches_the_worker",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add dialog test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2337_invite_is_disabled_until_a_row_is_checked_and_opens_a_message_with_read_only_from_and_a_to_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite composer fits its dialog test_UAT_AC2367_invite_subject_tolist_and_body_lie_within_the_dialog_panel_at_desktop_and_narrow_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e0ca0a36 \u2014 the Account dialog signs out test_UAT_AC2365_the_account_dialog_always_shows_a_sign_out_form_beside_close_posting_to_sign_out",
          "file": "",
          "status": "passed"
        },
        {
          "name": "both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a cold conversation is primed with both maps in one landscape section test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a client corpus small enough to list reaches the conversation in full test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one search reaches both knowledge bases and returns one ranked list test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a search hit from either knowledge base is read back, not refused test_UAT_AC2237_a_hit_from_each_knowledge_base_is_read_back_on_the_worker",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a document uploaded mid-conversation is known by name on the next turn test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn on which nothing arrived carries no arrival notice at all test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an arrival is announced once and never again test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an unreadable record of what a conversation was told never costs the turn test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation's coverage starts where the map's coverage ends test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a resumed conversation's first turn back reports what arrived while away test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is never announced to itself test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the arrival notice is last in a turn's context test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "arrivals are the client's knowledge alone, and no client knowledge still takes turns test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 which conversations the origin reports live test_UAT_AC2094_origin_reports_live_only_while_a_turn_is_open_never_when_settled_or_empty",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the account is a record people belong to test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the account is a record people belong to test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC1741_business_key_is_opaque_biz_and_distinct_from_its_owning_account_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC1742_provisioning_writes_an_account_owned_business_grant_and_unnamed_starter_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC2115_a_non_null_grant_subject_is_an_account_key_and_the_capacity_grant_names_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition on an existing contact test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column",
          "file": "",
          "status": "passed"
        },
        {
          "name": "who may invite test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning a business test_UAT_AC1741_the_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning a business test_UAT_AC1746_several_concurrent_grants_and_unknown_plan_and_status_round_trip",
          "file": "",
          "status": "passed"
        },
        {
          "name": "invite plus provisioning makes a customer test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1745_admission_refuses_an_unconfigured_platform_tenant_naming_what_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_excludes_its_business_and_refuses_only_when_none_remain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_a_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-120 \u2014 who a service token is test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-120 \u2014 who a service token is test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-120 \u2014 who a service token is test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a contact who is signing up is admitted with nothing test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the refusal the visitor reads test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the refusal the operator reads test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag",
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