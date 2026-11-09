---
uid: report-977b1cb6
id: REPORT-12021
type: report
title: 'Scoped quality: pass (219 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T20:47:56.864338+00:00'
updated_at: '2026-11-09T20:47:56.864338+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-76f63e53
  commit: 7b9976cf227bf31bf0b3062d6b5c8ea07956b030
---

{
  "timestamp": "2026-11-09T20:41:34.998573Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017349980771541595,
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
      "duration_seconds": 45.7644100417383,
      "passed": 219,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 219,
      "deselected": 18,
      "test_filter": [
        "test_UAT_AC1009_",
        "test_UAT_AC1010_",
        "test_UAT_AC1011_",
        "test_UAT_AC1012_",
        "test_UAT_AC1124_",
        "test_UAT_AC1125_",
        "test_UAT_AC1126_",
        "test_UAT_AC1127_",
        "test_UAT_AC1128_",
        "test_UAT_AC1418_",
        "test_UAT_AC1419_",
        "test_UAT_AC1420_",
        "test_UAT_AC1421_",
        "test_UAT_AC1422_",
        "test_UAT_AC1423_",
        "test_UAT_AC1424_",
        "test_UAT_AC1622_",
        "test_UAT_AC1678_",
        "test_UAT_AC1679_",
        "test_UAT_AC1680_",
        "test_UAT_AC1681_",
        "test_UAT_AC1682_",
        "test_UAT_AC1683_",
        "test_UAT_AC1684_",
        "test_UAT_AC1685_",
        "test_UAT_AC1686_",
        "test_UAT_AC1687_",
        "test_UAT_AC1714_",
        "test_UAT_AC1715_",
        "test_UAT_AC1716_",
        "test_UAT_AC1717_",
        "test_UAT_AC1718_",
        "test_UAT_AC1719_",
        "test_UAT_AC1720_",
        "test_UAT_AC1721_",
        "test_UAT_AC1722_",
        "test_UAT_AC1723_",
        "test_UAT_AC1724_",
        "test_UAT_AC1725_",
        "test_UAT_AC1726_",
        "test_UAT_AC1727_",
        "test_UAT_AC1728_",
        "test_UAT_AC1729_",
        "test_UAT_AC1730_",
        "test_UAT_AC1731_",
        "test_UAT_AC1732_",
        "test_UAT_AC1733_",
        "test_UAT_AC1734_",
        "test_UAT_AC1735_",
        "test_UAT_AC1809_",
        "test_UAT_AC1810_",
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
        "test_UAT_AC2021_",
        "test_UAT_AC2085_",
        "test_UAT_AC2086_",
        "test_UAT_AC2087_",
        "test_UAT_AC2095_",
        "test_UAT_AC2096_",
        "test_UAT_AC2098_",
        "test_UAT_AC2161_",
        "test_UAT_AC2244_",
        "test_UAT_AC2245_",
        "test_UAT_AC2246_",
        "test_UAT_AC2324_",
        "test_UAT_AC2325_",
        "test_UAT_AC2326_",
        "test_UAT_AC2327_",
        "test_UAT_AC2328_",
        "test_UAT_AC2333_",
        "test_UAT_AC2334_",
        "test_UAT_AC2335_",
        "test_UAT_AC2458_",
        "test_UAT_AC2459_",
        "test_UAT_AC2460_",
        "test_UAT_AC2461_",
        "test_UAT_AC2500_",
        "test_UAT_AC2501_",
        "test_UAT_AC2502_",
        "test_UAT_AC2503_",
        "test_UAT_AC2504_",
        "test_UAT_AC2505_",
        "test_UAT_AC2506_",
        "test_UAT_AC2507_",
        "test_UAT_AC2508_",
        "test_UAT_AC2509_",
        "test_UAT_AC2510_",
        "test_UAT_AC2511_",
        "test_UAT_AC2512_",
        "test_UAT_AC2513_",
        "test_UAT_AC2514_",
        "test_UAT_AC2515_",
        "test_UAT_AC2516_",
        "test_UAT_AC2523_",
        "test_UAT_AC2524_",
        "test_UAT_AC2525_",
        "test_UAT_AC2526_",
        "test_UAT_AC2527_",
        "test_UAT_AC2528_",
        "test_UAT_AC2529_",
        "test_UAT_AC2530_",
        "test_UAT_AC2531_",
        "test_UAT_AC2532_",
        "test_UAT_AC2533_",
        "test_UAT_AC2534_",
        "test_UAT_AC2535_",
        "test_UAT_AC2536_",
        "test_UAT_AC2537_",
        "test_UAT_AC2538_",
        "test_UAT_AC2539_",
        "test_UAT_AC2540_",
        "test_UAT_AC2541_",
        "test_UAT_AC2542_",
        "test_UAT_AC2543_",
        "test_UAT_AC2544_",
        "test_UAT_AC2545_",
        "test_UAT_AC2546_",
        "test_UAT_AC2547_",
        "test_UAT_AC2548_",
        "test_UAT_AC2549_",
        "test_UAT_AC2550_",
        "test_UAT_AC2551_",
        "test_UAT_AC2552_",
        "test_UAT_AC2553_",
        "test_UAT_AC2554_",
        "test_UAT_AC2555_",
        "test_UAT_AC2556_",
        "test_UAT_AC2557_",
        "test_UAT_AC2558_",
        "test_UAT_AC2559_",
        "test_UAT_AC2560_",
        "test_UAT_AC2561_",
        "test_UAT_AC2562_",
        "test_UAT_AC2563_",
        "test_UAT_AC682_",
        "test_UAT_AC683_",
        "test_UAT_AC684_",
        "test_UAT_AC685_",
        "test_UAT_AC686_",
        "test_UAT_AC687_",
        "test_UAT_AC688_",
        "test_UAT_AC723_",
        "test_UAT_AC725_",
        "test_UAT_AC726_",
        "test_UAT_AC727_",
        "test_UAT_AC728_",
        "test_UAT_AC801_",
        "test_UAT_AC802_",
        "test_UAT_AC803_",
        "test_UAT_AC804_",
        "test_UAT_AC805_",
        "test_UAT_AC806_",
        "test_UAT_AC807_",
        "test_UAT_AC829_",
        "test_UAT_AC830_",
        "test_UAT_AC831_",
        "test_UAT_AC832_",
        "test_UAT_AC849_",
        "test_UAT_AC850_",
        "test_UAT_AC851_",
        "test_UAT_AC888_",
        "test_UAT_AC889_",
        "test_UAT_AC890_",
        "test_UAT_AC891_",
        "test_UAT_AC892_",
        "test_UAT_AC894_",
        "test_UAT_AC903_",
        "test_UAT_AC904_",
        "test_UAT_AC905_",
        "test_UAT_AC906_",
        "test_UAT_AC907_",
        "test_UAT_AC908_",
        "test_UAT_AC909_",
        "test_UAT_AC911_",
        "test_UAT_AC912_",
        "test_UAT_AC913_",
        "test_UAT_AC933_",
        "test_UAT_AC934_",
        "test_UAT_AC935_",
        "test_UAT_AC936_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "est_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"status\":\"passed\",\"title\":\"test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-d34eccd8 \u2014 serving a published site, over real bindings\"],\"fullName\":\"story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable\",\"duration\":74,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794256937962,\"endTime\":1794256938246,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-published-site-serving.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2560_a_draft_preview_submission_lands_one_lead_through_the_same_handler\",\"status\":\"passed\",\"title\":\"test_UAT_AC2560_a_draft_preview_submission_lands_one_lead_through_the_same_handler\",\"duration\":244,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2561_a_preview_submission_resolves_its_form_definition_from_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2561_a_preview_submission_resolves_its_form_definition_from_the_draft\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2562_every_captured_lead_records_its_channel_set_by_the_server\",\"status\":\"passed\",\"title\":\"test_UAT_AC2562_every_captured_lead_records_its_channel_set_by_the_server\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2563_preview_skips_turnstile_and_rate_limit_and_no_request_can_obtain_the_bypass\",\"status\":\"passed\",\"title\":\"test_UAT_AC2563_preview_skips_turnstile_and_rate_limit_and_no_request_can_obtain_the_bypass\",\"duration\":394,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2504_a_preview_body_naming_another_tenant_writes_nothing_there\",\"status\":\"passed\",\"title\":\"test_UAT_AC2504_a_preview_body_naming_another_tenant_writes_nothing_there\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2505_a_preview_submission_records_the_draft_consent_wording\",\"status\":\"passed\",\"title\":\"test_UAT_AC2505_a_preview_submission_records_the_draft_consent_wording\",\"duration\":77,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2515_a_lead_post_to_any_preview_channel_other_than_draft_is_404\",\"status\":\"passed\",\"title\":\"test_UAT_AC2515_a_lead_post_to_any_preview_channel_other_than_draft_is_404\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 the draft preview submits for real\"],\"fullName\":\"story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2515_the_rendered_draft_preview_form_resolves_to_the_preview_lead_route_and_lands_a_lead\",\"status\":\"passed\",\"title\":\"test_UAT_AC2515_the_rendered_draft_preview_form_resolves_to_the_preview_lead_route_and_lands_a_lead\",\"duration\":66,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794256926090,\"endTime\":1794256927025,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/test_reconciliation_preview_lead_capture.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant\",\"duration\":68,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"status\":\"passed\",\"title\":\"test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact\",\"duration\":41,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"status\":\"passed\",\"title\":\"test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement\",\"duration\":102,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"status\":\"passed\",\"title\":\"test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"status\":\"passed\",\"title\":\"test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition\",\"duration\":26,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"status\":\"passed\",\"title\":\"test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"status\":\"passed\",\"title\":\"test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"status\":\"passed\",\"title\":\"test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"status\":\"passed\",\"title\":\"test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only\",\"duration\":142,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"status\":\"passed\",\"title\":\"test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset\",\"duration\":127,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url\",\"duration\":75,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-f2e5032c \u2014 public lead capture\"],\"fullName\":\"story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once\",\"duration\":35,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794256927836,\"endTime\":1794256928623,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/test_reconciliation_public_lead_capture.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_an_unconfigured_deployment_shows_the_reason_in_a_banner_and_the_builder_below_accepts_no_input",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_a_configured_deployment_shows_no_banner_and_is_not_blocked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_with_no_key_no_chat_session_is_opened_and_the_pane_says_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_with_no_key_a_dropped_file_is_not_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 the image converter binding (REQ-221) test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 the image converter binding (REQ-221) test_UAT_AC2537_the_converter_is_built_from_the_binding_under_the_declared_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d0a8cfad \u2014 the authoring path is held to the L1 safety envelope test_UAT_AC849_authored_page_body_clears_the_envelope_on_every_consuming_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d0a8cfad \u2014 the authoring path is held to the L1 safety envelope test_UAT_AC850_range_url_over_cap_and_duplicate_id_each_rejected_when_authored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d0a8cfad \u2014 the authoring path is held to the L1 safety envelope test_UAT_AC851_emitter_neutralisation_and_authoring_validation_catch_different_classes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-806 a control leaf renders the module element painted entirely by L1 test_UAT_AC806_module_attributes_survive_while_l1_paints_the_element",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-807 the safety envelope survives the L1-wraps-module inversion test_UAT_AC807_control_attributes_are_refused_or_escaped_and_nothing_goes_live",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-829 a node paints a repeating texture from a typed axis with no asset test_UAT_AC829_each_shape_is_drawn_by_the_renderer_from_its_typed_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-830 a gradient is linear or radial and the branches cannot be mixed test_UAT_AC830_radial_carries_its_own_axes_and_linear_stays_the_default",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-831 texture composes with fill, gradient, scrim and image in a defined layer order test_UAT_AC831_five_axes_paint_as_ordered_layers_and_untextured_pages_are_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-832 the envelope bounds the texture period, width and colour test_UAT_AC832_texture_violations_are_rejected_with_the_offending_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2529_manifest_render_emits_srcset_and_computed_sizes_and_plain_render_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2530_laddered_img_carries_the_measured_intrinsic_width_and_height",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2531_background_ladder_bases_on_the_smallest_width_and_overrides_only_where_the_choice_changes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2532_per_width_background_override_restates_the_whole_layer_stack_and_never_drops_the_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-d0a8cfad \u2014 the delivery ladder in the renderer (REQ-222) test_UAT_AC2533_document_carries_no_delivery_fields_and_rendition_urls_pass_url_safety",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1124 a picture declares which part of itself its box shows test_UAT_AC1124_object_position_is_a_pair_or_nothing_and_image_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1125 a node paints a typed colour adjustment as one declaration in a fixed order test_UAT_AC1125_colour_adjustment_emits_one_ordered_declaration_on_every_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1126 an adjustment at its identity emits nothing, per function test_UAT_AC1126_identity_is_skipped_per_function_and_the_opposite_extreme_is_emitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1127 a typed shape names an intent and never geometry test_UAT_AC1127_renderer_drawn_shapes_are_bounded_and_a_blob_is_seed_deterministic",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1128 the envelope bounds a colour adjustment through the shared surface check test_UAT_AC1128_adjustment_bounds_apply_to_base_and_interaction_states_alike",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-725 typed pixel-mover axes render as CSS re-derived from their typed fields test_UAT_AC725_structured_axes_emit_derived_css_and_identity_values_are_omitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-726 malformed structured axes are rejected by the envelope test_UAT_AC726_structured_axis_violations_rejected_with_offending_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-727 a document font resource table binds a family handle to its served face test_UAT_AC727_resource_table_emits_font_face_rules_ahead_of_use_and_binds_the_face",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-727 a document font resource table binds a family handle to its served face test_UAT_AC727_bound_face_paints_at_its_own_glyph_metrics_in_a_real_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-728 font resource entries are scheme-checked and weight-bounded by the envelope test_UAT_AC728_font_entry_scheme_and_weight_violations_rejected_with_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-933 a rendered page emits no colour custom property, and exactly one colour system survives test_UAT_AC933_no_colour_custom_property_is_declared_or_referenced_anywhere_the_renderer_emits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-934 page background and inherited text colour are L1 document fields, validated as colour axes test_UAT_AC934_document_page_colours_validate_as_colour_axes_and_emit_as_body_rules",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-935 no closed colour-role vocabulary survives in the schema, in a definition, or on a layer test_UAT_AC935_colour_role_vocabulary_is_absent_from_the_schema_surface_and_from_every_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-936 the non-colour token groups validate and emit exactly as before the colour cut test_UAT_AC936_every_surviving_token_group_still_emits_and_sparse_themes_are_default_filled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-888 a rendered snapshot is relocatable test_UAT_AC888_root_relative_references_are_emitted_document_relative_and_serve_under_a_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-889 only a root-relative reference changes shape test_UAT_AC889_absolute_protocol_relative_fragment_and_relative_references_emerge_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-890 an empty or colon-bearing first segment keeps its base test_UAT_AC890_root_fragment_query_and_colon_references_resolve_against_the_snapshot_root",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-891 a nested page slug fails the render loudly test_UAT_AC891_nested_page_slug_is_rejected_before_anything_is_written_and_flat_sites_are_unaffected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-685 injection payloads in content values are inert in the rendered output test_UAT_AC685_structured_axis_and_resource_table_payloads_emit_no_raw_css",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-801 a painted, internally laid-out element is a single node test_UAT_AC801_one_container_carries_both_the_surface_and_its_layout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-802 every node kind admits the same shared axis groups test_UAT_AC802_shared_groups_accepted_identically_and_strictly_on_every_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-803 a text run declares its own measure and the layout gate wraps against it test_UAT_AC803_measured_run_emits_its_width_and_the_gate_narrows_the_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-804 a behavior-module seam can be measured through the slot itself test_UAT_AC804_measured_slot_emits_its_width_and_needs_no_wrapper",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-805 a background image on any node kind binds to the mirrored asset test_UAT_AC805_background_handles_resolve_site_local_on_every_kind_or_are_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-682 well-formed L1 document accepted as a typed layout tree test_UAT_AC682_valid_document_and_optional_primitives_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_varies_continuously_and_snap_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap) test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-685 injection payloads in content values are inert in the rendered output test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope test_UAT_AC686_envelope_boundary_is_the_range_not_the_property",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-687 a rejected document returns the full list of per-field errors test_UAT_AC687_multiple_violations_all_reported_with_path_and_message",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-688 the spike renders equivalently across chromium, webkit, and firefox test_UAT_AC688_no_layout_divergence_across_three_engines",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-723 a slot leaf renders as an inert placeholder naming its behavior module test_UAT_AC723_slot_name_always_emitted_behavior_only_when_declared_both_escaped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole business, and a switch leaves nothing behind test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 role, kind and text narrow one listing; no used-on-this-site axis test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2018 \u2014 the warning and the Placed on row read one list test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 icon, title, role pill on one line test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2161 \u2014 only the never-placed site asset is marked test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2085 \u2014 a capture\u2019s preview is its screenshot, as one named member test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2086 \u2014 a capture states its file count in place of *File*, and downloads the screenshot test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2087 \u2014 a link in any description opens away from the builder, through every repaint test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the name, the description and an upload's role are the editable fields test_UAT_AC1718_name_description_and_upload_role_are_the_editable_fields_and_a_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2553 \u2014 the picture in the pane opens the image modal test_UAT_AC2553_editable_picture_is_a_labelled_button_opening_one_modal_on_the_picture_as_it_stands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2554 \u2014 the picture in the chat opens the same modal test_UAT_AC2554_chat_picture_opens_the_same_modal_for_scoped_and_unscoped_material_addresses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2555 \u2014 only raster image material is offered the editor test_UAT_AC2555_only_raster_images_are_offered_the_editor_and_captures_and_drawings_open_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2556 \u2014 the Library name is one field in two places test_UAT_AC2556_library_name_is_one_field_in_pane_and_modal_committed_as_the_title_and_kept",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2556 \u2014 the Library name is one field in two places test_UAT_AC2556_a_name_carrying_markup_stays_inert_text_through_the_feed_the_modal_and_the_chat_opener",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2557 \u2014 each tool commits one operation and the picture is re-fetched test_UAT_AC2557_each_tool_commits_one_operation_of_a_recipe_and_the_modal_refetches_without_sending_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2558 \u2014 undo and redo span the sitting and save each step test_UAT_AC2558_undo_and_redo_step_through_the_sitting_saving_the_recipe_at_each_step",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2559 \u2014 a refused edit, and an unrendered one, in the modal test_UAT_AC2559_modal_drops_only_the_refused_step_shows_the_origins_sentence_and_says_when_unrendered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 a business switch closes the feed, then re-reads, then reopens test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2324 \u2014 a write elsewhere appears without a reload, disturbing nothing else test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 a row redraws from the event; the body is re-read only for the open, unedited detail test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2019 \u2014 one labelled type icon per row, no kind pill test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is one line, and truncation lands on the title test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2020 \u2014 the row is laid out icon, then title, then pills test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1811 \u2014 the content type chooses the reader, bounded above the record, download kept test_UAT_AC1811_each_content_type_gets_its_own_bounded_reader_above_the_record_with_the_download_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1812 \u2014 the expand control opens the same document in the workspace\u2019s own dialog test_UAT_AC1812_expanding_opens_the_same_material_at_modal_size_and_browsing_away_takes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1814 \u2014 one render-then-sanitize path, markup shown as source, an SVG left a picture test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1815 \u2014 a surface painted before the engines settle repaints once they do test_UAT_AC1815_a_cold_pane_upgrades_itself_including_an_open_expanded_window_and_keeps_its_editability",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the record read-only but for an upload's role test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description, and on an upload the role, are the editable fields test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2458 \u2014 the select edits in the drop-area labels and repaints everything it changed test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2459 \u2014 no role control where the origin chose the role test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2461 \u2014 a placed material's narrowing is refused and the select reverts test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor test_UAT_AC1009_unwrappable_run_floors_its_captured_width_while_a_wrapping_run_keeps_it_fixed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1009 \u2014 a run that cannot wrap treats its captured width as a floor test_UAT_AC1009_longer_copy_grows_the_floored_box_instead_of_vanishing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1010 \u2014 the floor is gated by wrap threshold and by node kind test_UAT_AC1010_floor_begins_at_the_wrap_threshold_and_never_reaches_a_container",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1011 \u2014 a relaxed rung also releases its fixed width test_UAT_AC1011_every_floored_rung_resets_its_width_so_no_lower_segment_extrapolation_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1011 \u2014 a relaxed rung also releases its fixed width test_UAT_AC1011_each_rung_measures_at_its_own_floor_never_the_extrapolation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1012 \u2014 the relaxation is invisible for content that has not been edited test_UAT_AC1012_floored_and_fixed_stylesheets_differ_only_in_their_width_declarations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1012 \u2014 the relaxation is invisible for content that has not been edited test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2527_filesystem_and_memory_stores_hold_identical_renditions_and_the_manifest_only_feeds_the_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2523_publish_writes_raster_renditions_under_assets_d_in_their_own_format_and_skips_vectors_animations_and_undecodable_files",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2525_renditions_are_content_addressed_and_a_republish_of_an_unchanged_picture_transforms_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2524_ladder_is_the_conventional_widths_strictly_below_the_source_and_never_upscales",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 the publish builds a delivery width ladder (REQ-222) test_UAT_AC2526_draft_channel_and_a_publish_with_no_images_binding_build_no_ladder_and_are_otherwise_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC894_publishing_always_renders_from_the_current_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing from the command line and the builder test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC904_a_bare_published_root_redirects_to_the_slashed_form",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC905_the_record_and_not_the_key_space_says_what_a_url_may_reach",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC906_not_found_is_plain_and_identical_across_its_four_causes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC907_a_malformed_or_traversal_shaped_component_404s_without_a_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC908_the_served_type_follows_the_key_that_answered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC909_published_responses_are_short_lived_mutable_and_indexable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC2528_a_delivery_rendition_is_immutable_and_nothing_else_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC911_a_warm_request_skips_the_store_and_a_not_found_is_never_retained",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site test_UAT_AC912_the_server_is_read_only_and_head_is_bodiless",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1725_the_overlay_asks_what_the_file_is_for_and_states_the_privacy_promise",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1726_dropping_files_into_an_area_commits_that_role_and_withdraws_the_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1727_every_area_is_activatable_without_dragging_and_commits_the_same_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1728_a_file_dropped_outside_both_areas_creates_nothing_and_says_what_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1729_only_a_file_drag_raises_the_overlay_and_it_stays_up_across_the_workspace",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1734_dismissing_the_overlay_creates_nothing_and_the_next_raise_starts_clean",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC2538_the_picker_names_heic_and_the_formats_read_and_never_says_image_wildcard",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1730_the_conversation_and_the_library_raise_the_one_same_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1731_a_conversational_handover_is_the_clients_own_turn_and_a_library_one_adds_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1732_a_handover_that_did_not_fully_succeed_reports_what_went_wrong",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1733_the_open_site_travels_with_the_handover_and_a_reference_file_is_never_placed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1735_several_files_are_reported_one_by_one_and_the_library_is_re_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC2539_a_library_route_refusal_is_reported_in_the_library_and_cleared_by_the_next_handover",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 one definition names each area everywhere test_UAT_AC2021_overlay_labels_library_pills_filter_detail_and_manual_read_from_one_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the apex is a published site test_UAT_AC2333_apex_pages_and_assets_resolve_at_the_root",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_AC2334_signed_out_by_default_and_signed_in_with_a_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-200 \u00b7 the Worker reads a session only to select a state test_UAT_AC2335_a_session_dependent_response_is_not_shared_cached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the public form surface test_UAT_AC2514_contact_form_renders_a_checkbox_with_a_value_an_associated_label_and_no_placeholder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the public form surface test_UAT_AC2515_a_published_form_carries_its_instance_id_and_the_edit_render_cannot_post",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 edit_image stores a recipe and keeps the original test_UAT_AC2540_edit_image_stores_the_recipe_reports_image_edits_original_size_and_leaves_the_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 list_image_edits answers in the edit_image shape test_UAT_AC2541_an_unedited_picture_lists_no_edits_and_its_size_is_its_original",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 a call replaces the recipe whole test_UAT_AC2542_omitted_operations_are_removed_an_empty_list_restores_and_no_list_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 operations apply in the order written test_UAT_AC2543_each_operation_is_one_renderer_step_in_order_measured_against_what_came_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 a malformed recipe is refused with its reason test_UAT_AC2544_each_malformed_recipe_is_refused_naming_the_mistake_and_the_recipe_is_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 a recipe impossible for these pixels is refused before any write test_UAT_AC2545_an_enlarging_resize_and_a_sub_pixel_crop_are_refused_and_nothing_is_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 pictures are named in the one picture vocabulary test_UAT_AC2546_unknown_ambiguous_site_asset_and_non_raster_pictures_are_refused_with_distinct_codes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the image surface is offered only where pictures can be rendered test_UAT_AC2547_a_rendering_deployment_offers_both_groups_and_says_sizes_are_automatic_and_descriptions_describe_the_original",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the material file route serves the picture as it stands test_UAT_AC2548_edited_by_default_in_its_stored_format_original_on_request_and_unedited_untransformed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 width= is a delivery size and never an edit test_UAT_AC2549_width_scales_down_without_touching_the_recipe_never_enlarges_and_never_renders_a_capture_member",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the stored bytes are served whenever rendering cannot happen test_UAT_AC2550_no_usable_renderer_or_a_failed_render_serves_the_stored_bytes_with_200",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 renditions are content-addressed, per tenant, out of the material keyspace test_UAT_AC2551_a_repeat_request_is_not_re_rendered_and_renditions_live_under_their_own_tenant_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856 \u2014 the assistant sees a stored picture as it stands test_UAT_AC2552_the_default_look_is_the_edited_picture_original_true_is_the_stored_bytes_and_no_renderer_means_stored_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2325 \u2014 the list hands out its cursor, and the feed is SSE keyed by seq test_UAT_AC2325_list_cursor_ready_frame_seq_ids_last_event_id_precedence_head_default_and_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2325 \u2014 the list hands out its cursor, and the feed is SSE keyed by seq test_UAT_AC2325_an_idle_feed_is_kept_alive_with_sse_comment_heartbeats",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2326 \u2014 an event's row is the list's own row, built from the change test_UAT_AC2326_event_row_equals_the_re_read_list_row_and_is_built_without_reading_ticket_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2327 \u2014 the feed carries only the scoped business's material test_UAT_AC2327_a_second_business_writes_and_non_material_tickets_never_reach_the_subscription",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2328 \u2014 the baseline carries the change-log tables as the component declares them test_UAT_AC2328_baseline_change_log_tables_match_the_component_and_deliver_a_material_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2555 \u2014 the edit route refuses everything but a raster picture test_UAT_AC2555_recipe_for_a_drawing_document_or_capture_is_refused_403_and_nothing_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2556 \u2014 the name route writes the title and nothing else test_UAT_AC2556_name_route_writes_the_title_not_the_filename_and_refuses_empty_malformed_and_foreign",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2557 \u2014 an edit is a recipe on the record; the original is never rewritten test_UAT_AC2557_recipe_is_stored_on_the_record_and_the_original_bytes_are_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2559 \u2014 a refused recipe changes nothing; an unrendered one is still stored test_UAT_AC2559_recipe_route_refuses_409_in_the_vocabularys_words_400_when_malformed_and_stores_unrendered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2458 \u2014 an upload's role is corrected, and republishable is derived server-side test_UAT_AC2458_upload_role_corrects_both_ways_validates_and_derives_republishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2459 \u2014 fetched and captured material is refused 403; no recorded origin counts as uploaded test_UAT_AC2459_fetched_and_captured_roles_are_refused_403_unchanged_and_absent_origin_is_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2460 \u2014 widening places the bytes on the business's one site; otherwise not placed, not failed test_UAT_AC2460_widening_places_on_the_one_site_and_zero_several_or_failing_sites_leave_the_role_changed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2461 \u2014 narrowing a placed material is refused 409 and changes nothing test_UAT_AC2461_narrowing_a_placed_upload_is_refused_409_naming_uid_and_placed_on_and_nothing_moves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 renditions cross the store port identically (cloud) test_UAT_AC2527_cloud_and_memory_stores_hold_identical_renditions_and_the_frozen_definition_ignores_the_ladder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5349d01f \u2014 publishing in the cloud, where there is no filesystem test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC903_a_published_url_serves_the_live_revision_whole",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d34eccd8 \u2014 serving a published site, over real bindings test_UAT_AC2244_the_published_url_is_the_site_key_and_another_business_key_is_not_obtainable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2560_a_draft_preview_submission_lands_one_lead_through_the_same_handler",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2561_a_preview_submission_resolves_its_form_definition_from_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2562_every_captured_lead_records_its_channel_set_by_the_server",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2563_preview_skips_turnstile_and_rate_limit_and_no_request_can_obtain_the_bypass",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2504_a_preview_body_naming_another_tenant_writes_nothing_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2505_a_preview_submission_records_the_draft_consent_wording",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2515_a_lead_post_to_any_preview_channel_other_than_draft_is_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 the draft preview submits for real test_UAT_AC2515_the_rendered_draft_preview_form_resolves_to_the_preview_lead_route_and_lands_a_lead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-f2e5032c \u2014 public lead capture test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once",
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