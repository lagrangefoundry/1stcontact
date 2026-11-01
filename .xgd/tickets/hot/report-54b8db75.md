---
uid: report-54b8db75
id: REPORT-7208
type: report
title: 'Report: batch_quality_check for STORY-159'
created_by: xgd
created_at: '2026-11-01T02:10:00.278579+00:00'
updated_at: '2026-11-01T02:10:00.278579+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: STORY-159
  parent_report_uid: report-2db26efc
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-01T02:07:10.158678Z",
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
      "duration_seconds": 5.097481417004019,
      "passed": 27,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 27,
      "deselected": 23,
      "test_filter": [
        "test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member",
        "test_UAT_AC2044_",
        "test_UAT_AC2081_",
        "test_UAT_AC2082_",
        "test_UAT_AC2083_",
        "test_UAT_AC2084_",
        "test_UAT_AC2024_",
        "test_UAT_AC2025_",
        "test_UAT_FC_REQ-166_",
        "test_UAT_FC_REQ-157_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "lt test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2051_each_call_audited_with_its_url_typed_refusal_is_REFUSED_seam_refusal_reaches_model\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2052 \u2014 capture results are untrusted, and the model is told so\"],\"fullName\":\"AC-2052 \u2014 capture results are untrusted, and the model is told so test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was\"],\"fullName\":\"AC-2053 \u2014 capturing a reference leaves the site exactly as it was test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498832607,\"endTime\":1793498832639.1646,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_egress.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":54,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498834825,\"endTime\":1793498834908,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-166 \u2014 capture_site writes the site up as well as storing it\"],\"fullName\":\"REQ-166 \u2014 capture_site writes the site up as well as storing it test_UAT_FC_REQ-166_capture_site_yields_both_a_bundle_and_a_reference\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_capture_site_yields_both_a_bundle_and_a_reference\",\"duration\":61,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 capture_site writes the site up as well as storing it\"],\"fullName\":\"REQ-166 \u2014 capture_site writes the site up as well as storing it test_UAT_FC_REQ-166_a_host_with_no_corpus_captures_as_before_and_says_so\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_a_host_with_no_corpus_captures_as_before_and_says_so\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 capture_site writes the site up as well as storing it\"],\"fullName\":\"REQ-166 \u2014 capture_site writes the site up as well as storing it test_UAT_FC_REQ-166_a_failed_adoption_does_not_lose_the_capture\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_a_failed_adoption_does_not_lose_the_capture\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498834472,\"endTime\":1793498834553,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_UAT_FC_REQ-166_capture_site_adopts.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_a_bundle_becomes_one_reference_with_a_record_per_member\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_a_bundle_becomes_one_reference_with_a_record_per_member\",\"duration\":43,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_the_body_opens_with_a_link_to_the_site_captured\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_the_body_opens_with_a_link_to_the_site_captured\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_the_title_is_the_pages_own_title_and_falls_back_to_the_host\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_the_title_is_the_pages_own_title_and_falls_back_to_the_host\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_rights_invert_on_whose_site_was_captured\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_rights_invert_on_whose_site_was_captured\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_recapturing_updates_one_ticket_and_writes_no_blob_for_unchanged_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_recapturing_updates_one_ticket_and_writes_no_blob_for_unchanged_bytes\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_a_changed_member_is_replaced_and_the_superseded_record_detached\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_a_changed_member_is_replaced_and_the_superseded_record_detached\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_the_capture_appears_in_the_library_with_its_members\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_the_capture_appears_in_the_library_with_its_members\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-166 \u2014 a completed capture becomes a reference ticket\"],\"fullName\":\"REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_a_bundle_that_is_not_a_capture_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-166_a_bundle_that_is_not_a_capture_is_refused_by_name\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498834824,\"endTime\":1793498835022,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_UAT_FC_REQ-166_capture_to_ticket.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report\"],\"fullName\":\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"duration\":112,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket\"],\"fullName\":\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"status\":\"passed\",\"title\":\"test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"duration\":269,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link\"],\"fullName\":\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"duration\":60,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2082 \u2014 rights come from provenance\"],\"fullName\":\"AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"duration\":84,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\"],\"fullName\":\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"status\":\"passed\",\"title\":\"test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\"],\"fullName\":\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793498834825,\"endTime\":1793498835420,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/test_reconciliation_capture_site_reference_material.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a capture in the Library test_UAT_FC_REQ-166_the_preview_is_the_screenshot_addressed_as_one_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a capture in the Library test_UAT_FC_REQ-166_the_detail_counts_the_files_and_states_no_single_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a capture in the Library test_UAT_FC_REQ-166_the_download_is_the_screenshot_not_an_arbitrary_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a capture in the Library test_UAT_FC_REQ-166_the_body_opens_with_a_link_that_does_not_navigate_the_builder_away",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a capture in the Library test_UAT_FC_REQ-166_an_ordinary_material_is_untouched_by_any_of_this",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a capture in the Library test_UAT_FC_REQ-166_the_capture_is_listed_and_filterable_as_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2044 \u2014 capture_site records a public page as a named reference test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 capture_site writes the site up as well as storing it test_UAT_FC_REQ-166_capture_site_yields_both_a_bundle_and_a_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 capture_site writes the site up as well as storing it test_UAT_FC_REQ-166_a_host_with_no_corpus_captures_as_before_and_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 capture_site writes the site up as well as storing it test_UAT_FC_REQ-166_a_failed_adoption_does_not_lose_the_capture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_a_bundle_becomes_one_reference_with_a_record_per_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_the_body_opens_with_a_link_to_the_site_captured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_the_title_is_the_pages_own_title_and_falls_back_to_the_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_rights_invert_on_whose_site_was_captured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_recapturing_updates_one_ticket_and_writes_no_blob_for_unchanged_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_a_changed_member_is_replaced_and_the_superseded_record_detached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_the_capture_appears_in_the_library_with_its_members",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-166 \u2014 a completed capture becomes a reference ticket test_UAT_FC_REQ-166_a_bundle_that_is_not_a_capture_is_refused_by_name",
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
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}