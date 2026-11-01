---
uid: report-5e3306c9
id: REPORT-7577
type: report
title: 'Report: batch_quality_check for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T11:49:34.807612+00:00'
updated_at: '2026-11-01T11:49:34.807612+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-e674c60a
  parent_report_uid: report-e5febd9c
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T11:46:01.417982Z",
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
      "exit_code": 1,
      "duration_seconds": 10.71142275002785,
      "passed": 40,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 40,
      "deselected": 31,
      "test_filter": [
        "test_UAT_AC960_",
        "test_UAT_AC967_",
        "test_UAT_AC964_",
        "test_UAT_AC975_",
        "test_UAT_AC1400_",
        "test_UAT_AC1792_",
        "test_UAT_AC2110_",
        "test_UAT_AC2111_",
        "test_UAT_FC_REQ-171_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "71_the_purpose_names_the_documents_this_role_must_read\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_purpose_names_the_documents_this_role_must_read\",\"duration\":1.9955829999998969,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 the purpose is short and names what to read\"],\"fullName\":\"REQ-171 \u2014 the purpose is short and names what to read test_UAT_FC_REQ-171_the_purpose_names_both_corpora\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_purpose_names_both_corpora\",\"duration\":1.885957999999846,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 what was decided is written down\"],\"fullName\":\"REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_ledger_is_absent_where_there_is_nowhere_to_write\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_ledger_is_absent_where_there_is_nowhere_to_write\",\"duration\":1.7576250000001892,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 what was decided is written down\"],\"fullName\":\"REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_ledger_arrives_with_its_own_grant\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_ledger_arrives_with_its_own_grant\",\"duration\":2.149666999999681,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 what was decided is written down\"],\"fullName\":\"REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_a_decision_is_recorded_with_its_reasoning\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_a_decision_is_recorded_with_its_reasoning\",\"duration\":2.5270000000000437,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 what was decided is written down\"],\"fullName\":\"REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_entries_are_numbered_so_a_chunk_is_a_decision\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_entries_are_numbered_so_a_chunk_is_a_decision\",\"duration\":1.499374999999418,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 what was decided is written down\"],\"fullName\":\"REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_engagement_is_named_once_the_business_is_known\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_engagement_is_named_once_the_business_is_known\",\"duration\":1.950749999999971,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 what was decided is written down\"],\"fullName\":\"REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_ledger_never_reaches_the_site\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_ledger_never_reaches_the_site\",\"duration\":2.642166999999972,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793533568377,\"endTime\":1793533568435.642,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_UAT_FC_REQ-171_session_texts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the consultant writes the ledger into its own chat ticket\"],\"fullName\":\"the consultant writes the ledger into its own chat ticket test_UAT_AC2110_record_decision_and_name_engagement_write_only_this_conversations_chat_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_AC2110_record_decision_and_name_engagement_write_only_this_conversations_chat_ticket\",\"duration\":107,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the ledger is maintained on a stated trigger\"],\"fullName\":\"the ledger is maintained on a stated trigger test_UAT_AC2111_ledger_guidance_states_settled_one_per_call_rejected_and_rename_once_known\",\"status\":\"passed\",\"title\":\"test_UAT_AC2111_ledger_guidance_states_settled_one_per_call_rejected_and_rename_once_known\",\"duration\":34,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a turn leaves one chat ticket whose body the fold never writes\"],\"fullName\":\"a turn leaves one chat ticket whose body the fold never writes test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly\",\"status\":\"passed\",\"title\":\"test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793533571694,\"endTime\":1793533571872,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-assistant-chat-ledger.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a turn on the deployed host leaves the conversation as one chat ticket\"],\"fullName\":\"a turn on the deployed host leaves the conversation as one chat ticket test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body\",\"status\":\"passed\",\"title\":\"test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"two writers folding onto one conversation conflict loudly\"],\"fullName\":\"two writers folding onto one conversation conflict loudly test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"what a conversation has been told is recorded on its own chat ticket\"],\"fullName\":\"what a conversation has been told is recorded on its own chat ticket test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793533571694,\"endTime\":1793533571743,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793533571700,\"endTime\":1793533571710,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-workspace-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_the_first_decision_opens_the_ledger\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_first_decision_opens_the_ledger\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_each_decision_is_numbered_from_what_is_already_there\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_each_decision_is_numbered_from_what_is_already_there\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_a_decision_is_never_lost_to_a_race\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_a_decision_is_never_lost_to_a_race\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_a_clash_is_reported_as_something_to_retry\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_a_clash_is_reported_as_something_to_retry\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_an_unrelated_failure_is_not_dressed_up_as_a_clash\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_an_unrelated_failure_is_not_dressed_up_as_a_clash\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_no_ticket_yet_is_a_refusal_that_keeps_the_answer\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_no_ticket_yet_is_a_refusal_that_keeps_the_answer\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_naming_the_engagement_replaces_the_session_id\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_naming_the_engagement_replaces_the_session_id\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-171 \u2014 a decision survives the conversation\"],\"fullName\":\"REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_the_count_cannot_be_inflated_by_the_prose\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-171_the_count_cannot_be_inflated_by_the_prose\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793533571136,\"endTime\":1793533571138,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_UAT_FC_REQ-171_ledger.workers.test.ts\"}]}",
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
          "name": "where there is no ticket store the ledger surface is absent test_UAT_AC2110_command_line_host_offers_no_ledger_operation_and_still_takes_a_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the priming carries a summary guide, not a reference work test_UAT_FC_REQ-171_the_summary_is_a_fraction_of_the_full_manual",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the priming carries a summary guide, not a reference work test_UAT_FC_REQ-171_the_summary_keeps_what_you_choose_with",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the priming carries a summary guide, not a reference work test_UAT_FC_REQ-171_the_summary_drops_what_you_only_need_to_call_with",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the priming carries a summary guide, not a reference work test_UAT_FC_REQ-171_the_session_can_fetch_a_tools_full_entry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the priming carries a summary guide, not a reference work test_UAT_FC_REQ-171_every_capability_group_says_what_it_is_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 product material is written once, for every role test_UAT_FC_REQ-171_the_product_text_names_no_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 product material is written once, for every role test_UAT_FC_REQ-171_the_system_prompt_is_the_role_then_the_product",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 product material is written once, for every role test_UAT_FC_REQ-171_nothing_is_stated_in_two_places",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the role text is the role, derived from DOC-33 and DOC-35 test_UAT_FC_REQ-171_fluency_is_detected_not_assumed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the role text is the role, derived from DOC-33 and DOC-35 test_UAT_FC_REQ-171_a_real_decision_gets_options_not_iterations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the purpose is short and names what to read test_UAT_FC_REQ-171_the_purpose_names_the_documents_this_role_must_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 the purpose is short and names what to read test_UAT_FC_REQ-171_the_purpose_names_both_corpora",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_ledger_is_absent_where_there_is_nowhere_to_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_ledger_arrives_with_its_own_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_a_decision_is_recorded_with_its_reasoning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_entries_are_numbered_so_a_chunk_is_a_decision",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_engagement_is_named_once_the_business_is_known",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 what was decided is written down test_UAT_FC_REQ-171_the_ledger_never_reaches_the_site",
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
          "name": "a turn on the deployed host leaves the conversation as one chat ticket test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body",
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
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_the_first_decision_opens_the_ledger",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_each_decision_is_numbered_from_what_is_already_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_a_decision_is_never_lost_to_a_race",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_a_clash_is_reported_as_something_to_retry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_an_unrelated_failure_is_not_dressed_up_as_a_clash",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_no_ticket_yet_is_a_refusal_that_keeps_the_answer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_naming_the_engagement_replaces_the_session_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-171 \u2014 a decision survives the conversation test_UAT_FC_REQ-171_the_count_cannot_be_inflated_by_the_prose",
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