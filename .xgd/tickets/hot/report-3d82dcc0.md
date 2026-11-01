---
uid: report-3d82dcc0
id: REPORT-7182
type: report
title: 'Scoped quality: fail (19 tests, 2 failed)'
created_by: xgd
created_at: '2026-11-01T01:21:34.370109+00:00'
updated_at: '2026-11-01T01:21:34.370109+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-106
  commit: 7b2ec4d7bb1418d68324f1c7fde35aa45d046be3
---

{
  "timestamp": "2026-11-01T01:17:17.414436Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014083296991884708,
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
      "duration_seconds": 12.281376667087898,
      "passed": 17,
      "failed": 2,
      "skipped": 0,
      "errors": 0,
      "total": 19,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1083_",
        "test_UAT_AC1084_",
        "test_UAT_AC1085_",
        "test_UAT_AC1086_",
        "test_UAT_AC1087_",
        "test_UAT_AC1088_",
        "test_UAT_AC1089_",
        "test_UAT_AC1090_",
        "test_UAT_AC1091_",
        "test_UAT_AC1092_",
        "test_UAT_AC1093_",
        "test_UAT_AC1094_",
        "test_UAT_AC2068_",
        "test_UAT_AC2069_",
        "test_UAT_AC2070_",
        "test_UAT_AC2071_",
        "test_UAT_AC2072_",
        "test_UAT_AC2073_",
        "test_UAT_AC2074_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "false},\"startTime\":1793495838957,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the page document reads as stored\"],\"fullName\":\"the page document reads as stored test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set\",\"status\":\"passed\",\"title\":\"test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set\",\"duration\":8.311500000000024,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the page document reads as stored\"],\"fullName\":\"the page document reads as stored test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map\",\"status\":\"passed\",\"title\":\"test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map\",\"duration\":12.548584000000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the page document writes by top-level merge\"],\"fullName\":\"the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates\",\"status\":\"failed\",\"title\":\"test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates\",\"duration\":19.541167000000087,\"failureMessages\":[\"AssertionError: unknown key: expected 'Error: set_page_style failed (SCHEMA_\u2026' to match /widths, background, textColor, resour\u2026/\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-page-composition-document.test.ts:279:65\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\",\"AssertionError: element tree: expected 'Error: set_page_style failed (SCHEMA_\u2026' to match /set_l1/\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-page-composition-document.test.ts:279:65\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a write may not introduce a reference to something that does not exist\"],\"fullName\":\"a write may not introduce a reference to something that does not exist test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family\",\"status\":\"passed\",\"title\":\"test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family\",\"duration\":9.957124999999905,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a write may not introduce a reference to something that does not exist\"],\"fullName\":\"a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it\",\"status\":\"failed\",\"title\":\"test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it\",\"duration\":7.663457999999991,\"failureMessages\":[\"AssertionError: expected 'Error: set_l1 failed (SCHEMA_INVALID)\u2026' to match /reference something the site holds|a\u2026/i\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-page-composition-document.test.ts:376:24\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a write may not introduce a reference to something that does not exist\"],\"fullName\":\"a write may not introduce a reference to something that does not exist test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves\",\"status\":\"passed\",\"title\":\"test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves\",\"duration\":4.935208999999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"what the reproduction path can write, the assistant can write\"],\"fullName\":\"what the reproduction path can write, the assistant can write test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged\",\"duration\":10181.898125,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793495839976,\"endTime\":1793495850221.8982,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-page-composition-document.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the page map answers where every element is\"],\"fullName\":\"the page map answers where every element is test_UAT_AC1083_map_emits_every_element_with_its_address_kind_and_scope\",\"status\":\"passed\",\"title\":\"test_UAT_AC1083_map_emits_every_element_with_its_address_kind_and_scope\",\"duration\":22.57195799999988,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the page map answers where every element is\"],\"fullName\":\"the page map answers where every element is test_UAT_AC1084_labels_identify_an_element_and_carry_no_styling\",\"status\":\"passed\",\"title\":\"test_UAT_AC1084_labels_identify_an_element_and_carry_no_styling\",\"duration\":7.1967500000000655,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"one address reads and writes the element at it\"],\"fullName\":\"one address reads and writes the element at it test_UAT_AC1085_get_returns_the_subtree_exactly_as_stored\",\"status\":\"passed\",\"title\":\"test_UAT_AC1085_get_returns_the_subtree_exactly_as_stored\",\"duration\":8.268708999999944,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"one address reads and writes the element at it\"],\"fullName\":\"one address reads and writes the element at it test_UAT_AC1086_writing_back_what_was_read_is_accepted_and_changes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1086_writing_back_what_was_read_is_accepted_and_changes_nothing\",\"duration\":6.486917000000176,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"one address reads and writes the element at it\"],\"fullName\":\"one address reads and writes the element at it test_UAT_AC1087_replacing_an_element_replaces_its_subtree_and_spares_its_siblings\",\"status\":\"passed\",\"title\":\"test_UAT_AC1087_replacing_an_element_replaces_its_subtree_and_spares_its_siblings\",\"duration\":5.627500000000055,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"one address reads and writes the element at it\"],\"fullName\":\"one address reads and writes the element at it test_UAT_AC1088_adding_and_removing_are_replacing_a_group_and_the_result_renders\",\"status\":\"passed\",\"title\":\"test_UAT_AC1088_adding_and_removing_are_replacing_a_group_and_the_result_renders\",\"duration\":19.814374999999927,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the closed vocabulary is what refuses markup, stylesheets and scripts\"],\"fullName\":\"the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1089_an_element_outside_the_vocabulary_is_refused_whole\",\"status\":\"passed\",\"title\":\"test_UAT_AC1089_an_element_outside_the_vocabulary_is_refused_whole\",\"duration\":13.558917000000065,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the closed vocabulary is what refuses markup, stylesheets and scripts\"],\"fullName\":\"the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy\",\"duration\":3.377083999999968,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the closed vocabulary is what refuses markup, stylesheets and scripts\"],\"fullName\":\"the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1091_an_address_that_resolves_to_nothing_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1091_an_address_that_resolves_to_nothing_writes_nothing\",\"duration\":2.6250840000000153,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the closed vocabulary is what refuses markup, stylesheets and scripts\"],\"fullName\":\"the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1092_one_way_to_change_a_page_and_every_operation_is_declared\",\"status\":\"passed\",\"title\":\"test_UAT_AC1092_one_way_to_change_a_page_and_every_operation_is_declared\",\"duration\":3.7419589999999516,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the click-to-edit gesture still works on what the assistant composed\"],\"fullName\":\"the click-to-edit gesture still works on what the assistant composed test_UAT_AC1093_the_gesture_opens_and_saves_and_leaves_the_assistants_styling_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC1093_the_gesture_opens_and_saves_and_leaves_the_assistants_styling_alone\",\"duration\":26.86029099999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the click-to-edit gesture still works on what the assistant composed\"],\"fullName\":\"the click-to-edit gesture still works on what the assistant composed test_UAT_AC1094_the_gesture_exposes_no_fields_on_a_kind_it_does_not_edit\",\"status\":\"passed\",\"title\":\"test_UAT_AC1094_the_gesture_exposes_no_fields_on_a_kind_it_does_not_edit\",\"duration\":1.0800000000001546,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793495839981,\"endTime\":1793495840107.08,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-page-composition-surface.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the page document reads as stored test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page document reads as stored test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "what the reproduction path can write, the assistant can write test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page map answers where every element is test_UAT_AC1083_map_emits_every_element_with_its_address_kind_and_scope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the page map answers where every element is test_UAT_AC1084_labels_identify_an_element_and_carry_no_styling",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1085_get_returns_the_subtree_exactly_as_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1086_writing_back_what_was_read_is_accepted_and_changes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1087_replacing_an_element_replaces_its_subtree_and_spares_its_siblings",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one address reads and writes the element at it test_UAT_AC1088_adding_and_removing_are_replacing_a_group_and_the_result_renders",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1089_an_element_outside_the_vocabulary_is_refused_whole",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1090_a_refusal_carries_the_code_the_field_and_a_recovery_strategy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1091_an_address_that_resolves_to_nothing_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the closed vocabulary is what refuses markup, stylesheets and scripts test_UAT_AC1092_one_way_to_change_a_page_and_every_operation_is_declared",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the click-to-edit gesture still works on what the assistant composed test_UAT_AC1093_the_gesture_opens_and_saves_and_leaves_the_assistants_styling_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the click-to-edit gesture still works on what the assistant composed test_UAT_AC1094_the_gesture_exposes_no_fields_on_a_kind_it_does_not_edit",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it",
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
        "message": "2 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 2
        }
      }
    ]
  }
}