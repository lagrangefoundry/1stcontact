---
uid: report-22bd6aa0
id: REPORT-6772
type: report
title: 'Scoped quality: fail (21 tests, 4 failed, 2 orphan AC(s))'
created_by: xgd
created_at: '2026-10-26T01:48:31.679493+00:00'
updated_at: '2026-10-26T01:48:31.679493+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-1500b111
  commit: f109761138be67a94a20e0628e433bdcbcb94cbe
---

{
  "timestamp": "2026-10-26T01:43:16.435764Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001271250657737255,
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
      "duration_seconds": 89.71118104201742,
      "passed": 17,
      "failed": 4,
      "skipped": 0,
      "errors": 0,
      "total": 21,
      "deselected": 2639,
      "test_filter": [
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
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792978997431,\"endTime\":1792978997431,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792978997431,\"endTime\":1792978997431,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1792978997431,\"endTime\":1792978997431,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "status": "failed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the rights record read-only test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
          "file": "",
          "status": "failed"
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
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "AC-1715 \u2014 the whole account\u2019s material, with the open site as a badge test_UAT_AC1715_the_list_spans_every_binding_and_only_the_open_site_row_is_badged",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-1717 \u2014 the file itself, and the rights record read-only test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
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
      "passed": 17,
      "failed": 2,
      "total": 16,
      "failures": [
        {
          "test_name": "AC-1717 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1717 'Selecting a row shows the file itself and the rights record read-only, with no control by which a client can assert rights' (uid=acceptance_criterion-c3e5522d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1717.",
          "ac_uid": "acceptance_criterion-c3e5522d",
          "ac_id": "AC-1717",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1722 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1722 'Listing the account's material returns rows newest first carrying no descriptions, reading one adds its description, and neither reaches another account' (uid=acceptance_criterion-7a1805f5) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1722.",
          "ac_uid": "acceptance_criterion-7a1805f5",
          "ac_id": "AC-1722",
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
        "message": "4 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 4
        }
      }
    ]
  }
}