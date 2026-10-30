---
uid: report-ae2eccaa
id: REPORT-6926
type: report
title: 'Scoped quality: pass (230 tests, 0 failed)'
created_by: xgd
created_at: '2026-10-30T21:23:06.175593+00:00'
updated_at: '2026-10-30T21:23:06.175593+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-00553335
  commit: 601eba2d088708fe19871c9a899fae04180c3ab3
---

{
  "timestamp": "2026-10-30T21:18:47.895734Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015920796431601048,
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
      "duration_seconds": 38.85775824985467,
      "passed": 230,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 230,
      "deselected": 6,
      "test_filter": [
        "test_UAT_AC1013_",
        "test_UAT_AC1014_",
        "test_UAT_AC1015_",
        "test_UAT_AC1016_",
        "test_UAT_AC1017_",
        "test_UAT_AC1018_",
        "test_UAT_AC1019_",
        "test_UAT_AC1020_",
        "test_UAT_AC1021_",
        "test_UAT_AC1022_",
        "test_UAT_AC1023_",
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
        "test_UAT_AC1291_",
        "test_UAT_AC1292_",
        "test_UAT_AC1293_",
        "test_UAT_AC1294_",
        "test_UAT_AC1295_",
        "test_UAT_AC1296_",
        "test_UAT_AC1297_",
        "test_UAT_AC1298_",
        "test_UAT_AC1299_",
        "test_UAT_AC1300_",
        "test_UAT_AC1301_",
        "test_UAT_AC1302_",
        "test_UAT_AC1303_",
        "test_UAT_AC1304_",
        "test_UAT_AC1305_",
        "test_UAT_AC1306_",
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
        "test_UAT_AC1415_",
        "test_UAT_AC1416_",
        "test_UAT_AC1417_",
        "test_UAT_AC1456_",
        "test_UAT_AC1632_",
        "test_UAT_AC1633_",
        "test_UAT_AC1647_",
        "test_UAT_AC1648_",
        "test_UAT_AC1649_",
        "test_UAT_AC1650_",
        "test_UAT_AC1651_",
        "test_UAT_AC1652_",
        "test_UAT_AC1653_",
        "test_UAT_AC1709_",
        "test_UAT_AC1710_",
        "test_UAT_AC1711_",
        "test_UAT_AC1712_",
        "test_UAT_AC1713_",
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
        "test_UAT_AC1790_",
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_AC2009_",
        "test_UAT_AC2010_",
        "test_UAT_AC2011_",
        "test_UAT_AC2012_",
        "test_UAT_AC2013_",
        "test_UAT_AC2014_",
        "test_UAT_AC2015_",
        "test_UAT_AC2016_",
        "test_UAT_AC2017_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
        "test_UAT_AC2021_",
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
        "test_UAT_AC2036_",
        "test_UAT_AC2037_",
        "test_UAT_AC2038_",
        "test_UAT_AC2039_",
        "test_UAT_AC2040_",
        "test_UAT_AC2041_",
        "test_UAT_AC2042_",
        "test_UAT_AC2043_",
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
        "test_UAT_AC2054_",
        "test_UAT_AC2055_",
        "test_UAT_AC2056_",
        "test_UAT_AC2057_",
        "test_UAT_AC2058_",
        "test_UAT_AC2059_",
        "test_UAT_AC2064_",
        "test_UAT_AC2065_",
        "test_UAT_AC2066_",
        "test_UAT_AC2067_",
        "test_UAT_AC656_",
        "test_UAT_AC657_",
        "test_UAT_AC658_",
        "test_UAT_AC659_",
        "test_UAT_AC720_",
        "test_UAT_AC738_",
        "test_UAT_AC739_",
        "test_UAT_FC_BUG_44",
        "test_UAT_FC_BUG_45",
        "test_UAT_FC_BUG_47",
        "test_UAT_FC_BUG_49",
        "test_UAT_FC_BUNDLE_32",
        "test_UAT_FC_REQ_157",
        "test_UAT_FC_REQ_174",
        "test_UAT_FC_REQ_176",
        "test_UAT_FC_REQ_177"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ailureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"two writers folding onto one conversation conflict loudly\"],\"fullName\":\"two writers folding onto one conversation conflict loudly test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact\",\"status\":\"passed\",\"title\":\"test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact\",\"duration\":153,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"what a conversation has been told is recorded on its own chat ticket\"],\"fullName\":\"what a conversation has been told is recorded on its own chat ticket test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket\",\"duration\":196,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793395158558,\"endTime\":1793395159029,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"a Worker-hosted consultant with a browser can see\"],\"fullName\":\"a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"status\":\"passed\",\"title\":\"test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft\",\"duration\":93,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"a Worker-hosted consultant with no browser still edits\"],\"fullName\":\"a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant\",\"duration\":60,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793395158564,\"endTime\":1793395158718,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-assistant-looking-surface-worker.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account\"],\"fullName\":\"AC-1722 \u2014 the list is rows without descriptions; the item adds one; neither leaves the account test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description\",\"duration\":108,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1723 \u2014 a material\u2019s file comes back as itself\"],\"fullName\":\"AC-1723 \u2014 a material\u2019s file comes back as itself test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing\"],\"fullName\":\"AC-1724 \u2014 a uid that is not this account\u2019s material is answered not-found, and a write so answered changes nothing test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched\"],\"fullName\":\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1720 \u2014 a description the client wrote is recorded as theirs\"],\"fullName\":\"AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"status\":\"passed\",\"title\":\"test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards\"],\"fullName\":\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"status\":\"passed\",\"title\":\"test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"duration\":197,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793395158556,\"endTime\":1793395158939,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-library-surface.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1813 \u2014 every listed row carries what its bytes are\"],\"fullName\":\"AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"duration\":1242,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793395158556,\"endTime\":1793395159798,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-material-row-content-type.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"status\":\"passed\",\"title\":\"test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on\",\"duration\":134,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"status\":\"passed\",\"title\":\"test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material\",\"duration\":43,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 placement is recorded only when it is true\"],\"fullName\":\"story-aacb7060 \u2014 placement is recorded only when it is true test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none\",\"duration\":92,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793395158564,\"endTime\":1793395158833,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-site-asset-placement.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"status\":\"passed\",\"title\":\"test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy\",\"duration\":92,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"status\":\"passed\",\"title\":\"test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route\",\"duration\":90,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched\",\"duration\":47,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"status\":\"passed\",\"title\":\"test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret\",\"duration\":123,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-aacb7060 \u2014 only material the client may publish reaches their site\"],\"fullName\":\"story-aacb7060 \u2014 only material the client may publish reaches their site test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"status\":\"passed\",\"title\":\"test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears\",\"duration\":20,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793395158560,\"endTime\":1793395158932,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-32/tests/reconciliation-site-asset-promotion.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e15a19ef \u2014 aligned-crops forwards --sandbox store routing to its sub-commands test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the 1c bootstrap leaves both streams clean test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 Astro is never engaged by the render (REQ-148) test_UAT_AC739_astro_container_never_created_for_any_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --multi-viewport does not swallow the slug positional test_UAT_AC656_multi_viewport_keeps_slug_positional",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_json_is_exactly_one_parseable_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 --json stdout is exactly one clean JSON document test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 render/bootstrap diagnostics land on stderr test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 stdout is restored after success and after failure test_UAT_AC659_stdout_restored_after_success_and_failure",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 1c crop is an offline verb test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gated_command_refuses_before_doing_any_work",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 a gated command refuses on an unresolvable declared dependency test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 an install that lags the committed lockfile is its own fault test_UAT_AC1014_lockfile_drift_reported_while_deps_still_resolve",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 both install faults arrive in a single refusal test_UAT_AC1015_both_faults_reported_in_one_refusal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the refusal travels the CLI failure contract test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the gate is scoped to what each command loads test_UAT_AC1017_each_command_gated_on_exactly_what_it_loads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 the launcher configures its own plain Vite SSR server test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 Astro has left the repository test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document",
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
          "name": "every picture is named one way, and resolves to what it names test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults",
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
          "name": "AC-1715 \u2014 the whole account, with the open site as a badge test_UAT_AC1715_every_placement_is_listed_and_only_material_placed_on_the_open_site_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_placement_and_text_narrow_conjunctively_over_one_listing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2018 \u2014 badge, Used on row and filter read one placement list test_UAT_AC2018_badge_used_on_row_and_filter_agree_on_every_row_across_a_site_switch",
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
          "name": "AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole account\u2019s material, with the open site as a badge test_UAT_AC1715_the_list_spans_every_binding_and_only_the_open_site_row_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the rights record read-only test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1021_each_asset_reports_what_it_can_be_used_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store test_UAT_AC1022_the_store_answers_from_the_command_line_with_no_editing_gesture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the site asset store over the builder origin test_UAT_AC1023_the_store_answers_from_the_builder_origin_and_refuses_a_missing_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2010_reading_an_asset_answers_for_anything_listed_by_id_or_handle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2011_add_draw_and_remove_write_bytes_never_the_definition_and_are_journalled",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2009_a_definition_validates_with_or_without_the_retired_assets_key_and_nothing_reads_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the asset store tells the truth (BUG-44) test_UAT_AC2013_an_asset_reference_is_still_accepted_in_a_background_and_a_layer_child",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c46abfa6 \u2014 the declared control surface tells the truth about assets test_UAT_AC2012_the_surface_offers_no_alt_on_assets_and_never_makes_registration_a_precondition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the packed module is written on every application build test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1296_every_excluded_document_is_named_individually",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document",
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
          "name": "story-325da65f \u2014 one definition names each area everywhere test_UAT_AC2021_overlay_labels_library_pills_filter_detail_and_manual_read_from_one_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_serve_is_refused_as_an_unknown_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_help_offers_only_the_worker_based_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-177 \u2014 1c serve is discontinued test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC1 \u2014 the fidelity surface is declared as data, alongside the L1 one test_UAT_FC_REQ_157_both_declarations_validate_together",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC1 \u2014 the fidelity surface is declared as data, alongside the L1 one test_UAT_FC_REQ_157_the_l1_surface_gained_no_fidelity_operation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC1 \u2014 the fidelity surface is declared as data, alongside the L1 one test_UAT_FC_REQ_157_one_toolbox_composes_both_surfaces",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC2 \u2014 one picture source, and every operation takes it test_UAT_FC_REQ_157_no_operation_carries_its_own_ref_shaped_parameters",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC2 \u2014 one picture source, and every operation takes it test_UAT_FC_REQ_157_the_picture_type_declares_all_five_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC2 \u2014 one picture source, and every operation takes it test_UAT_FC_REQ_157_all_five_kinds_resolve_through_the_one_function",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC2 \u2014 one picture source, and every operation takes it test_UAT_FC_REQ_157_a_kind_missing_its_field_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC3 \u2014 screenshot returns an image the model can see test_UAT_FC_REQ_157_an_image_content_block_reaches_the_backend",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC3 \u2014 screenshot returns an image the model can see test_UAT_FC_REQ_157_a_large_picture_is_reduced_before_the_model_sees_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC3 \u2014 screenshot returns an image the model can see test_UAT_FC_REQ_157_downsampling_averages_rather_than_samples",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC4 \u2014 compare returns the verdict the CLI returns test_UAT_FC_REQ_157_compare_matches_the_cli_diff_for_the_same_pair",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC4 \u2014 compare returns the verdict the CLI returns test_UAT_FC_REQ_157_compare_crops_to_the_common_rectangle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC4 \u2014 compare returns the verdict the CLI returns test_UAT_FC_REQ_157_compare_takes_any_two_kinds",
          "file": "",
          "status": "passed"
        },
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
          "name": "REQ-157 AC7 \u2014 the consultant has the surface and its manual says so test_UAT_FC_REQ_157_the_manual_describes_what_it_can_now_do",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC7 \u2014 the consultant has the surface and its manual says so test_UAT_FC_REQ_157_the_grant_is_local_and_lives_beside_the_l1_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC8 \u2014 no operation on this surface can change a site test_UAT_FC_REQ_157_every_declared_operation_is_a_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC8 \u2014 no operation on this surface can change a site test_UAT_FC_REQ_157_running_every_operation_leaves_the_change_counter_where_it_was",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC8 \u2014 no operation on this surface can change a site test_UAT_FC_REQ_157_the_surface_declares_no_slug_parameter",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC5 \u2014 check_fidelity names which of the five verdicts applies test_UAT_FC_REQ_157_check_fidelity_runs_the_real_reconciliation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC5 \u2014 check_fidelity names which of the five verdicts applies test_UAT_FC_REQ_157_the_reference_side_is_read_at_the_viewport_the_actual_side_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC5 \u2014 check_fidelity names which of the five verdicts applies test_UAT_FC_REQ_157_a_bundle_without_a_ladder_member_falls_back_and_says_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-157 AC5 \u2014 check_fidelity names which of the five verdicts applies test_UAT_FC_REQ_157_each_of_the_five_verdicts_is_reachable_and_carries_its_own_next_step",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_every_row_opens_with_a_type_icon_including_the_kinds_nobody_uploads",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_the_icon_still_says_the_kind_to_a_screen_reader",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the Library row test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the row is one line, and truncation lands on the title test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-176 \u2014 the wording test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see",
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
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 compare test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-47fb84e6 \u2014 check_fidelity test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work",
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
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
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