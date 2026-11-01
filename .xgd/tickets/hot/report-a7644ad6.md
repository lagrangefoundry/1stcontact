---
uid: report-a7644ad6
id: REPORT-7186
type: report
title: 'Report: batch_quality_check for STORY-106'
created_by: xgd
created_at: '2026-11-01T01:27:23.246401+00:00'
updated_at: '2026-11-01T01:27:23.246401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-106
  parent_report_uid: report-7239a6f8
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T01:24:16.766038Z",
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
      "duration_seconds": 1.8790287079755217,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 5,
      "test_filter": [
        "test_UAT_AC2069",
        "test_UAT_AC2072"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34\\x1b[39m\n\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22mthe page document reads as stored\\x1b[2m > \\x1b[22mtest_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22mthe page document reads as stored\\x1b[2m > \\x1b[22mtest_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22mthe page document writes by top-level merge\\x1b[2m > \\x1b[22mtest_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates\\x1b[32m 26\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22ma write may not introduce a reference to something that does not exist\\x1b[2m > \\x1b[22mtest_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22ma write may not introduce a reference to something that does not exist\\x1b[2m > \\x1b[22mtest_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it\\x1b[32m 7\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22ma write may not introduce a reference to something that does not exist\\x1b[2m > \\x1b[22mtest_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-page-composition-document.test.ts\\x1b[2m > \\x1b[22mwhat the reproduction path can write, the assistant can write\\x1b[2m > \\x1b[22mtest_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m5 skipped\\x1b[39m\\x1b[90m (7)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:24:17\n\\x1b[2m   Duration \\x1b[22m 975ms\\x1b[2m (transform 486ms, setup 0ms, import 870ms, tests 34ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-vvegvwn0.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":5,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":7,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":5,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793496257857,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"the page document reads as stored\"],\"fullName\":\"the page document reads as stored test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the page document reads as stored\"],\"fullName\":\"the page document reads as stored test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the page document writes by top-level merge\"],\"fullName\":\"the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates\",\"duration\":26.06508299999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a write may not introduce a reference to something that does not exist\"],\"fullName\":\"a write may not introduce a reference to something that does not exist test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a write may not introduce a reference to something that does not exist\"],\"fullName\":\"a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it\",\"duration\":7.349209000000087,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a write may not introduce a reference to something that does not exist\"],\"fullName\":\"a write may not introduce a reference to something that does not exist test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"what the reproduction path can write, the assistant can write\"],\"fullName\":\"what the reproduction path can write, the assistant can write test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793496258801,\"endTime\":1793496258835.349,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-page-composition-document.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the page document writes by top-level merge test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a write may not introduce a reference to something that does not exist test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it",
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