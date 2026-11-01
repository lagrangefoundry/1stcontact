---
uid: report-cde992c2
id: REPORT-7210
type: report
title: 'Scoped quality: pass (16 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T02:14:08.540766+00:00'
updated_at: '2026-11-01T02:14:08.540766+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: STORY-159
  commit: d7a2e4f55fcc43f357449d3494afc670574f9084
---

{
  "timestamp": "2026-11-01T02:11:15.979948Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016366690397262573,
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
      "duration_seconds": 5.093015667051077,
      "passed": 16,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 16,
      "deselected": 0,
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
        "test_UAT_AC2053_",
        "test_UAT_AC2080_",
        "test_UAT_AC2081_",
        "test_UAT_AC2082_",
        "test_UAT_AC2083_",
        "test_UAT_AC2084_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "s\\x1b[2m > \\x1b[22mAC-2081 \u2014 the reference is titled by the page and its body opens with a link\\x1b[2m > \\x1b[22mtest_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\\x1b[32m 61\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_capture_site_reference_material.workers.test.ts\\x1b[2m > \\x1b[22mAC-2082 \u2014 rights come from provenance\\x1b[2m > \\x1b[22mtest_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\\x1b[32m 85\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_capture_site_reference_material.workers.test.ts\\x1b[2m > \\x1b[22mAC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\\x1b[2m > \\x1b[22mtest_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\\x1b[32m 49\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/test_reconciliation_capture_site_reference_material.workers.test.ts\\x1b[2m > \\x1b[22mAC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\\x1b[2m > \\x1b[22mtest_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\\x1b[32m 20\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m16 passed\\x1b[39m\\x1b[22m\\x1b[90m (16)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 19:11:17\n\\x1b[2m   Duration \\x1b[22m 4.19s\\x1b[2m (transform 1.88s, setup 0ms, import 4.03s, tests 712ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-7rpccm1d.json\n\n{\"numTotalTestSuites\":18,\"numPassedTestSuites\":18,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":16,\"numPassedTests\":16,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793499077045,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site records a public page as a named reference\"],\"fullName\":\"AC-2044 \u2014 capture_site records a public page as a named reference test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals\",\"duration\":34.66624999999999,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2045 \u2014 list_references lists every capture with its recorded address and time\"],\"fullName\":\"AC-2045 \u2014 list_references lists every capture with its recorded address and time test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time\",\"status\":\"passed\",\"title\":\"test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time\",\"duration\":0.8518340000000535,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2046 \u2014 describe_reference reports what one capture holds; an unknown name is an error naming the bundle\"],\"fullName\":\"AC-2046 \u2014 describe_reference reports what one capture holds; an unknown name is an error naming the bundle test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_errors_on_name_without_capture_record\",\"status\":\"passed\",\"title\":\"test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_errors_on_name_without_capture_record\",\"duration\":0.966542000000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2047 \u2014 the typed address is refused before any browser is leased\"],\"fullName\":\"AC-2047 \u2014 the typed address is refused before any browser is leased test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing\",\"duration\":4.339500000000044,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2048 \u2014 subresources are checked on both hosts, redirect hops on the Worker only\"],\"fullName\":\"AC-2048 \u2014 subresources are checked on both hosts, redirect hops on the Worker only test_UAT_AC2048_subresources_guarded_on_both_hosts_hops_on_worker_refused_never_sent_and_reported\",\"status\":\"passed\",\"title\":\"test_UAT_AC2048_subresources_guarded_on_both_hosts_hops_on_worker_refused_never_sent_and_reported\",\"duration\":4.568540999999982,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2049 \u2014 on the Worker, more than 5 distinct origins trips redirect-cap; a reference is still returned\"],\"fullName\":\"AC-2049 \u2014 on the Worker, more than 5 distinct origins trips redirect-cap; a reference is still returned test_UAT_AC2049_worker_redirect_cap_trips_past_5_origins_later_requests_unsent_capture_still_returns\",\"status\":\"passed\",\"title\":\"test_UAT_AC2049_worker_redirect_cap_trips_past_5_origins_later_requests_unsent_capture_still_returns\",\"duration\":1.3117500000000746,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2050 \u2014 on the Worker host, over 32 MiB trips response-cap and sends nothing further; the bundle is still returned\"],\"fullName\":\"AC-2050 \u2014 on the Worker host, over 32 MiB trips response-cap and sends nothing further; the bundle is still returned test_UAT_AC2050_worker_response_cap_trips_past_32MiB_later_requests_unsent_bundle_still_returned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2050_worker_response_cap_trips_past_32MiB_later_requests_unsent_bundle_still_returned\",\"duration\":10.949500000000057,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2051 \u2014 every capture_site call is audited with its URL; typed refusals are REFUSED, seam refusals are in the result\"],\"fullName\":\"AC-2051 \u2014 every capture_site call is audited with its URL; typed refusals are REFUSED, seam refusals are in the result test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"duration\":2.6948339999999007,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2052 \u2014 capture results are untrusted, and the model is told so\"],\"fullName\":\"AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"duration\":1.5506659999999783,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was\"],\"fullName\":\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"duration\":1.151666999999975,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793499077905,\"endTime\":1793499077968.1516,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_egress.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report\"],\"fullName\":\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"duration\":90,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket\"],\"fullName\":\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"status\":\"passed\",\"title\":\"test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"duration\":319,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link\"],\"fullName\":\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"duration\":61,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2082 \u2014 rights come from provenance\"],\"fullName\":\"AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"duration\":85,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\"],\"fullName\":\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"status\":\"passed\",\"title\":\"test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\"],\"fullName\":\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793499080615,\"endTime\":1793499081239,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_reference_material.workers.test.ts\"}]}",
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
          "name": "AC-2046 \u2014 describe_reference reports what one capture holds; an unknown name is an error naming the bundle test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_errors_on_name_without_capture_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2047 \u2014 the typed address is refused before any browser is leased test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2048 \u2014 subresources are checked on both hosts, redirect hops on the Worker only test_UAT_AC2048_subresources_guarded_on_both_hosts_hops_on_worker_refused_never_sent_and_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2049 \u2014 on the Worker, more than 5 distinct origins trips redirect-cap; a reference is still returned test_UAT_AC2049_worker_redirect_cap_trips_past_5_origins_later_requests_unsent_capture_still_returns",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2050 \u2014 on the Worker host, over 32 MiB trips response-cap and sends nothing further; the bundle is still returned test_UAT_AC2050_worker_response_cap_trips_past_32MiB_later_requests_unsent_bundle_still_returned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2051 \u2014 every capture_site call is audited with its URL; typed refusals are REFUSED, seam refusals are in the result test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model",
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
        },
        {
          "name": "AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why",
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