---
uid: report-c68ac7b6
id: REPORT-6829
type: report
title: 'Report: batch_quality_check for story-31204812'
created_by: xgd
created_at: '2026-10-28T20:16:44.409613+00:00'
updated_at: '2026-10-28T20:16:44.409613+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-31204812
  parent_report_uid: report-7713f9da
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-10-28T20:14:02.404700Z",
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
      "exit_code": 1,
      "duration_seconds": 55.869778332998976,
      "passed": 15,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 15,
      "deselected": 1024,
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
        "test_UAT_FC_REQ_157_private_and_link_local_space_is_refused",
        "test_UAT_FC_REQ_157_each_refusal_names_its_reason",
        "test_UAT_FC_REQ_157_the_guard_caps_redirects_and_size_and_records_both",
        "test_UAT_FC_REQ_157_a_refused_capture_is_journalled_with_its_url",
        "test_UAT_FC_REQ_157_the_audit_record_carries_the_refused_url"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-154_cloud_eyes.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_bundle_round_trips_every_member\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_bundle_round_trips_every_member\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_list_enumerates_members_and_narrows_by_prefix\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_list_enumerates_members_and_narrows_by_prefix\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_absent_members_read_as_null_not_as_an_error\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_absent_members_read_as_null_not_as_an_error\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_a_rewritten_member_replaces_rather_than_appends\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_a_rewritten_member_replaces_rather_than_appends\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_store_lists_the_bundles_it_holds\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_store_lists_the_bundles_it_holds\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_two_bundles_do_not_bleed_into_each_other\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_two_bundles_do_not_bleed_into_each_other\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"ReferenceStore contract \u2014 r2\"],\"fullName\":\"ReferenceStore contract \u2014 r2 test_UAT_FC_REQ-155_the_ladder_member_is_named_the_same_on_every_adapter\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_the_ladder_member_is_named_the_same_on_every_adapter\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC2 \u2014 `1c capture page` lands a complete bundle in R2\"],\"fullName\":\"REQ-155 AC2 \u2014 `1c capture page` lands a complete bundle in R2 test_UAT_FC_REQ-155_capture_writes_every_bundle_member_into_r2\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_capture_writes_every_bundle_member_into_r2\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC2 \u2014 `1c capture page` lands a complete bundle in R2\"],\"fullName\":\"REQ-155 AC2 \u2014 `1c capture page` lands a complete bundle in R2 test_UAT_FC_REQ-155_capture_bytes_are_addressed_under_the_tenant_prefix\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_capture_bytes_are_addressed_under_the_tenant_prefix\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC3 \u2014 a cloud bundle is equivalent to a laptop one\"],\"fullName\":\"REQ-155 AC3 \u2014 a cloud bundle is equivalent to a laptop one test_UAT_FC_REQ-155_same_capture_yields_the_same_bundle_on_either_adapter\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_same_capture_yields_the_same_bundle_on_either_adapter\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC3 \u2014 a cloud bundle is equivalent to a laptop one\"],\"fullName\":\"REQ-155 AC3 \u2014 a cloud bundle is equivalent to a laptop one test_UAT_FC_REQ-155_screenshots_are_compared_as_images_not_as_bytes\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_screenshots_are_compared_as_images_not_as_bytes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC5 \u2014 references are tenant-scoped\"],\"fullName\":\"REQ-155 AC5 \u2014 references are tenant-scoped test_UAT_FC_REQ-155_an_unknown_tenant_is_refused_at_construction\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_an_unknown_tenant_is_refused_at_construction\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC5 \u2014 references are tenant-scoped\"],\"fullName\":\"REQ-155 AC5 \u2014 references are tenant-scoped test_UAT_FC_REQ-155_a_deactivated_tenant_is_refused_and_says_which_refusal\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_a_deactivated_tenant_is_refused_and_says_which_refusal\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-155 AC5 \u2014 references are tenant-scoped\"],\"fullName\":\"REQ-155 AC5 \u2014 references are tenant-scoped test_UAT_FC_REQ-155_one_tenants_capture_is_invisible_to_another\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-155_one_tenants_capture_is_invisible_to_another\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793218443488,\"endTime\":1793218443488,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-155_reference_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-156 AC3 \u2014 the codec decodes in workerd exactly as it does in node\"],\"fullName\":\"REQ-156 AC3 \u2014 the codec decodes in workerd exactly as it does in node test_UAT_FC_REQ-156_workerd_decode_matches_the_sharp_baseline\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_workerd_decode_matches_the_sharp_baseline\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC3 \u2014 the codec decodes in workerd exactly as it does in node\"],\"fullName\":\"REQ-156 AC3 \u2014 the codec decodes in workerd exactly as it does in node test_UAT_FC_REQ-156_workerd_encodes_a_png_that_decodes_back_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_workerd_encodes_a_png_that_decodes_back_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC3 \u2014 the codec decodes in workerd exactly as it does in node\"],\"fullName\":\"REQ-156 AC3 \u2014 the codec decodes in workerd exactly as it does in node test_UAT_FC_REQ-156_workerd_refuses_a_non_png_by_name\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_workerd_refuses_a_non_png_by_name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC3 \u2014 a perceptual diff, in workerd, from PNGs in real R2\"],\"fullName\":\"REQ-156 AC3 \u2014 a perceptual diff, in workerd, from PNGs in real R2 test_UAT_FC_REQ-156_diff_from_two_pngs_in_r2_reproduces_the_cli_verdicts\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_diff_from_two_pngs_in_r2_reproduces_the_cli_verdicts\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC3 \u2014 a perceptual diff, in workerd, from PNGs in real R2\"],\"fullName\":\"REQ-156 AC3 \u2014 a perceptual diff, in workerd, from PNGs in real R2 test_UAT_FC_REQ-156_regions_rank_in_workerd_as_they_do_on_the_cli\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_regions_rank_in_workerd_as_they_do_on_the_cli\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC3 \u2014 a perceptual diff, in workerd, from PNGs in real R2\"],\"fullName\":\"REQ-156 AC3 \u2014 a perceptual diff, in workerd, from PNGs in real R2 test_UAT_FC_REQ-156_crop_and_common_rect_are_pure_arithmetic_in_workerd\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_crop_and_common_rect_are_pure_arithmetic_in_workerd\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC4 \u2014 the rest of the fidelity path is workerd-clean at its core\"],\"fullName\":\"REQ-156 AC4 \u2014 the rest of the fidelity path is workerd-clean at its core test_UAT_FC_REQ-156_values_diff_comparison_runs_in_workerd\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_values_diff_comparison_runs_in_workerd\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC4 \u2014 the rest of the fidelity path is workerd-clean at its core\"],\"fullName\":\"REQ-156 AC4 \u2014 the rest of the fidelity path is workerd-clean at its core test_UAT_FC_REQ-156_responsive_diff_table_and_classifier_run_in_workerd\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_responsive_diff_table_and_classifier_run_in_workerd\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-156 AC4 \u2014 the rest of the fidelity path is workerd-clean at its core\"],\"fullName\":\"REQ-156 AC4 \u2014 the rest of the fidelity path is workerd-clean at its core test_UAT_FC_REQ-156_l1_gate_probes_run_in_workerd_via_the_direct_module\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-156_l1_gate_probes_run_in_workerd_via_the_direct_module\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793218443488,\"endTime\":1793218443488,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-156_fidelity_in_workerd.workers.test.ts\"},{\"assertionResults\":[],\"startTime\":1793218443488,\"endTime\":1793218443488,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[],\"startTime\":1793218443488,\"endTime\":1793218443488,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ticketing' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/tickets.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[],\"startTime\":1793218443488,\"endTime\":1793218443488,\"status\":\"failed\",\"message\":\"Cannot find module './generated/ai-workers.js' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/apps/control-app/src/ai.ts\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-157 AC6 \u2014 capture_site refuses what it must, and says so test_UAT_FC_REQ_157_private_and_link_local_space_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC6 \u2014 capture_site refuses what it must, and says so test_UAT_FC_REQ_157_each_refusal_names_its_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC6 \u2014 capture_site refuses what it must, and says so test_UAT_FC_REQ_157_the_guard_caps_redirects_and_size_and_records_both",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC6 \u2014 capture_site refuses what it must, and says so test_UAT_FC_REQ_157_a_refused_capture_is_journalled_with_its_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC6 \u2014 capture_site refuses what it must, and says so test_UAT_FC_REQ_157_the_audit_record_carries_the_refused_url",
          "file": "",
          "status": "passed"
        },
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
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}