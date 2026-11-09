---
uid: report-c00f8142
id: REPORT-12072
type: report
title: 'Report: batch_quality_check for story-aacb7060'
created_by: xgd
created_at: '2026-11-09T23:55:45.026363+00:00'
updated_at: '2026-11-09T23:55:45.026363+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-aacb7060
  parent_report_uid: report-b5e1e434
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T23:51:50.649236Z",
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
      "duration_seconds": 6.550578458234668,
      "passed": 8,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 8,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2015",
        "test_UAT_AC2016",
        "test_UAT_AC2017",
        "test_UAT_AC1709",
        "test_UAT_AC1710",
        "test_UAT_AC1711",
        "test_UAT_AC1712",
        "test_UAT_AC1713"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44\\x1b[39m\n\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\\x1b[32m 39\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\\x1b[32m 21\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\\x1b[32m 20\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-placement.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 placement is recorded only when it is true\\x1b[2m > \\x1b[22mtest_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\\x1b[32m 58\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-placement.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 placement is recorded only when it is true\\x1b[2m > \\x1b[22mtest_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\\x1b[32m 24\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-placement.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 placement is recorded only when it is true\\x1b[2m > \\x1b[22mtest_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\\x1b[32m 41\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\\x1b[32m 57\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-site-asset-promotion.workers.test.ts\\x1b[2m > \\x1b[22mstory-aacb7060 \u2014 only material the client may publish reaches their site\\x1b[2m > \\x1b[22mtest_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m8 passed\\x1b[39m\\x1b[22m\\x1b[90m (8)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 15:51:52\n\\x1b[2m   Duration \\x1b[22m 5.50s\\x1b[2m (transform 2.37s, setup 0ms, import 7.41s, tests 322ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-mp_0fg7m.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":8,\"numPassedTests\":8,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794268312073,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"status\":\"passed\",\"title\":\"test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794268317428,\"endTime\":1794268317551,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"status\":\"passed\",\"title\":\"test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"duration\":57,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"status\":\"passed\",\"title\":\"test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794268317428,\"endTime\":1794268317578,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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