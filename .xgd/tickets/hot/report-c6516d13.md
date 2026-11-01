---
uid: report-c6516d13
id: REPORT-7856
type: report
title: 'Scoped quality: fail (220 tests, 9 failed, 9 orphan AC(s))'
created_by: xgd
created_at: '2026-11-01T21:33:35.667391+00:00'
updated_at: '2026-11-01T21:33:35.667391+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: report-54bc92a7
  commit: a546929c59dc4f366c79e5f2e7813f6de3ae8ed5
---

{
  "timestamp": "2026-11-01T21:29:27.950156Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001680001150816679,
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
      "duration_seconds": 38.44548266590573,
      "passed": 211,
      "failed": 9,
      "skipped": 0,
      "errors": 0,
      "total": 220,
      "deselected": 26,
      "test_filter": [
        "test_UAT_AC1029_",
        "test_UAT_AC1030_",
        "test_UAT_AC1031_",
        "test_UAT_AC1032_",
        "test_UAT_AC1033_",
        "test_UAT_AC1034_",
        "test_UAT_AC1035_",
        "test_UAT_AC1036_",
        "test_UAT_AC1110_",
        "test_UAT_AC1385_",
        "test_UAT_AC1386_",
        "test_UAT_AC1387_",
        "test_UAT_AC1388_",
        "test_UAT_AC1389_",
        "test_UAT_AC1390_",
        "test_UAT_AC1391_",
        "test_UAT_AC1392_",
        "test_UAT_AC1393_",
        "test_UAT_AC1394_",
        "test_UAT_AC1395_",
        "test_UAT_AC1396_",
        "test_UAT_AC1397_",
        "test_UAT_AC1398_",
        "test_UAT_AC1399_",
        "test_UAT_AC1400_",
        "test_UAT_AC1401_",
        "test_UAT_AC1402_",
        "test_UAT_AC1403_",
        "test_UAT_AC1447_",
        "test_UAT_AC1448_",
        "test_UAT_AC1449_",
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
        "test_UAT_AC2117_",
        "test_UAT_AC2118_",
        "test_UAT_AC2119_",
        "test_UAT_AC2120_",
        "test_UAT_AC2121_",
        "test_UAT_AC2122_",
        "test_UAT_AC2123_",
        "test_UAT_AC2124_",
        "test_UAT_AC2125_",
        "test_UAT_AC2126_",
        "test_UAT_AC2127_",
        "test_UAT_AC2128_",
        "test_UAT_AC2129_",
        "test_UAT_AC2130_",
        "test_UAT_AC2131_",
        "test_UAT_AC2143_",
        "test_UAT_AC2144_",
        "test_UAT_AC2145_",
        "test_UAT_AC2146_",
        "test_UAT_AC2147_",
        "test_UAT_AC2148_",
        "test_UAT_AC2149_",
        "test_UAT_AC2150_",
        "test_UAT_AC2151_",
        "test_UAT_AC2152_",
        "test_UAT_AC2153_",
        "test_UAT_AC2154_",
        "test_UAT_AC2155_",
        "test_UAT_AC2156_",
        "test_UAT_AC2157_",
        "test_UAT_AC2158_",
        "test_UAT_AC2159_",
        "test_UAT_AC2160_",
        "test_UAT_AC2165_",
        "test_UAT_AC2166_",
        "test_UAT_AC2167_",
        "test_UAT_AC2168_",
        "test_UAT_AC2169_",
        "test_UAT_AC2170_",
        "test_UAT_AC2171_",
        "test_UAT_AC2172_",
        "test_UAT_AC2173_",
        "test_UAT_AC2174_",
        "test_UAT_AC2175_",
        "test_UAT_AC2176_",
        "test_UAT_AC2177_",
        "test_UAT_AC2178_",
        "test_UAT_AC2179_",
        "test_UAT_AC2180_",
        "test_UAT_AC2181_",
        "test_UAT_AC2182_",
        "test_UAT_AC2183_",
        "test_UAT_AC2184_",
        "test_UAT_AC2185_",
        "test_UAT_AC2186_",
        "test_UAT_AC2187_",
        "test_UAT_AC2188_",
        "test_UAT_AC2189_",
        "test_UAT_AC2190_",
        "test_UAT_AC2191_",
        "test_UAT_AC2192_",
        "test_UAT_AC2193_",
        "test_UAT_AC2194_",
        "test_UAT_AC2195_",
        "test_UAT_AC2196_",
        "test_UAT_AC2197_",
        "test_UAT_AC2198_",
        "test_UAT_AC2199_",
        "test_UAT_AC2200_",
        "test_UAT_AC2201_",
        "test_UAT_AC2202_",
        "test_UAT_AC2203_",
        "test_UAT_AC2204_",
        "test_UAT_AC2205_",
        "test_UAT_AC2206_",
        "test_UAT_AC2207_",
        "test_UAT_AC2208_",
        "test_UAT_AC2209_",
        "test_UAT_AC2210_",
        "test_UAT_AC2211_",
        "test_UAT_AC2212_",
        "test_UAT_AC2213_",
        "test_UAT_AC2214_",
        "test_UAT_AC2215_",
        "test_UAT_AC2216_",
        "test_UAT_AC2217_",
        "test_UAT_AC2218_",
        "test_UAT_AC2219_",
        "test_UAT_AC2220_",
        "test_UAT_AC2221_",
        "test_UAT_AC2222_",
        "test_UAT_AC2223_",
        "test_UAT_AC2224_",
        "test_UAT_AC2225_",
        "test_UAT_AC2226_",
        "test_UAT_AC2227_",
        "test_UAT_AC2228_",
        "test_UAT_AC2229_",
        "test_UAT_AC2230_",
        "test_UAT_AC2231_",
        "test_UAT_AC2232_",
        "test_UAT_AC959_",
        "test_UAT_AC960_",
        "test_UAT_AC961_",
        "test_UAT_AC962_",
        "test_UAT_AC963_",
        "test_UAT_AC964_",
        "test_UAT_AC965_",
        "test_UAT_AC966_",
        "test_UAT_AC967_",
        "test_UAT_AC968_",
        "test_UAT_AC969_",
        "test_UAT_AC970_",
        "test_UAT_AC971_",
        "test_UAT_AC972_",
        "test_UAT_AC973_",
        "test_UAT_AC974_",
        "test_UAT_AC975_",
        "test_UAT_AC976_",
        "test_UAT_AC977_",
        "test_UAT_AC978_",
        "test_UAT_AC979_",
        "test_UAT_FC_BUG_51",
        "test_UAT_FC_BUG_52",
        "test_UAT_FC_BUG_53",
        "test_UAT_FC_BUG_54",
        "test_UAT_FC_BUG_56",
        "test_UAT_FC_BUNDLE_36",
        "test_UAT_FC_REQ_170",
        "test_UAT_FC_REQ_183",
        "test_UAT_FC_REQ_185",
        "test_UAT_FC_REQ_186",
        "test_UAT_FC_REQ_188",
        "test_UAT_FC_REQ_189"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "nd_is_not_owned\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793568599693,\"endTime\":1793568600299,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_business_scope_operator.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted\",\"status\":\"passed\",\"title\":\"test_UAT_AC2203_member_if_and_only_if_terms_accepted\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2204_contact_begins_at_lead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2204_contact_begins_at_lead\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp\",\"status\":\"passed\",\"title\":\"test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp\",\"duration\":30,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage\",\"status\":\"passed\",\"title\":\"test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0ea74f39 \u2014 two axes at the origin\"],\"fullName\":\"story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred\",\"status\":\"passed\",\"title\":\"test_UAT_AC2207_stage_is_the_stored_value_not_inferred\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793568593984,\"endTime\":1793568594087,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contact_axes.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0ea74f39 \u2014 the one-time pipeline backfill\"],\"fullName\":\"story-0ea74f39 \u2014 the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited\",\"status\":\"passed\",\"title\":\"test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited\",\"duration\":195,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793568599331,\"endTime\":1793568599526,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contact_axes_migration.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-0034d937 \u2014 the list is the scoped business, for every business\"],\"fullName\":\"story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"status\":\"passed\",\"title\":\"test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first\",\"duration\":74,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 the business barrier\"],\"fullName\":\"story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"status\":\"passed\",\"title\":\"test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-0034d937 \u2014 every grant names its business\"],\"fullName\":\"story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"status\":\"passed\",\"title\":\"test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793568594087,\"endTime\":1793568594211,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"status\":\"passed\",\"title\":\"test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"status\":\"passed\",\"title\":\"test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 an owner corrects who somebody is\"],\"fullName\":\"story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"status\":\"passed\",\"title\":\"test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"status\":\"passed\",\"title\":\"test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"status\":\"passed\",\"title\":\"test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 grants\"],\"fullName\":\"story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"status\":\"passed\",\"title\":\"test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-a55c2f35 \u2014 the login control, server-side only\"],\"fullName\":\"story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"status\":\"passed\",\"title\":\"test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793568594028,\"endTime\":1793568594324,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_contacts_tab_editing.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-83ff6262 \u2014 which portal an admitted account reaches\"],\"fullName\":\"story-83ff6262 \u2014 which portal an admitted account reaches test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 which portal an admitted account reaches\"],\"fullName\":\"story-83ff6262 \u2014 which portal an admitted account reaches test_UAT_AC2217_another_accounts_business_is_indistinguishable_from_a_missing_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2217_another_accounts_business_is_indistinguishable_from_a_missing_one\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-83ff6262 \u2014 using the portal destroys nothing\"],\"fullName\":\"story-83ff6262 \u2014 using the portal destroys nothing test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists\",\"status\":\"passed\",\"title\":\"test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists\",\"duration\":65,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793568594100,\"endTime\":1793568594255,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-36/tests/test_reconciliation_customer_portal.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_preview_names_the_control_app_store_and_deletes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_yes_removes_only_the_control_app_store_and_never_storage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_include_public_also_removes_the_public_site_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_listening_port_is_refused_and_nothing_is_deleted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_an_absent_store_is_already_empty_and_a_success",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_paths_resolve_from_the_repo_root_whatever_the_working_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a business switch moves everything test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the account surface explains a lapse test_UAT_AC2147_account_surface_states_each_lapse_reason_and_switcher_only_suffixes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the word a person reads is Business test_UAT_AC2148_no_user_facing_string_in_builder_or_public_site_says_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC970_strip_re_derives_when_a_business_switch_or_a_restore_changes_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC974_business_selection_is_remembered_under_a_shell_wide_key_and_falls_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC959_renders_one_panel_per_declared_tab_and_opens_the_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC976_every_option_of_every_declared_tab_reaches_the_chrome",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component consumption route test_UAT_AC962_absent_component_names_the_component_and_the_install_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a origin failure reporting test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1391_the_filesystem_store_applies_a_version_carrying_write_unconditionally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1397_one_extension_yields_one_content_type_wherever_an_asset_is_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1398_each_declared_binding_names_one_target_across_both_halves_and_the_schema_precedes_upload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite control test_UAT_AC2175_the_invite_control_is_owner_only_and_its_dialog_says_no_message_is_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refusal is no longer a default test_UAT_FC_BUG_52_the_three_load_calls_refuse_rather_than_returning_a_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refusal is no longer a default test_UAT_FC_BUG_52_a_rejected_fetch_is_an_authentication_failure_not_a_transport_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refusal is no longer a default test_UAT_FC_BUG_52_every_call_announces_it_not_only_the_ones_on_the_load_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refusal is no longer a default test_UAT_FC_BUG_52_a_valid_session_answers_normally_and_announces_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refusal is no longer a default test_UAT_FC_BUG_52_an_origin_that_merely_failed_is_still_not_a_session_failure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refused load draws the reason, not a blank page test_UAT_FC_BUG_52_a_refused_load_says_so_where_the_builder_would_have_been",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refused load draws the reason, not a blank page test_UAT_FC_BUG_52_any_other_load_failure_is_still_thrown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a refused load draws the reason, not a blank page test_UAT_FC_BUG_52_recovery_is_a_top_level_navigation_the_operator_asks_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a session that lapses under a working builder test_UAT_FC_BUG_52_it_says_so_and_leaves_the_unsaved_work_where_it_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a session that lapses under a working builder test_UAT_FC_BUG_52_it_is_said_once_however_many_calls_are_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 a session that lapses under a working builder test_UAT_FC_BUG_52_a_refused_site_listing_does_not_empty_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 the notice is visible, and it disables nothing test_UAT_FC_BUG_52_both_shapes_are_styled_and_neither_dims_the_shell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 the local Access harness issues multi-day tokens test_UAT_FC_BUG_52_a_minted_token_lasts_days_rather_than_one_hour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-52 \u2014 the local Access harness issues multi-day tokens test_UAT_FC_BUG_52_a_deliberately_expired_token_is_still_mintable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2159_no_generic_administrator_predicate_exists",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the platform-tenant setting is consulted only by scope resolution and identity test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2210_two_facets_narrow_independently_and_combine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the tab and its name test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the detail pane test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 presentation test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 presentation test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Who they are test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants and login, in the detail test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 Provision a business test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2213_authored_portal_site_is_served_else_the_shipped_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2214_portal_is_rendered_by_the_preview_renderer_with_assets_under_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2215_portal_accepts_only_get_and_head_and_writes_change_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the portal is site content served at /account test_UAT_AC2216_no_admission_and_no_scope_is_404_but_a_scope_alone_serves_its_portal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2218_delete_account_reveals_the_erasure_explanation_and_close_folds_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2220_without_scripting_the_explanation_is_served_in_full_and_visible",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2221_copy_says_closing_is_done_by_asking_and_offers_no_dead_contact_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the Delete account control and its explanation test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2223_holdings_sentence_names_every_business_including_lapsed_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the caller's own account facts test_UAT_AC2224_failed_account_load_is_announced_and_the_explanation_still_works",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 the avatar dialog links out to the portal test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1386_a_store_handle_sees_exactly_one_account_and_no_operation_takes_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1388_a_site_version_is_readable_and_advances_on_every_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1389_a_stale_expectation_is_refused_with_both_versions_and_one_racer_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1390_a_refused_multi_part_write_leaves_no_page_definition_or_version_behind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite is a transition, not a creation test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login",
          "file": "",
          "status": "passed"
        },
        {
          "name": "who may invite test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing",
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
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_builder_changed_site_refuses_409_and_is_byte_identical_force_lands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_fresh_slug_and_an_import_only_slug_both_land",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_1c_push_omits_force_unless_asked_and_force_sends_true",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_a_preview_asset_comes_back_as_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400",
          "file": "",
          "status": "failed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the platform_operator hosting bypass test_UAT_AC2121_platform_operator_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target",
          "file": "",
          "status": "passed"
        },
        {
          "name": "store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "PLATFORM_ADMINS is break glass that leaves its rows behind test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying",
          "file": "",
          "status": "passed"
        },
        {
          "name": "entering a hosted business is not owning it test_UAT_AC2167_business_entered_via_platform_operator_bypass_carries_role_null_and_is_not_owned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2204_contact_begins_at_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0ea74f39 \u2014 the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 the business barrier test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0034d937 \u2014 every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a55c2f35 \u2014 the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 which portal an admitted account reaches test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 which portal an admitted account reaches test_UAT_AC2217_another_accounts_business_is_indistinguishable_from_a_missing_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-83ff6262 \u2014 using the portal destroys nothing test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses",
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
      "passed": 168,
      "failed": 9,
      "total": 177,
      "failures": [
        {
          "test_name": "AC-2149 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2149 'A caller who is not an owner of the 1st Contact business who asks to add a business gets 404 and no business is created' (uid=acceptance_criterion-504bbd4c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2149.",
          "ac_uid": "acceptance_criterion-504bbd4c",
          "ac_id": "AC-2149",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2158 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2158 'The platform_operator column is read in exactly one place, scope entry, and a second read fails the build' (uid=acceptance_criterion-0dc30744) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2158.",
          "ac_uid": "acceptance_criterion-0dc30744",
          "ac_id": "AC-2158",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2150 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2150 'The refusal of add-a-business reveals nothing: body is 'Not found.' and names neither admin nor business' (uid=acceptance_criterion-e6d7c451) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2150.",
          "ac_uid": "acceptance_criterion-e6d7c451",
          "ac_id": "AC-2150",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2152 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2152 'The operator adds a business to an existing account and it is immediately selectable for that account's owner' (uid=acceptance_criterion-4aa71bb2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2152.",
          "ac_uid": "acceptance_criterion-4aa71bb2",
          "ac_id": "AC-2152",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2153 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2153 'Adding a business creates the whole business in one operation: active business, owner membership, live grant attributed to the operator, and a starter site' (uid=acceptance_criterion-aa306f12) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2153.",
          "ac_uid": "acceptance_criterion-aa306f12",
          "ac_id": "AC-2153",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2154 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2154 'Creating an account provisions its first business through the same operation, so the new account is admitted with exactly one business' (uid=acceptance_criterion-0fbe6d15) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2154.",
          "ac_uid": "acceptance_criterion-0fbe6d15",
          "ac_id": "AC-2154",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2155 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2155 'Operator adding a business for an unknown email gets 404 with 'No account with that email address.'' (uid=acceptance_criterion-2ec54b32) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2155.",
          "ac_uid": "acceptance_criterion-2ec54b32",
          "ac_id": "AC-2155",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2156 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2156 'Operator add-a-business with a missing or blank account email or name is rejected with 400' (uid=acceptance_criterion-d9fd433f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2156.",
          "ac_uid": "acceptance_criterion-d9fd433f",
          "ac_id": "AC-2156",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-2157 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-2157 'The businesses payload the browser reads carries exactly 'account' and 'businesses' and offers no self-serve creation contract' (uid=acceptance_criterion-be56b74c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-2157.",
          "ac_uid": "acceptance_criterion-be56b74c",
          "ac_id": "AC-2157",
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
        "message": "9 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 9
        }
      }
    ]
  }
}