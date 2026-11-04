---
uid: report-49d04bfe
id: REPORT-10875
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-04T17:28:58.799514+00:00'
updated_at: '2026-11-04T17:28:58.799514+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-4630e921
  commit: 7ed67889b664524e1440acfc40db5e457f8dfa9d
---

{
  "timestamp": "2026-11-04T17:25:24.550911Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0003196250181645155,
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
      "duration_seconds": 2.532190209021792,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2258_",
        "test_UAT_AC2259_",
        "test_UAT_AC2260_",
        "test_UAT_AC2261_",
        "test_UAT_AC2262_",
        "test_UAT_AC2263_",
        "test_UAT_AC2264_",
        "test_UAT_AC2265_",
        "test_UAT_AC2266_",
        "test_UAT_AC2267_",
        "test_UAT_AC2268_",
        "test_UAT_AC2269_",
        "test_UAT_AC2270_",
        "test_UAT_AC2271_",
        "test_UAT_AC2272_",
        "test_UAT_AC2273_",
        "test_UAT_AC2274_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "_ties_capped_at_100\\x1b[32m 52\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 one sequence, in the order things happened\\x1b[2m > \\x1b[22mtest_UAT_AC2262_an_event_keeps_occurred_and_recorded_times_and_sorts_by_occurred\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 one sequence, in the order things happened\\x1b[2m > \\x1b[22mtest_UAT_AC2263_an_unseen_kind_is_accepted_and_read_back_verbatim\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 provenance is the earliest event\\x1b[2m > \\x1b[22mtest_UAT_AC2264_provenance_is_the_earliest_event_past_the_cap_and_null_without_history\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 the acts that exist today emit\\x1b[2m > \\x1b[22mtest_UAT_AC2265_first_invite_records_created_and_invited_and_reinvite_adds_one_invited\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 the acts that exist today emit\\x1b[2m > \\x1b[22mtest_UAT_AC2266_accepting_terms_records_signed_up_with_the_terms_version\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 the acts that exist today emit\\x1b[2m > \\x1b[22mtest_UAT_AC2267_a_seeded_platform_operator_records_created_once\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 the business barrier\\x1b[2m > \\x1b[22mtest_UAT_AC2268_events_belong_to_the_contacts_business_and_cross_business_access_is_refused\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-contact-history-events.workers.test.ts\\x1b[2m > \\x1b[22mstory-4630e921 \u2014 the detail the Contacts tab reads\\x1b[2m > \\x1b[22mtest_UAT_AC2269_contact_detail_carries_history_and_provenance_and_is_null_across_businesses\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m17 passed\\x1b[39m\\x1b[22m\\x1b[90m (17)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 09:25:25\n\\x1b[2m   Duration \\x1b[22m 1.52s\\x1b[2m (transform 368ms, setup 0ms, import 800ms, tests 229ms, environment 208ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-pmn_wzs_.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":9,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":17,\"numPassedTests\":17,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793813125988,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-4630e921 \u2014 the History section\"],\"fullName\":\"story-4630e921 \u2014 the History section test_UAT_AC2270_history_lists_events_newest_first_with_labels_and_unknown_kinds_verbatim\",\"status\":\"passed\",\"title\":\"test_UAT_AC2270_history_lists_events_newest_first_with_labels_and_unknown_kinds_verbatim\",\"duration\":25.726125000000025,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the History section\"],\"fullName\":\"story-4630e921 \u2014 the History section test_UAT_AC2271_a_recorded_stamp_appears_only_when_it_differs_from_occurred\",\"status\":\"passed\",\"title\":\"test_UAT_AC2271_a_recorded_stamp_appears_only_when_it_differs_from_occurred\",\"duration\":6.374666999999988,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the History section\"],\"fullName\":\"story-4630e921 \u2014 the History section test_UAT_AC2272_origin_line_comes_from_server_provenance_and_is_absent_without_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2272_origin_line_comes_from_server_provenance_and_is_absent_without_it\",\"duration\":16.683457999999973,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the History section\"],\"fullName\":\"story-4630e921 \u2014 the History section test_UAT_AC2273_an_empty_history_still_shows_the_section_with_nothing_recorded_yet\",\"status\":\"passed\",\"title\":\"test_UAT_AC2273_an_empty_history_still_shows_the_section_with_nothing_recorded_yet\",\"duration\":4.032792000000029,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the History section\"],\"fullName\":\"story-4630e921 \u2014 the History section test_UAT_AC2274_history_section_is_read_only_and_every_emitted_class_is_styled\",\"status\":\"passed\",\"title\":\"test_UAT_AC2274_history_section_is_read_only_and_every_emitted_class_is_styled\",\"duration\":6.63070799999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793813126711,\"endTime\":1793813126770.6306,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-contact-history-pane.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-4630e921 \u2014 events are immutable facts\"],\"fullName\":\"story-4630e921 \u2014 events are immutable facts test_UAT_AC2258_a_recorded_event_cannot_be_rewritten_and_has_no_status\",\"status\":\"passed\",\"title\":\"test_UAT_AC2258_a_recorded_event_cannot_be_rewritten_and_has_no_status\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 events are immutable facts\"],\"fullName\":\"story-4630e921 \u2014 events are immutable facts test_UAT_AC2259_a_changing_delivery_outcome_appends_against_the_same_ref\",\"status\":\"passed\",\"title\":\"test_UAT_AC2259_a_changing_delivery_outcome_appends_against_the_same_ref\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 events are immutable facts\"],\"fullName\":\"story-4630e921 \u2014 events are immutable facts test_UAT_AC2260_erasing_a_contact_erases_only_that_contacts_events\",\"status\":\"passed\",\"title\":\"test_UAT_AC2260_erasing_a_contact_erases_only_that_contacts_events\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 one sequence, in the order things happened\"],\"fullName\":\"story-4630e921 \u2014 one sequence, in the order things happened test_UAT_AC2261_history_is_one_newest_first_sequence_with_stable_ties_capped_at_100\",\"status\":\"passed\",\"title\":\"test_UAT_AC2261_history_is_one_newest_first_sequence_with_stable_ties_capped_at_100\",\"duration\":52,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 one sequence, in the order things happened\"],\"fullName\":\"story-4630e921 \u2014 one sequence, in the order things happened test_UAT_AC2262_an_event_keeps_occurred_and_recorded_times_and_sorts_by_occurred\",\"status\":\"passed\",\"title\":\"test_UAT_AC2262_an_event_keeps_occurred_and_recorded_times_and_sorts_by_occurred\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 one sequence, in the order things happened\"],\"fullName\":\"story-4630e921 \u2014 one sequence, in the order things happened test_UAT_AC2263_an_unseen_kind_is_accepted_and_read_back_verbatim\",\"status\":\"passed\",\"title\":\"test_UAT_AC2263_an_unseen_kind_is_accepted_and_read_back_verbatim\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 provenance is the earliest event\"],\"fullName\":\"story-4630e921 \u2014 provenance is the earliest event test_UAT_AC2264_provenance_is_the_earliest_event_past_the_cap_and_null_without_history\",\"status\":\"passed\",\"title\":\"test_UAT_AC2264_provenance_is_the_earliest_event_past_the_cap_and_null_without_history\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the acts that exist today emit\"],\"fullName\":\"story-4630e921 \u2014 the acts that exist today emit test_UAT_AC2265_first_invite_records_created_and_invited_and_reinvite_adds_one_invited\",\"status\":\"passed\",\"title\":\"test_UAT_AC2265_first_invite_records_created_and_invited_and_reinvite_adds_one_invited\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the acts that exist today emit\"],\"fullName\":\"story-4630e921 \u2014 the acts that exist today emit test_UAT_AC2266_accepting_terms_records_signed_up_with_the_terms_version\",\"status\":\"passed\",\"title\":\"test_UAT_AC2266_accepting_terms_records_signed_up_with_the_terms_version\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the acts that exist today emit\"],\"fullName\":\"story-4630e921 \u2014 the acts that exist today emit test_UAT_AC2267_a_seeded_platform_operator_records_created_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2267_a_seeded_platform_operator_records_created_once\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the business barrier\"],\"fullName\":\"story-4630e921 \u2014 the business barrier test_UAT_AC2268_events_belong_to_the_contacts_business_and_cross_business_access_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2268_events_belong_to_the_contacts_business_and_cross_business_access_is_refused\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4630e921 \u2014 the detail the Contacts tab reads\"],\"fullName\":\"story-4630e921 \u2014 the detail the Contacts tab reads test_UAT_AC2269_contact_detail_carries_history_and_provenance_and_is_null_across_businesses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2269_contact_detail_carries_history_and_provenance_and_is_null_across_businesses\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793813127424,\"endTime\":1793813127518,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-contact-history-events.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-4630e921 \u2014 the History section test_UAT_AC2270_history_lists_events_newest_first_with_labels_and_unknown_kinds_verbatim",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the History section test_UAT_AC2271_a_recorded_stamp_appears_only_when_it_differs_from_occurred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the History section test_UAT_AC2272_origin_line_comes_from_server_provenance_and_is_absent_without_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the History section test_UAT_AC2273_an_empty_history_still_shows_the_section_with_nothing_recorded_yet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the History section test_UAT_AC2274_history_section_is_read_only_and_every_emitted_class_is_styled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 events are immutable facts test_UAT_AC2258_a_recorded_event_cannot_be_rewritten_and_has_no_status",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 events are immutable facts test_UAT_AC2259_a_changing_delivery_outcome_appends_against_the_same_ref",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 events are immutable facts test_UAT_AC2260_erasing_a_contact_erases_only_that_contacts_events",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 one sequence, in the order things happened test_UAT_AC2261_history_is_one_newest_first_sequence_with_stable_ties_capped_at_100",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 one sequence, in the order things happened test_UAT_AC2262_an_event_keeps_occurred_and_recorded_times_and_sorts_by_occurred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 one sequence, in the order things happened test_UAT_AC2263_an_unseen_kind_is_accepted_and_read_back_verbatim",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 provenance is the earliest event test_UAT_AC2264_provenance_is_the_earliest_event_past_the_cap_and_null_without_history",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the acts that exist today emit test_UAT_AC2265_first_invite_records_created_and_invited_and_reinvite_adds_one_invited",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the acts that exist today emit test_UAT_AC2266_accepting_terms_records_signed_up_with_the_terms_version",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the acts that exist today emit test_UAT_AC2267_a_seeded_platform_operator_records_created_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the business barrier test_UAT_AC2268_events_belong_to_the_contacts_business_and_cross_business_access_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4630e921 \u2014 the detail the Contacts tab reads test_UAT_AC2269_contact_detail_carries_history_and_provenance_and_is_null_across_businesses",
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