---
uid: report-9a57f7b2
id: REPORT-10857
type: report
title: 'Report: batch_quality_check for story-fde7370b'
created_by: xgd
created_at: '2026-11-04T16:21:04.601344+00:00'
updated_at: '2026-11-04T16:21:04.601344+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-fde7370b
  parent_report_uid: report-61b51ef3
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-04T16:15:41.268005Z",
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
      "duration_seconds": 19.043052125023678,
      "passed": 5,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 5,
      "deselected": 10,
      "test_filter": [
        "test_UAT_AC1392",
        "test_UAT_AC1448",
        "test_UAT_AC2229"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "arter_site\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-cloudflare-site-store.workers.test.ts\\x1b[2m > \\x1b[22mstory-fde7370b \u2014 the cloud site store, inside the Workers runtime\\x1b[2m > \\x1b[22mtest_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-cloudflare-site-store.workers.test.ts\\x1b[2m > \\x1b[22mstory-fde7370b \u2014 the cloud site store, inside the Workers runtime\\x1b[2m > \\x1b[22mtest_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-cloudflare-site-store.workers.test.ts\\x1b[2m > \\x1b[22mstory-fde7370b \u2014 the cloud site store, inside the Workers runtime\\x1b[2m > \\x1b[22mtest_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-cloudflare-site-store.workers.test.ts\\x1b[2m > \\x1b[22mstory-fde7370b \u2014 the cloud site store, inside the Workers runtime\\x1b[2m > \\x1b[22mtest_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\nSourcemap for \"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts\\x1b[2m > \\x1b[22mstory-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained\\x1b[2m > \\x1b[22mtest_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts\\x1b[2m > \\x1b[22mstory-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained\\x1b[2m > \\x1b[22mtest_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes\\x1b[32m 291\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m5 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m10 skipped\\x1b[39m\\x1b[90m (15)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 08:15:44\n\\x1b[2m   Duration \\x1b[22m 15.95s\\x1b[2m (transform 13.50s, setup 0ms, import 25.26s, tests 525ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-z2msjabs.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":6,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":15,\"numPassedTests\":5,\"numFailedTests\":0,\"numPendingTests\":10,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793808944841,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1386_a_store_handle_sees_exactly_one_account_and_no_operation_takes_one\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1386_a_store_handle_sees_exactly_one_account_and_no_operation_takes_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1388_a_site_version_is_readable_and_advances_on_every_write\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1388_a_site_version_is_readable_and_advances_on_every_write\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1389_a_stale_expectation_is_refused_with_both_versions_and_one_racer_survives\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1389_a_stale_expectation_is_refused_with_both_versions_and_one_racer_survives\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1390_a_refused_multi_part_write_leaves_no_page_definition_or_version_behind\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1390_a_refused_multi_part_write_leaves_no_page_definition_or_version_behind\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable\",\"duration\":51,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793808951831,\"endTime\":1793808951882,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-cloudflare-site-store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained\"],\"fullName\":\"story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained\"],\"fullName\":\"story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes\",\"status\":\"passed\",\"title\":\"test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes\",\"duration\":291,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793808960514,\"endTime\":1793808960805,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793808951830,\"endTime\":1793808951876,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_starter_site_guard.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site",
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