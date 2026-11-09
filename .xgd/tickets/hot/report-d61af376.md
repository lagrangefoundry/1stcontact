---
uid: report-d61af376
id: REPORT-11929
type: report
title: 'Report: batch_quality_check for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T15:32:28.541385+00:00'
updated_at: '2026-11-09T15:32:28.541385+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-d0a8cfad
  parent_report_uid: report-ca31830a
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T15:28:40.553507Z",
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
      "duration_seconds": 3.172348708845675,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 8,
      "test_filter": [
        "test_UAT_AC687_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43\\x1b[39m\n\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-682 well-formed L1 document accepted as a typed layout tree\\x1b[2m > \\x1b[22mtest_UAT_AC682_valid_document_and_optional_primitives_accepted\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis\\x1b[2m > \\x1b[22mtest_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-684 geometry keyframes produce per-viewport layout (interpolate vs snap)\\x1b[2m > \\x1b[22mtest_UAT_AC684_interpolate_varies_continuously_and_snap_holds\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-684 geometry keyframes produce per-viewport layout (interpolate vs snap)\\x1b[2m > \\x1b[22mtest_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-685 injection payloads in content values are inert in the rendered output\\x1b[2m > \\x1b[22mtest_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-686 out-of-range, oversize, and freeform documents are rejected by the envelope\\x1b[2m > \\x1b[22mtest_UAT_AC686_envelope_boundary_is_the_range_not_the_property\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-687 a rejected document returns the full list of per-field errors\\x1b[2m > \\x1b[22mtest_UAT_AC687_multiple_violations_all_reported_with_path_and_message\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-688 the spike renders equivalently across chromium, webkit, and firefox\\x1b[2m > \\x1b[22mtest_UAT_AC688_no_layout_divergence_across_three_engines\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-l1-substrate.test.ts\\x1b[2m > \\x1b[22mAC-723 a slot leaf renders as an inert placeholder naming its behavior module\\x1b[2m > \\x1b[22mtest_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m8 skipped\\x1b[39m\\x1b[90m (9)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 07:28:42\n\\x1b[2m   Duration \\x1b[22m 2.09s\\x1b[2m (transform 689ms, setup 0ms, import 1.60s, tests 5ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-x4dc0aq9.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":9,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":9,\"numPassedTests\":1,\"numFailedTests\":0,\"numPendingTests\":8,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794238122023,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-682 well-formed L1 document accepted as a typed layout tree\"],\"fullName\":\"AC-682 well-formed L1 document accepted as a typed layout tree test_UAT_AC682_valid_document_and_optional_primitives_accepted\",\"status\":\"skipped\",\"title\":\"test_UAT_AC682_valid_document_and_optional_primitives_accepted\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis\"],\"fullName\":\"AC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths\",\"status\":\"skipped\",\"title\":\"test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap)\"],\"fullName\":\"AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_varies_continuously_and_snap_holds\",\"status\":\"skipped\",\"title\":\"test_UAT_AC684_interpolate_varies_continuously_and_snap_holds\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap)\"],\"fullName\":\"AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser\",\"status\":\"skipped\",\"title\":\"test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-685 injection payloads in content values are inert in the rendered output\"],\"fullName\":\"AC-685 injection payloads in content values are inert in the rendered output test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised\",\"status\":\"skipped\",\"title\":\"test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope\"],\"fullName\":\"AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope test_UAT_AC686_envelope_boundary_is_the_range_not_the_property\",\"status\":\"skipped\",\"title\":\"test_UAT_AC686_envelope_boundary_is_the_range_not_the_property\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-687 a rejected document returns the full list of per-field errors\"],\"fullName\":\"AC-687 a rejected document returns the full list of per-field errors test_UAT_AC687_multiple_violations_all_reported_with_path_and_message\",\"status\":\"passed\",\"title\":\"test_UAT_AC687_multiple_violations_all_reported_with_path_and_message\",\"duration\":4.761834000000135,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-688 the spike renders equivalently across chromium, webkit, and firefox\"],\"fullName\":\"AC-688 the spike renders equivalently across chromium, webkit, and firefox test_UAT_AC688_no_layout_divergence_across_three_engines\",\"status\":\"skipped\",\"title\":\"test_UAT_AC688_no_layout_divergence_across_three_engines\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-723 a slot leaf renders as an inert placeholder naming its behavior module\"],\"fullName\":\"AC-723 a slot leaf renders as an inert placeholder naming its behavior module test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped\",\"status\":\"skipped\",\"title\":\"test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794238124115,\"endTime\":1794238124119.7617,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-l1-substrate.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-687 a rejected document returns the full list of per-field errors test_UAT_AC687_multiple_violations_all_reported_with_path_and_message",
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