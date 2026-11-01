---
uid: report-516f27b7
id: REPORT-7195
type: report
title: 'Report: batch_quality_check for STORY-146'
created_by: xgd
created_at: '2026-11-01T01:44:44.806724+00:00'
updated_at: '2026-11-01T01:44:44.806724+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-146
  parent_report_uid: report-76cdd954
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T01:41:45.329071Z",
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
      "duration_seconds": 4.441166541073471,
      "passed": 3,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 3,
      "deselected": 29,
      "test_filter": [
        "test_UAT_AC1748",
        "test_UAT_AC1754"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1744_case_and_padding_do_not_make_a_second_person\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1744_case_and_padding_do_not_make_a_second_person\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant\",\"status\":\"passed\",\"title\":\"test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1750_a_grant_end_is_evaluated_from_both_sides\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1752_a_revoked_grant_refuses_whatever_its_dates_say\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest\",\"status\":\"passed\",\"title\":\"test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"login binds, and provisions nothing\"],\"fullName\":\"login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1760_an_invited_and_entitled_person_reaches_the_builder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793497309933,\"endTime\":1793497309948,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-identity-invite-and-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the invite provisions\"],\"fullName\":\"the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account\",\"status\":\"passed\",\"title\":\"test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"admission returns the set of businesses\"],\"fullName\":\"admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1750_grant_end_evaluated_both_sides_and_refusal_only_when_all_lapsed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"grant state is evaluated per business\"],\"fullName\":\"grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"membership state excludes, grants untouched\"],\"fullName\":\"membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793497307432,\"endTime\":1793497307446,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-identity-multi-business-admission.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
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