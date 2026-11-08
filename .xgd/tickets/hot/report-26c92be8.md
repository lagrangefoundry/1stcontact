---
uid: report-26c92be8
id: REPORT-11234
type: report
title: 'Report: batch_quality_check for STORY-170'
created_by: xgd
created_at: '2026-11-08T02:18:42.211214+00:00'
updated_at: '2026-11-08T02:18:42.211214+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-170
  parent_report_uid: report-c1b20b12
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T02:13:57.300614Z",
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
      "duration_seconds": 3.6521842912770808,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 16,
      "test_filter": [
        "test_UAT_AC2317"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "_pass_untouched\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-access-sim-edge.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim as the edge\\x1b[2m > \\x1b[22mtest_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2312_the_seed_creates_no_platform_operator\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2313_seed_targets_local_unless_remote_is_typed\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2314_success_report_and_help_text\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2316_applying_migrations_never_applies_the_fixture\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping\\x1b[32m 71\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2318_a_minted_token_passes_the_real_verifier\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 ACCESS.md\\x1b[2m > \\x1b[22mtest_UAT_AC2322_access_md_points_to_seed_and_simulator\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m16 skipped\\x1b[39m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:13:58\n\\x1b[2m   Duration \\x1b[22m 2.82s\\x1b[2m (transform 24ms, setup 0ms, import 49ms, tests 2.66s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-taz66ikf.json\n\n{\"numTotalTestSuites\":7,\"numPassedTestSuites\":7,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":16,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794104038474,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim configuration output\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping\",\"status\":\"passed\",\"title\":\"test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping\",\"duration\":147.85483399999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim configuration output\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794104039028,\"endTime\":1794104039175.8547,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-access-sim-edge.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2314_success_report_and_help_text\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2314_success_report_and_help_text\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping\",\"status\":\"passed\",\"title\":\"test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping\",\"duration\":70.81812500000024,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 ACCESS.md\"],\"fullName\":\"story-5b5be809 \u2014 ACCESS.md test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794104041228,\"endTime\":1794104041298.818,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-dev-seed-access-sim.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping",
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