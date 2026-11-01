---
uid: report-d2e621c2
id: REPORT-7218
type: report
title: 'Report: batch_quality_check for STORY-144'
created_by: xgd
created_at: '2026-11-01T02:30:54.424744+00:00'
updated_at: '2026-11-01T02:30:54.424744+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-144
  parent_report_uid: report-b4d04353
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T02:27:46.743628Z",
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
      "duration_seconds": 4.656697917031124,
      "passed": 7,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 7,
      "deselected": 1,
      "test_filter": [
        "test_UAT_AC1722",
        "test_UAT_AC1723",
        "test_UAT_AC1721",
        "test_UAT_AC1720",
        "test_UAT_AC1719",
        "test_UAT_AC1813"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34\\x1b[39m\n\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-capture-file.workers.test.ts\\x1b[2m > \\x1b[22mAC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file\\x1b[2m > \\x1b[22mtest_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name\\x1b[32m 44\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-surface.workers.test.ts\\x1b[2m > \\x1b[22mAC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account\\x1b[2m > \\x1b[22mtest_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\\x1b[32m 35\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-surface.workers.test.ts\\x1b[2m > \\x1b[22mAC-1723 \u2014 a material\u2019s file comes back as itself\\x1b[2m > \\x1b[22mtest_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-surface.workers.test.ts\\x1b[2m > \\x1b[22mAC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing\\x1b[2m > \\x1b[22mtest_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-surface.workers.test.ts\\x1b[2m > \\x1b[22mAC-1721 \u2014 an empty description is refused, and the stored one is untouched\\x1b[2m > \\x1b[22mtest_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-surface.workers.test.ts\\x1b[2m > \\x1b[22mAC-1720 \u2014 a description the client wrote is recorded as theirs\\x1b[2m > \\x1b[22mtest_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-library-surface.workers.test.ts\\x1b[2m > \\x1b[22mAC-1719 \u2014 the corrected description is what retrieval answers with afterwards\\x1b[2m > \\x1b[22mtest_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\\x1b[32m 66\\x1b[2mms\\x1b[22m\\x1b[39m\n\\x1b[90mstderr\\x1b[2m | tests/reconciliation-material-row-content-type.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mAC-1813 \u2014 every listed row carries what its bytes are\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\n\\x1b[22m\\x1b[39mWarning: Indexing all PDF objects\n\n\\x1b[90mstderr\\x1b[2m | tests/reconciliation-material-row-content-type.workers.test.ts\\x1b[2m > \\x1b[22m\\x1b[2mAC-1813 \u2014 every listed row carries what its bytes are\\x1b[2m > \\x1b[22m\\x1b[2mtest_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\n\\x1b[22m\\x1b[39mWarning: Indexing all PDF objects\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-row-content-type.workers.test.ts\\x1b[2m > \\x1b[22mAC-1813 \u2014 every listed row carries what its bytes are\\x1b[2m > \\x1b[22mtest_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\\x1b[33m 738\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m7 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m1 skipped\\x1b[39m\\x1b[90m (8)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 19:27:47\n\\x1b[2m   Duration \\x1b[22m 3.82s\\x1b[2m (transform 3.84s, setup 0ms, import 8.07s, tests 959ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-va_wcs1h.json\n\n{\"numTotalTestSuites\":11,\"numPassedTestSuites\":11,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":8,\"numPassedTests\":7,\"numFailedTests\":0,\"numPendingTests\":1,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793500067752,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file\"],\"fullName\":\"AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793500070838,\"endTime\":1793500070882,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-library-capture-file.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account\"],\"fullName\":\"AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1723 \u2014 a material\u2019s file comes back as itself\"],\"fullName\":\"AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing\"],\"fullName\":\"AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched\"],\"fullName\":\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1720 \u2014 a description the client wrote is recorded as theirs\"],\"fullName\":\"AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"status\":\"passed\",\"title\":\"test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards\"],\"fullName\":\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"status\":\"passed\",\"title\":\"test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793500070838,\"endTime\":1793500070968,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-library-surface.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1813 \u2014 every listed row carries what its bytes are\"],\"fullName\":\"AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"duration\":738,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793500070838,\"endTime\":1793500071576,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-material-row-content-type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name",
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