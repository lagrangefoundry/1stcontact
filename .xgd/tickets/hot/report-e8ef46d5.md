---
uid: report-e8ef46d5
id: REPORT-6766
type: report
title: 'Scoped quality: pass (10 tests, 0 failed)'
created_by: xgd
created_at: '2026-10-26T01:21:20.440898+00:00'
updated_at: '2026-10-26T01:21:20.440898+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-c46abfa6
  commit: 5b146de3bf5db52e2318392638f0f843a2cf7e81
---

{
  "timestamp": "2026-10-26T01:16:12.582023Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012329081073403358,
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
      "duration_seconds": 84.85283695789985,
      "passed": 10,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 10,
      "deselected": 2642,
      "test_filter": [
        "test_UAT_AC1018_",
        "test_UAT_AC1019_",
        "test_UAT_AC1020_",
        "test_UAT_AC1021_",
        "test_UAT_AC1022_",
        "test_UAT_AC1023_",
        "test_UAT_AC2009_",
        "test_UAT_AC2010_",
        "test_UAT_AC2011_",
        "test_UAT_AC2012_",
        "test_UAT_AC2013_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792977373947,\"endTime\":1792977373947,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792977373947,\"endTime\":1792977373947,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792977373947,\"endTime\":1792977373947,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1021_each_asset_reports_what_it_can_be_used_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1022_the_store_answers_from_the_command_line_with_no_editing_gesture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store over the builder origin test_UAT_AC1023_the_store_answers_from_the_builder_origin_and_refuses_a_missing_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2010_reading_an_asset_answers_for_anything_listed_by_id_or_handle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2011_add_draw_and_remove_write_bytes_never_the_definition_and_are_journalled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2009_a_definition_validates_with_or_without_the_retired_assets_key_and_nothing_reads_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2013_an_asset_reference_is_still_accepted_in_a_background_and_a_layer_child",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the declared control surface tells the truth about assets test_UAT_AC2012_the_surface_offers_no_alt_on_assets_and_never_makes_registration_a_precondition",
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