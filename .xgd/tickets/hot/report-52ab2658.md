---
uid: report-52ab2658
id: REPORT-11497
type: report
title: 'Scoped quality: fail (18 tests, 6 failed)'
created_by: xgd
created_at: '2026-11-08T15:37:15.362838+00:00'
updated_at: '2026-11-08T15:37:15.362838+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: STORY-159
  commit: 27325c7703774fb742bcee400fd246f0fc2e53ad
---

{
  "timestamp": "2026-11-08T15:34:02.756536Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015508290380239487,
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
      "duration_seconds": 4.794452624861151,
      "passed": 12,
      "failed": 6,
      "skipped": 0,
      "errors": 0,
      "total": 18,
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
        "test_UAT_AC2084_",
        "test_UAT_AC2465_",
        "test_UAT_AC2466_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"duration\":2.834250000000111,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2052 \u2014 capture results are untrusted, and the model is told so\"],\"fullName\":\"AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"duration\":1.6600419999999758,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was\"],\"fullName\":\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"duration\":1.11262499999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794152045333,\"endTime\":1794152045397.1125,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_egress.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2465 \u2014 an unresolvable host costs one navigation and earns one guarded alternate\"],\"fullName\":\"AC-2465 \u2014 an unresolvable host costs one navigation and earns one guarded alternate test_UAT_AC2465_unresolved_host_is_navigated_once_and_one_guarded_alternate_is_tried\",\"status\":\"passed\",\"title\":\"test_UAT_AC2465_unresolved_host_is_navigated_once_and_one_guarded_alternate_is_tried\",\"duration\":35.231708000000026,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2466 \u2014 the host that answered is the host every pass uses; no host is reported as an address fact\"],\"fullName\":\"AC-2466 \u2014 the host that answered is the host every pass uses; no host is reported as an address fact test_UAT_AC2466_alternate_host_carries_through_every_pass_and_no_such_host_is_actionable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2466_alternate_host_carries_through_every_pass_and_no_such_host_is_actionable\",\"duration\":4.115083000000141,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794152045320,\"endTime\":1794152045359.115,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_host_resolution.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report\"],\"fullName\":\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"status\":\"failed\",\"title\":\"test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"duration\":6,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/apps/control-app/src/tickets.ts:646:26)\\n    at stores (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:75:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:229:37\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket\"],\"fullName\":\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"status\":\"failed\",\"title\":\"test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"duration\":6,\"failureMessages\":[\"AssertionError: expected 500 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:401:27\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link\"],\"fullName\":\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"status\":\"failed\",\"title\":\"test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"duration\":1,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/apps/control-app/src/tickets.ts:646:26)\\n    at stores (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:75:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:447:37\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2082 \u2014 rights come from provenance\"],\"fullName\":\"AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"status\":\"failed\",\"title\":\"test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"duration\":1,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/apps/control-app/src/tickets.ts:646:26)\\n    at stores (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:75:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:493:37\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\"],\"fullName\":\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"status\":\"failed\",\"title\":\"test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"duration\":0,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/apps/control-app/src/tickets.ts:646:26)\\n    at stores (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:75:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:523:37\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\"],\"fullName\":\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"status\":\"failed\",\"title\":\"test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"duration\":1,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/apps/control-app/src/tickets.ts:646:26)\\n    at stores (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:75:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts:603:37\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794152047874,\"endTime\":1794152047889,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts\"}]}",
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
          "name": "AC-2465 \u2014 an unresolvable host costs one navigation and earns one guarded alternate test_UAT_AC2465_unresolved_host_is_navigated_once_and_one_guarded_alternate_is_tried",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2466 \u2014 the host that answered is the host every pass uses; no host is reported as an address fact test_UAT_AC2466_alternate_host_carries_through_every_pass_and_no_such_host_is_actionable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members",
          "file": "",
          "status": "failed"
        },
        {
          "name": "AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why",
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
        "message": "6 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 6
        }
      }
    ]
  }
}