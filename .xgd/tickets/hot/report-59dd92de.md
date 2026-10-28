---
uid: report-59dd92de
id: REPORT-6845
type: report
title: 'Scoped quality: pass (24 tests, 0 failed)'
created_by: xgd
created_at: '2026-10-28T21:14:57.233197+00:00'
updated_at: '2026-10-28T21:14:57.233197+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-c4f329d3
  commit: faa67fb24a9ed551e5d7073263a327de8146ad91
---

{
  "timestamp": "2026-10-28T21:10:18.184477Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017024995759129524,
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
      "duration_seconds": 69.22947700018995,
      "passed": 24,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 24,
      "deselected": 2674,
      "test_filter": [
        "test_UAT_AC1291_",
        "test_UAT_AC1292_",
        "test_UAT_AC1293_",
        "test_UAT_AC1294_",
        "test_UAT_AC1295_",
        "test_UAT_AC1296_",
        "test_UAT_AC1297_",
        "test_UAT_AC1298_",
        "test_UAT_AC1299_",
        "test_UAT_AC1300_",
        "test_UAT_AC1301_",
        "test_UAT_AC1302_",
        "test_UAT_AC1303_",
        "test_UAT_AC1304_",
        "test_UAT_AC1305_",
        "test_UAT_AC1306_",
        "test_UAT_AC1632_",
        "test_UAT_AC1633_",
        "test_UAT_AC1647_",
        "test_UAT_AC1648_",
        "test_UAT_AC1649_",
        "test_UAT_AC2058_",
        "test_UAT_AC2059_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793221819185,\"endTime\":1793221819185,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793221819185,\"endTime\":1793221819185,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793221819185,\"endTime\":1793221819185,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the packed module is written on every application build test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1296_every_excluded_document_is_named_individually",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document",
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