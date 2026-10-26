---
uid: report-f91f4805
id: REPORT-6769
type: report
title: 'Scoped quality: pass (8 tests, 0 failed)'
created_by: xgd
created_at: '2026-10-26T01:35:12.866924+00:00'
updated_at: '2026-10-26T01:35:12.866924+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-aacb7060
  commit: adeeaa252d3caa1352499c15256b05680b6cc8dd
---

{
  "timestamp": "2026-10-26T01:30:14.708283Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011674989946186543,
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
      "duration_seconds": 79.50950683304109,
      "passed": 8,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 8,
      "deselected": 2647,
      "test_filter": [
        "test_UAT_AC1709_",
        "test_UAT_AC1710_",
        "test_UAT_AC1711_",
        "test_UAT_AC1712_",
        "test_UAT_AC1713_",
        "test_UAT_AC2015_",
        "test_UAT_AC2016_",
        "test_UAT_AC2017_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792978215791,\"endTime\":1792978215791,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792978215791,\"endTime\":1792978215791,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792978215791,\"endTime\":1792978215791,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears",
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