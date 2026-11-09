---
uid: report-4c1b52f6
id: REPORT-11723
type: report
title: 'Scoped quality: pass (14 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T06:30:43.965367+00:00'
updated_at: '2026-11-09T06:30:43.965367+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-5349d01f
  commit: 5f71adae47d5731f58aee3a2b18c3e6b33fefc59
---

{
  "timestamp": "2026-11-09T06:25:27.791476Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0002425829879939556,
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
      "duration_seconds": 13.028666542377323,
      "passed": 14,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 14,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1418_",
        "test_UAT_AC1419_",
        "test_UAT_AC1420_",
        "test_UAT_AC1421_",
        "test_UAT_AC1422_",
        "test_UAT_AC2245_",
        "test_UAT_AC2246_",
        "test_UAT_AC2523_",
        "test_UAT_AC2524_",
        "test_UAT_AC2525_",
        "test_UAT_AC2526_",
        "test_UAT_AC2527_",
        "test_UAT_AC892_",
        "test_UAT_AC894_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only\\x1b[32m 47\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC894_publishing_always_renders_from_the_current_draft\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing from the command line and the builder\\x1b[2m > \\x1b[22mtest_UAT_AC892_a_revision_stores_both_halves_of_the_artifact\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision-cloud.workers.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing in the cloud, where there is no filesystem\\x1b[2m > \\x1b[22mtest_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors\\x1b[32m 107\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision-cloud.workers.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing in the cloud, where there is no filesystem\\x1b[2m > \\x1b[22mtest_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted\\x1b[32m 80\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-publish-revision-cloud.workers.test.ts\\x1b[2m > \\x1b[22mstory-5349d01f \u2014 publishing in the cloud, where there is no filesystem\\x1b[2m > \\x1b[22mtest_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding\\x1b[32m 54\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m4 passed\\x1b[39m\\x1b[22m\\x1b[90m (4)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m14 passed\\x1b[39m\\x1b[22m\\x1b[90m (14)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 22:25:30\n\\x1b[2m   Duration \\x1b[22m 11.37s\\x1b[2m (transform 10.07s, setup 0ms, import 17.45s, tests 696ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-fdxl9fi6.json\n\n{\"numTotalTestSuites\":8,\"numPassedTestSuites\":8,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":14,\"numPassedTests\":14,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794205530152,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222)\"],\"fullName\":\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2523_filesystem_and_memory_stores_hold_identical_renditions_and_the_manifest_only_feeds_the_render\",\"status\":\"passed\",\"title\":\"test_UAT_AC2523_filesystem_and_memory_stores_hold_identical_renditions_and_the_manifest_only_feeds_the_render\",\"duration\":42.55491699999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222)\"],\"fullName\":\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2524_publish_writes_raster_renditions_under_assets_d_and_skips_vectors_animations_and_undecodable_files\",\"status\":\"passed\",\"title\":\"test_UAT_AC2524_publish_writes_raster_renditions_under_assets_d_and_skips_vectors_animations_and_undecodable_files\",\"duration\":5.86220800000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222)\"],\"fullName\":\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2525_renditions_are_content_addressed_and_a_republish_of_an_unchanged_picture_transforms_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2525_renditions_are_content_addressed_and_a_republish_of_an_unchanged_picture_transforms_nothing\",\"duration\":8.309959000000163,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222)\"],\"fullName\":\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2526_ladder_is_the_conventional_widths_strictly_below_the_source_and_never_upscales\",\"status\":\"passed\",\"title\":\"test_UAT_AC2526_ladder_is_the_conventional_widths_strictly_below_the_source_and_never_upscales\",\"duration\":3.206124999999929,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222)\"],\"fullName\":\"story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2527_draft_channel_and_a_publish_with_no_images_binding_build_no_ladder_and_are_otherwise_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2527_draft_channel_and_a_publish_with_no_images_binding_build_no_ladder_and_are_otherwise_unchanged\",\"duration\":44.87787500000013,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794205532223,\"endTime\":1794205532327.878,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-publish-ladder.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so\",\"duration\":43.74316699999963,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write\",\"status\":\"passed\",\"title\":\"test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write\",\"duration\":62.9248749999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only\",\"status\":\"passed\",\"title\":\"test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only\",\"duration\":46.63545900000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC894_publishing_always_renders_from_the_current_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC894_publishing_always_renders_from_the_current_draft\",\"duration\":10.803124999999454,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing from the command line and the builder\"],\"fullName\":\"story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact\",\"status\":\"passed\",\"title\":\"test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact\",\"duration\":8.167207999999846,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794205535066,\"endTime\":1794205535239.1672,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-publish-revision.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5349d01f \u2014 renditions cross the store port identically (cloud)\"],\"fullName\":\"story-5349d01f \u2014 renditions cross the store port identically (cloud) test_UAT_AC2523_cloud_and_memory_stores_hold_identical_renditions_and_the_frozen_definition_ignores_the_ladder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2523_cloud_and_memory_stores_hold_identical_renditions_and_the_frozen_definition_ignores_the_ladder\",\"duration\":116,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794205534600,\"endTime\":1794205534716,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-publish-ladder-cloud.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem\"],\"fullName\":\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors\",\"status\":\"passed\",\"title\":\"test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors\",\"duration\":107,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem\"],\"fullName\":\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted\",\"duration\":80,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem\"],\"fullName\":\"story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding\",\"duration\":54,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794205541295,\"endTime\":1794205541536,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-publish-revision-cloud.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2523_filesystem_and_memory_stores_hold_identical_renditions_and_the_manifest_only_feeds_the_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2524_publish_writes_raster_renditions_under_assets_d_and_skips_vectors_animations_and_undecodable_files",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2525_renditions_are_content_addressed_and_a_republish_of_an_unchanged_picture_transforms_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2526_ladder_is_the_conventional_widths_strictly_below_the_source_and_never_upscales",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2527_draft_channel_and_a_publish_with_no_images_binding_build_no_ladder_and_are_otherwise_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC894_publishing_always_renders_from_the_current_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 renditions cross the store port identically (cloud) test_UAT_AC2523_cloud_and_memory_stores_hold_identical_renditions_and_the_frozen_definition_ignores_the_ladder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding",
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