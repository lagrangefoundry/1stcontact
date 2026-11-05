---
uid: report-3e84cb47
id: REPORT-11072
type: report
title: 'Report: batch_quality_check for story-179b8c06'
created_by: xgd
created_at: '2026-11-05T22:07:27.935284+00:00'
updated_at: '2026-11-05T22:07:27.935284+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-179b8c06
  parent_report_uid: report-84738adf
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-05T22:02:52.973676Z",
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
      "duration_seconds": 1.8773421661462635,
      "passed": 4,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 4,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_FC_REQ-200_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-account-chrome.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome is gated by a site declaration\\x1b[2m > \\x1b[22mtest_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none\\x1b[32m 64\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-account-chrome.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome sign-in baseline and enhancement\\x1b[2m > \\x1b[22mtest_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind\\x1b[32m 43\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-account-chrome.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 account-chrome on the behavior contract\\x1b[2m > \\x1b[22mtest_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint\\x1b[32m 32\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-behavior-account-chrome.test.ts\\x1b[2m > \\x1b[22mstory-179b8c06 \u2014 link controls\\x1b[2m > \\x1b[22mtest_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m4 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 14:02:54\n\\x1b[2m   Duration \\x1b[22m 1.00s\\x1b[2m (transform 162ms, setup 0ms, import 478ms, tests 144ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-bfbcqf37.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":5,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":4,\"numPassedTests\":4,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793916174203,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome is gated by a site declaration\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none\",\"duration\":63.97158300000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind\",\"status\":\"passed\",\"title\":\"test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind\",\"duration\":43.07704100000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 account-chrome on the behavior contract\"],\"fullName\":\"story-179b8c06 \u2014 account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint\",\"status\":\"passed\",\"title\":\"test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint\",\"duration\":31.77270800000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-179b8c06 \u2014 link controls\"],\"fullName\":\"story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href\",\"status\":\"passed\",\"title\":\"test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href\",\"duration\":4.833541999999966,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793916175065,\"endTime\":1793916175208.8335,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-behavior-account-chrome.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
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