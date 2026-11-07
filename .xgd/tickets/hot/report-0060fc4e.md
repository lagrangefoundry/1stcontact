---
uid: report-0060fc4e
id: REPORT-11118
type: report
title: 'Scoped quality: pass (53 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-07T08:19:37.728341+00:00'
updated_at: '2026-11-07T08:19:37.728341+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-7b1025b8
  commit: fa873501c42ea4da6ff98192973ff69dd34c826e
---

{
  "timestamp": "2026-11-07T08:16:00.055160Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012816605158150196,
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
      "duration_seconds": 8.524735582992435,
      "passed": 53,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 53,
      "deselected": 6,
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
        "test_UAT_AC2248_",
        "test_UAT_AC2253_",
        "test_UAT_AC2254_",
        "test_UAT_AC2257_",
        "test_UAT_AC2336_",
        "test_UAT_AC2337_",
        "test_UAT_AC2338_",
        "test_UAT_AC2339_",
        "test_UAT_AC2340_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "est_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"status\":\"passed\",\"title\":\"test_UAT_AC1757_admission_is_decided_before_any_route_is_served\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the request path\"],\"fullName\":\"the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder\",\"status\":\"passed\",\"title\":\"test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794039368596,\"endTime\":1794039368953,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-identity-invite-provision-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary\",\"status\":\"passed\",\"title\":\"test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary\",\"duration\":43,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2179_the_contacts_list_route_carries_the_primary_address_not_the_oldest\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2179_the_contacts_list_route_carries_the_primary_address_not_the_oldest\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a person and their addresses\"],\"fullName\":\"a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates\",\"duration\":67,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"correcting an address\"],\"fullName\":\"correcting an address test_UAT_AC2249_correcting_the_address_rewrites_the_primary_row_and_neither_that_nor_repriming_moves_a_key\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2249_correcting_the_address_rewrites_the_primary_row_and_neither_that_nor_repriming_moves_a_key\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name is a row that is superseded, never updated\"],\"fullName\":\"a name is a row that is superseded, never updated test_UAT_AC2251_a_name_is_superseded_as_corrected_unless_marked_changed_and_only_changed_former_names_reach_the_client\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2251_a_name_is_superseded_as_corrected_unless_marked_changed_and_only_changed_former_names_reach_the_client\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a name is a row that is superseded, never updated\"],\"fullName\":\"a name is a row that is superseded, never updated test_UAT_AC2252_clearing_every_part_through_the_route_leaves_no_name_and_clearing_only_the_displayed_name_is_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2252_clearing_every_part_through_the_route_leaves_no_name_and_clearing_only_the_displayed_name_is_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794039368589,\"endTime\":1794039368699,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/reconciliation-identity-person-addresses-names.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite\",\"status\":\"passed\",\"title\":\"test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"status\":\"passed\",\"title\":\"test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"status\":\"passed\",\"title\":\"test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the add\"],\"fullName\":\"story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp\",\"duration\":40,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 who may add and invite\"],\"fullName\":\"story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"status\":\"passed\",\"title\":\"test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"status\":\"passed\",\"title\":\"test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7b1025b8 \u2014 the invite\"],\"fullName\":\"story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794039368601,\"endTime\":1794039368842,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_contacts_add_invite.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a contact who is signing up is admitted with nothing\"],\"fullName\":\"a contact who is signing up is admitted with nothing test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the refusal the visitor reads\"],\"fullName\":\"the refusal the visitor reads test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"the refusal the operator reads\"],\"fullName\":\"the refusal the operator reads test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag\",\"status\":\"passed\",\"title\":\"test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794039368595,\"endTime\":1794039368722,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_identity_signup_admission_refusal.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-7b1025b8 \u2014 the add dialog test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2337_invite_is_disabled_until_a_row_is_checked_and_opens_a_message_with_read_only_from_and_a_to_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite modal test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the account is a record people belong to test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the account is a record people belong to test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC1741_business_key_is_opaque_biz_and_distinct_from_its_owning_account_key",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC1742_provisioning_writes_an_account_owned_business_grant_and_unnamed_starter_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business is owned by an account test_UAT_AC2115_a_non_null_grant_subject_is_an_account_key_and_the_capacity_grant_names_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition on an existing contact test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column",
          "file": "",
          "status": "passed"
        },
        {
          "name": "who may invite test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2173_the_invite_writes_no_membership_or_grant_and_the_invitee_is_refused_no_membership",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite writes no membership and no grant test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "file": "",
          "status": "passed"
        },
        {
          "name": "provisioning a business test_UAT_AC1742_provisioning_not_the_invite_writes_the_business_grant_and_a_starter_site",
          "file": "",
          "status": "passed"
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
          "status": "passed"
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
          "status": "passed"
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
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_a_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2076_a_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC1751_a_future_start_makes_its_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates",
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
          "name": "a lapse explains itself test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted",
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
          "name": "a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2336_adding_creates_a_lead_sends_nothing_and_no_flag_selects_the_invite",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2253_adding_a_contact_mints_an_acct_account_and_the_schema_refuses_a_person_without_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC1743_adding_a_known_address_reports_the_person_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_add_route_and_at_login",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2248_the_add_and_admission_resolve_a_person_through_a_secondary_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the add test_UAT_AC2171_a_name_at_the_add_fills_in_never_supersedes_and_a_re_invite_keeps_the_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 who may add and invite test_UAT_AC2172_only_an_owner_may_add_or_invite_and_every_refusal_writes_and_sends_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2169_the_invite_acts_only_on_existing_contacts_by_id_and_unknown_ids_are_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2337_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_deployment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2338_edits_apply_to_that_send_only_and_a_body_without_cta_url_is_refused_before_sending",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7b1025b8 \u2014 the invite test_UAT_AC2339_each_invite_goes_to_the_primary_address_and_a_contact_without_one_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a contact who is signing up is admitted with nothing test_UAT_AC2340_a_contact_signing_up_is_admitted_to_the_terms_only_and_a_lost_or_accepted_empty_membership_is_still_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the refusal the visitor reads test_UAT_AC1758_every_refusal_and_the_scope_refusal_are_the_same_truthful_sentence_forbidden_and_uncacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the refusal the operator reads test_UAT_AC1759_each_refusal_writes_exactly_one_structured_admission_denied_line_with_reason_address_and_seed_flag",
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