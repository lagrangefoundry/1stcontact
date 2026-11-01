---
uid: report-1842ac78
id: REPORT-7232
type: report
title: 'Report: batch_quality_check for STORY-103'
created_by: xgd
created_at: '2026-11-01T02:59:17.138322+00:00'
updated_at: '2026-11-01T02:59:17.138322+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-103
  parent_report_uid: report-7597fd1f
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T02:56:23.684056Z",
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
      "duration_seconds": 5.223638124996796,
      "passed": 24,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 24,
      "deselected": 13,
      "test_filter": [
        "test_UAT_AC2088_",
        "test_UAT_AC1057_",
        "test_UAT_AC1404_",
        "test_UAT_AC1405_",
        "test_UAT_AC1408_",
        "test_UAT_AC1409_",
        "test_UAT_FC_BUG-46_",
        "test_UAT_FC_BUG-38_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "C_BUG-46_the_partial_and_the_tail_are_one_message\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_the_partial_and_the_tail_are_one_message\",\"duration\":8.717917,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 the pane rejoins a turn in flight\"],\"fullName\":\"BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_settled_conversation_does_not_reattach\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_settled_conversation_does_not_reattach\",\"duration\":2.893416000000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 the pane rejoins a turn in flight\"],\"fullName\":\"BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_reload_between_turns_seeds_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_reload_between_turns_seeds_nothing\",\"duration\":3.3303750000000036,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 the pane rejoins a turn in flight\"],\"fullName\":\"BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_resumed_turn_still_reports_its_writes\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_resumed_turn_still_reports_its_writes\",\"duration\":3.8593340000000467,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 the pane rejoins a turn in flight\"],\"fullName\":\"BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_failed_rejoin_costs_the_tail_and_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_failed_rejoin_costs_the_tail_and_nothing_else\",\"duration\":3.408999999999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 the pane rejoins a turn in flight\"],\"fullName\":\"BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_transport_with_no_reattach_still_mounts\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_transport_with_no_reattach_still_mounts\",\"duration\":2.7133340000000317,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793501785251,\"endTime\":1793501785275.7134,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_UAT_FC_BUG-46_panel_rejoins_a_live_turn.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a whole turn runs on the deployed host\"],\"fullName\":\"a whole turn runs on the deployed host test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store\",\"duration\":76,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a conversation is replayed out of the deployed store after the host is gone\"],\"fullName\":\"a conversation is replayed out of the deployed store after the host is gone test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart\",\"status\":\"passed\",\"title\":\"test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a transcript is stored in one language-neutral form\"],\"fullName\":\"a transcript is stored in one language-neutral form test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"no credential the host holds appears in anything it says\"],\"fullName\":\"no credential the host holds appears in anything it says test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream\",\"status\":\"passed\",\"title\":\"test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"transcripts live outside the region site files are addressed within\"],\"fullName\":\"transcripts live outside the region site files are addressed within test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record\",\"status\":\"passed\",\"title\":\"test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793501788876,\"endTime\":1793501789075,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-assistant-conversation-deployed.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live\",\"status\":\"passed\",\"title\":\"test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-103 \u2014 a conversation stays whole across a live turn\"],\"fullName\":\"STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793501788875,\"endTime\":1793501788933,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-conversations-live-turn.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-38 \u2014 a conversation is not a property of one isolate\"],\"fullName\":\"BUG-38 \u2014 a conversation is not a property of one isolate test_UAT_FC_BUG-38_a_turn_runs_on_an_isolate_that_did_not_open_the_session\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-38_a_turn_runs_on_an_isolate_that_did_not_open_the_session\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-38 \u2014 a conversation is not a property of one isolate\"],\"fullName\":\"BUG-38 \u2014 a conversation is not a property of one isolate test_UAT_FC_BUG-38_the_conversation_continues_across_isolates\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-38_the_conversation_continues_across_isolates\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-38 \u2014 a conversation is not a property of one isolate\"],\"fullName\":\"BUG-38 \u2014 a conversation is not a property of one isolate test_UAT_FC_BUG-38_an_id_naming_no_site_is_still_refused\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-38_an_id_naming_no_site_is_still_refused\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793501788876,\"endTime\":1793501788964,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-46 \u2014 a reload during a turn keeps the turn\"],\"fullName\":\"BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_reload_mid_turn_still_shows_the_turn\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_reload_mid_turn_still_shows_the_turn\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 \u2014 a reload during a turn keeps the turn\"],\"fullName\":\"BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_reattached_client_sees_the_rest_of_the_turn_exactly_once\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_reattached_client_sees_the_rest_of_the_turn_exactly_once\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 \u2014 a reload during a turn keeps the turn\"],\"fullName\":\"BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_cancelled_stream_still_archives_its_turn\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_cancelled_stream_still_archives_its_turn\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 \u2014 a reload during a turn keeps the turn\"],\"fullName\":\"BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_an_abandoned_turn_is_recorded_aborted_not_complete\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_an_abandoned_turn_is_recorded_aborted_not_complete\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 \u2014 a reload during a turn keeps the turn\"],\"fullName\":\"BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_reattach_refuses_a_request_with_no_cursor\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_reattach_refuses_a_request_with_no_cursor\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-46 \u2014 a reload during a turn keeps the turn\"],\"fullName\":\"BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_frozen_panel_still_renders_the_conversation\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-46_a_frozen_panel_still_renders_the_conversation\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793501788875,\"endTime\":1793501789019,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_UAT_FC_BUG-46_reload_during_a_turn.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "name": "BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_the_partial_and_the_tail_are_one_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_settled_conversation_does_not_reattach",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_reload_between_turns_seeds_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_resumed_turn_still_reports_its_writes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_failed_rejoin_costs_the_tail_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 the pane rejoins a turn in flight test_UAT_FC_BUG-46_a_transport_with_no_reattach_still_mounts",
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
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-38 \u2014 a conversation is not a property of one isolate test_UAT_FC_BUG-38_a_turn_runs_on_an_isolate_that_did_not_open_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-38 \u2014 a conversation is not a property of one isolate test_UAT_FC_BUG-38_the_conversation_continues_across_isolates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-38 \u2014 a conversation is not a property of one isolate test_UAT_FC_BUG-38_an_id_naming_no_site_is_still_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_reload_mid_turn_still_shows_the_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_reattached_client_sees_the_rest_of_the_turn_exactly_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_cancelled_stream_still_archives_its_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_an_abandoned_turn_is_recorded_aborted_not_complete",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_reattach_refuses_a_request_with_no_cursor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-46 \u2014 a reload during a turn keeps the turn test_UAT_FC_BUG-46_a_frozen_panel_still_renders_the_conversation",
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