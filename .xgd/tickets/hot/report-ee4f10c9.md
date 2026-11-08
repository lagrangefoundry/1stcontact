---
uid: report-ee4f10c9
id: REPORT-11284
type: report
title: 'Scoped quality: fail (57 tests, 3 failed, 2 orphan AC(s))'
created_by: xgd
created_at: '2026-11-08T05:19:42.425597+00:00'
updated_at: '2026-11-08T05:19:42.425597+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-a58a0974
  commit: 8d3de5e349b03a76129927417981efb2adf69312
---

{
  "timestamp": "2026-11-08T05:16:29.487111Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010908301919698715,
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
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 6.0055899997241795,
      "passed": 54,
      "failed": 3,
      "skipped": 0,
      "errors": 0,
      "total": 57,
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
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_AC2054_",
        "test_UAT_AC2055_",
        "test_UAT_AC2056_",
        "test_UAT_AC2057_",
        "test_UAT_AC2066_",
        "test_UAT_AC2088_",
        "test_UAT_AC2089_",
        "test_UAT_AC2090_",
        "test_UAT_AC2091_",
        "test_UAT_AC2107_",
        "test_UAT_AC2108_",
        "test_UAT_AC2109_",
        "test_UAT_AC2110_",
        "test_UAT_AC2111_",
        "test_UAT_AC2374_",
        "test_UAT_AC2375_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "t-chat-ledger.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a conversation is not a property of the process that opened it\"],\"fullName\":\"a conversation is not a property of the process that opened it test_UAT_AC1456_a_turn_runs_on_a_process_that_never_opened_the_session\",\"status\":\"passed\",\"title\":\"test_UAT_AC1456_a_turn_runs_on_a_process_that_never_opened_the_session\",\"duration\":92,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no knowledge base to open is ordinary on the deployed host too\"],\"fullName\":\"no knowledge base to open is ordinary on the deployed host too test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent\",\"status\":\"passed\",\"title\":\"test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"an unresolvable identifier is refused in the channel the caller is reading\"],\"fullName\":\"an unresolvable identifier is refused in the channel the caller is reading test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion\",\"status\":\"passed\",\"title\":\"test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114995567,\"endTime\":1794114995725,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-conversation-continuity.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a conversation on the deployed runtime reads the design documents\"],\"fullName\":\"a conversation on the deployed runtime reads the design documents test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it\",\"duration\":96,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the deployed session is primed with the map and granted the read set\"],\"fullName\":\"the deployed session is primed with the map and granted the read set test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes\",\"status\":\"passed\",\"title\":\"test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no embedding model is a second route to no knowledge operations\"],\"fullName\":\"no embedding model is a second route to no knowledge operations test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations\",\"status\":\"passed\",\"title\":\"test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114995562,\"endTime\":1794114995741,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a whole turn runs on the deployed host\"],\"fullName\":\"a whole turn runs on the deployed host test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store\",\"duration\":102,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a conversation is replayed out of the deployed store after the host is gone\"],\"fullName\":\"a conversation is replayed out of the deployed store after the host is gone test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart\",\"status\":\"passed\",\"title\":\"test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a transcript is stored in one language-neutral form\"],\"fullName\":\"a transcript is stored in one language-neutral form test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no credential the host holds appears in anything it says\"],\"fullName\":\"no credential the host holds appears in anything it says test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream\",\"status\":\"passed\",\"title\":\"test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"transcripts live outside the region site files are addressed within\"],\"fullName\":\"transcripts live outside the region site files are addressed within test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record\",\"status\":\"failed\",\"title\":\"test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record\",\"duration\":33,\"failureMessages\":[\"AssertionError: expected [ \u2026(3) ] to include 'draft/story-a58a0974/private-6/assets\u2026'\\n    at Proxy.<anonymous> (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1319:15)\\n    at Proxy.<anonymous> (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1156:15)\\n    at Proxy.methodWrapper (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-conversation-deployed.workers.test.ts:651:20\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794114995567,\"endTime\":1794114995834,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-conversation-deployed.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a turn on the deployed host leaves the conversation as one chat ticket\"],\"fullName\":\"a turn on the deployed host leaves the conversation as one chat ticket test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body\",\"status\":\"passed\",\"title\":\"test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body\",\"duration\":98,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"two writers folding onto one conversation conflict loudly\"],\"fullName\":\"two writers folding onto one conversation conflict loudly test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact\",\"status\":\"passed\",\"title\":\"test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"what a conversation has been told is recorded on its own chat ticket\"],\"fullName\":\"what a conversation has been told is recorded on its own chat ticket test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket\",\"duration\":109,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114995562,\"endTime\":1794114995840,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live\",\"status\":\"passed\",\"title\":\"test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live\",\"duration\":86,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request\",\"status\":\"passed\",\"title\":\"test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request\",\"duration\":34,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty\",\"status\":\"passed\",\"title\":\"test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794114995569,\"endTime\":1794114995771,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-conversations-live-turn.workers.test.ts\"}]}",
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
          "status": "failed"
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
          "name": "the session\u2019s words are read from one configuration file, validated at start-up test_UAT_AC2374_priming_and_reminders_come_from_priming_json_and_malformed_entries_fail_naming_themselves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conditional entry drops with its separator, and the priming is bounded test_UAT_AC2375_quiet_entries_drop_whole_and_priming_is_capped_at_60000_naming_the_overflowing_entry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the product tier is empty and each text lives in one place test_UAT_AC2107_product_tier_is_empty_and_role_then_product_text_open_the_priming_with_no_restatement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the per-turn reminder is assembled from its configured entries test_UAT_AC2109_reminder_renders_six_ordered_entries_and_drops_each_signal_when_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the session is told three texts, each piece of material in exactly one test_UAT_AC2107_system_prompt_opens_with_the_role_then_carries_the_product_text_which_names_no_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "priming carries the grant-projected summary, with DescribeTools for the rest test_UAT_AC2108_priming_is_the_summary_manual_of_the_grant_and_describe_tools_is_offered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the per-turn reminder points to the method and carries only the per-turn signals test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present",
          "file": "",
          "status": "failed"
        },
        {
          "name": "where there is no ticket store the ledger surface is absent test_UAT_AC2110_command_line_host_offers_no_ledger_operation_and_still_takes_a_turn",
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
          "name": "the consultant writes the ledger into its own chat ticket test_UAT_AC2110_record_decision_and_name_engagement_write_only_this_conversations_chat_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the ledger is maintained on a stated trigger test_UAT_AC2111_ledger_guidance_states_settled_one_per_call_rejected_and_rename_once_known",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn leaves one chat ticket whose body the fold never writes test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly",
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
          "status": "failed"
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
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "the assistant is told it is a consultant test_UAT_AC2066_per_turn_reminder_the_model_receives_calls_the_owner_the_client",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the per-turn reminder points to the method and carries only the per-turn signals test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "transcripts live outside the region site files are addressed within test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": [],
      "synthetic": true
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 45,
      "failed": 2,
      "total": 45,
      "failures": [
        {
          "test_name": "AC-2066 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2066 'The per-turn reminder the model receives calls the site owner the client and never uses the old register word \"user\" or the former role name' (uid=acceptance_criterion-ea5191fe) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2066.",
          "ac_uid": "acceptance_criterion-ea5191fe",
          "ac_id": "AC-2066",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1409 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1409 'No request address names a conversation or the assistant's record, and a conversation is confined by the store's own account binding rather than by a key convention' (uid=acceptance_criterion-fa74adda) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1409.",
          "ac_uid": "acceptance_criterion-fa74adda",
          "ac_id": "AC-1409",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "test_failure",
        "field": "test results",
        "message": "3 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 3
        }
      }
    ]
  }
}