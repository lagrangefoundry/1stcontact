---
uid: report-3999b38c
id: REPORT-12583
type: report
title: 'Scoped quality: pass (277 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-11T02:17:12.675040+00:00'
updated_at: '2026-11-11T02:17:12.675040+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-4ada51a8
  commit: f0feec8c5b5062c534c91fee358099215d93b07d
---

{
  "timestamp": "2026-11-11T02:11:17.102389Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001832079142332077,
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
      "duration_seconds": 39.957387417089194,
      "passed": 277,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 277,
      "deselected": 17,
      "test_filter": [
        "test_UAT_AC1051_",
        "test_UAT_AC1052_",
        "test_UAT_AC1053_",
        "test_UAT_AC1054_",
        "test_UAT_AC1055_",
        "test_UAT_AC1056_",
        "test_UAT_AC1057_",
        "test_UAT_AC1058_",
        "test_UAT_AC1059_",
        "test_UAT_AC1060_",
        "test_UAT_AC1061_",
        "test_UAT_AC1095_",
        "test_UAT_AC1096_",
        "test_UAT_AC1097_",
        "test_UAT_AC1098_",
        "test_UAT_AC1099_",
        "test_UAT_AC1100_",
        "test_UAT_AC1101_",
        "test_UAT_AC1102_",
        "test_UAT_AC1103_",
        "test_UAT_AC1104_",
        "test_UAT_AC1105_",
        "test_UAT_AC1106_",
        "test_UAT_AC1107_",
        "test_UAT_AC1108_",
        "test_UAT_AC1109_",
        "test_UAT_AC1317_",
        "test_UAT_AC1318_",
        "test_UAT_AC1319_",
        "test_UAT_AC1320_",
        "test_UAT_AC1404_",
        "test_UAT_AC1405_",
        "test_UAT_AC1406_",
        "test_UAT_AC1407_",
        "test_UAT_AC1408_",
        "test_UAT_AC1409_",
        "test_UAT_AC1410_",
        "test_UAT_AC1412_",
        "test_UAT_AC1413_",
        "test_UAT_AC1414_",
        "test_UAT_AC1456_",
        "test_UAT_AC1623_",
        "test_UAT_AC1624_",
        "test_UAT_AC1650_",
        "test_UAT_AC1651_",
        "test_UAT_AC1652_",
        "test_UAT_AC1653_",
        "test_UAT_AC1709_",
        "test_UAT_AC1710_",
        "test_UAT_AC1711_",
        "test_UAT_AC1712_",
        "test_UAT_AC1713_",
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1795_",
        "test_UAT_AC1796_",
        "test_UAT_AC1797_",
        "test_UAT_AC1798_",
        "test_UAT_AC1799_",
        "test_UAT_AC1800_",
        "test_UAT_AC1801_",
        "test_UAT_AC1802_",
        "test_UAT_AC1803_",
        "test_UAT_AC1804_",
        "test_UAT_AC1805_",
        "test_UAT_AC1806_",
        "test_UAT_AC1807_",
        "test_UAT_AC1808_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_AC2014_",
        "test_UAT_AC2015_",
        "test_UAT_AC2016_",
        "test_UAT_AC2017_",
        "test_UAT_AC2022_",
        "test_UAT_AC2023_",
        "test_UAT_AC2024_",
        "test_UAT_AC2025_",
        "test_UAT_AC2026_",
        "test_UAT_AC2027_",
        "test_UAT_AC2028_",
        "test_UAT_AC2029_",
        "test_UAT_AC2030_",
        "test_UAT_AC2031_",
        "test_UAT_AC2032_",
        "test_UAT_AC2033_",
        "test_UAT_AC2034_",
        "test_UAT_AC2035_",
        "test_UAT_AC2054_",
        "test_UAT_AC2055_",
        "test_UAT_AC2056_",
        "test_UAT_AC2057_",
        "test_UAT_AC2066_",
        "test_UAT_AC2067_",
        "test_UAT_AC2088_",
        "test_UAT_AC2089_",
        "test_UAT_AC2090_",
        "test_UAT_AC2091_",
        "test_UAT_AC2107_",
        "test_UAT_AC2108_",
        "test_UAT_AC2109_",
        "test_UAT_AC2110_",
        "test_UAT_AC2111_",
        "test_UAT_AC2237_",
        "test_UAT_AC2329_",
        "test_UAT_AC2330_",
        "test_UAT_AC2331_",
        "test_UAT_AC2332_",
        "test_UAT_AC2364_",
        "test_UAT_AC2372_",
        "test_UAT_AC2373_",
        "test_UAT_AC2374_",
        "test_UAT_AC2375_",
        "test_UAT_AC2376_",
        "test_UAT_AC2377_",
        "test_UAT_AC2379_",
        "test_UAT_AC2380_",
        "test_UAT_AC2381_",
        "test_UAT_AC2382_",
        "test_UAT_AC2383_",
        "test_UAT_AC2384_",
        "test_UAT_AC2385_",
        "test_UAT_AC2386_",
        "test_UAT_AC2387_",
        "test_UAT_AC2388_",
        "test_UAT_AC2389_",
        "test_UAT_AC2390_",
        "test_UAT_AC2391_",
        "test_UAT_AC2392_",
        "test_UAT_AC2413_",
        "test_UAT_AC2414_",
        "test_UAT_AC2415_",
        "test_UAT_AC2416_",
        "test_UAT_AC2417_",
        "test_UAT_AC2418_",
        "test_UAT_AC2419_",
        "test_UAT_AC2420_",
        "test_UAT_AC2421_",
        "test_UAT_AC2422_",
        "test_UAT_AC2423_",
        "test_UAT_AC2424_",
        "test_UAT_AC2425_",
        "test_UAT_AC2467_",
        "test_UAT_AC2476_",
        "test_UAT_AC2477_",
        "test_UAT_AC2478_",
        "test_UAT_AC2479_",
        "test_UAT_AC2480_",
        "test_UAT_AC2481_",
        "test_UAT_AC2482_",
        "test_UAT_AC2483_",
        "test_UAT_AC2484_",
        "test_UAT_AC2485_",
        "test_UAT_AC2486_",
        "test_UAT_AC2487_",
        "test_UAT_AC2488_",
        "test_UAT_AC2489_",
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
        "test_UAT_AC2564_",
        "test_UAT_AC2565_",
        "test_UAT_AC2566_",
        "test_UAT_AC2567_",
        "test_UAT_AC2568_",
        "test_UAT_AC2569_",
        "test_UAT_AC2570_",
        "test_UAT_AC2571_",
        "test_UAT_AC2572_",
        "test_UAT_AC2573_",
        "test_UAT_AC2574_",
        "test_UAT_AC2575_",
        "test_UAT_AC2576_",
        "test_UAT_AC2577_",
        "test_UAT_AC2578_",
        "test_UAT_AC2579_",
        "test_UAT_AC2580_",
        "test_UAT_AC2581_",
        "test_UAT_AC2582_",
        "test_UAT_AC2583_",
        "test_UAT_AC2584_",
        "test_UAT_AC2585_",
        "test_UAT_AC2586_",
        "test_UAT_AC2587_",
        "test_UAT_AC2588_",
        "test_UAT_AC2589_",
        "test_UAT_AC2590_",
        "test_UAT_AC2591_",
        "test_UAT_AC2592_",
        "test_UAT_AC2593_",
        "test_UAT_AC2594_",
        "test_UAT_AC697_",
        "test_UAT_AC698_",
        "test_UAT_AC699_",
        "test_UAT_AC700_",
        "test_UAT_AC701_",
        "test_UAT_AC702_",
        "test_UAT_AC703_",
        "test_UAT_AC704_",
        "test_UAT_AC722_",
        "test_UAT_AC808_",
        "test_UAT_AC809_",
        "test_UAT_AC810_",
        "test_UAT_AC811_",
        "test_UAT_AC877_",
        "test_UAT_AC878_",
        "test_UAT_FC_BUG_76",
        "test_UAT_FC_BUG_80",
        "test_UAT_FC_BUG_83",
        "test_UAT_FC_BUG_84",
        "test_UAT_FC_REQ_217",
        "test_UAT_FC_REQ_228",
        "test_UAT_FC_REQ_229"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "rue\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"status\":\"passed\",\"title\":\"test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"duration\":63,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794363115897,\"endTime\":1794363116090,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-placement.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"duration\":47,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"status\":\"passed\",\"title\":\"test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"duration\":82,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"status\":\"passed\",\"title\":\"test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794363109523,\"endTime\":1794363109728,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-site-asset-promotion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2467: model requests carry the backend document\u2019s model and max_tokens (deployed host)\"],\"fullName\":\"AC-2467: model requests carry the backend document\u2019s model and max_tokens (deployed host) test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794363117889,\"endTime\":1794363117925,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_assistant_backend_settings.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2586 \u2014 the consultant reads, never writes, this business tickets\"],\"fullName\":\"AC-2586 \u2014 the consultant reads, never writes, this business tickets test_UAT_AC2586_worker_consultant_reads_this_business_tickets_and_transcripts_never_writes_and_reaches_no_other_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2586_worker_consultant_reads_this_business_tickets_and_transcripts_never_writes_and_reaches_no_other_business\",\"duration\":73,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2587 \u2014 the deployed host always composes the ticket surface\"],\"fullName\":\"AC-2587 \u2014 the deployed host always composes the ticket surface test_UAT_AC2587_worker_host_with_no_knowledge_images_renderer_or_catalogue_still_offers_ticket_reads\",\"status\":\"passed\",\"title\":\"test_UAT_AC2587_worker_host_with_no_knowledge_images_renderer_or_catalogue_still_offers_ticket_reads\",\"duration\":29,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794363116126,\"endTime\":1794363116228,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_assistant_ticket_read.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2576 \u2014 list_library returns the whole catalogue\"],\"fullName\":\"AC-2576 \u2014 list_library returns the whole catalogue test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields\",\"status\":\"passed\",\"title\":\"test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields\",\"duration\":377,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2577 \u2014 list_library is bounded and says so\"],\"fullName\":\"AC-2577 \u2014 list_library is bounded and says so test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more\",\"status\":\"passed\",\"title\":\"test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more\",\"duration\":515,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2578 \u2014 list_library filters combine with AND\"],\"fullName\":\"AC-2578 \u2014 list_library filters combine with AND test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text\",\"duration\":130,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2579 \u2014 get_library_item reads one item in full\"],\"fullName\":\"AC-2579 \u2014 get_library_item reads one item in full test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title\",\"status\":\"passed\",\"title\":\"test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2580 \u2014 a name that is not exactly one item is refused\"],\"fullName\":\"AC-2580 \u2014 a name that is not exactly one item is refused test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates\",\"status\":\"passed\",\"title\":\"test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates\",\"duration\":600,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2581 \u2014 a catalogue item name is a picture name\"],\"fullName\":\"AC-2581 \u2014 a catalogue item name is a picture name test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture\",\"status\":\"passed\",\"title\":\"test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture\",\"duration\":115,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2582 \u2014 place_on_site puts a republishable item on the draft site\"],\"fullName\":\"AC-2582 \u2014 place_on_site puts a republishable item on the draft site test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on\",\"duration\":275,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2583 \u2014 place_on_site never overwrites a site asset\"],\"fullName\":\"AC-2583 \u2014 place_on_site never overwrites a site asset test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes\",\"status\":\"passed\",\"title\":\"test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes\",\"duration\":88,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2584 \u2014 what place_on_site refuses\"],\"fullName\":\"AC-2584 \u2014 what place_on_site refuses test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store\",\"duration\":56,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794363104644,\"endTime\":1794363106877,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_library_catalogue.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[],\"fullName\":\"test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\",\"status\":\"passed\",\"title\":\"test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794363116350,\"endTime\":1794363116419,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/test_reconciliation_site_asset_import_rights_gate.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "an arrival notice above its budget truncates titles and never the count test_UAT_AC1800_forty_one_arrivals_keep_an_exact_count_and_lose_only_titles",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a single title longer than the whole budget is clipped and still named test_UAT_AC1801_one_oversized_title_is_clipped_rather_than_dropped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant is told it is a consultant test_UAT_AC2054_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant is told it is a consultant test_UAT_AC2066_per_turn_reminder_the_model_receives_calls_the_owner_the_client",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant is told it is a consultant test_UAT_AC2055_new_session_is_recorded_and_reported_under_the_consultant_name_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation stored under the former name still works test_UAT_AC2056_session_stored_under_the_legacy_role_resumes_and_takes_an_editing_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the rename left nothing behind test_UAT_AC2057_no_working_tree_file_carries_the_legacy_role_word_except_the_alias",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no filesystem-backed junction or archive can reach the deployed artifact test_UAT_AC1406_the_artifacts_import_graph_carries_no_filesystem_module_or_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant library is bundled at build time test_UAT_AC1407_the_library_travels_in_the_artifact_and_a_missing_one_fails_the_build",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the model key ships as a deploy secret test_UAT_AC1410_the_deploy_asks_the_deployment_and_rehearses_the_same_decision",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the corpus arrives on the surface the site operations arrive on test_UAT_AC1317_knowledge_is_offered_beside_the_site_operations_and_audited_like_an_edit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the knowledge grant is read-only and confined by one declaration test_UAT_AC1318_the_grant_is_the_read_set_and_names_one_kb_on_both_scope_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is primed with the map and the manual, not the documents test_UAT_AC1319_priming_carries_the_map_then_the_purpose_then_the_manual",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no knowledge base is ordinary; one that cannot be opened is reported test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant answers for itself before any conversation exists test_UAT_AC1051_capability_answer_names_the_role_and_readiness_without_a_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "naming a site opens that site\u2019s conversation test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1053_naming_a_site_or_omitting_a_value_is_refused_as_malformed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1055_an_identifier_is_answered_only_when_it_names_a_site_this_account_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "two sites are two conversations test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the conversation is stored with the workspace test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the conversation is stored with the workspace test_UAT_AC2570_a_turn_that_pasted_a_display_line_replays_it_after_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the conversation is stored with the workspace test_UAT_AC1057_losing_the_host_mid_turn_costs_that_turn_and_not_the_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a transcript written by the deployed host is read by the local one test_UAT_AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "what the assistant is offered test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased",
          "file": "",
          "status": "passed"
        },
        {
          "name": "steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant is offered a separate, read-only looking surface test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_the_five_page_kinds_resolve_to_what_they_name_with_the_defaults",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays",
          "file": "",
          "status": "passed"
        },
        {
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2031_no_text_carries_the_base64_the_toolbox_audits_and_validates_and_other_results_stay_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no looking operation changes the site test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the 1c CLI has no browser budget test_UAT_AC2373_the_shared_declaration_names_no_ceiling_and_the_node_host_makes_41_looks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing a turn made is a picture the client sees test_UAT_AC2569_write_image_hands_back_a_business_scoped_line_that_a_redraw_keeps",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing a turn made is a picture the client sees test_UAT_AC2570_surface_v9_tells_the_model_to_paste_the_line_word_for_word",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing a turn made is a picture the client sees test_UAT_AC2571_with_no_asset_url_factory_the_drawing_is_written_with_no_display",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing a turn made is a picture the client sees test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Node CLI host sends the model the whole priming test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_each_priming_order_declares_exactly_one_boundary_and_it_is_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_with_a_knowledge_base_the_whole_priming_is_one_cached_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_without_a_knowledge_base_the_whole_priming_is_one_cached_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_the_boundary_renders_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2376 \u2014 the whole priming sits before one cache boundary declared at its end test_UAT_AC2376_landscape_and_manual_are_assembled_once_a_session_not_once_a_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_no_shipped_priming_text_names_a_corpus_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_no_shipped_priming_text_names_a_document_by_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_the_purpose_still_carries_the_obligation_and_the_subjects",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_the_reminder_points_at_the_method_without_naming_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 no authored text names a document test_UAT_AC2377_both_declared_orders_are_scanned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_a_document_added_to_the_corpus_reaches_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_a_document_demoted_from_the_corpus_leaves_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_neither_change_cost_an_edit_to_the_authored_priming",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_a_document_retitled_in_the_corpus_is_retitled_in_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-65 \u2014 which documents exist is the build\u2019s answer, not a sentence\u2019s test_UAT_AC2377_the_session_is_still_told_to_go_and_read_its_method",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2364 \u2014 the Node host carries the reminder at the tail of the last user message test_UAT_AC2364_node_host_reminder_rides_last_user_message_tail_not_system_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2364 \u2014 the Node host carries the reminder at the tail of the last user message test_UAT_AC2364_the_tail_is_read_in_both_wire_shapes_and_a_quiet_turn_reads_as_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the picture schema the model is shown carries the sixth kind test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an image picture resolves to the stored picture it names test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an image picture missing its name is refused naming the field test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a stored picture is named however it is referenced test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a name that means several pictures, or none, is refused test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a drawing says how it was photographed, and a stored picture cannot be driven test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment",
          "file": "",
          "status": "passed"
        },
        {
          "name": "check_fidelity needs a live page test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict",
          "file": "",
          "status": "passed"
        },
        {
          "name": ".gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the session\u2019s words are read from one configuration file, validated at start-up test_UAT_AC2374_priming_and_reminders_come_from_priming_json_and_malformed_entries_fail_naming_themselves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the session\u2019s words are read from one configuration file, validated at start-up test_UAT_AC2374_opening_a_session_whose_order_names_an_unregistered_provider_fails_naming_the_entry_and_asks_the_model_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conditional entry drops with its separator, and the priming is bounded test_UAT_AC2375_quiet_entries_drop_whole_and_priming_is_capped_at_60000_naming_the_overflowing_entry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the product tier is empty and each text lives in one place test_UAT_AC2107_product_tier_is_empty_and_role_then_product_text_open_the_priming_with_no_restatement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the per-turn reminder is assembled from its configured entries test_UAT_AC2109_reminder_renders_six_ordered_entries_and_drops_each_signal_when_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a template slot with no value reaches the prompt as itself test_UAT_AC2374_a_placeholder_with_no_value_is_left_exactly_as_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the session is told three texts, each piece of material in exactly one test_UAT_AC2107_system_prompt_opens_with_the_role_then_carries_the_product_text_which_names_no_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "priming carries the grant-projected summary, with DescribeTools for the rest test_UAT_AC2108_priming_is_the_summary_manual_of_the_grant_and_describe_tools_is_offered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the per-turn reminder points to the method and carries only the per-turn signals test_UAT_AC2109_reminder_is_short_points_to_the_knowledge_base_and_carries_signals_only_when_present",
          "file": "",
          "status": "passed"
        },
        {
          "name": "where there is no ticket store the ledger surface is absent test_UAT_AC2110_command_line_host_offers_no_ledger_operation_and_still_takes_a_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the composed client-behaviour asset (BUG-75) test_UAT_AC702_shipped_asset_loads_as_an_es_module_with_one_scoped_block_per_behavior_in_catalog_order",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the composed client-behaviour asset (BUG-75) test_UAT_AC2476_behaviors_sharing_a_top_level_name_each_run_against_their_own_value",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 control bindings are validated in both directions test_UAT_AC808_control_bindings_validated_in_both_directions",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior modules paint only their invariant elements test_UAT_AC809_modules_ship_no_css_beyond_declared_invariant_elements",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the generated stylesheet carries chrome, not source test_UAT_AC810_generated_stylesheet_carries_module_chrome_and_no_component_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the relocated default look is an L2 preset test_UAT_AC811_l2_preset_supplies_a_vetted_default_look",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 the module escapes its own config, and refuses an unsafe endpoint test_UAT_AC1414_module_escapes_both_sinks_and_refuses_an_unsafe_endpoint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavioural config validation test_UAT_AC697_config_validated_against_typed_contract",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 slot presentation validated as L1 subtrees test_UAT_AC698_slots_validated_as_l1_subtrees",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel L1 slide track test_UAT_AC699_carousel_renders_l1_slide_track_from_config",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 carousel autoplay/loop client behaviour test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 contact-form functional render + L1 controls test_UAT_AC701_contact_form_renders_functional_form_with_l1_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior client behaviour ships once per page test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 isolation conformance dimension test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 full five-dimension conformance obligation set test_UAT_AC704_survivors_declare_the_full_obligation_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 Behavior* contract naming is atomic test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 address prompt test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 behavior config and slots are closed at the write boundary test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a refused write names every fault precisely test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 sign-in baseline and confirmation test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 account-chrome v2 on the behavior contract test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a site\u2019s settings are written as structured values test_UAT_AC1095_a_settings_group_is_written_whole_and_unnamed_siblings_survive",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a site\u2019s settings are written as structured values test_UAT_AC1096_omitting_the_group_writes_top_level_and_a_scalar_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a site\u2019s settings are written as structured values test_UAT_AC1097_a_settings_value_the_site_schema_rejects_leaves_the_site_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 components are instantiated from a closed catalog test_UAT_AC1098_the_catalog_is_listable_and_closed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 components are instantiated from a closed catalog test_UAT_AC1099_a_component_is_added_with_configuration_alone_and_arrives_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 components are instantiated from a closed catalog test_UAT_AC1100_a_configuration_violating_the_kind_contract_is_refused_at_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 components are instantiated from a closed catalog test_UAT_AC1101_reconfiguring_merges_and_removing_leaves_the_seam_in_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 components are instantiated from a closed catalog test_UAT_AC1102_describing_a_page_reports_its_components_and_their_configuration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a page describes itself to a search engine test_UAT_AC1103_search_metadata_is_written_merged_and_reaches_the_rendered_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing the assistant composed test_UAT_AC1104_a_drawing_becomes_an_ordinary_site_image_and_ships_unaltered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing the assistant composed test_UAT_AC1105_a_drawing_carrying_anything_executable_is_refused_whole",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing the assistant composed test_UAT_AC1106_the_grammar_refuses_what_it_does_not_name_and_bounds_size_and_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing the assistant composed test_UAT_AC1107_the_filename_is_generated_and_an_existing_name_is_a_conflict",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing the assistant composed test_UAT_AC1108_drawing_is_its_own_grantable_capability_apart_from_managing_supplied_files",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 a drawing the assistant composed test_UAT_AC2014_drawing_is_declared_never_to_stand_in_for_a_client_supplied_file",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 the same four capabilities from the command line test_UAT_AC1109_every_capability_is_reachable_from_the_command_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 deploying never fails for a missing image credential test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a non-fetchable endpoint keeps its native submit test_UAT_AC877_non_fetchable_endpoint_keeps_the_native_submit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a fetchable endpoint is enhanced exactly as before test_UAT_AC878_fetchable_endpoint_is_enhanced_with_no_config_dial",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 the builder is served the anchor and measurement modules the tools run test_UAT_AC2421_the_builder_entry_loads_the_served_anchor_and_measure_modules_and_they_answer_as_the_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 the builder is served the anchor and measurement modules the tools run test_UAT_AC2421_in_a_browser_the_default_measure_path_gives_near_equal_to_measure_drawing_and_nearest_anchors",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 the pill and the composer test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an ordinary camera photograph can be looked at test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an absurd picture costs no browser, and a stored media type cannot escape the src test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounting_weakens_no_dimension",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-93 \u2014 an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-55 \u2014 search is called with indexes, not source test_UAT_AC2237_a_search_hit_is_read_back_on_the_node_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 a browser failure comes back as a sentence, never as its payload test_UAT_FC_BUG_80_a_failed_navigation_does_not_return_the_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 a browser failure comes back as a sentence, never as its payload test_UAT_FC_BUG_80_a_failed_evaluation_does_not_return_its_script",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 a browser failure comes back as a sentence, never as its payload test_UAT_FC_BUG_80_the_sanitiser_bounds_a_message_it_has_never_seen",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 an ordinary photograph is photographable test_UAT_FC_BUG_80_a_picture_past_the_old_url_ceiling_is_photographed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 an ordinary photograph is photographable test_UAT_FC_BUG_80_an_absurd_picture_is_refused_before_a_browser_is_leased",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 an ordinary photograph is photographable test_UAT_FC_BUG_80_a_stored_media_type_cannot_escape_the_src_it_goes_into",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-80 \u2014 an ordinary photograph is photographable test_UAT_FC_BUG_80_an_undecodable_picture_still_says_so_in_its_own_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2467: model requests carry the backend document\u2019s model and max_tokens (CLI host) test_UAT_AC2467_cli_host_requests_carry_the_documents_model_and_max_tokens_and_follow_an_edit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2587 \u2014 no ticket store, no ticket surface test_UAT_AC2587_cli_host_offers_no_ticket_tool_and_still_opens_replays_and_edits_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2585 \u2014 the catalogue tools, their groups, and where they are offered test_UAT_AC2585_hosted_consultant_offers_library_tools_in_read_and_place_groups_and_cli_offers_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the consultant writes the ledger into its own chat ticket test_UAT_AC2110_record_decision_and_name_engagement_write_only_this_conversations_chat_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the ledger is maintained on a stated trigger test_UAT_AC2111_ledger_guidance_states_settled_one_per_call_rejected_and_rename_once_known",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn leaves one chat ticket whose body the fold never writes test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is not a property of the process that opened it test_UAT_AC1456_a_turn_runs_on_a_process_that_never_opened_the_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no knowledge base to open is ordinary on the deployed host too test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an unresolvable identifier is refused in the channel the caller is reading test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation on the deployed runtime reads the design documents test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the deployed session is primed with the map and granted the read set test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no embedding model is a second route to no knowledge operations test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a whole turn runs on the deployed host test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is replayed out of the deployed store after the host is gone test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a transcript is stored in one language-neutral form test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "no credential the host holds appears in anything it says test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream",
          "file": "",
          "status": "passed"
        },
        {
          "name": "transcripts live outside the region site files are addressed within test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn on the deployed host leaves the conversation as one chat ticket test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body",
          "file": "",
          "status": "passed"
        },
        {
          "name": "two writers folding onto one conversation conflict loudly test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "what a conversation has been told is recorded on its own chat ticket test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the Worker binds the looking surface to the request business test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker with a browser but no private bucket opens no chat at all test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft",
          "file": "",
          "status": "passed"
        },
        {
          "name": "on the Worker a screenshot reaches the model as an image, through the Toolbox test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-b3de4571 \u2014 the drawing is in the conversation that made it test_UAT_AC2569_a_drawing_the_turn_made_is_fetchable_from_the_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "both Worker paths send the model the whole priming test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2364 \u2014 both Worker paths carry the reminder at the tail of the last user message test_UAT_AC2364_worker_paths_reminder_rides_last_user_message_tail_not_system_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a cold conversation is primed with both maps in one landscape section test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a client corpus small enough to list reaches the conversation in full test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete",
          "file": "",
          "status": "passed"
        },
        {
          "name": "one search reaches both knowledge bases and returns one ranked list test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a search hit from either knowledge base is read back, not refused test_UAT_AC2237_a_hit_from_each_knowledge_base_is_read_back_on_the_worker",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a document uploaded mid-conversation is known by name on the next turn test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn on which nothing arrived carries no arrival notice at all test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an arrival is announced once and never again test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an unreadable record of what a conversation was told never costs the turn test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation's coverage starts where the map's coverage ends test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a resumed conversation's first turn back reports what arrived while away test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a conversation is never announced to itself test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the arrival notice is last in a turn's context test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "arrivals are the client's knowledge alone, and no client knowledge still takes turns test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-179b8c06 \u2014 a behavior-mounting site renders in the edge runtime test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 a generated picture is shown in the turn that made it test_UAT_AC2567_a_generated_picture_result_carries_a_business_scoped_line_that_fetches_its_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 a generated picture is shown in the turn that made it test_UAT_AC2568_without_a_material_url_factory_the_result_has_no_display_and_generation_still_succeeds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_its_vocabulary_before_its_bytes_are_attached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-103 \u2014 a conversation stays whole across a live turn test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty",
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
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2590_promotion_places_the_current_render_and_records_the_name_actually_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2591_a_recipe_change_replaces_the_placed_bytes_at_the_recorded_name_and_reports_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2592_promoting_a_recorded_picture_again_overwrites_at_its_name_and_mints_no_duplicate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ed976856: the recipe reaches the site (REQ-229) test_UAT_AC2593_a_recorded_name_gone_from_the_site_is_reported_and_never_re_added",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2467: model requests carry the backend document\u2019s model and max_tokens (deployed host) test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2586 \u2014 the consultant reads, never writes, this business tickets test_UAT_AC2586_worker_consultant_reads_this_business_tickets_and_transcripts_never_writes_and_reaches_no_other_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2587 \u2014 the deployed host always composes the ticket surface test_UAT_AC2587_worker_host_with_no_knowledge_images_renderer_or_catalogue_still_offers_ticket_reads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2576 \u2014 list_library returns the whole catalogue test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2577 \u2014 list_library is bounded and says so test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2578 \u2014 list_library filters combine with AND test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2579 \u2014 get_library_item reads one item in full test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2580 \u2014 a name that is not exactly one item is refused test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2581 \u2014 a catalogue item name is a picture name test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2582 \u2014 place_on_site puts a republishable item on the draft site test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2583 \u2014 place_on_site never overwrites a site asset test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2584 \u2014 what place_on_site refuses test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409",
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