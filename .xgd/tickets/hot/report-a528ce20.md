---
uid: report-a528ce20
id: REPORT-11230
type: report
title: 'Scoped quality: fail (23 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T02:12:22.420825+00:00'
updated_at: '2026-11-08T02:12:22.420825+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-170
  commit: d08488d01153c269f809f1a1d3fb2b83e845cef5
---

{
  "timestamp": "2026-11-08T02:09:00.355854Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016237515956163406,
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
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 9.845659041777253,
      "passed": 22,
      "failed": 1,
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
      "stdout": "m\\x1b[1m\\x1b[32m22 passed\\x1b[39m\\x1b[22m\\x1b[90m (23)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:09:01\n\\x1b[2m   Duration \\x1b[22m 9.02s\\x1b[2m (transform 470ms, setup 0ms, import 1.08s, tests 9.31s, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-v427dtfy.json\n\n{\"numTotalTestSuites\":9,\"numPassedTestSuites\":7,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":23,\"numPassedTests\":22,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794103741536,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership\",\"status\":\"passed\",\"title\":\"test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 the seeded cast, through the product\"],\"fullName\":\"story-5b5be809 \u2014 the seeded cast, through the product test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794103743032,\"endTime\":1794103743053,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-dev-seed-fixture.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim configuration output\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping\",\"status\":\"passed\",\"title\":\"test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping\",\"duration\":146.523458,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim configuration output\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim configuration output test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier\",\"status\":\"passed\",\"title\":\"test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier\",\"duration\":17.925374999999974,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it\",\"duration\":418.13770900000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched\",\"duration\":10.286500000000046,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim as the edge\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim as the edge test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder\",\"duration\":2.4305409999999483,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794103742134,\"endTime\":1794103742729.4304,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-access-sim-edge.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"status\":\"passed\",\"title\":\"test_UAT_AC2305_seed_on_an_empty_store_populates_exactly_the_cast\",\"duration\":589.8635840000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"status\":\"passed\",\"title\":\"test_UAT_AC2311_re_running_the_seed_leaves_every_row_identical\",\"duration\":1651.7546659999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"status\":\"passed\",\"title\":\"test_UAT_AC2312_the_seed_creates_no_platform_operator\",\"duration\":522.8366660000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2313_seed_targets_local_unless_remote_is_typed\",\"duration\":288.2114169999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2314_success_report_and_help_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2314_success_report_and_help_text\",\"duration\":9.837083000000348,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"status\":\"passed\",\"title\":\"test_UAT_AC2315_seed_without_schema_fails_with_migration_guidance\",\"duration\":579.5632080000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/seed\"],\"fullName\":\"story-5b5be809 \u2014 bin/seed test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"status\":\"passed\",\"title\":\"test_UAT_AC2316_applying_migrations_never_applies_the_fixture\",\"duration\":1367.1072080000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings\",\"status\":\"failed\",\"title\":\"test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings\",\"duration\":38.1284169999999,\"failureMessages\":[\"AssertionError: expected 'ACCESS_TEAM_DOMAIN=\\\"http://127.0.0.1:\u2026' to be 'ACCESS_TEAM_DOMAIN=\\\"http://127.0.0.1:\u2026' // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-dev-seed-access-sim.test.ts:415:29\\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"status\":\"passed\",\"title\":\"test_UAT_AC2318_a_minted_token_passes_the_real_verifier\",\"duration\":6.149792000000161,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"status\":\"passed\",\"title\":\"test_UAT_AC2319_the_verifier_refuses_the_token_under_a_different_aud\",\"duration\":5.143000000000029,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2320_login_lists_every_address_and_signs_in_as_the_chosen_one\",\"duration\":658.3225419999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 bin/access-sim\"],\"fullName\":\"story-5b5be809 \u2014 bin/access-sim test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2321_login_offers_a_way_in_when_the_store_is_missing\",\"duration\":541.3405830000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5b5be809 \u2014 ACCESS.md\"],\"fullName\":\"story-5b5be809 \u2014 ACCESS.md test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"status\":\"passed\",\"title\":\"test_UAT_AC2322_access_md_points_to_seed_and_simulator\",\"duration\":0.27745800000047893,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794103744175,\"endTime\":1794103750557.3406,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-39/tests/reconciliation-dev-seed-access-sim.test.ts\"}]}",
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
          "name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings",
          "file": "",
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-5b5be809 \u2014 bin/access-sim test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": [],
      "synthetic": true
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "test_failure",
        "field": "test results",
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}