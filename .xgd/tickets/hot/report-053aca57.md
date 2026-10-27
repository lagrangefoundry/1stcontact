---
uid: report-053aca57
id: REPORT-6798
type: report
title: 'Scoped quality: fail (8 tests, 1 failed)'
created_by: xgd
created_at: '2026-10-27T20:54:41.812117+00:00'
updated_at: '2026-10-27T20:54:41.812117+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-47fb84e6
  commit: 3906203cea95758832a0d79065041e5618d31ad3
---

{
  "timestamp": "2026-10-27T20:50:07.575825Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011241692118346691,
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
      "duration_seconds": 65.106033958029,
      "passed": 7,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 8,
      "deselected": 2674,
      "test_filter": [
        "test_UAT_AC2036_",
        "test_UAT_AC2037_",
        "test_UAT_AC2038_",
        "test_UAT_AC2039_",
        "test_UAT_AC2040_",
        "test_UAT_AC2041_",
        "test_UAT_AC2042_",
        "test_UAT_AC2043_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793134208485,\"endTime\":1793134208485,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793134208485,\"endTime\":1793134208485,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793134208485,\"endTime\":1793134208485,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work",
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
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}