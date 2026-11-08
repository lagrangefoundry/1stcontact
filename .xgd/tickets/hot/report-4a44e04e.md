---
uid: report-4a44e04e
id: REPORT-11348
type: report
title: 'Scoped quality: pass (210 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T07:52:59.119984+00:00'
updated_at: '2026-11-08T07:52:59.119984+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-d87c1fe2
  commit: 11e05a22249c7f2666bc8899b49ba7902d944838
---

{
  "timestamp": "2026-11-08T07:49:38.092954Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014525000005960464,
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
      "duration_seconds": 18.84926624968648,
      "passed": 210,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 210,
      "deselected": 3,
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
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
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
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
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
        "test_UAT_AC2054_",
        "test_UAT_AC2055_",
        "test_UAT_AC2056_",
        "test_UAT_AC2057_",
        "test_UAT_AC2066_",
        "test_UAT_AC2067_",
        "test_UAT_AC2088_",
        "test_UAT_AC2089_",
        "test_UAT_AC2090_",
        "test_UAT_AC2091_",
        "test_UAT_AC2097_",
        "test_UAT_AC2107_",
        "test_UAT_AC2108_",
        "test_UAT_AC2109_",
        "test_UAT_AC2110_",
        "test_UAT_AC2111_",
        "test_UAT_AC2237_",
        "test_UAT_AC2275_",
        "test_UAT_AC2276_",
        "test_UAT_AC2277_",
        "test_UAT_AC2278_",
        "test_UAT_AC2279_",
        "test_UAT_AC2280_",
        "test_UAT_AC2281_",
        "test_UAT_AC2282_",
        "test_UAT_AC2283_",
        "test_UAT_AC2284_",
        "test_UAT_AC2285_",
        "test_UAT_AC2286_",
        "test_UAT_AC2364_",
        "test_UAT_AC2369_",
        "test_UAT_AC2370_",
        "test_UAT_AC2371_",
        "test_UAT_AC2372_",
        "test_UAT_AC2373_",
        "test_UAT_AC2374_",
        "test_UAT_AC2375_",
        "test_UAT_AC2376_",
        "test_UAT_AC2377_",
        "test_UAT_AC2378_",
        "test_UAT_AC2379_",
        "test_UAT_AC2380_",
        "test_UAT_AC2381_",
        "test_UAT_AC2382_",
        "test_UAT_AC2383_",
        "test_UAT_AC2384_",
        "test_UAT_AC2385_",
        "test_UAT_AC2386_",
        "test_UAT_AC2387_",
        "test_UAT_AC2388_",
        "test_UAT_AC2389_",
        "test_UAT_AC2390_",
        "test_UAT_AC2391_",
        "test_UAT_AC2392_",
        "test_UAT_AC2393_",
        "test_UAT_AC2394_",
        "test_UAT_AC2395_",
        "test_UAT_AC2396_",
        "test_UAT_AC2397_",
        "test_UAT_AC2398_",
        "test_UAT_AC2399_",
        "test_UAT_AC2400_",
        "test_UAT_AC2401_",
        "test_UAT_AC2402_",
        "test_UAT_AC2403_",
        "test_UAT_AC2404_",
        "test_UAT_AC2405_",
        "test_UAT_AC2406_",
        "test_UAT_AC2407_",
        "test_UAT_AC2408_",
        "test_UAT_FC_BUG_65",
        "test_UAT_FC_REQ_182",
        "test_UAT_FC_REQ_205",
        "test_UAT_FC_REQ_206",
        "test_UAT_FC_REQ_207",
        "test_UAT_FC_REQ_208",
        "test_UAT_FC_REQ_209"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "94124197141,\"endTime\":1794124197180,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description-session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"status\":\"passed\",\"title\":\"test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"duration\":1068,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"status\":\"passed\",\"title\":\"test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"status\":\"passed\",\"title\":\"test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"duration\":67,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"duration\":61,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794124188655,\"endTime\":1794124189863,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"passed\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"passed\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794124196742,\"endTime\":1794124196782,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"status\":\"passed\",\"title\":\"test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the derived text part (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"status\":\"passed\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable\",\"duration\":59,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"status\":\"passed\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sending address is per template (REQ-205)\"],\"fullName\":\"story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"status\":\"passed\",\"title\":\"test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794124196321,\"endTime\":1794124196407,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts\"}]}",
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
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults",
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
          "name": "the Node CLI host sends the model the whole priming test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder",
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
          "name": "the per-turn reminder points to the method and carries only the per-turn signals test_UAT_AC2109_reminder_is_short_points_to_the_knowledge_base_and_carries_signals_only_when_present",
          "file": "",
          "status": "passed"
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
          "name": "story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host",
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
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_ink_and_advance_are_different_places",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_cap_top_and_ink_top_are_different_alignments",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_font_lines_derive_from_the_metrics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_axis_is_inferred_from_the_anchor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_shape_has_no_ink_or_baseline",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_node_reference_may_contain_a_dot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 the anchor vocabulary test_UAT_FC_REQ_209_a_relation_is_read_from_the_same_sentence_either_way",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_measure_reports_the_primitives_and_the_font_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_answers_one_number",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring, relating and solving through the surface test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 asserting on the write test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_measuring_script_is_valid_javascript",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_composed_runs_place_themselves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_ink_and_advance_are_measurably_different",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_every_glyph_has_an_extent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_node_with_no_id_appears_under_its_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_an_empty_node_is_flagged_not_omitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_drawing_that_names_no_real_font_is_reported_as_such",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_an_absent_family_falls_through_to_the_fallback",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_a_nested_transform_is_resolved_away",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-209 measuring a drawing for real test_UAT_FC_REQ_209_the_viewbox_comes_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the anchor vocabulary test_UAT_AC2393_anchors_are_a_closed_set_of_17_with_an_inferred_axis",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2394_measurement_is_root_space_primitives_fonts_once_no_internals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2395_text_reports_per_glyph_extents_and_tspan_runs_union_into_the_parent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2396_ink_advance_and_font_lines_are_distinct_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2397_fonts_report_requested_and_resolved_face",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c what a measurement reports test_UAT_AC2398_unidd_nodes_by_path_defs_skipped_degenerate_flagged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2399_relate_returns_b_minus_a_and_refuses_mixed_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2400_unknown_nodes_and_malformed_refs_are_refused_with_the_fix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2401_solve_returns_node_attr_value_and_applying_it_zeroes_relate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c relate and solve test_UAT_AC2402_solve_refuses_what_one_translation_cannot_do",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c recorded relations and assert test_UAT_AC2403_measure_reports_recorded_relations_with_their_current_delta",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c recorded relations and assert test_UAT_AC2404_assert_always_writes_and_reports_each_relation_against_the_written_drawing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c recorded relations and assert test_UAT_AC2405_write_image_without_assert_renders_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the operations on the consultant surface test_UAT_AC2406_with_no_browser_the_operations_are_offered_and_refuse_with_the_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the operations on the consultant surface test_UAT_AC2407_write_image_description_gives_the_three_authoring_rules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d2bee21c the operations on the consultant surface test_UAT_AC2408_drawing_operations_are_a_read_effect_group_reading_the_sites_own_drawings",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 rendering test_UAT_AC2284_render_substitutes_every_token_in_subject_and_body_and_names_the_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 rendering test_UAT_AC2285_render_refuses_on_absent_declared_token_empty_value_or_leftover_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending configuration test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending configuration test_UAT_AC2280_mail_credential_is_uncommitted_redacted_and_resolved_by_the_deploy_hook",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the fallback sending address test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses",
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
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket still edits test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder",
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
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown",
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
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the derived text part (REQ-205) test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7d255580 \u2014 the sending address is per template (REQ-205) test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender",
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