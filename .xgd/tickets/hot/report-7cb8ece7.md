---
uid: report-7cb8ece7
id: REPORT-7200
type: report
title: 'Scoped quality: fail (16 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-01T02:01:02.460235+00:00'
updated_at: '2026-11-01T02:01:02.460235+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-159
  commit: 7a7c6d62a08b7774b2a85f2403741a2fabbe3302
---

{
  "timestamp": "2026-11-01T01:58:07.775308Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014241598546504974,
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
      "duration_seconds": 4.732106416951865,
      "passed": 15,
      "failed": 1,
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
      "stdout": "ers.test.ts:\\x1b[2m415:68\\x1b[22m\\x1b[39m\n    \\x1b[90m413|\\x1b[39m\n    \\x1b[90m414|\\x1b[39m     // \u2026and on the deployed host it was written up as reference materi\u2026\n    \\x1b[90m415|\\x1b[39m     expect(answer.reference.adopted, String(answer.reference.why)).toB\u2026\n    \\x1b[90m   |\\x1b[39m                                                                    \\x1b[31m^\\x1b[39m\n    \\x1b[90m416|\\x1b[39m\n    \\x1b[90m417|\\x1b[39m     \\x1b[35mconst\\x1b[39m { tickets\\x1b[33m,\\x1b[39m references } \\x1b[33m=\\x1b[39m \\x1b[35mawait\\x1b[39m \\x1b[34mstores\\x1b[39m(\\x1b[33mTENANT\\x1b[39m)\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m15 passed\\x1b[39m\\x1b[22m\\x1b[90m (16)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:58:08\n\\x1b[2m   Duration \\x1b[22m 3.88s\\x1b[2m (transform 1.90s, setup 0ms, import 4.06s, tests 413ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-30mco8bl.json\n\n{\"numTotalTestSuites\":18,\"numPassedTestSuites\":16,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":16,\"numPassedTests\":15,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793498288818,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site records a public page as a named reference\"],\"fullName\":\"AC-2044 \u2014 capture_site records a public page as a named reference test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals\",\"duration\":30.239708000000064,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2045 \u2014 list_references lists every capture with its recorded address and time\"],\"fullName\":\"AC-2045 \u2014 list_references lists every capture with its recorded address and time test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time\",\"status\":\"passed\",\"title\":\"test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time\",\"duration\":0.8938329999999723,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2046 \u2014 describe_reference reports what one capture holds; an unknown name is an error naming the bundle\"],\"fullName\":\"AC-2046 \u2014 describe_reference reports what one capture holds; an unknown name is an error naming the bundle test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_errors_on_name_without_capture_record\",\"status\":\"passed\",\"title\":\"test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_errors_on_name_without_capture_record\",\"duration\":0.89549999999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2047 \u2014 the typed address is refused before any browser is leased\"],\"fullName\":\"AC-2047 \u2014 the typed address is refused before any browser is leased test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing\",\"duration\":4.2708339999999225,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2048 \u2014 subresources are checked on both hosts, redirect hops on the Worker only\"],\"fullName\":\"AC-2048 \u2014 subresources are checked on both hosts, redirect hops on the Worker only test_UAT_AC2048_subresources_guarded_on_both_hosts_hops_on_worker_refused_never_sent_and_reported\",\"status\":\"passed\",\"title\":\"test_UAT_AC2048_subresources_guarded_on_both_hosts_hops_on_worker_refused_never_sent_and_reported\",\"duration\":4.564209000000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2049 \u2014 on the Worker, more than 5 distinct origins trips redirect-cap; a reference is still returned\"],\"fullName\":\"AC-2049 \u2014 on the Worker, more than 5 distinct origins trips redirect-cap; a reference is still returned test_UAT_AC2049_worker_redirect_cap_trips_past_5_origins_later_requests_unsent_capture_still_returns\",\"status\":\"passed\",\"title\":\"test_UAT_AC2049_worker_redirect_cap_trips_past_5_origins_later_requests_unsent_capture_still_returns\",\"duration\":0.9894160000000056,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2050 \u2014 on the Worker host, over 32 MiB trips response-cap and sends nothing further; the bundle is still returned\"],\"fullName\":\"AC-2050 \u2014 on the Worker host, over 32 MiB trips response-cap and sends nothing further; the bundle is still returned test_UAT_AC2050_worker_response_cap_trips_past_32MiB_later_requests_unsent_bundle_still_returned\",\"status\":\"passed\",\"title\":\"test_UAT_AC2050_worker_response_cap_trips_past_32MiB_later_requests_unsent_bundle_still_returned\",\"duration\":10.656458000000043,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2051 \u2014 every capture_site call is audited with its URL; typed refusals are REFUSED, seam refusals are in the result\"],\"fullName\":\"AC-2051 \u2014 every capture_site call is audited with its URL; typed refusals are REFUSED, seam refusals are in the result test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"duration\":2.73275000000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2052 \u2014 capture results are untrusted, and the model is told so\"],\"fullName\":\"AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"duration\":1.7218750000000682,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was\"],\"fullName\":\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"duration\":1.1310830000001033,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498289751,\"endTime\":1793498289809.131,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_egress.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report\"],\"fullName\":\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"duration\":82,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket\"],\"fullName\":\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"status\":\"failed\",\"title\":\"test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"duration\":38,\"failureMessages\":[\"AssertionError: this deployment keeps no corpus, so the bundle was stored but not indexed: expected false to be true // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:415:68\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link\"],\"fullName\":\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2082 \u2014 rights come from provenance\"],\"fullName\":\"AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"duration\":83,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\"],\"fullName\":\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"status\":\"passed\",\"title\":\"test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\"],\"fullName\":\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498292377,\"endTime\":1793498292707,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_reference_material.workers.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member",
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