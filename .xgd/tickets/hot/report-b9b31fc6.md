---
uid: report-b9b31fc6
id: REPORT-11664
type: report
title: 'Scoped quality: pass (269 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T02:31:41.123533+00:00'
updated_at: '2026-11-09T02:31:41.123533+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-0758e7c5
  commit: 600afcce04667ebed842d56101b617e0a4203cc9
---

{
  "timestamp": "2026-11-09T02:27:03.858602Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014954106882214546,
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
      "duration_seconds": 34.326906374655664,
      "passed": 269,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 269,
      "deselected": 14,
      "test_filter": [
        "test_UAT_AC1029_",
        "test_UAT_AC1030_",
        "test_UAT_AC1031_",
        "test_UAT_AC1032_",
        "test_UAT_AC1033_",
        "test_UAT_AC1034_",
        "test_UAT_AC1035_",
        "test_UAT_AC1036_",
        "test_UAT_AC1110_",
        "test_UAT_AC1399_",
        "test_UAT_AC1400_",
        "test_UAT_AC1401_",
        "test_UAT_AC1402_",
        "test_UAT_AC1403_",
        "test_UAT_AC1412_",
        "test_UAT_AC1413_",
        "test_UAT_AC1414_",
        "test_UAT_AC1423_",
        "test_UAT_AC1424_",
        "test_UAT_AC1449_",
        "test_UAT_AC1623_",
        "test_UAT_AC1624_",
        "test_UAT_AC1654_",
        "test_UAT_AC1655_",
        "test_UAT_AC1656_",
        "test_UAT_AC1657_",
        "test_UAT_AC1658_",
        "test_UAT_AC1659_",
        "test_UAT_AC1660_",
        "test_UAT_AC1661_",
        "test_UAT_AC1662_",
        "test_UAT_AC1663_",
        "test_UAT_AC1664_",
        "test_UAT_AC1665_",
        "test_UAT_AC2022_",
        "test_UAT_AC2023_",
        "test_UAT_AC2024_",
        "test_UAT_AC2025_",
        "test_UAT_AC2026_",
        "test_UAT_AC2027_",
        "test_UAT_AC2028_",
        "test_UAT_AC2029_",
        "test_UAT_AC2030_",
        "test_UAT_AC2031_",
        "test_UAT_AC2032_",
        "test_UAT_AC2033_",
        "test_UAT_AC2034_",
        "test_UAT_AC2035_",
        "test_UAT_AC2036_",
        "test_UAT_AC2037_",
        "test_UAT_AC2038_",
        "test_UAT_AC2039_",
        "test_UAT_AC2040_",
        "test_UAT_AC2041_",
        "test_UAT_AC2042_",
        "test_UAT_AC2043_",
        "test_UAT_AC2067_",
        "test_UAT_AC2143_",
        "test_UAT_AC2144_",
        "test_UAT_AC2145_",
        "test_UAT_AC2146_",
        "test_UAT_AC2147_",
        "test_UAT_AC2148_",
        "test_UAT_AC2227_",
        "test_UAT_AC2228_",
        "test_UAT_AC2230_",
        "test_UAT_AC2231_",
        "test_UAT_AC2232_",
        "test_UAT_AC2244_",
        "test_UAT_AC2287_",
        "test_UAT_AC2288_",
        "test_UAT_AC2289_",
        "test_UAT_AC2290_",
        "test_UAT_AC2291_",
        "test_UAT_AC2292_",
        "test_UAT_AC2293_",
        "test_UAT_AC2294_",
        "test_UAT_AC2295_",
        "test_UAT_AC2296_",
        "test_UAT_AC2297_",
        "test_UAT_AC2298_",
        "test_UAT_AC2299_",
        "test_UAT_AC2300_",
        "test_UAT_AC2301_",
        "test_UAT_AC2302_",
        "test_UAT_AC2303_",
        "test_UAT_AC2304_",
        "test_UAT_AC2329_",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_AC2333_",
        "test_UAT_AC2334_",
        "test_UAT_AC2335_",
        "test_UAT_AC2372_",
        "test_UAT_AC2373_",
        "test_UAT_AC2426_",
        "test_UAT_AC2427_",
        "test_UAT_AC2428_",
        "test_UAT_AC2429_",
        "test_UAT_AC2430_",
        "test_UAT_AC2431_",
        "test_UAT_AC2432_",
        "test_UAT_AC2433_",
        "test_UAT_AC2434_",
        "test_UAT_AC2435_",
        "test_UAT_AC2436_",
        "test_UAT_AC2437_",
        "test_UAT_AC2438_",
        "test_UAT_AC2439_",
        "test_UAT_AC2440_",
        "test_UAT_AC2441_",
        "test_UAT_AC2442_",
        "test_UAT_AC2463_",
        "test_UAT_AC2464_",
        "test_UAT_AC2468_",
        "test_UAT_AC2469_",
        "test_UAT_AC2470_",
        "test_UAT_AC2471_",
        "test_UAT_AC2472_",
        "test_UAT_AC2473_",
        "test_UAT_AC2474_",
        "test_UAT_AC2475_",
        "test_UAT_AC2476_",
        "test_UAT_AC2477_",
        "test_UAT_AC2478_",
        "test_UAT_AC2479_",
        "test_UAT_AC2480_",
        "test_UAT_AC2481_",
        "test_UAT_AC2482_",
        "test_UAT_AC2483_",
        "test_UAT_AC2484_",
        "test_UAT_AC2485_",
        "test_UAT_AC2486_",
        "test_UAT_AC2487_",
        "test_UAT_AC2488_",
        "test_UAT_AC2489_",
        "test_UAT_AC2490_",
        "test_UAT_AC2491_",
        "test_UAT_AC2492_",
        "test_UAT_AC2493_",
        "test_UAT_AC2494_",
        "test_UAT_AC2495_",
        "test_UAT_AC2496_",
        "test_UAT_AC2497_",
        "test_UAT_AC2498_",
        "test_UAT_AC2499_",
        "test_UAT_AC2500_",
        "test_UAT_AC2501_",
        "test_UAT_AC2502_",
        "test_UAT_AC2503_",
        "test_UAT_AC2504_",
        "test_UAT_AC2505_",
        "test_UAT_AC2506_",
        "test_UAT_AC2507_",
        "test_UAT_AC2508_",
        "test_UAT_AC2509_",
        "test_UAT_AC2510_",
        "test_UAT_AC2511_",
        "test_UAT_AC2512_",
        "test_UAT_AC2513_",
        "test_UAT_AC2514_",
        "test_UAT_AC2515_",
        "test_UAT_AC2516_",
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
        "test_UAT_AC959_",
        "test_UAT_AC960_",
        "test_UAT_AC961_",
        "test_UAT_AC962_",
        "test_UAT_AC963_",
        "test_UAT_AC964_",
        "test_UAT_AC965_",
        "test_UAT_AC966_",
        "test_UAT_AC967_",
        "test_UAT_AC968_",
        "test_UAT_AC969_",
        "test_UAT_AC970_",
        "test_UAT_AC971_",
        "test_UAT_AC972_",
        "test_UAT_AC973_",
        "test_UAT_AC974_",
        "test_UAT_AC975_",
        "test_UAT_AC976_",
        "test_UAT_AC977_",
        "test_UAT_AC978_",
        "test_UAT_AC979_",
        "test_UAT_FC_BUG_73",
        "test_UAT_FC_BUG_75",
        "test_UAT_FC_REQ_215",
        "test_UAT_FC_REQ_216",
        "test_UAT_FC_REQ_218",
        "test_UAT_FC_REQ_223"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "eta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2296_with_no_signing_secret_every_request_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2296_with_no_signing_secret_every_request_is_refused\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the webhook sits ahead of the Access gate\"],\"fullName\":\"story-219b4217 \u2014 the webhook sits ahead of the Access gate test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure\",\"status\":\"passed\",\"title\":\"test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\",\"status\":\"passed\",\"title\":\"test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\",\"status\":\"passed\",\"title\":\"test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\",\"duration\":57,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794191258527,\"endTime\":1794191258860,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_outgoing_message_record.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"duration\":56,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"status\":\"passed\",\"title\":\"test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"duration\":99,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"status\":\"passed\",\"title\":\"test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"duration\":33,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"status\":\"passed\",\"title\":\"test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"duration\":33,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"duration\":34,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"status\":\"passed\",\"title\":\"test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"status\":\"passed\",\"title\":\"test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"status\":\"passed\",\"title\":\"test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"duration\":91,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"status\":\"passed\",\"title\":\"test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"duration\":80,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794191253275,\"endTime\":1794191253890,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/test_reconciliation_public_lead_capture.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_preview_names_the_control_app_store_and_deletes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_yes_removes_only_the_control_app_store_and_never_storage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_include_public_also_removes_the_public_site_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_listening_port_is_refused_and_nothing_is_deleted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_an_absent_store_is_already_empty_and_a_success",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_paths_resolve_from_the_repo_root_whatever_the_working_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased",
          "file": "",
          "status": "passed"
        },
        {
          "name": "steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_the_five_page_kinds_resolve_to_what_they_name_with_the_defaults",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2031_no_text_carries_the_base64_the_toolbox_audits_and_validates_and_other_results_stay_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the 1c CLI has no browser budget test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the picture schema the model is shown carries the sixth kind test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an image picture resolves to the stored picture it names test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an image picture missing its name is refused naming the field test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a stored picture is named however it is referenced test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict",
          "file": "",
          "status": "passed"
        },
        {
          "name": "compare accepts a stored picture on either side test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": ".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif",
          "file": "",
          "status": "passed"
        },
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
          "name": "story-179b8c06 \u2014 the composed client-behaviour asset (BUG-75) test_UAT_AC702_shipped_asset_loads_as_an_es_module_with_one_scoped_block_per_behavior_in_catalog_order",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the composed client-behaviour asset (BUG-75) test_UAT_AC2476_behaviors_sharing_a_top_level_name_each_run_against_their_own_value",
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
          "name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a business switch moves everything test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the account surface explains a lapse test_UAT_AC2147_account_surface_states_each_lapse_reason_and_switcher_only_suffixes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the word a person reads is Business test_UAT_AC2148_no_user_facing_string_in_builder_or_public_site_says_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC970_strip_re_derives_when_a_business_switch_or_a_restore_changes_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC974_business_selection_is_remembered_under_a_shell_wide_key_and_falls_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC959_renders_one_panel_per_declared_tab_and_opens_the_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC976_every_option_of_every_declared_tab_reaches_the_chrome",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the asset build emits and verifies the import graph test_UAT_AC2464_asset_build_emits_the_closed_framework_graph_verifies_it_and_refuses_a_tree_that_cannot_load",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the asset build emits and verifies the import graph test_UAT_AC2464_type_only_imports_are_not_emitted_and_an_import_quoted_in_a_comment_is_left_as_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_fails_1c_assets_naming_the_importer_and_the_specifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component consumption route test_UAT_AC962_absent_component_names_the_component_and_the_install_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a origin failure reporting test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the empty detail state is one styled box test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the declaration the product ships test_UAT_AC1654_the_clients_knowledge_base_is_declared_with_exactly_the_four_record_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the scaffold a fresh workspace gets test_UAT_AC1658_a_fresh_workspace_is_scaffolded_the_shipped_client_knowledge_base_field_for_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 a host serves only what it can resolve test_UAT_AC1659_the_release_build_offers_exactly_the_shipped_knowledge_base",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 one place decides how to reach the model test_UAT_AC2471_one_module_decides_how_to_embed_and_nothing_else_builds_an_embedder_or_reads_the_ai_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 one place decides how to reach the model test_UAT_AC2475_neither_rest_credential_variable_is_named_in_the_committed_wrangler_toml",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy",
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
          "name": "story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store",
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
          "name": "REQ-200 \u00b7 the apex is a published site test_UAT_AC2333_apex_pages_and_assets_resolve_at_the_root",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_AC2334_signed_out_by_default_and_signed_in_with_a_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_AC2335_a_session_dependent_response_is_not_shared_cached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC1 \u2014 a stored picture is addressable however it is referenced test_UAT_FC_REQ_218_a_stored_picture_is_named_however_it_is_referenced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC1 \u2014 a stored picture is addressable however it is referenced test_UAT_FC_REQ_218_a_name_that_means_two_pictures_is_refused_with_both",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC2 \u2014 the sixth kind is declared, and nothing else was added test_UAT_FC_REQ_218_the_sixth_kind_reaches_both_stores_through_one_verb",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC2 \u2014 the sixth kind is declared, and nothing else was added test_UAT_FC_REQ_218_the_declaration_carries_the_sixth_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC3 \u2014 screenshot answers for a stored picture as it does for a page test_UAT_FC_REQ_218_a_stored_picture_comes_back_as_a_picture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC3 \u2014 screenshot answers for a stored picture as it does for a page test_UAT_FC_REQ_218_a_photograph_reaches_the_model_with_no_decoder_in_this_product",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC4 \u2014 compare measures a stored picture against anything test_UAT_FC_REQ_218_compare_measures_a_stored_picture_against_a_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC5 \u2014 a drawing says what it gave up, and no picture can be driven test_UAT_FC_REQ_218_a_drawing_says_what_it_gave_up_and_cannot_be_driven",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-218 AC6 \u2014 the original is askable, and a host without a store says so test_UAT_FC_REQ_218_the_original_is_askable_and_a_host_that_holds_none_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the page carried across a channel switch test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the edit render carries for a modal test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 reading what the page is showing test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 putting a page into a state test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 putting a page into a state test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 putting a page into a state test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the mechanism does not reach test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the Messages section test_UAT_AC2301_messages_section_lists_rows_newest_first_with_subject_time_status_and_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the Messages section test_UAT_AC2302_no_messages_says_nothing_sent_and_a_failed_read_says_it_could_not_be_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the bounced marker in the list test_UAT_AC2304_contacts_list_marks_only_bounced_contacts_and_drops_marks_on_business_switch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the public form surface test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the public form surface test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
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
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 configuration selects the transport test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 configuration selects the transport test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 configuration selects the transport test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_builder_changed_site_refuses_409_and_is_byte_identical_force_lands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_fresh_slug_and_an_import_only_slug_both_land",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_1c_push_omits_force_unless_asked_and_force_sends_true",
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
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the email record type test_UAT_AC2287_email_type_is_registered_with_its_field_contract_and_refuses_a_record_without_an_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 queue, send, update test_UAT_AC2288_record_is_queued_naming_contact_and_address_before_the_sender_is_called",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 queue, send, update test_UAT_AC2289_successful_send_moves_the_same_record_to_sent_with_provider_id_and_send_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 queue, send, update test_UAT_AC2290_failed_send_resolves_with_a_failed_record_carrying_the_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 queue, send, update test_UAT_AC2291_stored_body_is_the_rendered_text_and_survives_a_later_template_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 queue, send, update test_UAT_AC2292_sending_goes_only_through_the_sender_passed_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2293_verified_delivery_and_bounce_land_on_the_record_in_the_business_that_sent_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2296_with_no_signing_secret_every_request_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the delivery webhook test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the webhook sits ahead of the Access gate test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the Contacts reads test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the Contacts reads test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the Contacts reads test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-219b4217 \u2014 the Contacts reads test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once",
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