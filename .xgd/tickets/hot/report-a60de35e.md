---
uid: report-a60de35e
id: REPORT-7610
type: report
title: 'Report: batch_quality_check for report-71b1019e'
created_by: xgd
created_at: '2026-11-01T13:13:20.222816+00:00'
updated_at: '2026-11-01T13:13:20.222816+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-71b1019e
  parent_report_uid: report-4ac069c7
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T13:10:35.054254Z",
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
      "duration_seconds": 1.570039541926235,
      "passed": 18,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 18,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2104_",
        "test_UAT_AC2105_",
        "test_UAT_AC2106_",
        "test_UAT_FC_BUG-48_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "FC_BUG-48_a_document_the_index_holds_under_an_older_version_refuses_too\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts\\x1b[2m > \\x1b[22mBUG-48 \u2014 the corpus and the index are one artefact\\x1b[2m > \\x1b[22mtest_UAT_FC_BUG-48_the_refusal_names_the_documents_and_the_command_that_fixes_them\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts\\x1b[2m > \\x1b[22mBUG-48 \u2014 the corpus and the index are one artefact\\x1b[2m > \\x1b[22mtest_UAT_FC_BUG-48_the_asset_build_refuses_before_it_overwrites_the_shipped_bundle\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts\\x1b[2m > \\x1b[22mBUG-48 \u2014 the corpus and the index are one artefact\\x1b[2m > \\x1b[22mtest_UAT_FC_BUG-48_the_asset_report_says_which_documents_ship_unsearchable\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts\\x1b[2m > \\x1b[22mBUG-48 \u2014 one command runs the release in order\\x1b[2m > \\x1b[22mtest_UAT_FC_BUG-48_the_release_script_builds_before_it_inlines\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m18 passed\\x1b[39m\\x1b[22m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 05:10:36\n\\x1b[2m   Duration \\x1b[22m 557ms\\x1b[2m (transform 574ms, setup 0ms, import 1.28s, tests 72ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-0emm8tqb.json\n\n{\"numTotalTestSuites\":11,\"numPassedTestSuites\":11,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":18,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793538636227,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2104 \u2014 the reference projects the page document\"],\"fullName\":\"AC-2104 \u2014 the reference projects the page document test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach\",\"status\":\"passed\",\"title\":\"test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach\",\"duration\":1.3527500000000146,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2105 \u2014 the limits section states the structural rules beside the bounds\"],\"fullName\":\"AC-2105 \u2014 the limits section states the structural rules beside the bounds test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words\",\"status\":\"passed\",\"title\":\"test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words\",\"duration\":4.578707999999949,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2106 \u2014 the coverage check holds the projection to its declared source\"],\"fullName\":\"AC-2106 \u2014 the coverage check holds the projection to its declared source test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none\",\"duration\":9.417541000000028,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793538636740,\"endTime\":1793538636756.4175,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-l1-reference-coverage.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-48 \u2014 the corpus and the index are one artefact\"],\"fullName\":\"BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_a_coherent_bundle_passes_and_names_what_it_exempted\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_a_coherent_bundle_passes_and_names_what_it_exempted\",\"duration\":1.8713330000000497,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the corpus and the index are one artefact\"],\"fullName\":\"BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_a_document_the_index_does_not_hold_refuses_the_bundle\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_a_document_the_index_does_not_hold_refuses_the_bundle\",\"duration\":1.1656249999999773,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the corpus and the index are one artefact\"],\"fullName\":\"BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_a_document_the_index_holds_under_an_older_version_refuses_too\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_a_document_the_index_holds_under_an_older_version_refuses_too\",\"duration\":4.853291000000013,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the corpus and the index are one artefact\"],\"fullName\":\"BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_the_refusal_names_the_documents_and_the_command_that_fixes_them\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_refusal_names_the_documents_and_the_command_that_fixes_them\",\"duration\":0.23070799999993596,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the corpus and the index are one artefact\"],\"fullName\":\"BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_the_asset_build_refuses_before_it_overwrites_the_shipped_bundle\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_asset_build_refuses_before_it_overwrites_the_shipped_bundle\",\"duration\":2.0936660000000984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the corpus and the index are one artefact\"],\"fullName\":\"BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_the_asset_report_says_which_documents_ship_unsearchable\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_asset_report_says_which_documents_ship_unsearchable\",\"duration\":0.11933400000009442,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 one command runs the release in order\"],\"fullName\":\"BUG-48 \u2014 one command runs the release in order test_UAT_FC_BUG-48_the_release_script_builds_before_it_inlines\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_release_script_builds_before_it_inlines\",\"duration\":0.15674999999998818,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793538636779,\"endTime\":1793538636791.1567,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-48 \u2014 the reference projects the page, not only its tree\"],\"fullName\":\"BUG-48 \u2014 the reference projects the page, not only its tree test_UAT_FC_BUG-48_every_document_key_appears_in_the_reference\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_every_document_key_appears_in_the_reference\",\"duration\":1.130790999999988,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the reference projects the page, not only its tree\"],\"fullName\":\"BUG-48 \u2014 the reference projects the page, not only its tree test_UAT_FC_BUG-48_the_keys_the_consultant_can_now_write_say_what_they_take\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_keys_the_consultant_can_now_write_say_what_they_take\",\"duration\":0.13541600000002063,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the reference projects the page, not only its tree\"],\"fullName\":\"BUG-48 \u2014 the reference projects the page, not only its tree test_UAT_FC_BUG-48_the_shapes_a_document_key_reaches_are_described_once\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_shapes_a_document_key_reaches_are_described_once\",\"duration\":0.1297089999999912,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the limits section keeps its whole promise\"],\"fullName\":\"BUG-48 \u2014 the limits section keeps its whole promise test_UAT_FC_BUG-48_every_structural_rule_is_stated_beside_the_numeric_bounds\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_every_structural_rule_is_stated_beside_the_numeric_bounds\",\"duration\":0.22529099999997015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the limits section keeps its whole promise\"],\"fullName\":\"BUG-48 \u2014 the limits section keeps its whole promise test_UAT_FC_BUG-48_the_refusals_that_are_not_numbers_are_projected_not_authored\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_refusals_that_are_not_numbers_are_projected_not_authored\",\"duration\":9.539833999999985,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 the limits section keeps its whole promise\"],\"fullName\":\"BUG-48 \u2014 the limits section keeps its whole promise test_UAT_FC_BUG-48_every_stated_rule_is_one_the_validator_actually_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_every_stated_rule_is_one_the_validator_actually_refuses\",\"duration\":3.8859170000000063,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 a projection is checked against its declared source\"],\"fullName\":\"BUG-48 \u2014 a projection is checked against its declared source test_UAT_FC_BUG-48_the_reference_covers_everything_it_says_it_is_generated_from\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_reference_covers_everything_it_says_it_is_generated_from\",\"duration\":5.071290999999974,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-48 \u2014 a projection is checked against its declared source\"],\"fullName\":\"BUG-48 \u2014 a projection is checked against its declared source test_UAT_FC_BUG-48_the_coverage_check_has_teeth\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-48_the_coverage_check_has_teeth\",\"duration\":1.3417910000000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793538636741,\"endTime\":1793538636762.3418,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-2104 \u2014 the reference projects the page document test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2105 \u2014 the limits section states the structural rules beside the bounds test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2106 \u2014 the coverage check holds the projection to its declared source test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_a_coherent_bundle_passes_and_names_what_it_exempted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_a_document_the_index_does_not_hold_refuses_the_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_a_document_the_index_holds_under_an_older_version_refuses_too",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_the_refusal_names_the_documents_and_the_command_that_fixes_them",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_the_asset_build_refuses_before_it_overwrites_the_shipped_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the corpus and the index are one artefact test_UAT_FC_BUG-48_the_asset_report_says_which_documents_ship_unsearchable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 one command runs the release in order test_UAT_FC_BUG-48_the_release_script_builds_before_it_inlines",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the reference projects the page, not only its tree test_UAT_FC_BUG-48_every_document_key_appears_in_the_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the reference projects the page, not only its tree test_UAT_FC_BUG-48_the_keys_the_consultant_can_now_write_say_what_they_take",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the reference projects the page, not only its tree test_UAT_FC_BUG-48_the_shapes_a_document_key_reaches_are_described_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the limits section keeps its whole promise test_UAT_FC_BUG-48_every_structural_rule_is_stated_beside_the_numeric_bounds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the limits section keeps its whole promise test_UAT_FC_BUG-48_the_refusals_that_are_not_numbers_are_projected_not_authored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 the limits section keeps its whole promise test_UAT_FC_BUG-48_every_stated_rule_is_one_the_validator_actually_refuses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 a projection is checked against its declared source test_UAT_FC_BUG-48_the_reference_covers_everything_it_says_it_is_generated_from",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-48 \u2014 a projection is checked against its declared source test_UAT_FC_BUG-48_the_coverage_check_has_teeth",
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