---
uid: report-187396ae
id: REPORT-7261
type: report
title: 'Scoped quality: pass (230 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T03:58:46.536562+00:00'
updated_at: '2026-11-01T03:58:46.536562+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-06a89294
  commit: 506e9f1fe42d39344e392b70f4c7a32e15222e2f
---

{
  "timestamp": "2026-11-01T03:55:44.153616Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017562508583068848,
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
      "duration_seconds": 13.397143207956105,
      "passed": 230,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 230,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1051_",
        "test_UAT_AC1052_",
        "test_UAT_AC1053_",
        "test_UAT_AC1054_",
        "test_UAT_AC1055_",
        "test_UAT_AC1056_",
        "test_UAT_AC1057_",
        "test_UAT_AC1058_",
        "test_UAT_AC1059_",
        "test_UAT_AC1060_",
        "test_UAT_AC1061_",
        "test_UAT_AC1062_",
        "test_UAT_AC1063_",
        "test_UAT_AC1064_",
        "test_UAT_AC1065_",
        "test_UAT_AC1066_",
        "test_UAT_AC1067_",
        "test_UAT_AC1068_",
        "test_UAT_AC1069_",
        "test_UAT_AC1070_",
        "test_UAT_AC1083_",
        "test_UAT_AC1084_",
        "test_UAT_AC1085_",
        "test_UAT_AC1086_",
        "test_UAT_AC1087_",
        "test_UAT_AC1088_",
        "test_UAT_AC1089_",
        "test_UAT_AC1090_",
        "test_UAT_AC1091_",
        "test_UAT_AC1092_",
        "test_UAT_AC1093_",
        "test_UAT_AC1094_",
        "test_UAT_AC1317_",
        "test_UAT_AC1318_",
        "test_UAT_AC1319_",
        "test_UAT_AC1320_",
        "test_UAT_AC1404_",
        "test_UAT_AC1405_",
        "test_UAT_AC1406_",
        "test_UAT_AC1407_",
        "test_UAT_AC1408_",
        "test_UAT_AC1409_",
        "test_UAT_AC1410_",
        "test_UAT_AC1456_",
        "test_UAT_AC1651_",
        "test_UAT_AC1652_",
        "test_UAT_AC1653_",
        "test_UAT_AC1678_",
        "test_UAT_AC1679_",
        "test_UAT_AC1680_",
        "test_UAT_AC1681_",
        "test_UAT_AC1682_",
        "test_UAT_AC1683_",
        "test_UAT_AC1684_",
        "test_UAT_AC1685_",
        "test_UAT_AC1686_",
        "test_UAT_AC1687_",
        "test_UAT_AC1688_",
        "test_UAT_AC1689_",
        "test_UAT_AC1690_",
        "test_UAT_AC1691_",
        "test_UAT_AC1692_",
        "test_UAT_AC1693_",
        "test_UAT_AC1694_",
        "test_UAT_AC1695_",
        "test_UAT_AC1696_",
        "test_UAT_AC1697_",
        "test_UAT_AC1698_",
        "test_UAT_AC1699_",
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
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1809_",
        "test_UAT_AC1810_",
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC1816_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_AC1819_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
        "test_UAT_AC2044_",
        "test_UAT_AC2045_",
        "test_UAT_AC2046_",
        "test_UAT_AC2047_",
        "test_UAT_AC2048_",
        "test_UAT_AC2049_",
        "test_UAT_AC2050_",
        "test_UAT_AC2051_",
        "test_UAT_AC2052_",
        "test_UAT_AC2053_",
        "test_UAT_AC2054_",
        "test_UAT_AC2055_",
        "test_UAT_AC2056_",
        "test_UAT_AC2057_",
        "test_UAT_AC2066_",
        "test_UAT_AC2068_",
        "test_UAT_AC2069_",
        "test_UAT_AC2070_",
        "test_UAT_AC2071_",
        "test_UAT_AC2072_",
        "test_UAT_AC2073_",
        "test_UAT_AC2074_",
        "test_UAT_AC2075_",
        "test_UAT_AC2076_",
        "test_UAT_AC2077_",
        "test_UAT_AC2078_",
        "test_UAT_AC2079_",
        "test_UAT_AC2080_",
        "test_UAT_AC2081_",
        "test_UAT_AC2082_",
        "test_UAT_AC2083_",
        "test_UAT_AC2084_",
        "test_UAT_AC2085_",
        "test_UAT_AC2086_",
        "test_UAT_AC2087_",
        "test_UAT_AC2088_",
        "test_UAT_AC2089_",
        "test_UAT_AC2090_",
        "test_UAT_AC2091_",
        "test_UAT_AC2092_",
        "test_UAT_AC2093_",
        "test_UAT_AC2094_",
        "test_UAT_AC2095_",
        "test_UAT_AC2096_",
        "test_UAT_AC2097_",
        "test_UAT_AC2098_",
        "test_UAT_FC_BUG_46",
        "test_UAT_FC_BUNDLE_34",
        "test_UAT_FC_REQ_166",
        "test_UAT_FC_REQ_173",
        "test_UAT_FC_REQ_175",
        "test_UAT_FC_REQ_178"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "the_public_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search\",\"status\":\"passed\",\"title\":\"test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search\",\"duration\":67,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there\",\"status\":\"passed\",\"title\":\"test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request\",\"status\":\"passed\",\"title\":\"test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"status\":\"passed\",\"title\":\"test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"status\":\"passed\",\"title\":\"test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793505356651,\"endTime\":1793505356904,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-material-ingestion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1813 \u2014 every listed row carries what its bytes are\"],\"fullName\":\"AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"duration\":904,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793505353483,\"endTime\":1793505354387,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-material-row-content-type.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-173 \u2014 the full text lands in one marked comment\"],\"fullName\":\"REQ-173 \u2014 the full text lands in one marked comment test_UAT_FC_REQ_173_the_documents_own_text_is_written_to_a_material_text_comment\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_documents_own_text_is_written_to_a_material_text_comment\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 the full text lands in one marked comment\"],\"fullName\":\"REQ-173 \u2014 the full text lands in one marked comment test_UAT_FC_REQ_173_material_with_no_extracted_text_writes_no_comment\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_material_with_no_extracted_text_writes_no_comment\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 the two indexes read the same corpus through different eyes\"],\"fullName\":\"REQ-173 \u2014 the two indexes read the same corpus through different eyes test_UAT_FC_REQ_173_the_chunk_index_reads_the_full_text_and_the_document_index_the_digest\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_chunk_index_reads_the_full_text_and_the_document_index_the_digest\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 a deployment that cannot describe refuses the upload\"],\"fullName\":\"REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_ingestion_is_refused_with_the_reason_when_no_key_is_configured\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_ingestion_is_refused_with_the_reason_when_no_key_is_configured\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 a deployment that cannot describe refuses the upload\"],\"fullName\":\"REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_the_fetch_entry_point_is_gated_too\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_fetch_entry_point_is_gated_too\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 a deployment that cannot describe refuses the upload\"],\"fullName\":\"REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_the_status_route_says_which_deployment_this_is\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_status_route_says_which_deployment_this_is\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793505356662,\"endTime\":1793505356742,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_UAT_FC_REQ-173_text_comment.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report\"],\"fullName\":\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"duration\":197,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket\"],\"fullName\":\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"status\":\"passed\",\"title\":\"test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"duration\":350,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link\"],\"fullName\":\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"duration\":64,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2082 \u2014 rights come from provenance\"],\"fullName\":\"AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"duration\":98,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\"],\"fullName\":\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"status\":\"passed\",\"title\":\"test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"duration\":56,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\"],\"fullName\":\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793505353516,\"endTime\":1793505354304,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_reference_material.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the assistant is told it is a consultant test_UAT_AC2054_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant is told it is a consultant test_UAT_AC2066_per_turn_reminder_the_model_receives_calls_the_owner_the_client",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant is told it is a consultant test_UAT_AC2055_new_session_is_recorded_and_reported_under_the_consultant_name_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation stored under the former name still works test_UAT_AC2056_session_stored_under_the_legacy_role_resumes_and_takes_an_editing_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the rename left nothing behind test_UAT_AC2057_no_working_tree_file_carries_the_legacy_role_word_except_the_alias",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no filesystem-backed junction or archive can reach the deployed artifact test_UAT_AC1406_the_artifacts_import_graph_carries_no_filesystem_module_or_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant library is bundled at build time test_UAT_AC1407_the_library_travels_in_the_artifact_and_a_missing_one_fails_the_build",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the model key ships as a deploy secret test_UAT_AC1410_the_deploy_asks_the_deployment_and_rehearses_the_same_decision",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the corpus arrives on the surface the site operations arrive on test_UAT_AC1317_knowledge_is_offered_beside_the_site_operations_and_audited_like_an_edit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the knowledge grant is read-only and confined by one declaration test_UAT_AC1318_the_grant_is_the_read_set_and_names_one_kb_on_both_scope_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is primed with the map and the manual, not the documents test_UAT_AC1319_priming_carries_the_map_then_the_purpose_then_the_manual",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no knowledge base is ordinary; one that cannot be opened is reported test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant answers for itself before any conversation exists test_UAT_AC1051_capability_answer_names_the_role_and_readiness_without_a_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "naming a site opens that site\u2019s conversation test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1053_naming_a_site_or_omitting_a_value_is_refused_as_malformed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1055_an_identifier_is_answered_only_when_it_names_a_site_this_account_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "two sites are two conversations test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the conversation is stored with the workspace test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the conversation is stored with the workspace test_UAT_AC1057_losing_the_host_mid_turn_costs_that_turn_and_not_the_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a transcript written by the deployed host is read by the local one test_UAT_AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "what the assistant is offered test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one",
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
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses",
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
          "name": "AC-1715 \u2014 the whole account, with the open site as a badge test_UAT_AC1715_every_placement_is_listed_and_only_material_placed_on_the_open_site_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_placement_and_text_narrow_conjunctively_over_one_listing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2018 \u2014 badge, Used on row and filter read one placement list test_UAT_AC2018_badge_used_on_row_and_filter_agree_on_every_row_across_a_site_switch",
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
          "name": "AC-1715 \u2014 the whole account\u2019s material, with the open site as a badge test_UAT_AC1715_the_list_spans_every_binding_and_only_the_open_site_row_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the rights record read-only test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page document reads as stored test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page document reads as stored test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "what the reproduction path can write, the assistant can write test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page map answers where every element is test_UAT_AC1083_map_emits_every_element_with_its_address_kind_and_scope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page map answers where every element is test_UAT_AC1084_labels_identify_an_element_and_carry_no_styling",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1085_get_returns_the_subtree_exactly_as_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1086_writing_back_what_was_read_is_accepted_and_changes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1087_replacing_an_element_replaces_its_subtree_and_spares_its_siblings",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1088_adding_and_removing_are_replacing_a_group_and_the_result_renders",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1089_an_element_outside_the_vocabulary_is_refused_whole",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1091_an_address_that_resolves_to_nothing_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1092_one_way_to_change_a_page_and_every_operation_is_declared",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the click-to-edit gesture still works on what the assistant composed test_UAT_AC1093_the_gesture_opens_and_saves_and_leaves_the_assistants_styling_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the click-to-edit gesture still works on what the assistant composed test_UAT_AC1094_the_gesture_exposes_no_fields_on_a_kind_it_does_not_edit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the document describer is a session on the AI host test_UAT_FC_REQ_173_the_digest_comes_back_from_a_session_prompted_with_the_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the document describer is a session on the AI host test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the document describer is a session on the AI host test_UAT_FC_REQ_173_the_describer_is_offered_no_tools",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the document describer is a session on the AI host test_UAT_FC_REQ_173_two_documents_do_not_share_a_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the document describer is a session on the AI host test_UAT_FC_REQ_173_a_failing_describer_still_closes_its_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a document body is a description, not a transcription test_UAT_FC_REQ_173_a_pdf_body_is_the_digest_and_its_text_comes_back_beside_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a document body is a description, not a transcription test_UAT_FC_REQ_173_a_text_document_splits_the_same_way_a_pdf_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a document body is a description, not a transcription test_UAT_FC_REQ_173_the_title_is_the_documents_own_and_the_prompt_asks_for_no_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a document body is a description, not a transcription test_UAT_FC_REQ_173_the_describer_credits_the_model_and_still_names_the_extractor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 what the describer is shown, and what it may not overrun test_UAT_FC_REQ_173_a_long_document_is_sampled_from_the_middle_as_well_as_the_head",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 what the describer is shown, and what it may not overrun test_UAT_FC_REQ_173_a_short_document_is_shown_whole",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 what the describer is shown, and what it may not overrun test_UAT_FC_REQ_173_the_kept_text_is_bounded_and_says_so_when_it_bites",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 extraction and description fail independently test_UAT_FC_REQ_173_a_document_with_no_describer_still_carries_its_text_and_its_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 extraction and description fail independently test_UAT_FC_REQ_173_a_describer_that_answers_with_nothing_is_not_a_lost_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 extraction and description fail independently test_UAT_FC_REQ_173_a_scan_is_unchanged_and_has_no_text_to_keep",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the branches that were already digests are untouched test_UAT_FC_REQ_173_an_image_and_a_font_carry_no_extracted_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_FC_REQ_173_an_unconfigured_deployment_shows_the_reason_and_disables_the_shell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_FC_REQ_173_a_configured_deployment_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_FC_REQ_173_no_session_is_opened_and_the_pane_says_the_same_thing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_FC_REQ_173_a_dropped_file_is_not_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the banner is visible as well as blocking test_UAT_FC_REQ_173_the_blocked_shell_is_dimmed_by_the_class_the_app_sets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 the page document reads and writes test_UAT_FC_REQ_175_the_page_map_says_what_colour_the_page_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 the page document reads and writes test_UAT_FC_REQ_175_reads_and_writes_the_page_background_as_a_palette_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 the page document reads and writes test_UAT_FC_REQ_175_naming_one_document_key_leaves_the_others_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 the page document reads and writes test_UAT_FC_REQ_175_every_document_key_the_schema_declares_is_writable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 the page document reads and writes test_UAT_FC_REQ_175_a_document_key_can_be_given_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 the page document reads and writes test_UAT_FC_REQ_175_the_element_tree_is_refused_by_name_not_ignored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 a change that would break the page is refused, and says why test_UAT_FC_REQ_175_a_ladder_rung_something_is_pinned_to_cannot_be_taken_away",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 a change that would break the page is refused, and says why test_UAT_FC_REQ_175_a_column_elements_line_up_against_cannot_be_taken_away",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 a change that would break the page is refused, and says why test_UAT_FC_REQ_175_a_typeface_with_nothing_to_render_it_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 a change that would break the page is refused, and says why test_UAT_FC_REQ_175_a_picture_the_site_does_not_hold_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 a change that would break the page is refused, and says why test_UAT_FC_REQ_175_an_inherited_broken_reference_does_not_block_an_unrelated_edit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 painting a page is authoring test_UAT_FC_REQ_175_the_document_pair_sits_with_set_l1_in_the_authoring_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 what the reproduction path can write, the consultant can write test_UAT_FC_REQ_175_the_corpus_is_present_and_exercises_every_document_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 what the reproduction path can write, the consultant can write test_UAT_FC_REQ_175_every_node_and_document_key_of_xgd/home_round_trips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 what the reproduction path can write, the consultant can write test_UAT_FC_REQ_175_every_node_and_document_key_of_xgd/whitepapers_round_trips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-175 \u2014 what the reproduction path can write, the consultant can write test_UAT_FC_REQ_175_every_node_and_document_key_of_gigabytealchemy/home_round_trips",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2044 \u2014 capture_site records a public page as a named reference test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2045 \u2014 list_references lists every capture with its recorded address and time test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2046 \u2014 describe_reference reports what one capture holds; an unknown name is an error naming the bundle test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_errors_on_name_without_capture_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2047 \u2014 the typed address is refused before any browser is leased test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2048 \u2014 subresources are checked on both hosts, redirect hops on the Worker only test_UAT_AC2048_subresources_guarded_on_both_hosts_hops_on_worker_refused_never_sent_and_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2049 \u2014 on the Worker, more than 5 distinct origins trips redirect-cap; a reference is still returned test_UAT_AC2049_worker_redirect_cap_trips_past_5_origins_later_requests_unsent_capture_still_returns",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2050 \u2014 on the Worker host, over 32 MiB trips response-cap and sends nothing further; the bundle is still returned test_UAT_AC2050_worker_response_cap_trips_past_32MiB_later_requests_unsent_bundle_still_returned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2051 \u2014 every capture_site call is audited with its URL; typed refusals are REFUSED, seam refusals are in the result test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is not a property of the process that opened it test_UAT_AC1456_a_turn_runs_on_a_process_that_never_opened_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no knowledge base to open is ordinary on the deployed host too test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an unresolvable identifier is refused in the channel the caller is reading test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation on the deployed runtime reads the design documents test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the deployed session is primed with the map and granted the read set test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no embedding model is a second route to no knowledge operations test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a whole turn runs on the deployed host test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is replayed out of the deployed store after the host is gone test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a transcript is stored in one language-neutral form test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no credential the host holds appears in anything it says test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream",
          "file": "",
          "status": "passed"
        },
        {
          "name": "transcripts live outside the region site files are addressed within test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn on the deployed host leaves the conversation as one chat ticket test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body",
          "file": "",
          "status": "passed"
        },
        {
          "name": "two writers folding onto one conversation conflict loudly test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "what a conversation has been told is recorded on its own chat ticket test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1744_case_and_padding_do_not_make_a_second_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
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
          "name": "the request path test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
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
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the full text lands in one marked comment test_UAT_FC_REQ_173_the_documents_own_text_is_written_to_a_material_text_comment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the full text lands in one marked comment test_UAT_FC_REQ_173_material_with_no_extracted_text_writes_no_comment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the two indexes read the same corpus through different eyes test_UAT_FC_REQ_173_the_chunk_index_reads_the_full_text_and_the_document_index_the_digest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_ingestion_is_refused_with_the_reason_when_no_key_is_configured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_the_fetch_entry_point_is_gated_too",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_the_status_route_says_which_deployment_this_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why",
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