---
uid: report-73fc8311
id: REPORT-12079
type: report
title: 'Scoped quality: pass (35 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-10T00:23:14.448242+00:00'
updated_at: '2026-11-10T00:23:14.448242+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-3cf3d57b
  commit: aedc2feb809e0805c697992d0a02f0a675044c21
---

{
  "timestamp": "2026-11-10T00:18:44.562420Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015570782124996185,
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
      "duration_seconds": 8.517734750173986,
      "passed": 35,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 35,
      "deselected": 3,
      "test_filter": [
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
        "test_UAT_AC2237_",
        "test_UAT_AC2364_",
        "test_UAT_AC2376_",
        "test_UAT_AC2377_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": ":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s\"],\"fullName\":\"BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_the_session_is_still_told_to_go_and_read_its_method\",\"status\":\"passed\",\"title\":\"test_UAT_AC2377_the_session_is_still_told_to_go_and_read_its_method\",\"duration\":0.4244579999999587,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269929239,\"endTime\":1794269929392.4246,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-priming-names-no-documents.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2364 \u2014 the Node host carries the reminder at the tail of the last user message\"],\"fullName\":\"AC-2364 \u2014 the Node host carries the reminder at the tail of the last user message test_UAT_AC2364_node_host_reminder_rides_last_user_message_tail_not_system_field\",\"status\":\"passed\",\"title\":\"test_UAT_AC2364_node_host_reminder_rides_last_user_message_tail_not_system_field\",\"duration\":34.89787500000011,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269929377,\"endTime\":1794269929411.898,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-reminder-channel.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-55 \u2014 search is called with indexes, not source\"],\"fullName\":\"BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_a_hit_can_be_searched_and_then_read\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_BUG-55_a_hit_can_be_searched_and_then_read\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-55 \u2014 search is called with indexes, not source\"],\"fullName\":\"BUG-55 \u2014 search is called with indexes, not source test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host\",\"status\":\"passed\",\"title\":\"test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host\",\"duration\":35.69137500000011,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-55 \u2014 search is called with indexes, not source\"],\"fullName\":\"BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_each_knowledge_base_is_keyed_by_its_own_declared_source\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_BUG-55_each_knowledge_base_is_keyed_by_its_own_declared_source\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-55 \u2014 search is called with indexes, not source\"],\"fullName\":\"BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_the_preflight_notices_when_the_store_and_the_repo_disagree\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_BUG-55_the_preflight_notices_when_the_store_and_the_repo_disagree\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269928937,\"endTime\":1794269928972.6914,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_UAT_FC_BUG-55_index_seam.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"both Worker paths send the model the whole priming\"],\"fullName\":\"both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder\",\"duration\":96,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269932817,\"endTime\":1794269932913,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-priming-delivery.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2364 \u2014 both Worker paths carry the reminder at the tail of the last user message\"],\"fullName\":\"AC-2364 \u2014 both Worker paths carry the reminder at the tail of the last user message test_UAT_AC2364_worker_paths_reminder_rides_last_user_message_tail_not_system_field\",\"status\":\"passed\",\"title\":\"test_UAT_AC2364_worker_paths_reminder_rides_last_user_message_tail_not_system_field\",\"duration\":96,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269932817,\"endTime\":1794269932913,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-reminder-channel.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a cold conversation is primed with both maps in one landscape section\"],\"fullName\":\"a cold conversation is primed with both maps in one landscape section test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first\",\"status\":\"passed\",\"title\":\"test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a client corpus small enough to list reaches the conversation in full\"],\"fullName\":\"a client corpus small enough to list reaches the conversation in full test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete\",\"status\":\"passed\",\"title\":\"test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"one search reaches both knowledge bases and returns one ranked list\"],\"fullName\":\"one search reaches both knowledge bases and returns one ranked list test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after\",\"status\":\"passed\",\"title\":\"test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after\",\"duration\":42,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a search hit from either knowledge base is read back, not refused\"],\"fullName\":\"a search hit from either knowledge base is read back, not refused test_UAT_AC2237_a_hit_from_each_knowledge_base_is_read_back_on_the_worker\",\"status\":\"passed\",\"title\":\"test_UAT_AC2237_a_hit_from_each_knowledge_base_is_read_back_on_the_worker\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a document uploaded mid-conversation is known by name on the next turn\"],\"fullName\":\"a document uploaded mid-conversation is known by name on the next turn test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild\",\"status\":\"passed\",\"title\":\"test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild\",\"duration\":102,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a turn on which nothing arrived carries no arrival notice at all\"],\"fullName\":\"a turn on which nothing arrived carries no arrival notice at all test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind\",\"status\":\"passed\",\"title\":\"test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind\",\"duration\":50,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an arrival is announced once and never again\"],\"fullName\":\"an arrival is announced once and never again test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice\",\"status\":\"passed\",\"title\":\"test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice\",\"duration\":114,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an unreadable record of what a conversation was told never costs the turn\"],\"fullName\":\"an unreadable record of what a conversation was told never costs the turn test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn\",\"duration\":79,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a conversation's coverage starts where the map's coverage ends\"],\"fullName\":\"a conversation's coverage starts where the map's coverage ends test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn\",\"duration\":85,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a resumed conversation's first turn back reports what arrived while away\"],\"fullName\":\"a resumed conversation's first turn back reports what arrived while away test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served\",\"status\":\"passed\",\"title\":\"test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a conversation is never announced to itself\"],\"fullName\":\"a conversation is never announced to itself test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus\",\"status\":\"passed\",\"title\":\"test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the arrival notice is last in a turn's context\"],\"fullName\":\"the arrival notice is last in a turn's context test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change\",\"status\":\"passed\",\"title\":\"test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"arrivals are the client's knowledge alone, and no client knowledge still takes turns\"],\"fullName\":\"arrivals are the client's knowledge alone, and no client knowledge still takes turns test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs\",\"status\":\"passed\",\"title\":\"test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs\",\"duration\":52,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794269932817,\"endTime\":1794269933594,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_each_priming_order_declares_exactly_one_boundary_and_it_is_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_with_a_knowledge_base_the_whole_priming_is_one_cached_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_without_a_knowledge_base_the_whole_priming_is_one_cached_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_the_boundary_renders_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_landscape_and_manual_are_assembled_once_a_session_not_once_a_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_no_shipped_priming_text_names_a_corpus_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_no_shipped_priming_text_names_a_document_by_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_the_purpose_still_carries_the_obligation_and_the_subjects",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_the_reminder_points_at_the_method_without_naming_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_both_declared_orders_are_scanned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_a_document_added_to_the_corpus_reaches_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_a_document_demoted_from_the_corpus_leaves_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_neither_change_cost_an_edit_to_the_authored_priming",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_a_document_retitled_in_the_corpus_is_retitled_in_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_the_session_is_still_told_to_go_and_read_its_method",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2364 \u2014 the Node host carries the reminder at the tail of the last user message test_UAT_AC2364_node_host_reminder_rides_last_user_message_tail_not_system_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2364 \u2014 both Worker paths carry the reminder at the tail of the last user message test_UAT_AC2364_worker_paths_reminder_rides_last_user_message_tail_not_system_field",
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