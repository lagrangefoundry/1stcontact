---
uid: report-afde402e
id: REPORT-11104
type: report
title: 'Report: batch_quality_check for story-d34eccd8'
created_by: xgd
created_at: '2026-11-07T07:12:23.358737+00:00'
updated_at: '2026-11-07T07:12:23.358737+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-d34eccd8
  parent_report_uid: report-83b9f631
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-07T07:06:51.288234Z",
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
      "duration_seconds": 104.38881958392449,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 0,
      "deselected": 3882,
      "test_filter": [
        "test_UAT_AC913"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ailureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2293_verified_delivery_and_bounce_land_on_the_record_in_the_business_that_sent_it\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2293_verified_delivery_and_bounce_land_on_the_record_in_the_business_that_sent_it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2296_with_no_signing_secret_every_request_is_refused\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2296_with_no_signing_secret_every_request_is_refused\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the delivery webhook\"],\"fullName\":\"story-219b4217 \u2014 the delivery webhook test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the webhook sits ahead of the Access gate\"],\"fullName\":\"story-219b4217 \u2014 the webhook sits ahead of the Access gate test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-219b4217 \u2014 the Contacts reads\"],\"fullName\":\"story-219b4217 \u2014 the Contacts reads test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794035212479,\"endTime\":1794035212479,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_outgoing_message_record.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2276_uncredentialed_send_records_locally_with_no_network_and_distinct_local_ids\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2277_both_senders_refuse_malformed_messages_naming_the_fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2278_provider_failures_are_reported_to_the_caller_as_send_errors\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 the sender\"],\"fullName\":\"story-7d255580 \u2014 the sender test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2281_message_body_reaches_the_provider_as_html\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2282_template_type_requires_key_subject_and_body_and_refuses_invalid_writes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2283_lookup_returns_newest_for_key_and_seeds_the_default_once_per_business\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7d255580 \u2014 templates in the business store\"],\"fullName\":\"story-7d255580 \u2014 templates in the business store test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2286_seeded_templates_are_business_neutral_with_button_and_pasteable_url\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794035212479,\"endTime\":1794035212479,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_outgoing_messages.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-387c9dfe \u2014 owning 1st Contact is ordinary ownership\"],\"fullName\":\"story-387c9dfe \u2014 owning 1st Contact is ordinary ownership test_UAT_AC2165_owning_1st_contact_reads_exactly_like_owning_a_salon\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2165_owning_1st_contact_reads_exactly_like_owning_a_salon\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-387c9dfe \u2014 no single predicate answers both questions\"],\"fullName\":\"story-387c9dfe \u2014 no single predicate answers both questions test_UAT_AC2168_ownership_and_bypass_are_separately_held_and_neither_implies_the_other\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2168_ownership_and_bypass_are_separately_held_and_neither_implies_the_other\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794035212479,\"endTime\":1794035212479,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_ownership_and_bypass_split.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794035212479,\"endTime\":1794035212479,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-38/tests/test_reconciliation_starter_site_guard.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [],
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