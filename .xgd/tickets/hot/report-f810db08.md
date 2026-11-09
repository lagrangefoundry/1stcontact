---
uid: report-f810db08
id: REPORT-12062
type: report
title: 'Scoped quality: pass (10 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T23:29:48.806175+00:00'
updated_at: '2026-11-09T23:29:48.806175+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-a0b20525
  commit: 0314a2d43f2994ac976fc5e692dc240405fabbbc
---

{
  "timestamp": "2026-11-09T23:25:19.655882Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012116599828004837,
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
      "duration_seconds": 6.9384167501702905,
      "passed": 10,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 10,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2576_",
        "test_UAT_AC2577_",
        "test_UAT_AC2578_",
        "test_UAT_AC2579_",
        "test_UAT_AC2580_",
        "test_UAT_AC2581_",
        "test_UAT_AC2582_",
        "test_UAT_AC2583_",
        "test_UAT_AC2584_",
        "test_UAT_AC2585_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue_grant.test.ts\\x1b[2m > \\x1b[22mAC-2585 \u2014 the catalogue tools, their groups, and where they are offered\\x1b[2m > \\x1b[22mtest_UAT_AC2585_hosted_consultant_offers_library_tools_in_read_and_place_groups_and_cli_offers_none\\x1b[32m 86\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2576 \u2014 list_library returns the whole catalogue\\x1b[2m > \\x1b[22mtest_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields\\x1b[32m 106\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2577 \u2014 list_library is bounded and says so\\x1b[2m > \\x1b[22mtest_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more\\x1b[32m 112\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2578 \u2014 list_library filters combine with AND\\x1b[2m > \\x1b[22mtest_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text\\x1b[32m 52\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2579 \u2014 get_library_item reads one item in full\\x1b[2m > \\x1b[22mtest_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title\\x1b[32m 26\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2580 \u2014 a name that is not exactly one item is refused\\x1b[2m > \\x1b[22mtest_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates\\x1b[32m 91\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2581 \u2014 a catalogue item name is a picture name\\x1b[2m > \\x1b[22mtest_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture\\x1b[32m 37\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2582 \u2014 place_on_site puts a republishable item on the draft site\\x1b[2m > \\x1b[22mtest_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on\\x1b[32m 42\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2583 \u2014 place_on_site never overwrites a site asset\\x1b[2m > \\x1b[22mtest_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes\\x1b[32m 32\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_library_catalogue.workers.test.ts\\x1b[2m > \\x1b[22mAC-2584 \u2014 what place_on_site refuses\\x1b[2m > \\x1b[22mtest_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store\\x1b[32m 27\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m10 passed\\x1b[39m\\x1b[22m\\x1b[90m (10)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 15:25:21\n\\x1b[2m   Duration \\x1b[22m 5.90s\\x1b[2m (transform 2.09s, setup 0ms, import 4.46s, tests 635ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-eu821wd6.json\n\n{\"numTotalTestSuites\":12,\"numPassedTestSuites\":12,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":10,\"numPassedTests\":10,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794266721013,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2585 \u2014 the catalogue tools, their groups, and where they are offered\"],\"fullName\":\"AC-2585 \u2014 the catalogue tools, their groups, and where they are offered test_UAT_AC2585_hosted_consultant_offers_library_tools_in_read_and_place_groups_and_cli_offers_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2585_hosted_consultant_offers_library_tools_in_read_and_place_groups_and_cli_offers_none\",\"duration\":86.26741700000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794266723514,\"endTime\":1794266723600.2673,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_library_catalogue_grant.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2576 \u2014 list_library returns the whole catalogue\"],\"fullName\":\"AC-2576 \u2014 list_library returns the whole catalogue test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields\",\"duration\":106,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2577 \u2014 list_library is bounded and says so\"],\"fullName\":\"AC-2577 \u2014 list_library is bounded and says so test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more\",\"status\":\"passed\",\"title\":\"test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more\",\"duration\":112,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2578 \u2014 list_library filters combine with AND\"],\"fullName\":\"AC-2578 \u2014 list_library filters combine with AND test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text\",\"duration\":52,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2579 \u2014 get_library_item reads one item in full\"],\"fullName\":\"AC-2579 \u2014 get_library_item reads one item in full test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title\",\"status\":\"passed\",\"title\":\"test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2580 \u2014 a name that is not exactly one item is refused\"],\"fullName\":\"AC-2580 \u2014 a name that is not exactly one item is refused test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates\",\"duration\":91,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2581 \u2014 a catalogue item name is a picture name\"],\"fullName\":\"AC-2581 \u2014 a catalogue item name is a picture name test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture\",\"status\":\"passed\",\"title\":\"test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2582 \u2014 place_on_site puts a republishable item on the draft site\"],\"fullName\":\"AC-2582 \u2014 place_on_site puts a republishable item on the draft site test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on\",\"duration\":42,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2583 \u2014 place_on_site never overwrites a site asset\"],\"fullName\":\"AC-2583 \u2014 place_on_site never overwrites a site asset test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2584 \u2014 what place_on_site refuses\"],\"fullName\":\"AC-2584 \u2014 what place_on_site refuses test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794266726394,\"endTime\":1794266726919,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_library_catalogue.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-2585 \u2014 the catalogue tools, their groups, and where they are offered test_UAT_AC2585_hosted_consultant_offers_library_tools_in_read_and_place_groups_and_cli_offers_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2576 \u2014 list_library returns the whole catalogue test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2577 \u2014 list_library is bounded and says so test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2578 \u2014 list_library filters combine with AND test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2579 \u2014 get_library_item reads one item in full test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2580 \u2014 a name that is not exactly one item is refused test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2581 \u2014 a catalogue item name is a picture name test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2582 \u2014 place_on_site puts a republishable item on the draft site test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2583 \u2014 place_on_site never overwrites a site asset test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2584 \u2014 what place_on_site refuses test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store",
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