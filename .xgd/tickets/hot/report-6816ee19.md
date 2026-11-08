---
uid: report-6816ee19
id: REPORT-11313
type: report
title: 'Report: batch_quality_check for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T06:36:12.750847+00:00'
updated_at: '2026-11-08T06:36:12.750847+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-4cabde9a
  parent_report_uid: report-0b06d9b6
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T06:32:24.067342Z",
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
      "duration_seconds": 8.255855292081833,
      "passed": 93,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 93,
      "deselected": 22,
      "test_filter": [
        "test_UAT_AC2097_",
        "test_UAT_AC2378_",
        "test_UAT_AC1690_",
        "test_UAT_AC1693_",
        "test_UAT_AC1694_",
        "test_UAT_AC1697_",
        "test_UAT_AC1698_",
        "test_UAT_FC_REQ_207_",
        "test_UAT_FC_REQ_173_",
        "test_UAT_FC_REQ-122_",
        "test_UAT_FC_REQ-146_the_walk_reaches_the_workers_real_runtime_modules",
        "test_UAT_FC_REQ-146_type_only_imports_are_classified_correctly",
        "test_UAT_FC_REQ-146_a_planted_filesystem_import_is_caught",
        "test_UAT_FC_REQ-146_comment_stripping_keeps_the_code",
        "test_UAT_FC_REQ-146_no_filesystem_module_can_reach_the_worker",
        "test_UAT_FC_REQ-146_no_runtime_module_resolution_survives_on_the_worker_path",
        "test_UAT_FC_REQ-146_the_ai_library_is_reached_as_a_bundled_static_import",
        "test_UAT_FC_REQ-146_the_generated_shim_is_not_committed",
        "test_UAT_FC_REQ-146_a_secret_is_scrubbed_from_whatever_the_worker_says",
        "test_UAT_FC_REQ-146_redaction_is_inert_when_there_is_nothing_to_protect",
        "test_UAT_AC1057_",
        "test_UAT_AC1404_",
        "test_UAT_AC1405_",
        "test_UAT_AC1408_",
        "test_UAT_AC1409_",
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1688_",
        "test_UAT_AC1689_",
        "test_UAT_AC1691_",
        "test_UAT_AC1692_",
        "test_UAT_AC1695_",
        "test_UAT_AC1696_",
        "test_UAT_AC1699_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "eMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794119551640,\"endTime\":1794119551702,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description-session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"status\":\"passed\",\"title\":\"test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"duration\":789,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"status\":\"passed\",\"title\":\"test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"status\":\"passed\",\"title\":\"test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"duration\":83,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794119550607,\"endTime\":1794119551557,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_a_turn_runs_in_workerd_and_its_edit_lands_in_the_store\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_a_turn_runs_in_workerd_and_its_edit_lands_in_the_store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_reloading_resumes_the_sites_conversation\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_reloading_resumes_the_sites_conversation\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_no_url_can_reach_the_conversation\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_no_url_can_reach_the_conversation\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_every_ai_write_is_audited_and_survives_a_restart\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_every_ai_write_is_audited_and_survives_a_restart\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_the_audit_is_append_only_across_concurrent_flushes\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_the_audit_is_append_only_across_concurrent_flushes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_no_api_key_appears_in_a_response_or_an_error\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_no_api_key_appears_in_a_response_or_an_error\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_a_missing_key_costs_a_turn_and_not_the_conversation\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_a_missing_key_costs_a_turn_and_not_the_conversation\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_the_worker_carries_only_the_operations_it_can_run\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_the_worker_carries_only_the_operations_it_can_run\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_the_archive_reports_an_absent_session_rather_than_inventing_one\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_the_archive_reports_an_absent_session_rather_than_inventing_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794119545416,\"endTime\":1794119545416,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-173 \u2014 the full text lands in one marked comment\"],\"fullName\":\"REQ-173 \u2014 the full text lands in one marked comment test_UAT_FC_REQ_173_the_documents_own_text_is_written_to_a_material_text_comment\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_documents_own_text_is_written_to_a_material_text_comment\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 the full text lands in one marked comment\"],\"fullName\":\"REQ-173 \u2014 the full text lands in one marked comment test_UAT_FC_REQ_173_material_with_no_extracted_text_writes_no_comment\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_material_with_no_extracted_text_writes_no_comment\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 the two indexes read the same corpus through different eyes\"],\"fullName\":\"REQ-173 \u2014 the two indexes read the same corpus through different eyes test_UAT_FC_REQ_173_the_chunk_index_reads_the_full_text_and_the_document_index_the_digest\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_chunk_index_reads_the_full_text_and_the_document_index_the_digest\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 a deployment that cannot describe refuses the upload\"],\"fullName\":\"REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_ingestion_is_refused_with_the_reason_when_no_key_is_configured\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_ingestion_is_refused_with_the_reason_when_no_key_is_configured\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 a deployment that cannot describe refuses the upload\"],\"fullName\":\"REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_the_fetch_entry_point_is_gated_too\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_fetch_entry_point_is_gated_too\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 a deployment that cannot describe refuses the upload\"],\"fullName\":\"REQ-173 \u2014 a deployment that cannot describe refuses the upload test_UAT_FC_REQ_173_the_status_route_says_which_deployment_this_is\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ_173_the_status_route_says_which_deployment_this_is\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794119552464,\"endTime\":1794119552522,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-173_text_comment.workers.test.ts\"}]}",
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
          "name": "REQ-122 \u2014 a turn changes the site test_UAT_FC_REQ-122_a_turn_that_calls_a_tool_changes_the_draft_and_streams_what_it_did",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 a turn changes the site test_UAT_FC_REQ-122_a_refused_call_comes_back_correctable_and_leaves_the_draft_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 one session per site test_UAT_FC_REQ-122_the_conversation_persists_and_is_replayed_from_the_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 one session per site test_UAT_FC_REQ-122_two_sites_are_two_conversations_over_two_tool_surfaces",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 what the model is told test_UAT_FC_REQ-122_the_model_is_primed_with_the_generated_manual_and_bound_to_this_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 what the model is told test_UAT_FC_REQ-122_an_enum_reaches_the_model_as_a_sentence_it_can_act_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 when the assistant cannot run test_UAT_FC_REQ-122_a_missing_api_key_is_explained_without_losing_the_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 \u2014 when the assistant cannot run test_UAT_FC_REQ-122_a_failure_mid_turn_arrives_in_the_stream_rather_than_stopping_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 the assistant is in the split test_UAT_FC_REQ-122_the_secondary_is_a_live_chat_panel_bound_to_the_shown_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 the assistant is in the split test_UAT_FC_REQ-122_switching_site_switches_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 the assistant is in the split test_UAT_FC_REQ-122_a_turn_is_sent_for_the_site_on_screen_and_streams_back_into_the_panel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 the pane says what is wrong test_UAT_FC_REQ-122_an_unavailable_assistant_is_explained_in_the_panel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-122 the pane says what is wrong test_UAT_FC_REQ-122_an_unreachable_origin_is_reported_rather_than_left_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 the import walk actually discriminates test_UAT_FC_REQ-146_the_walk_reaches_the_workers_real_runtime_modules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 the import walk actually discriminates test_UAT_FC_REQ-146_type_only_imports_are_classified_correctly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 the import walk actually discriminates test_UAT_FC_REQ-146_a_planted_filesystem_import_is_caught",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 the import walk actually discriminates test_UAT_FC_REQ-146_comment_stripping_keeps_the_code",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_no_filesystem_module_can_reach_the_worker",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_no_runtime_module_resolution_survives_on_the_worker_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_the_ai_library_is_reached_as_a_bundled_static_import",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_the_generated_shim_is_not_committed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_a_secret_is_scrubbed_from_whatever_the_worker_says",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_redaction_is_inert_when_there_is_nothing_to_protect",
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
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_the_description_comes_back_from_a_session_prompted_with_the_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_the_picture_is_sent_as_an_image_block_not_as_prose_about_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_the_describer_is_primed_with_the_image_prompt_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_the_describer_is_offered_no_tools",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_two_images_do_not_share_a_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_a_failing_describer_still_closes_its_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_the_image_and_document_describers_do_not_cross_wire",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-207 \u2014 the image describer is a session on the AI host test_UAT_FC_REQ_207_the_DescribeImage_seam_did_not_move",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn leaves one chat ticket whose body the fold never writes test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly",
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
          "name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order",
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