---
uid: report-c5b99f7d
id: REPORT-10893
type: report
title: 'Scoped quality: pass (21 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-04T18:14:30.627157+00:00'
updated_at: '2026-11-04T18:14:30.627157+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-219b4217
  commit: b750d3270d43ff05c69d57a158c21e74155bf6f9
---

{
  "timestamp": "2026-11-04T18:09:22.868040Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001407500822097063,
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
      "duration_seconds": 7.44093449995853,
      "passed": 21,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 21,
      "deselected": 0,
      "test_filter": [
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
        "test_UAT_AC2304_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "s\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_message_record.workers.test.ts\\x1b[2m > \\x1b[22mstory-219b4217 \u2014 the Contacts reads\\x1b[2m > \\x1b[22mtest_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_message_record.workers.test.ts\\x1b[2m > \\x1b[22mstory-219b4217 \u2014 the Contacts reads\\x1b[2m > \\x1b[22mtest_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\\x1b[32m 31\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_outgoing_message_record.workers.test.ts\\x1b[2m > \\x1b[22mstory-219b4217 \u2014 the Contacts reads\\x1b[2m > \\x1b[22mtest_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\\x1b[32m 54\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m21 passed\\x1b[39m\\x1b[22m\\x1b[90m (21)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 10:09:24\n\\x1b[2m   Duration \\x1b[22m 6.32s\\x1b[2m (transform 2.27s, setup 0ms, import 4.99s, tests 480ms, environment 347ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-o8737sl6.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":9,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":21,\"numPassedTests\":21,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793815764345,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-219b4217 \u2014 the email record type\"],\"fullName\":\"story-219b4217 \u2014 the email record type test_UAT_AC2287_email_type_is_registered_with_its_field_contract_and_refuses_a_record_without_an_address\",\"status\":\"passed\",\"title\":\"test_UAT_AC2287_email_type_is_registered_with_its_field_contract_and_refuses_a_record_without_an_address\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 queue, send, update\"],\"fullName\":\"story-219b4217 \u2014 queue, send, update test_UAT_AC2288_record_is_queued_naming_contact_and_address_before_the_sender_is_called\",\"status\":\"passed\",\"title\":\"test_UAT_AC2288_record_is_queued_naming_contact_and_address_before_the_sender_is_called\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 queue, send, update\"],\"fullName\":\"story-219b4217 \u2014 queue, send, update test_UAT_AC2289_successful_send_moves_the_same_record_to_sent_with_provider_id_and_send_time\",\"status\":\"passed\",\"title\":\"test_UAT_AC2289_successful_send_moves_the_same_record_to_sent_with_provider_id_and_send_time\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 queue, send, update\"],\"fullName\":\"story-219b4217 \u2014 queue, send, update test_UAT_AC2290_failed_send_resolves_with_a_failed_record_carrying_the_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC2290_failed_send_resolves_with_a_failed_record_carrying_the_reason\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 queue, send, update\"],\"fullName\":\"story-219b4217 \u2014 queue, send, update test_UAT_AC2291_stored_body_is_the_rendered_text_and_survives_a_later_template_change\",\"status\":\"passed\",\"title\":\"test_UAT_AC2291_stored_body_is_the_rendered_text_and_survives_a_later_template_change\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 queue, send, update\"],\"fullName\":\"story-219b4217 \u2014 queue, send, update test_UAT_AC2292_sending_goes_only_through_the_sender_passed_in\",\"status\":\"passed\",\"title\":\"test_UAT_AC2292_sending_goes_only_through_the_sender_passed_in\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2293_verified_delivery_and_bounce_land_on_the_record_in_the_business_that_sent_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2293_verified_delivery_and_bounce_land_on_the_record_in_the_business_that_sent_it\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2296_with_no_signing_secret_every_request_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2296_with_no_signing_secret_every_request_is_refused\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the webhook sits ahead of the Access gate\"],\"fullName\":\"story-219b4217 \u2014 the webhook sits ahead of the Access gate test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure\",\"status\":\"passed\",\"title\":\"test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\",\"status\":\"passed\",\"title\":\"test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\",\"status\":\"passed\",\"title\":\"test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\",\"duration\":54,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793815770372,\"endTime\":1793815770670,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_outgoing_message_record.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-219b4217 \u2014 the Messages section\"],\"fullName\":\"story-219b4217 \u2014 the Messages section test_UAT_AC2301_messages_section_lists_rows_newest_first_with_subject_time_status_and_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC2301_messages_section_lists_rows_newest_first_with_subject_time_status_and_reason\",\"duration\":29.985750000000053,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Messages section\"],\"fullName\":\"story-219b4217 \u2014 the Messages section test_UAT_AC2302_no_messages_says_nothing_sent_and_a_failed_read_says_it_could_not_be_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC2302_no_messages_says_nothing_sent_and_a_failed_read_says_it_could_not_be_read\",\"duration\":25.36445900000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the bounced marker in the list\"],\"fullName\":\"story-219b4217 \u2014 the bounced marker in the list test_UAT_AC2304_contacts_list_marks_only_bounced_contacts_and_drops_marks_on_business_switch\",\"status\":\"passed\",\"title\":\"test_UAT_AC2304_contacts_list_marks_only_bounced_contacts_and_drops_marks_on_business_switch\",\"duration\":8.196374999999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793815765373,\"endTime\":1793815765437.1963,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_outgoing_message_record.test.ts\"}]}",
      "stderr": "",
      "tests": [
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