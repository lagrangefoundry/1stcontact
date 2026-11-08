---
uid: report-1afdd445
id: REPORT-11235
type: report
title: 'Scoped quality: pass (23 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T02:22:34.731961+00:00'
updated_at: '2026-11-08T02:22:34.731961+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: STORY-170
  commit: 16fa36b1727af8499752044657cf93e6a1f6798c
---

{
  "timestamp": "2026-11-08T02:18:51.737563Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00021491572260856628,
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
      "duration_seconds": 11.891468416899443,
      "passed": 23,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 23,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2305_",
        "test_UAT_AC2306_",
        "test_UAT_AC2307_",
        "test_UAT_AC2308_",
        "test_UAT_AC2309_",
        "test_UAT_AC2310_",
        "test_UAT_AC2311_",
        "test_UAT_AC2312_",
        "test_UAT_AC2313_",
        "test_UAT_AC2314_",
        "test_UAT_AC2315_",
        "test_UAT_AC2316_",
        "test_UAT_AC2317_",
        "test_UAT_AC2318_",
        "test_UAT_AC2319_",
        "test_UAT_AC2320_",
        "test_UAT_AC2321_",
        "test_UAT_AC2322_",
        "test_UAT_AC2361_",
        "test_UAT_AC2362_",
        "test_UAT_AC2363_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "one\\x1b[33m 957\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\\x1b[33m 725\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 ACCESS.md\\x1b[2m > \\x1b[22mtest_UAT_AC2322_access_md_points_to_seed_and_simulator\\x1b[32m 0\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m23 passed\\x1b[39m\\x1b[22m\\x1b[90m (23)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:18:53\n\\x1b[2m   Duration \\x1b[22m 10.82s\\x1b[2m (transform 663ms, setup 0ms, import 1.48s, tests 10.87s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-grjwgw2g.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":9,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":23,\"numPassedTests\":23,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794104333316,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim configuration output\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping\",\"status\":\"passed\",\"title\":\"test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping\",\"duration\":173.554167,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim configuration output\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier\",\"status\":\"passed\",\"title\":\"test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier\",\"duration\":25.180124999999975,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it\",\"duration\":449.78125,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched\",\"duration\":11.679250000000025,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\",\"duration\":3.153500000000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794104334256,\"endTime\":1794104334920.1536,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-access-sim-edge.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"status\":\"passed\",\"title\":\"test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"duration\":586.943084,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"status\":\"passed\",\"title\":\"test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"duration\":1973.395375,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"status\":\"passed\",\"title\":\"test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"duration\":600.4819580000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"duration\":228.99004100000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2314_success_report_and_help_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2314_success_report_and_help_text\",\"duration\":10.75525000000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"status\":\"passed\",\"title\":\"test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"duration\":601.9847920000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"status\":\"passed\",\"title\":\"test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"duration\":1458.8699589999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping\",\"status\":\"passed\",\"title\":\"test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping\",\"duration\":92.02237500000047,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"status\":\"passed\",\"title\":\"test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"duration\":9.17974999999933,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"status\":\"passed\",\"title\":\"test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"duration\":3.407583000000159,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"duration\":957.4689590000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"duration\":724.7489160000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 ACCESS.md\"],\"fullName\":\"story-5b5be809 \u2014 ACCESS.md test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"status\":\"passed\",\"title\":\"test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"duration\":0.2732910000013362,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794104336758,\"endTime\":1794104344138.2732,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-dev-seed-access-sim.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership\",\"status\":\"passed\",\"title\":\"test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794104335534,\"endTime\":1794104335558,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-dev-seed-fixture.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2312_the_seed_creates_no_platform_operator",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2313_seed_targets_local_unless_remote_is_typed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2314_success_report_and_help_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/seed test_UAT_AC2316_applying_migrations_never_applies_the_fixture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2318_a_minted_token_passes_the_real_verifier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 ACCESS.md test_UAT_AC2322_access_md_points_to_seed_and_simulator",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes",
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