---
uid: report-85003dc4
id: REPORT-7552
type: report
title: 'Report: batch_quality_check for story-7b1025b8'
created_by: xgd
created_at: '2026-11-01T10:19:24.155835+00:00'
updated_at: '2026-11-01T10:19:24.155835+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-7b1025b8
  parent_report_uid: report-0faeb796
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T10:15:54.430394Z",
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
      "duration_seconds": 4.090692667057738,
      "passed": 36,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 36,
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
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "hip_and_grant\",\"status\":\"passed\",\"title\":\"test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide\",\"status\":\"passed\",\"title\":\"test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates\",\"status\":\"passed\",\"title\":\"test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1744_case_and_padding_do_not_make_a_second_person\",\"status\":\"passed\",\"title\":\"test_UAT_AC1744_case_and_padding_do_not_make_a_second_person\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values\",\"status\":\"passed\",\"title\":\"test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant\",\"status\":\"passed\",\"title\":\"test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included\",\"status\":\"passed\",\"title\":\"test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit_its_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit_its_business\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates_say\",\"status\":\"passed\",\"title\":\"test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates_say\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest\",\"status\":\"passed\",\"title\":\"test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed\",\"status\":\"passed\",\"title\":\"test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account\",\"status\":\"passed\",\"title\":\"test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"status\":\"passed\",\"title\":\"test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793528158635,\"endTime\":1793528158734,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-invite-and-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back\",\"status\":\"passed\",\"title\":\"test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape\",\"status\":\"passed\",\"title\":\"test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account\",\"status\":\"passed\",\"title\":\"test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list\",\"status\":\"passed\",\"title\":\"test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates\",\"status\":\"passed\",\"title\":\"test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"membership state excludes, grants untouched\"],\"fullName\":\"membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain\",\"status\":\"passed\",\"title\":\"test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793528156517,\"endTime\":1793528156625,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-identity-multi-business-admission.workers.test.ts\"}]}",
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
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide",
          "file": "",
          "status": "passed"
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
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit_its_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates_say",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
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
          "name": "the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain",
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