---
uid: report-e08e7a66
id: REPORT-7547
type: report
title: 'Scoped quality: fail (39 tests, 24 failed, 12 orphan AC(s))'
created_by: xgd
created_at: '2026-11-01T10:00:29.471915+00:00'
updated_at: '2026-11-01T10:00:29.471915+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-7b1025b8
  commit: 575c20f6508e88011c7ab7ad130c771df2eb2736
---

{
  "timestamp": "2026-11-01T09:57:38.095900Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017916690558195114,
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
      "duration_seconds": 4.380597667070106,
      "passed": 15,
      "failed": 24,
      "skipped": 0,
      "errors": 0,
      "total": 39,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1740_",
        "test_UAT_AC1741_",
        "test_UAT_AC1742_",
        "test_UAT_AC1743_",
        "test_UAT_AC1744_",
        "test_UAT_AC1745_",
        "test_UAT_AC1746_",
        "test_UAT_AC1747_",
        "test_UAT_AC1748_",
        "test_UAT_AC1749_",
        "test_UAT_AC1750_",
        "test_UAT_AC1751_",
        "test_UAT_AC1752_",
        "test_UAT_AC1753_",
        "test_UAT_AC1754_",
        "test_UAT_AC1755_",
        "test_UAT_AC1756_",
        "test_UAT_AC1757_",
        "test_UAT_AC1758_",
        "test_UAT_AC1759_",
        "test_UAT_AC1760_",
        "test_UAT_AC2075_",
        "test_UAT_AC2076_",
        "test_UAT_AC2077_",
        "test_UAT_AC2078_",
        "test_UAT_AC2079_",
        "test_UAT_AC2112_",
        "test_UAT_AC2113_",
        "test_UAT_AC2114_",
        "test_UAT_AC2115_",
        "test_UAT_AC2116_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "rktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:97:8\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape\",\"status\":\"failed\",\"title\":\"test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape\",\"duration\":6,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at shapeOf (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:150:10)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:165:32\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account\",\"status\":\"failed\",\"title\":\"test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account\",\"duration\":3,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:262:8\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant\",\"status\":\"failed\",\"title\":\"test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant\",\"duration\":7,\"failureMessages\":[\"AssertionError: expected 1 to be 2 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:300:29\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted\",\"status\":\"failed\",\"title\":\"test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted\",\"duration\":5,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at setGrant (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:54:6)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:330:13\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list\",\"status\":\"failed\",\"title\":\"test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list\",\"duration\":6,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:349:8\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed\",\"status\":\"failed\",\"title\":\"test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed\",\"duration\":3,\"failureMessages\":[\"AssertionError: expected null to be undefined // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:377:64\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused\",\"status\":\"failed\",\"title\":\"test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused\",\"duration\":3,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at setGrant (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:54:6)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:404:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates\",\"status\":\"failed\",\"title\":\"test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates\",\"duration\":3,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at setGrant (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:54:6)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:424:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"membership state excludes, grants untouched\"],\"fullName\":\"membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain\",\"status\":\"failed\",\"title\":\"test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain\",\"duration\":3,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts:458:33\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1793527060227,\"endTime\":1793527060289,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2076_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an entitlement has a subject and an object test_UAT_AC2115_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an entitlement has a subject and an object test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite provisions test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1744_case_and_padding_do_not_make_a_second_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the request path test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "file": "",
          "status": "failed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "failed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted",
          "file": "",
          "status": "failed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "failed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed",
          "file": "",
          "status": "failed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "failed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates",
          "file": "",
          "status": "failed"
        },
        {
          "name": "membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "the invite provisions test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the request path test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "grant state is evaluated per business test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain",
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
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 15,
      "failed": 12,
      "total": 20,
      "failures": [
        {
          "test_name": "AC-1740 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1740 'An invite creates the person, then the business's owner membership and active grant together, all readable back' (uid=acceptance_criterion-aa26d407) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1740.",
          "ac_uid": "acceptance_criterion-aa26d407",
          "ac_id": "AC-1740",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1753 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1753 'A membership that is not active excludes its business; the person is refused only when no active membership remains, grants untouched' (uid=acceptance_criterion-15ef9fae) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1753.",
          "ac_uid": "acceptance_criterion-15ef9fae",
          "ac_id": "AC-1753",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1752 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1752 'A revoked grant makes its business unselectable whatever its dates say' (uid=acceptance_criterion-ddfa5b62) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1752.",
          "ac_uid": "acceptance_criterion-ddfa5b62",
          "ac_id": "AC-1752",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1751 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1751 'A grant whose start is in the future makes its business unselectable rather than refusing the person outright' (uid=acceptance_criterion-cbbd3ee4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1751.",
          "ac_uid": "acceptance_criterion-cbbd3ee4",
          "ac_id": "AC-1751",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1748 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1748 'An invited person is admitted with the deterministic set of businesses they operate, each bound to its own effective grant' (uid=acceptance_criterion-c65eae15) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1748.",
          "ac_uid": "acceptance_criterion-c65eae15",
          "ac_id": "AC-1748",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1741 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1741 'The account's identifier is opaque and derived from nothing a human chose; the label is separate' (uid=acceptance_criterion-17f275a7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1741.",
          "ac_uid": "acceptance_criterion-17f275a7",
          "ac_id": "AC-1741",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1742 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1742 'A newly invited account owns one starter site whose published address cannot collide with another account's' (uid=acceptance_criterion-3f0182e4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1742.",
          "ac_uid": "acceptance_criterion-3f0182e4",
          "ac_id": "AC-1742",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1749 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1749 'Arrival is recorded on every attempt: first arrival never moves, latest always does, refused visits included' (uid=acceptance_criterion-aacc39c7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1749.",
          "ac_uid": "acceptance_criterion-aacc39c7",
          "ac_id": "AC-1749",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1754 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1754 'Where several grants cover now, the one preserving access longest is the effective one' (uid=acceptance_criterion-a15e3f06) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1754.",
          "ac_uid": "acceptance_criterion-a15e3f06",
          "ac_id": "AC-1754",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1756 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1756 'A person whose own record is not active is refused, without disturbing their account' (uid=acceptance_criterion-150f5bbd) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1756.",
          "ac_uid": "acceptance_criterion-150f5bbd",
          "ac_id": "AC-1756",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1758 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1758 'Every refusal is byte-identical to the caller, forbidden rather than a challenge, and neither cached nor indexed' (uid=acceptance_criterion-766fc357) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1758.",
          "ac_uid": "acceptance_criterion-766fc357",
          "ac_id": "AC-1758",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1759 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1759 'The check that failed is recorded for the operator, distinguished per reason' (uid=acceptance_criterion-fea04c41) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1759.",
          "ac_uid": "acceptance_criterion-fea04c41",
          "ac_id": "AC-1759",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
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
        "message": "24 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 24
        }
      }
    ]
  }
}