---
uid: report-93d367e2
id: REPORT-10897
type: report
title: 'Scoped quality: pass (18 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-04T18:28:48.314574+00:00'
updated_at: '2026-11-04T18:28:48.314574+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-5b5be809
  commit: 849ca0cce16c4c59e016e32179ccf18e1b7408a6
---

{
  "timestamp": "2026-11-04T18:23:27.748362Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016850000247359276,
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
      "duration_seconds": 14.387188667198643,
      "passed": 18,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 18,
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
        "test_UAT_AC2322_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "9m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\\x1b[33m 2393\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2312_the_seed_creates_no_platform_operator\\x1b[33m 729\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2313_seed_targets_local_unless_remote_is_typed\\x1b[32m 236\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2314_success_report_and_help_text\\x1b[32m 32\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\\x1b[33m 1033\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/seed\\x1b[2m > \\x1b[22mtest_UAT_AC2316_applying_migrations_never_applies_the_fixture\\x1b[33m 1966\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2317_print_env_emits_exactly_the_two_access_settings\\x1b[32m 103\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2318_a_minted_token_passes_the_real_verifier\\x1b[32m 14\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\\x1b[33m 1356\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 bin/access-sim\\x1b[2m > \\x1b[22mtest_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\\x1b[33m 877\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-dev-seed-access-sim.test.ts\\x1b[2m > \\x1b[22mstory-5b5be809 \u2014 ACCESS.md\\x1b[2m > \\x1b[22mtest_UAT_AC2322_access_md_points_to_seed_and_simulator\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m18 passed\\x1b[39m\\x1b[22m\\x1b[90m (18)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 10:23:29\n\\x1b[2m   Duration \\x1b[22m 13.33s\\x1b[2m (transform 1.01s, setup 0ms, import 1.92s, tests 12.60s, environment 1ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-agojte_j.json\n\n{\"numTotalTestSuites\":6,\"numPassedTestSuites\":6,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":18,\"numPassedTests\":18,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793816609352,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership\",\"status\":\"passed\",\"title\":\"test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793816612184,\"endTime\":1793816612209,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-dev-seed-fixture.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"status\":\"passed\",\"title\":\"test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"duration\":793.2618749999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"status\":\"passed\",\"title\":\"test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"duration\":2393.317166,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"status\":\"passed\",\"title\":\"test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"duration\":729.4445420000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"duration\":235.78200000000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2314_success_report_and_help_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2314_success_report_and_help_text\",\"duration\":31.52229200000056,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"status\":\"passed\",\"title\":\"test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"duration\":1033.0007499999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"status\":\"passed\",\"title\":\"test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"duration\":1966.3270420000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings\",\"status\":\"passed\",\"title\":\"test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings\",\"duration\":103.02708399999938,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"status\":\"passed\",\"title\":\"test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"duration\":13.932292000001326,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"status\":\"passed\",\"title\":\"test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"duration\":5.725500000000466,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"duration\":1355.5521659999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"duration\":877.0446659999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 ACCESS.md\"],\"fullName\":\"story-5b5be809 \u2014 ACCESS.md test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"status\":\"passed\",\"title\":\"test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"duration\":0.5323339999995369,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793816613017,\"endTime\":1793816622682.5322,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-dev-seed-access-sim.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings",
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