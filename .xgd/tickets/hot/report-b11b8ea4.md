---
uid: report-b11b8ea4
id: REPORT-10922
type: report
title: 'Report: batch_quality_check for report-3f77b790'
created_by: xgd
created_at: '2026-11-04T19:58:58.806385+00:00'
updated_at: '2026-11-04T19:58:58.806385+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-3f77b790
  parent_report_uid: report-06a422ea
  batch_index: 1
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-04T19:54:42.664319Z",
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
      "duration_seconds": 7.826384917134419,
      "passed": 24,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 24,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1418_",
        "test_UAT_AC1422_",
        "test_UAT_AC903_",
        "test_UAT_AC1423_",
        "test_UAT_AC1424_",
        "test_UAT_AC1795_",
        "test_UAT_AC1796_",
        "test_UAT_AC1797_",
        "test_UAT_AC1798_",
        "test_UAT_AC1799_",
        "test_UAT_AC1802_",
        "test_UAT_AC1803_",
        "test_UAT_AC1804_",
        "test_UAT_AC1805_",
        "test_UAT_AC1806_",
        "test_UAT_AC1807_",
        "test_UAT_AC1808_",
        "test_UAT_AC2237_",
        "test_UAT_AC2244_",
        "test_UAT_AC2245_",
        "test_UAT_AC2246_",
        "test_UAT_FC_BUG-55_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-55 \u2014 search is called with indexes, not source\"],\"fullName\":\"BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_each_knowledge_base_is_keyed_by_its_own_declared_source\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-55_each_knowledge_base_is_keyed_by_its_own_declared_source\",\"duration\":1.5565000000000282,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-55 \u2014 search is called with indexes, not source\"],\"fullName\":\"BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_the_preflight_notices_when_the_store_and_the_repo_disagree\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-55_the_preflight_notices_when_the_store_and_the_repo_disagree\",\"duration\":0.7699579999999742,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793822085179,\"endTime\":1793822085217.77,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_UAT_FC_BUG-55_index_seam.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a cold conversation is primed with both maps in one landscape section\"],\"fullName\":\"a cold conversation is primed with both maps in one landscape section test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first\",\"status\":\"passed\",\"title\":\"test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first\",\"duration\":50,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a client corpus small enough to list reaches the conversation in full\"],\"fullName\":\"a client corpus small enough to list reaches the conversation in full test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete\",\"status\":\"passed\",\"title\":\"test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"one search reaches both knowledge bases and returns one ranked list\"],\"fullName\":\"one search reaches both knowledge bases and returns one ranked list test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after\",\"status\":\"passed\",\"title\":\"test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a search hit from either knowledge base is read back, not refused\"],\"fullName\":\"a search hit from either knowledge base is read back, not refused test_UAT_AC2237_a_hit_from_each_knowledge_base_is_read_back_on_the_worker\",\"status\":\"passed\",\"title\":\"test_UAT_AC2237_a_hit_from_each_knowledge_base_is_read_back_on_the_worker\",\"duration\":30,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a document uploaded mid-conversation is known by name on the next turn\"],\"fullName\":\"a document uploaded mid-conversation is known by name on the next turn test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild\",\"status\":\"passed\",\"title\":\"test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild\",\"duration\":53,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a turn on which nothing arrived carries no arrival notice at all\"],\"fullName\":\"a turn on which nothing arrived carries no arrival notice at all test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind\",\"status\":\"passed\",\"title\":\"test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an arrival is announced once and never again\"],\"fullName\":\"an arrival is announced once and never again test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice\",\"status\":\"passed\",\"title\":\"test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice\",\"duration\":54,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an unreadable record of what a conversation was told never costs the turn\"],\"fullName\":\"an unreadable record of what a conversation was told never costs the turn test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a conversation's coverage starts where the map's coverage ends\"],\"fullName\":\"a conversation's coverage starts where the map's coverage ends test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn\",\"status\":\"passed\",\"title\":\"test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a resumed conversation's first turn back reports what arrived while away\"],\"fullName\":\"a resumed conversation's first turn back reports what arrived while away test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served\",\"status\":\"passed\",\"title\":\"test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a conversation is never announced to itself\"],\"fullName\":\"a conversation is never announced to itself test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus\",\"status\":\"passed\",\"title\":\"test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the arrival notice is last in a turn's context\"],\"fullName\":\"the arrival notice is last in a turn's context test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change\",\"status\":\"passed\",\"title\":\"test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"arrivals are the client's knowledge alone, and no client knowledge still takes turns\"],\"fullName\":\"arrivals are the client's knowledge alone, and no client knowledge still takes turns test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs\",\"status\":\"passed\",\"title\":\"test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793822090317,\"endTime\":1793822090814,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem\"],\"fullName\":\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors\",\"status\":\"passed\",\"title\":\"test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem\"],\"fullName\":\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem\"],\"fullName\":\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793822090318,\"endTime\":1793822090458,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-publish-revision-cloud.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC903_a_published_url_serves_the_live_revision_whole\",\"status\":\"passed\",\"title\":\"test_UAT_AC903_a_published_url_serves_the_live_revision_whole\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793822090317,\"endTime\":1793822090495,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-published-site-serving.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_a_hit_can_be_searched_and_then_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_each_knowledge_base_is_keyed_by_its_own_declared_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_FC_BUG-55_the_preflight_notices_when_the_store_and_the_repo_disagree",
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
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding",
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
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}