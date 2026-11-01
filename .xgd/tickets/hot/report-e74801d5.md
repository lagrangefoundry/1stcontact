---
uid: report-e74801d5
id: REPORT-7835
type: report
title: 'Scoped quality: pass (9 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T20:12:49.208643+00:00'
updated_at: '2026-11-01T20:12:49.208643+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-0ea74f39
  commit: e9052d9dea80440ddbd49f95fc4a0033a5b96df3
---

{
  "timestamp": "2026-11-01T20:09:52.147494Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011150003410875797,
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
      "duration_seconds": 4.108353750081733,
      "passed": 9,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 9,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2203_",
        "test_UAT_AC2204_",
        "test_UAT_AC2205_",
        "test_UAT_AC2206_",
        "test_UAT_AC2207_",
        "test_UAT_AC2208_",
        "test_UAT_AC2209_",
        "test_UAT_AC2210_",
        "test_UAT_AC2211_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 the Contacts tab draws two axes\\x1b[2m > \\x1b[22mtest_UAT_AC2209_each_row_draws_stage_and_member_badge_separately\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 the Contacts tab draws two axes\\x1b[2m > \\x1b[22mtest_UAT_AC2210_two_facets_narrow_independently_and_combine\\x1b[32m 21\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 the Contacts tab draws two axes\\x1b[2m > \\x1b[22mtest_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes_migration.workers.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 the one-time pipeline backfill\\x1b[2m > \\x1b[22mtest_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited\\x1b[32m 68\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.workers.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 two axes at the origin\\x1b[2m > \\x1b[22mtest_UAT_AC2203_member_if_and_only_if_terms_accepted\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.workers.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 two axes at the origin\\x1b[2m > \\x1b[22mtest_UAT_AC2204_contact_begins_at_lead\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.workers.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 two axes at the origin\\x1b[2m > \\x1b[22mtest_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp\\x1b[32m 19\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.workers.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 two axes at the origin\\x1b[2m > \\x1b[22mtest_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage\\x1b[32m 17\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_contact_axes.workers.test.ts\\x1b[2m > \\x1b[22mstory-0ea74f39 \u2014 two axes at the origin\\x1b[2m > \\x1b[22mtest_UAT_AC2207_stage_is_the_stored_value_not_inferred\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m9 passed\\x1b[39m\\x1b[22m\\x1b[90m (9)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 12:09:53\n\\x1b[2m   Duration \\x1b[22m 3.28s\\x1b[2m (transform 2.58s, setup 0ms, import 5.65s, tests 282ms, environment 184ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-en0x19ic.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":6,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":9,\"numPassedTests\":9,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793563793146,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-0ea74f39 \u2014 the Contacts tab draws two axes\"],\"fullName\":\"story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately\",\"status\":\"passed\",\"title\":\"test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately\",\"duration\":14.810375000000022,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 the Contacts tab draws two axes\"],\"fullName\":\"story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2210_two_facets_narrow_independently_and_combine\",\"status\":\"passed\",\"title\":\"test_UAT_AC2210_two_facets_narrow_independently_and_combine\",\"duration\":20.711584000000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 the Contacts tab draws two axes\"],\"fullName\":\"story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value\",\"duration\":8.838124999999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793563793479,\"endTime\":1793563793523.8381,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contact_axes.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2203_member_if_and_only_if_terms_accepted\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2204_contact_begins_at_lead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2204_contact_begins_at_lead\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage\",\"status\":\"passed\",\"title\":\"test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred\",\"status\":\"passed\",\"title\":\"test_UAT_AC2207_stage_is_the_stored_value_not_inferred\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793563796372,\"endTime\":1793563796432,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contact_axes.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0ea74f39 \u2014 the one-time pipeline backfill\"],\"fullName\":\"story-0ea74f39 \u2014 the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited\",\"status\":\"passed\",\"title\":\"test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited\",\"duration\":68,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793563796300,\"endTime\":1793563796368,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contact_axes_migration.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2210_two_facets_narrow_independently_and_combine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2204_contact_begins_at_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited",
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