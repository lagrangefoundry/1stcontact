---
uid: report-611b158e
id: REPORT-7535
type: report
title: 'Scoped quality: pass (13 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T09:24:16.216558+00:00'
updated_at: '2026-11-01T09:24:16.216558+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-5836022a
  commit: 34750b23790b1d3d0f4c0fa24989fd4556fbf949
---

{
  "timestamp": "2026-11-01T09:21:12.708880Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013950001448392868,
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
      "duration_seconds": 11.918648874852806,
      "passed": 13,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 13,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1634_",
        "test_UAT_AC1635_",
        "test_UAT_AC1636_",
        "test_UAT_AC1637_",
        "test_UAT_AC1638_",
        "test_UAT_AC1639_",
        "test_UAT_AC1640_",
        "test_UAT_AC1641_",
        "test_UAT_AC1642_",
        "test_UAT_AC1643_",
        "test_UAT_AC1644_",
        "test_UAT_AC1645_",
        "test_UAT_AC1646_",
        "test_UAT_AC2104_",
        "test_UAT_AC2105_",
        "test_UAT_AC2106_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "[22mstory-5836022a \u2014 a generated document lives in the corpus on its own terms\\x1b[2m > \\x1b[22mtest_UAT_AC1636_a_reference_asserts_membership_derived_from_the_declaration\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 a generated document lives in the corpus on its own terms\\x1b[2m > \\x1b[22mtest_UAT_AC1637_each_producer_removes_only_its_own_stale_output_in_either_order\\x1b[33m 694\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 a generated document lives in the corpus on its own terms\\x1b[2m > \\x1b[22mtest_UAT_AC1638_an_unchanged_reference_keeps_its_timestamp_and_a_changed_source_advances_one\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 the component reference says what the catalogue says\\x1b[2m > \\x1b[22mtest_UAT_AC1639_every_component_is_described_with_its_settings_values_slots_and_obligations\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 the component reference says what the catalogue says\\x1b[2m > \\x1b[22mtest_UAT_AC1640_the_component_reference_describes_no_component_the_catalogue_does_not_carry\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 the layout reference is read off the schemas\\x1b[2m > \\x1b[22mtest_UAT_AC1641_every_element_kind_its_closed_value_sets_and_the_page_limits_are_named\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 the layout reference is read off the schemas\\x1b[2m > \\x1b[22mtest_UAT_AC1642_a_harvested_definition_appears_only_against_the_shape_it_was_written_for\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 the control-surface reference covers the whole declared surface\\x1b[2m > \\x1b[22mtest_UAT_AC1643_every_operation_group_refusal_and_declared_absence_is_named\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 a reference stands on its own for the reader it was written for\\x1b[2m > \\x1b[22mtest_UAT_AC1644_no_definition_sends_the_assistant_to_an_internal_ticket\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 a reference stands on its own for the reader it was written for\\x1b[2m > \\x1b[22mtest_UAT_AC1645_a_reference_names_its_source_in_its_body_and_says_it_is_rebuilt\\x1b[32m 3\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-projected-reference.test.ts\\x1b[2m > \\x1b[22mstory-5836022a \u2014 the reference is reachable through ordinary retrieval\\x1b[2m > \\x1b[22mtest_UAT_AC1646_asking_what_a_component_supports_returns_a_passage_from_the_reference\\x1b[32m 171\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m13 passed\\x1b[39m\\x1b[22m\\x1b[90m (13)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 01:21:13\n\\x1b[2m   Duration \\x1b[22m 10.91s\\x1b[2m (transform 575ms, setup 0ms, import 980ms, tests 9.86s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-96h5cguc.json\n\n{\"numTotalTestSuites\":8,\"numPassedTestSuites\":8,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":13,\"numPassedTests\":13,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793524873911,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5836022a \u2014 the reference reaches the shipped corpus\"],\"fullName\":\"story-5836022a \u2014 the reference reaches the shipped corpus test_UAT_AC1634_a_reference_is_written_for_every_source_on_export_and_on_build\",\"status\":\"passed\",\"title\":\"test_UAT_AC1634_a_reference_is_written_for_every_source_on_export_and_on_build\",\"duration\":614.7227500000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the reference reaches the shipped corpus\"],\"fullName\":\"story-5836022a \u2014 the reference reaches the shipped corpus test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_documents\",\"status\":\"passed\",\"title\":\"test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_documents\",\"duration\":8346.584166,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 a generated document lives in the corpus on its own terms\"],\"fullName\":\"story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1636_a_reference_asserts_membership_derived_from_the_declaration\",\"status\":\"passed\",\"title\":\"test_UAT_AC1636_a_reference_asserts_membership_derived_from_the_declaration\",\"duration\":6.48058299999866,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 a generated document lives in the corpus on its own terms\"],\"fullName\":\"story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1637_each_producer_removes_only_its_own_stale_output_in_either_order\",\"status\":\"passed\",\"title\":\"test_UAT_AC1637_each_producer_removes_only_its_own_stale_output_in_either_order\",\"duration\":693.7388750000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 a generated document lives in the corpus on its own terms\"],\"fullName\":\"story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1638_an_unchanged_reference_keeps_its_timestamp_and_a_changed_source_advances_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC1638_an_unchanged_reference_keeps_its_timestamp_and_a_changed_source_advances_one\",\"duration\":7.108000000000175,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the component reference says what the catalogue says\"],\"fullName\":\"story-5836022a \u2014 the component reference says what the catalogue says test_UAT_AC1639_every_component_is_described_with_its_settings_values_slots_and_obligations\",\"status\":\"passed\",\"title\":\"test_UAT_AC1639_every_component_is_described_with_its_settings_values_slots_and_obligations\",\"duration\":0.7615409999998519,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the component reference says what the catalogue says\"],\"fullName\":\"story-5836022a \u2014 the component reference says what the catalogue says test_UAT_AC1640_the_component_reference_describes_no_component_the_catalogue_does_not_carry\",\"status\":\"passed\",\"title\":\"test_UAT_AC1640_the_component_reference_describes_no_component_the_catalogue_does_not_carry\",\"duration\":0.24020799999925657,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the layout reference is read off the schemas\"],\"fullName\":\"story-5836022a \u2014 the layout reference is read off the schemas test_UAT_AC1641_every_element_kind_its_closed_value_sets_and_the_page_limits_are_named\",\"status\":\"passed\",\"title\":\"test_UAT_AC1641_every_element_kind_its_closed_value_sets_and_the_page_limits_are_named\",\"duration\":2.1053329999995185,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the layout reference is read off the schemas\"],\"fullName\":\"story-5836022a \u2014 the layout reference is read off the schemas test_UAT_AC1642_a_harvested_definition_appears_only_against_the_shape_it_was_written_for\",\"status\":\"passed\",\"title\":\"test_UAT_AC1642_a_harvested_definition_appears_only_against_the_shape_it_was_written_for\",\"duration\":2.2271249999994325,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the control-surface reference covers the whole declared surface\"],\"fullName\":\"story-5836022a \u2014 the control-surface reference covers the whole declared surface test_UAT_AC1643_every_operation_group_refusal_and_declared_absence_is_named\",\"status\":\"passed\",\"title\":\"test_UAT_AC1643_every_operation_group_refusal_and_declared_absence_is_named\",\"duration\":2.6530000000002474,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 a reference stands on its own for the reader it was written for\"],\"fullName\":\"story-5836022a \u2014 a reference stands on its own for the reader it was written for test_UAT_AC1644_no_definition_sends_the_assistant_to_an_internal_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_AC1644_no_definition_sends_the_assistant_to_an_internal_ticket\",\"duration\":7.943500000001222,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 a reference stands on its own for the reader it was written for\"],\"fullName\":\"story-5836022a \u2014 a reference stands on its own for the reader it was written for test_UAT_AC1645_a_reference_names_its_source_in_its_body_and_says_it_is_rebuilt\",\"status\":\"passed\",\"title\":\"test_UAT_AC1645_a_reference_names_its_source_in_its_body_and_says_it_is_rebuilt\",\"duration\":2.6617499999993015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5836022a \u2014 the reference is reachable through ordinary retrieval\"],\"fullName\":\"story-5836022a \u2014 the reference is reachable through ordinary retrieval test_UAT_AC1646_asking_what_a_component_supports_returns_a_passage_from_the_reference\",\"status\":\"passed\",\"title\":\"test_UAT_AC1646_asking_what_a_component_supports_returns_a_passage_from_the_reference\",\"duration\":170.97133300000132,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793524874968,\"endTime\":1793524884825.9714,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-projected-reference.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5836022a \u2014 the reference reaches the shipped corpus test_UAT_AC1634_a_reference_is_written_for_every_source_on_export_and_on_build",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the reference reaches the shipped corpus test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_documents",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1636_a_reference_asserts_membership_derived_from_the_declaration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1637_each_producer_removes_only_its_own_stale_output_in_either_order",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1638_an_unchanged_reference_keeps_its_timestamp_and_a_changed_source_advances_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the component reference says what the catalogue says test_UAT_AC1639_every_component_is_described_with_its_settings_values_slots_and_obligations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the component reference says what the catalogue says test_UAT_AC1640_the_component_reference_describes_no_component_the_catalogue_does_not_carry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the layout reference is read off the schemas test_UAT_AC1641_every_element_kind_its_closed_value_sets_and_the_page_limits_are_named",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the layout reference is read off the schemas test_UAT_AC1642_a_harvested_definition_appears_only_against_the_shape_it_was_written_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the control-surface reference covers the whole declared surface test_UAT_AC1643_every_operation_group_refusal_and_declared_absence_is_named",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a reference stands on its own for the reader it was written for test_UAT_AC1644_no_definition_sends_the_assistant_to_an_internal_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a reference stands on its own for the reader it was written for test_UAT_AC1645_a_reference_names_its_source_in_its_body_and_says_it_is_rebuilt",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the reference is reachable through ordinary retrieval test_UAT_AC1646_asking_what_a_component_supports_returns_a_passage_from_the_reference",
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