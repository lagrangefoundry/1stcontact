---
uid: report-1bc0a82f
id: REPORT-6830
type: report
title: 'Scoped quality: pass (10 tests, 0 failed)'
created_by: xgd
created_at: '2026-10-28T20:22:26.959639+00:00'
updated_at: '2026-10-28T20:22:26.959639+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-31204812
  commit: cb81b9624fcc5112e77722c2c5cf74774db337cc
---

{
  "timestamp": "2026-10-28T20:16:55.175124Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015487498603761196,
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
      "duration_seconds": 85.27814616588876,
      "passed": 10,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 10,
      "deselected": 2686,
      "test_filter": [
        "test_UAT_AC2044_",
        "test_UAT_AC2045_",
        "test_UAT_AC2046_",
        "test_UAT_AC2047_",
        "test_UAT_AC2048_",
        "test_UAT_AC2049_",
        "test_UAT_AC2050_",
        "test_UAT_AC2051_",
        "test_UAT_AC2052_",
        "test_UAT_AC2053_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "a_kind_pill_and_the_other_pills_remain\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the row is one line, and truncation lands on the title\"],\"fullName\":\"REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-176 \u2014 the wording\"],\"fullName\":\"REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793218616285,\"endTime\":1793218616285,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site records a public page as a named reference\"],\"fullName\":\"AC-2044 \u2014 capture_site records a public page as a named reference test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals\",\"duration\":98.01583300000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2045 \u2014 list_references lists every capture with its recorded address and time\"],\"fullName\":\"AC-2045 \u2014 list_references lists every capture with its recorded address and time test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time\",\"status\":\"passed\",\"title\":\"test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time\",\"duration\":6.145207999999911,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2046 \u2014 describe_reference reports what one capture holds\"],\"fullName\":\"AC-2046 \u2014 describe_reference reports what one capture holds test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown\",\"duration\":3.8435830000000806,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2047 \u2014 the typed address is refused before any browser is leased\"],\"fullName\":\"AC-2047 \u2014 the typed address is refused before any browser is leased test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing\",\"duration\":4.788291999999956,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2048 \u2014 every request is checked: hops and subresources on Worker, routed requests on Node\"],\"fullName\":\"AC-2048 \u2014 every request is checked: hops and subresources on Worker, routed requests on Node test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported\",\"status\":\"passed\",\"title\":\"test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported\",\"duration\":40.387416999999914,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2049 \u2014 a redirect chain through more than 5 distinct hosts trips redirect-cap (Worker)\"],\"fullName\":\"AC-2049 \u2014 a redirect chain through more than 5 distinct hosts trips redirect-cap (Worker) test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins\",\"status\":\"passed\",\"title\":\"test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins\",\"duration\":1.2265420000001086,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2050 \u2014 on the Worker host a capture over 32 MiB trips response-cap and sends nothing further\"],\"fullName\":\"AC-2050 \u2014 on the Worker host a capture over 32 MiB trips response-cap and sends nothing further test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts\",\"duration\":42.49970899999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2051 \u2014 every capture_site call is audited with its URL; a refusal is REFUSED\"],\"fullName\":\"AC-2051 \u2014 every capture_site call is audited with its URL; a refusal is REFUSED test_UAT_AC2051_capture_site_audit_record_carries_url_and_refusal_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2051_capture_site_audit_record_carries_url_and_refusal_is_refused\",\"duration\":2.941000000000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2052 \u2014 capture results are untrusted, and the model is told so\"],\"fullName\":\"AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"duration\":2.3002500000000055,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was\"],\"fullName\":\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"duration\":1.8601249999999254,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793218662131,\"endTime\":1793218662334.86,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_reconciliation_capture_site_egress.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-47fb84e6 \u2014 compare\"],\"fullName\":\"story-47fb84e6 \u2014 compare test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 compare\"],\"fullName\":\"story-47fb84e6 \u2014 compare test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 compare\"],\"fullName\":\"story-47fb84e6 \u2014 compare test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-47fb84e6 \u2014 check_fidelity\"],\"fullName\":\"story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793218616285,\"endTime\":1793218616285,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_reconciliation_fidelity_compare_and_judge.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-2044 \u2014 capture_site records a public page as a named reference test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2045 \u2014 list_references lists every capture with its recorded address and time test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2046 \u2014 describe_reference reports what one capture holds test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2047 \u2014 the typed address is refused before any browser is leased test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2048 \u2014 every request is checked: hops and subresources on Worker, routed requests on Node test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2049 \u2014 a redirect chain through more than 5 distinct hosts trips redirect-cap (Worker) test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2050 \u2014 on the Worker host a capture over 32 MiB trips response-cap and sends nothing further test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2051 \u2014 every capture_site call is audited with its URL; a refusal is REFUSED test_UAT_AC2051_capture_site_audit_record_carries_url_and_refusal_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged",
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