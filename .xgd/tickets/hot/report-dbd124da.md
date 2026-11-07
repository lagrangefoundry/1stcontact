---
uid: report-dbd124da
id: REPORT-11185
type: report
title: 'Scoped quality: pass (204 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-07T22:14:26.584146+00:00'
updated_at: '2026-11-07T22:14:26.584146+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-05835b4c
  commit: 6b3cc6f290c05359b340c37669d9d3afc417d70c
---

{
  "timestamp": "2026-11-07T22:08:12.478353Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0002687079831957817,
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
      "duration_seconds": 38.7904164576903,
      "passed": 204,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 204,
      "deselected": 23,
      "test_filter": [
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
        "test_UAT_AC1412_",
        "test_UAT_AC1413_",
        "test_UAT_AC1414_",
        "test_UAT_AC1423_",
        "test_UAT_AC1424_",
        "test_UAT_AC1425_",
        "test_UAT_AC1426_",
        "test_UAT_AC1427_",
        "test_UAT_AC1454_",
        "test_UAT_AC1455_",
        "test_UAT_AC1623_",
        "test_UAT_AC1624_",
        "test_UAT_AC1714_",
        "test_UAT_AC1715_",
        "test_UAT_AC1716_",
        "test_UAT_AC1717_",
        "test_UAT_AC1718_",
        "test_UAT_AC1719_",
        "test_UAT_AC1720_",
        "test_UAT_AC1721_",
        "test_UAT_AC1722_",
        "test_UAT_AC1723_",
        "test_UAT_AC1724_",
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
        "test_UAT_AC1791_",
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
        "test_UAT_AC2075_",
        "test_UAT_AC2076_",
        "test_UAT_AC2077_",
        "test_UAT_AC2078_",
        "test_UAT_AC2079_",
        "test_UAT_AC2085_",
        "test_UAT_AC2086_",
        "test_UAT_AC2087_",
        "test_UAT_AC2112_",
        "test_UAT_AC2113_",
        "test_UAT_AC2114_",
        "test_UAT_AC2115_",
        "test_UAT_AC2116_",
        "test_UAT_AC2132_",
        "test_UAT_AC2133_",
        "test_UAT_AC2134_",
        "test_UAT_AC2135_",
        "test_UAT_AC2136_",
        "test_UAT_AC2137_",
        "test_UAT_AC2138_",
        "test_UAT_AC2139_",
        "test_UAT_AC2140_",
        "test_UAT_AC2141_",
        "test_UAT_AC2142_",
        "test_UAT_AC2161_",
        "test_UAT_AC2169_",
        "test_UAT_AC2170_",
        "test_UAT_AC2171_",
        "test_UAT_AC2172_",
        "test_UAT_AC2173_",
        "test_UAT_AC2174_",
        "test_UAT_AC2175_",
        "test_UAT_AC2176_",
        "test_UAT_AC2203_",
        "test_UAT_AC2204_",
        "test_UAT_AC2205_",
        "test_UAT_AC2206_",
        "test_UAT_AC2207_",
        "test_UAT_AC2208_",
        "test_UAT_AC2209_",
        "test_UAT_AC2210_",
        "test_UAT_AC2211_",
        "test_UAT_AC2244_",
        "test_UAT_AC2247_",
        "test_UAT_AC2248_",
        "test_UAT_AC2253_",
        "test_UAT_AC2254_",
        "test_UAT_AC2257_",
        "test_UAT_AC2324_",
        "test_UAT_AC2325_",
        "test_UAT_AC2326_",
        "test_UAT_AC2327_",
        "test_UAT_AC2328_",
        "test_UAT_AC2329_",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_AC2333_",
        "test_UAT_AC2334_",
        "test_UAT_AC2335_",
        "test_UAT_AC2336_",
        "test_UAT_AC2337_",
        "test_UAT_AC2338_",
        "test_UAT_AC2339_",
        "test_UAT_AC2340_",
        "test_UAT_AC2341_",
        "test_UAT_AC2342_",
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
        "test_UAT_AC697_",
        "test_UAT_AC698_",
        "test_UAT_AC699_",
        "test_UAT_AC700_",
        "test_UAT_AC701_",
        "test_UAT_AC702_",
        "test_UAT_AC703_",
        "test_UAT_AC704_",
        "test_UAT_AC722_",
        "test_UAT_AC808_",
        "test_UAT_AC809_",
        "test_UAT_AC810_",
        "test_UAT_AC811_",
        "test_UAT_AC877_",
        "test_UAT_AC878_",
        "test_UAT_AC903_",
        "test_UAT_AC904_",
        "test_UAT_AC905_",
        "test_UAT_AC906_",
        "test_UAT_AC907_",
        "test_UAT_AC908_",
        "test_UAT_AC909_",
        "test_UAT_AC911_",
        "test_UAT_AC912_",
        "test_UAT_AC913_",
        "test_UAT_FC_BUG_57",
        "test_UAT_FC_BUG_62",
        "test_UAT_FC_REQ_199",
        "test_UAT_FC_REQ_200",
        "test_UAT_FC_REQ_201",
        "test_UAT_FC_REQ_202",
        "test_UAT_FC_REQ_203"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "itles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"status\":\"passed\",\"title\":\"test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"status\":\"passed\",\"title\":\"test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"duration\":70,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 who may add and invite\"],\"fullName\":\"story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"duration\":87,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"duration\":47,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"status\":\"passed\",\"title\":\"test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"duration\":52,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"duration\":57,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794089320331,\"endTime\":1794089320931,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_contacts_add_invite.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a contact who is signing up is admitted with nothing\"],\"fullName\":\"a contact who is signing up is admitted with nothing test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused\",\"duration\":101,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the refusal the visitor reads\"],\"fullName\":\"the refusal the visitor reads test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the refusal the operator reads\"],\"fullName\":\"the refusal the operator reads test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag\",\"status\":\"passed\",\"title\":\"test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794089325308,\"endTime\":1794089325490,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_identity_signup_admission_refusal.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement\",\"duration\":140,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing\",\"duration\":167,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"status\":\"passed\",\"title\":\"test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour\",\"duration\":76,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 requesting a link\"],\"fullName\":\"story-e0ca0a36 \u2014 requesting a link test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"status\":\"passed\",\"title\":\"test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain\",\"duration\":42,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"status\":\"passed\",\"title\":\"test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link\",\"duration\":47,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the emailed link\"],\"fullName\":\"story-e0ca0a36 \u2014 the emailed link test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"status\":\"passed\",\"title\":\"test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 sessions at the builder\"],\"fullName\":\"story-e0ca0a36 \u2014 sessions at the builder test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"status\":\"passed\",\"title\":\"test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links\",\"duration\":95,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e0ca0a36 \u2014 the invite carries a token\"],\"fullName\":\"story-e0ca0a36 \u2014 the invite carries a token test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access\",\"duration\":82,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794089320005,\"endTime\":1794089320847,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_passwordless_sign_in.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 control bindings are validated in both directions test_UAT_AC808_control_bindings_validated_in_both_directions",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior modules paint only their invariant elements test_UAT_AC809_modules_ship_no_css_beyond_declared_invariant_elements",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the generated stylesheet carries chrome, not source test_UAT_AC810_generated_stylesheet_carries_module_chrome_and_no_component_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the relocated default look is an L2 preset test_UAT_AC811_l2_preset_supplies_a_vetted_default_look",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the module escapes its own config, and refuses an unsafe endpoint test_UAT_AC1414_module_escapes_both_sinks_and_refuses_an_unsafe_endpoint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavioural config validation test_UAT_AC697_config_validated_against_typed_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 slot presentation validated as L1 subtrees test_UAT_AC698_slots_validated_as_l1_subtrees",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel L1 slide track test_UAT_AC699_carousel_renders_l1_slide_track_from_config",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel autoplay/loop client behaviour test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 contact-form functional render + L1 controls test_UAT_AC701_contact_form_renders_functional_form_with_l1_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior client behaviour ships once per page test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 isolation conformance dimension test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 full five-dimension conformance obligation set test_UAT_AC704_survivors_declare_the_full_obligation_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 Behavior* contract naming is atomic test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole business, and a switch leaves nothing behind test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 role, kind and text narrow one listing; no used-on-this-site axis test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2018 \u2014 the warning and the Placed on row read one list test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 icon, title, role pill on one line test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2161 \u2014 only the never-placed site asset is marked test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2087 \u2014 a link in any description opens away from the builder, through every repaint test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 a business switch closes the feed, then re-reads, then reopens test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 a row redraws from the event; the body is re-read only for the open, unedited detail test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is one line, and truncation lands on the title test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is laid out icon, then title, then pills test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1811 \u2014 the content type chooses the reader, bounded above the record, download kept test_UAT_AC1811_each_content_type_gets_its_own_bounded_reader_above_the_record_with_the_download_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1812 \u2014 the expand control opens the same document in the workspace\u2019s own dialog test_UAT_AC1812_expanding_opens_the_same_material_at_modal_size_and_browsing_away_takes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1814 \u2014 one render-then-sanitize path, markup shown as source, an SVG left a picture test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1815 \u2014 a surface painted before the engines settle repaints once they do test_UAT_AC1815_a_cold_pane_upgrades_itself_including_an_open_expanded_window_and_keeps_its_editability",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one",
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
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension",
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
          "name": "REQ-200 \u00b7 account-chrome is a behavior module like any other test_UAT_FC_REQ_200_module_is_catalogued_beside_contact_form",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 account-chrome is a behavior module like any other test_UAT_FC_REQ_200_ships_a_slot_preset_asked_for_by_behavior_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the capability is declared per site, and never derived test_UAT_FC_REQ_200_absent_on_a_site_that_declares_no_accounts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the capability is declared per site, and never derived test_UAT_FC_REQ_200_declaration_is_a_site_field_and_not_a_member_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 two states, and what is in each test_UAT_FC_REQ_200_signed_out_offers_a_working_address_form",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 two states, and what is in each test_UAT_FC_REQ_200_signed_in_offers_the_portal_and_signed_out_does_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 two states, and what is in each test_UAT_FC_REQ_200_builder_link_follows_the_person_not_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 two states, and what is in each test_UAT_FC_REQ_200_states_are_hidden_by_the_modules_own_invariant_css",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the sent message cannot distinguish a known address test_UAT_FC_REQ_200_check_your_email_is_identical_either_way",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the sent message cannot distinguish a known address test_UAT_FC_REQ_200_only_an_unreachable_server_reports_an_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 L1 decides where it goes and what it looks like test_UAT_FC_REQ_200_two_sites_place_it_differently_and_both_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 L1 decides where it goes and what it looks like test_UAT_FC_REQ_200_no_branch_on_which_site_or_business_it_renders_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the apex is a published site test_UAT_FC_REQ_200_apex_serves_a_published_site_and_the_literal_is_gone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the apex is a published site test_UAT_AC2333_apex_pages_and_assets_resolve_at_the_root",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the apex is a published site test_UAT_FC_REQ_200_the_authored_apex_site_carries_the_module",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_AC2334_signed_out_by_default_and_signed_in_with_a_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_FC_REQ_200_no_published_content_becomes_gated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_AC2335_a_session_dependent_response_is_not_shared_cached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_FC_REQ_200_a_request_with_a_session_never_reads_the_shared_cache",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 a session does not cross a cookie domain test_UAT_FC_REQ_200_host_must_be_within_the_issuing_domain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 a session does not cross a cookie domain test_UAT_FC_REQ_200_a_cookie_from_another_domain_authenticates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2210_two_facets_narrow_independently_and_combine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value",
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
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts",
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
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2325 \u2014 the list hands out its cursor, and the feed is SSE keyed by seq test_UAT_AC2325_list_cursor_ready_frame_seq_ids_last_event_id_precedence_head_default_and_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2325 \u2014 the list hands out its cursor, and the feed is SSE keyed by seq test_UAT_AC2325_an_idle_feed_is_kept_alive_with_sse_comment_heartbeats",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 an event's row is the list's own row, built from the change test_UAT_AC2326_event_row_equals_the_re_read_list_row_and_is_built_without_reading_ticket_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2327 \u2014 the feed carries only the scoped business's material test_UAT_AC2327_a_second_business_writes_and_non_material_tickets_never_reach_the_subscription",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2328 \u2014 the baseline carries the change-log tables as the component declares them test_UAT_AC2328_baseline_change_log_tables_match_the_component_and_deliver_a_material_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
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
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 versions and configuration test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 versions and configuration test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2204_contact_begins_at_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the pipeline stage on the baseline schema test_UAT_AC2208_unstaged_contact_is_lead_and_seeded_operator_stage_agrees_with_its_stamp",
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