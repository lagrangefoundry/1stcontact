---
uid: report-4bfc5355
id: REPORT-3132
type: report
title: 'Scoped quality: pass (17 tests, 0 failed)'
created_by: xgd
created_at: '2026-08-31T23:56:50.756637+00:00'
updated_at: '2026-08-31T23:56:50.756637+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: reconcile-BUNDLE-22
  commit: f815d5992d3e3b5677fa0dfe0c67abc0ae1c526b
---

{
  "timestamp": "2026-08-31T23:53:50.707613Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012645800597965717,
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
      "duration_seconds": 28.505657083005644,
      "passed": 17,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 17,
      "deselected": 2122,
      "test_filter": [
        "test_UAT_AC1459",
        "test_UAT_AC1460",
        "test_UAT_AC1461",
        "test_UAT_AC1462",
        "test_UAT_AC1463",
        "test_UAT_AC1464",
        "test_UAT_AC1465",
        "test_UAT_AC1466",
        "test_UAT_AC1467",
        "test_UAT_AC1468",
        "test_UAT_AC1469",
        "test_UAT_AC1470",
        "test_UAT_AC1471",
        "test_UAT_AC1472",
        "test_UAT_AC1473",
        "test_UAT_AC1474",
        "test_UAT_AC1475"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "he AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_the_audit_is_append_only_across_concurrent_flushes\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_the_audit_is_append_only_across_concurrent_flushes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_no_api_key_appears_in_a_response_or_an_error\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_no_api_key_appears_in_a_response_or_an_error\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_a_missing_key_costs_a_turn_and_not_the_conversation\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_a_missing_key_costs_a_turn_and_not_the_conversation\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_the_worker_carries_only_the_operations_it_can_run\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_the_worker_carries_only_the_operations_it_can_run\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-146 \u2014 the AI host runs in workerd\"],\"fullName\":\"REQ-146 \u2014 the AI host runs in workerd test_UAT_FC_REQ-146_the_r2_archive_round_trips_the_neutral_session_file\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-146_the_r2_archive_round_trips_the_neutral_session_file\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1788220432157,\"endTime\":1788220432157,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-22/tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-148 \u2014 behavior modules render in workerd\"],\"fullName\":\"REQ-148 \u2014 behavior modules render in workerd test_UAT_FC_REQ-148_a_behavior_module_site_renders_its_draft_channel\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-148_a_behavior_module_site_renders_its_draft_channel\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-148 \u2014 behavior modules render in workerd\"],\"fullName\":\"REQ-148 \u2014 behavior modules render in workerd test_UAT_FC_REQ-148_the_served_bytes_are_the_components_own_output\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-148_the_served_bytes_are_the_components_own_output\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-148 \u2014 behavior modules render in workerd\"],\"fullName\":\"REQ-148 \u2014 behavior modules render in workerd test_UAT_FC_REQ-148_the_edit_channel_switches_the_behaviour_off\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-148_the_edit_channel_switches_the_behaviour_off\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1788220432157,\"endTime\":1788220432157,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-22/tests/test_UAT_FC_REQ-148_behavior_in_workerd.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_publish_mints_renders_and_stores_with_no_filesystem\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_publish_mints_renders_and_stores_with_no_filesystem\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_public_site_serves_the_published_revision_from_d1\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_public_site_serves_the_published_revision_from_d1\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_publishing_an_unchanged_draft_is_a_no_op\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_publishing_an_unchanged_draft_is_a_no_op\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_history_is_readable_and_checkout_is_forward_only\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_history_is_readable_and_checkout_is_forward_only\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_an_invalid_draft_publishes_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_an_invalid_draft_publishes_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_a_second_tenant_cannot_publish_over_a_claimed_slug\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_a_second_tenant_cannot_publish_over_a_claimed_slug\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_the_builder_redirects_the_published_channel_to_public_site\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_the_builder_redirects_the_published_channel_to_public_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_build_artifacts_serve_when_the_store_has_no_tenant\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_build_artifacts_serve_when_the_store_has_no_tenant\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-149 \u2014 publish in the cloud\"],\"fullName\":\"REQ-149 \u2014 publish in the cloud test_UAT_FC_REQ-149_the_site_listing_reports_the_live_revision\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-149_the_site_listing_reports_the_live_revision\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1788220432157,\"endTime\":1788220432157,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-22/tests/test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-154 AC2 \u2014 `1c shot --url` returns a PNG from inside workerd\"],\"fullName\":\"REQ-154 AC2 \u2014 `1c shot --url` returns a PNG from inside workerd test_UAT_FC_REQ_154_shot_url_returns_png_in_workerd\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_shot_url_returns_png_in_workerd\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC2 \u2014 `1c shot --url` returns a PNG from inside workerd\"],\"fullName\":\"REQ-154 AC2 \u2014 `1c shot --url` returns a PNG from inside workerd test_UAT_FC_REQ_154_shot_without_binding_names_the_missing_binding\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_shot_without_binding_names_the_missing_binding\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC3 \u2014 our own preview, not an Access challenge\"],\"fullName\":\"REQ-154 AC3 \u2014 our own preview, not an Access challenge test_UAT_FC_REQ_154_preview_shot_serves_the_authored_page\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_preview_shot_serves_the_authored_page\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC3 \u2014 our own preview, not an Access challenge\"],\"fullName\":\"REQ-154 AC3 \u2014 our own preview, not an Access challenge test_UAT_FC_REQ_154_no_request_to_our_host_ever_reaches_the_network\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_no_request_to_our_host_ever_reaches_the_network\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC3 \u2014 our own preview, not an Access challenge\"],\"fullName\":\"REQ-154 AC3 \u2014 our own preview, not an Access challenge test_UAT_FC_REQ_154_third_party_subresources_still_reach_the_network\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_third_party_subresources_still_reach_the_network\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC3 \u2014 our own preview, not an Access challenge\"],\"fullName\":\"REQ-154 AC3 \u2014 our own preview, not an Access challenge test_UAT_FC_REQ_154_unknown_slug_is_404_not_a_fetch\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_unknown_slug_is_404_not_a_fetch\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC6 \u2014 the session is released on every path\"],\"fullName\":\"REQ-154 AC6 \u2014 the session is released on every path test_UAT_FC_REQ_154_session_released_on_success\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_session_released_on_success\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC6 \u2014 the session is released on every path\"],\"fullName\":\"REQ-154 AC6 \u2014 the session is released on every path test_UAT_FC_REQ_154_session_released_on_failure\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_session_released_on_failure\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC6 \u2014 the session is released on every path\"],\"fullName\":\"REQ-154 AC6 \u2014 the session is released on every path test_UAT_FC_REQ_154_session_released_on_timeout\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_session_released_on_timeout\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC6 \u2014 the session is released on every path\"],\"fullName\":\"REQ-154 AC6 \u2014 the session is released on every path test_UAT_FC_REQ_154_one_browser_many_contexts_across_a_ladder\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_one_browser_many_contexts_across_a_ladder\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-154 AC6 \u2014 the session is released on every path\"],\"fullName\":\"REQ-154 AC6 \u2014 the session is released on every path test_UAT_FC_REQ_154_each_driver_sees_only_its_own_navigation\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ_154_each_driver_sees_only_its_own_navigation\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1788220432157,\"endTime\":1788220432157,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-22/tests/test_UAT_FC_REQ-154_cloud_eyes.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "AC-1465 \u2014 an unactuatable interaction state is skipped and reported, never faked test_UAT_AC1465_rest_only_with_a_note_when_the_path_cannot_actuate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1466 \u2014 the capture preconditions, executed against a real document test_UAT_AC1466_preconditions_land_motion_reveal_scroll_images_and_fonts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1467 \u2014 a cloud capture and a local capture are the same capture test_UAT_AC1467_both_paths_draw_preconditions_from_one_source_and_apply_width_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1468 \u2014 the shipped deployment depends on the cloud browser capability alone test_UAT_AC1468_worker_graph_reaches_no_local_browser_stack_and_one_lease",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1461 \u2014 a deployment with no browser capability still edits, renders and publishes test_UAT_AC1461_no_browser_binding_leaves_edit_render_publish_working_and_names_the_gap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1459 \u2014 PNG bytes at the named viewport preset, inside the deployed runtime test_UAT_AC1459_screenshot_returns_png_bytes_at_each_named_preset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1460 \u2014 an unrecognised viewport preset is refused, never defaulted test_UAT_AC1460_unknown_preset_is_refused_naming_it_and_the_valid_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1462 \u2014 a run leases one browser and gives every capture its own context test_UAT_AC1462_one_browser_and_a_fresh_context_per_viewport_across_a_ladder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1463 \u2014 the leased browser is released on every exit path test_UAT_AC1463_release_on_success_on_failure_and_on_the_time_ceiling",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1464 \u2014 each capture's request record contains only its own page's requests test_UAT_AC1464_a_second_capture_in_the_same_run_carries_none_of_the_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1469 \u2014 a capture of the operator's own draft returns the authored page test_UAT_AC1469_own_channel_capture_is_the_authored_page_not_a_challenge",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1470 \u2014 every request to the owned host is answered in-process test_UAT_AC1470_no_path_on_the_owned_host_ever_reaches_the_network",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1471 \u2014 requests to any other host are untouched and go to the network test_UAT_AC1471_third_party_subresources_are_fetched_not_substituted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1472 \u2014 capturing a site that does not exist is answered in-process test_UAT_AC1472_unknown_slug_is_not_found_and_never_a_fetch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1473 \u2014 a failure while producing the page is answered with a server error test_UAT_AC1473_a_render_failure_is_a_500_naming_it_and_never_a_fall_through",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1474 \u2014 the capture shows the draft as it stands now test_UAT_AC1474_a_capture_after_an_edit_shows_the_edited_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1475 \u2014 a capture of a published site is fetched like any other page test_UAT_AC1475_every_request_including_the_navigation_goes_to_the_network",
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