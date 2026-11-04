---
uid: report-f1eb470e
id: REPORT-10861
type: report
title: 'Scoped quality: fail (39 tests, 22 failed, 20 orphan AC(s))'
created_by: xgd
created_at: '2026-11-04T16:38:44.498206+00:00'
updated_at: '2026-11-04T16:38:44.498206+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-7b1025b8
  commit: c881840d05c3852a7d6347aad5d5891d732a66f8
---

{
  "timestamp": "2026-11-04T16:34:41.474670Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001449580304324627,
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
      "duration_seconds": 6.491097208112478,
      "passed": 17,
      "failed": 22,
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
        "test_UAT_AC2116_",
        "test_UAT_AC2169_",
        "test_UAT_AC2170_",
        "test_UAT_AC2171_",
        "test_UAT_AC2172_",
        "test_UAT_AC2173_",
        "test_UAT_AC2174_",
        "test_UAT_AC2175_",
        "test_UAT_AC2176_",
        "test_UAT_AC2247_",
        "test_UAT_AC2248_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "y_evaluated_both_sides\",\"status\":\"failed\",\"title\":\"test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides\",\"duration\":7,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:962:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"membership admits; entitlement does not\"],\"fullName\":\"membership admits; entitlement does not test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason\",\"status\":\"failed\",\"title\":\"test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason\",\"duration\":3,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:989:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"membership admits; entitlement does not\"],\"fullName\":\"membership admits; entitlement does not test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused\",\"status\":\"failed\",\"title\":\"test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused\",\"duration\":6,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:1017:28\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"membership admits; entitlement does not\"],\"fullName\":\"membership admits; entitlement does not test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates\",\"status\":\"failed\",\"title\":\"test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates\",\"duration\":7,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:1038:25\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a lapse explains itself\"],\"fullName\":\"a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing\",\"status\":\"failed\",\"title\":\"test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing\",\"duration\":5,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at add (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:1050:35)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:1052:27\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a lapse explains itself\"],\"fullName\":\"a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on\",\"status\":\"failed\",\"title\":\"test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on\",\"duration\":4,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:1087:31\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a lapse explains itself\"],\"fullName\":\"a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted\",\"status\":\"failed\",\"title\":\"test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted\",\"duration\":5,\"failureMessages\":[\"Error: A business needs an account to belong to.\\n    at provisionBusiness (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/apps/control-app/src/identity.ts:673:31)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts:1126:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"status\":\"passed\",\"title\":\"test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder\",\"status\":\"passed\",\"title\":\"test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793810088035,\"endTime\":1793810088293,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-invite-provision-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary\",\"status\":\"passed\",\"title\":\"test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2248_admission_and_the_invite_resolve_a_person_through_any_of_their_addresses\",\"status\":\"passed\",\"title\":\"test_UAT_AC2248_admission_and_the_invite_resolve_a_person_through_any_of_their_addresses\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login_with_the_schema_casefolding\",\"status\":\"passed\",\"title\":\"test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login_with_the_schema_casefolding\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a re-invite\"],\"fullName\":\"a re-invite test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_supersedes_an_existing_current_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_supersedes_an_existing_current_name\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793810088038,\"endTime\":1793810088133,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-identity-person-addresses-names.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the invite control test_UAT_AC2175_the_invite_control_is_owner_only_and_its_dialog_says_no_message_is_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login",
          "file": "",
          "status": "failed"
        },
        {
          "name": "who may invite test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing",
          "file": "",
          "status": "failed"
        },
        {
          "name": "who may invite test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "file": "",
          "status": "failed"
        },
        {
          "name": "provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site",
          "file": "",
          "status": "failed"
        },
        {
          "name": "provisioning a business test_UAT_AC1741_the_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning a business test_UAT_AC1746_several_concurrent_grants_and_unknown_plan_and_status_round_trip",
          "file": "",
          "status": "passed"
        },
        {
          "name": "invite plus provisioning makes a customer test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1745_admission_refuses_an_unconfigured_platform_tenant_naming_what_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "file": "",
          "status": "failed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_excludes_its_business_and_refuses_only_when_none_remain",
          "file": "",
          "status": "failed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "failed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_a_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "failed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides",
          "file": "",
          "status": "failed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason",
          "file": "",
          "status": "failed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "failed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted",
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
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC2248_admission_and_the_invite_resolve_a_person_through_any_of_their_addresses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a person and their addresses test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login_with_the_schema_casefolding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a re-invite test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_supersedes_an_existing_current_name",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "the invite is a transition, not a creation test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite is a transition, not a creation test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite is a transition, not a creation test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite is a transition, not a creation test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite is a transition, not a creation test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "who may invite test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "who may invite test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "invite plus provisioning makes a customer test_UAT_AC2176_invite_provision_sign_in_reaches_only_that_business_and_its_account",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_excludes_its_business_and_refuses_only_when_none_remain",
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
          "test_name": "admission returns the set of businesses test_UAT_AC2077_a_withdrawn_or_expired_membership_is_absent_from_the_list",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "membership admits; entitlement does not test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "membership admits; entitlement does not test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "membership admits; entitlement does not test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted",
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
      "passed": 17,
      "failed": 20,
      "total": 35,
      "failures": [
        {
          "test_name": "AC-2075 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2075 'A person holding memberships in several businesses is admitted with all of them, each carrying its own effective grant and its business name' (uid=acceptance_criterion-dc59f060) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2075.",
          "ac_uid": "acceptance_criterion-dc59f060",
          "ac_id": "AC-2075",
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
          "test_name": "AC-2169 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2169 'Inviting an address already a contact of the business promotes that same row and inserts no second; the result reports whether a row was created' (uid=acceptance_criterion-08105c13) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2169.",
          "ac_uid": "acceptance_criterion-08105c13",
          "ac_id": "AC-2169",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2170 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2170 'Invites from two different businesses differ only in the business the row is held against, and the people schema carries no level' (uid=acceptance_criterion-de051c1d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2170.",
          "ac_uid": "acceptance_criterion-de051c1d",
          "ac_id": "AC-2170",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2172 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2172 'Only an owner of the business may invite into it: a non-owner, including a platform operator, is refused 403, the dev-open path is refused, an empty address is 400' (uid=acceptance_criterion-b57f3f26) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2172.",
          "ac_uid": "acceptance_criterion-b57f3f26",
          "ac_id": "AC-2172",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2173 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2173 'The invite writes no membership and no grant; an invited person holding no business is refused as no_membership at the door' (uid=acceptance_criterion-84cb722b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2173.",
          "ac_uid": "acceptance_criterion-84cb722b",
          "ac_id": "AC-2173",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2174 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2174 'GET /api/people reports canInvite and canFulfil as two separate flags' (uid=acceptance_criterion-16e701a9) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2174.",
          "ac_uid": "acceptance_criterion-16e701a9",
          "ac_id": "AC-2174",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2176 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2176 'The DOC-42 \u00a71 sequence runs: invite, provision a business, sign in, reach only that business and its /account' (uid=acceptance_criterion-a816942d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2176.",
          "ac_uid": "acceptance_criterion-a816942d",
          "ac_id": "AC-2176",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2115 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2115 'An entitlement names its business as object and optionally an account as subject; business provisioning writes grants naming no account and the invite writes none' (uid=acceptance_criterion-d384dcb1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2115.",
          "ac_uid": "acceptance_criterion-d384dcb1",
          "ac_id": "AC-2115",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1742 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1742 'Provisioning a business \u2014 not the invite \u2014 writes the business, its owner membership and grant together, and a starter site whose address cannot collide' (uid=acceptance_criterion-3f0182e4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1742.",
          "ac_uid": "acceptance_criterion-3f0182e4",
          "ac_id": "AC-1742",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1743 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1743 'Re-inviting a known address reports the existing person and creates nothing \u2014 no second person, no business, no grant' (uid=acceptance_criterion-c7cfa975) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1743.",
          "ac_uid": "acceptance_criterion-c7cfa975",
          "ac_id": "AC-1743",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2077 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2077 'A business whose membership is revoked or expired is absent from the list entirely' (uid=acceptance_criterion-c7f1513b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2077.",
          "ac_uid": "acceptance_criterion-c7f1513b",
          "ac_id": "AC-2077",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2076 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2076 'A business whose grant has lapsed, not started or been revoked stays listed, unselectable and carrying its lapse reason; the person is admitted regardless' (uid=acceptance_criterion-c6bc805e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2076.",
          "ac_uid": "acceptance_criterion-c6bc805e",
          "ac_id": "AC-2076",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2112 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2112 'A person whose every business has lapsed is admitted with every business listed and none selectable; grant expiry is evaluated from both sides' (uid=acceptance_criterion-e515a53e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2112.",
          "ac_uid": "acceptance_criterion-e515a53e",
          "ac_id": "AC-2112",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2113 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2113 'Each unselectable business says why \u2014 expired with its end date, revoked, not_yet or never_granted \u2014 and a selectable one says nothing' (uid=acceptance_criterion-3e874f22) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2113.",
          "ac_uid": "acceptance_criterion-3e874f22",
          "ac_id": "AC-2113",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2114 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2114 'A lapse reason is only ever reported for a business on which the person holds a live membership' (uid=acceptance_criterion-75da6dd7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2114.",
          "ac_uid": "acceptance_criterion-75da6dd7",
          "ac_id": "AC-2114",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2116 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2116 'Only per-business capacity grants decide selectability; a grant naming an account leaves its business unselectable and never_granted' (uid=acceptance_criterion-3ca01422) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2116.",
          "ac_uid": "acceptance_criterion-3ca01422",
          "ac_id": "AC-2116",
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
          "test_name": "AC-1753 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1753 'A membership that is not active excludes its business; the person is refused only when no active membership remains, grants untouched' (uid=acceptance_criterion-15ef9fae) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1753.",
          "ac_uid": "acceptance_criterion-15ef9fae",
          "ac_id": "AC-1753",
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
        "message": "22 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 22
        }
      }
    ]
  }
}