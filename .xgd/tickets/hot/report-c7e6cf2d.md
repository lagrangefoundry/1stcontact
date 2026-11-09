---
uid: report-c7e6cf2d
id: REPORT-12073
type: report
title: 'Scoped quality: pass (10 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T23:59:50.066839+00:00'
updated_at: '2026-11-09T23:59:50.066839+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-aacb7060
  commit: cc2b31c1f43b1467ec6b5ee833b495a4b1f39f96
---

{
  "timestamp": "2026-11-09T23:55:48.961532Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014408305287361145,
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
      "duration_seconds": 7.909060792066157,
      "passed": 10,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 10,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1709_",
        "test_UAT_AC1710_",
        "test_UAT_AC1711_",
        "test_UAT_AC1712_",
        "test_UAT_AC1713_",
        "test_UAT_AC2015_",
        "test_UAT_AC2016_",
        "test_UAT_AC2017_",
        "test_UAT_AC2588_",
        "test_UAT_AC2589_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/test_reconciliation_site_asset_push_rights_gate.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_site_asset_import_rights_gate.workers.test.ts\\x1b[2m > \\x1b[22mtest_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\\x1b[32m 66\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\\x1b[32m 42\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\\x1b[32m 24\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\\x1b[32m 24\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-placement.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 placement is recorded only when it is true\\x1b[2m > \\x1b[22mtest_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\\x1b[32m 63\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-placement.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 placement is recorded only when it is true\\x1b[2m > \\x1b[22mtest_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\\x1b[32m 30\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-placement.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 placement is recorded only when it is true\\x1b[2m > \\x1b[22mtest_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\\x1b[32m 41\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\\x1b[32m 56\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m4 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m10 passed\\x1b[39m\\x1b[22m\\x1b[90m (10)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 15:55:50\n\\x1b[2m   Duration \\x1b[22m 6.92s\\x1b[2m (transform 5.71s, setup 0ms, import 16.78s, tests 463ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-nov_yak0.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":6,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":10,\"numPassedTests\":10,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794268550257,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override\",\"status\":\"passed\",\"title\":\"test_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override\",\"duration\":12.429665999999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794268553961,\"endTime\":1794268553973.4297,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_site_asset_push_rights_gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"status\":\"passed\",\"title\":\"test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"duration\":30,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794268557032,\"endTime\":1794268557166,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"duration\":42,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"status\":\"passed\",\"title\":\"test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"duration\":56,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"status\":\"passed\",\"title\":\"test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794268557031,\"endTime\":1794268557190,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\",\"status\":\"passed\",\"title\":\"test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794268557031,\"endTime\":1794268557097,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_site_asset_import_rights_gate.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "test_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409",
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