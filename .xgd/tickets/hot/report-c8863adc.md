---
uid: report-c8863adc
id: REPORT-11528
type: report
title: 'Scoped quality: pass (274 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T17:24:20.987624+00:00'
updated_at: '2026-11-08T17:24:20.987624+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-49607926
  commit: 485f2ad1e99ca0284e5138c623e7998537cefedd
---

{
  "timestamp": "2026-11-08T17:20:10.843800Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001271250657737255,
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
      "exit_code": 1,
      "duration_seconds": 37.89608708303422,
      "passed": 274,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 274,
      "deselected": 3,
      "test_filter": [
        "test_UAT_AC1029_",
        "test_UAT_AC1030_",
        "test_UAT_AC1031_",
        "test_UAT_AC1032_",
        "test_UAT_AC1033_",
        "test_UAT_AC1034_",
        "test_UAT_AC1035_",
        "test_UAT_AC1036_",
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
        "test_UAT_AC1062_",
        "test_UAT_AC1063_",
        "test_UAT_AC1064_",
        "test_UAT_AC1065_",
        "test_UAT_AC1066_",
        "test_UAT_AC1067_",
        "test_UAT_AC1068_",
        "test_UAT_AC1069_",
        "test_UAT_AC1070_",
        "test_UAT_AC1110_",
        "test_UAT_AC1317_",
        "test_UAT_AC1318_",
        "test_UAT_AC1319_",
        "test_UAT_AC1320_",
        "test_UAT_AC1399_",
        "test_UAT_AC1400_",
        "test_UAT_AC1401_",
        "test_UAT_AC1402_",
        "test_UAT_AC1403_",
        "test_UAT_AC1404_",
        "test_UAT_AC1405_",
        "test_UAT_AC1406_",
        "test_UAT_AC1407_",
        "test_UAT_AC1408_",
        "test_UAT_AC1409_",
        "test_UAT_AC1410_",
        "test_UAT_AC1449_",
        "test_UAT_AC1456_",
        "test_UAT_AC1651_",
        "test_UAT_AC1652_",
        "test_UAT_AC1653_",
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
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1811_",
        "test_UAT_AC1812_",
        "test_UAT_AC1813_",
        "test_UAT_AC1814_",
        "test_UAT_AC1815_",
        "test_UAT_AC1816_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_AC1819_",
        "test_UAT_AC2018_",
        "test_UAT_AC2019_",
        "test_UAT_AC2020_",
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
        "test_UAT_AC2066_",
        "test_UAT_AC2080_",
        "test_UAT_AC2081_",
        "test_UAT_AC2082_",
        "test_UAT_AC2083_",
        "test_UAT_AC2084_",
        "test_UAT_AC2085_",
        "test_UAT_AC2086_",
        "test_UAT_AC2087_",
        "test_UAT_AC2088_",
        "test_UAT_AC2089_",
        "test_UAT_AC2090_",
        "test_UAT_AC2091_",
        "test_UAT_AC2092_",
        "test_UAT_AC2093_",
        "test_UAT_AC2094_",
        "test_UAT_AC2107_",
        "test_UAT_AC2108_",
        "test_UAT_AC2109_",
        "test_UAT_AC2110_",
        "test_UAT_AC2111_",
        "test_UAT_AC2143_",
        "test_UAT_AC2144_",
        "test_UAT_AC2145_",
        "test_UAT_AC2146_",
        "test_UAT_AC2147_",
        "test_UAT_AC2148_",
        "test_UAT_AC2161_",
        "test_UAT_AC2227_",
        "test_UAT_AC2228_",
        "test_UAT_AC2230_",
        "test_UAT_AC2231_",
        "test_UAT_AC2232_",
        "test_UAT_AC2324_",
        "test_UAT_AC2325_",
        "test_UAT_AC2326_",
        "test_UAT_AC2327_",
        "test_UAT_AC2328_",
        "test_UAT_AC2368_",
        "test_UAT_AC2374_",
        "test_UAT_AC2375_",
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
        "test_UAT_AC2426_",
        "test_UAT_AC2427_",
        "test_UAT_AC2428_",
        "test_UAT_AC2429_",
        "test_UAT_AC2430_",
        "test_UAT_AC2431_",
        "test_UAT_AC2432_",
        "test_UAT_AC2433_",
        "test_UAT_AC2434_",
        "test_UAT_AC2435_",
        "test_UAT_AC2436_",
        "test_UAT_AC2437_",
        "test_UAT_AC2438_",
        "test_UAT_AC2439_",
        "test_UAT_AC2440_",
        "test_UAT_AC2441_",
        "test_UAT_AC2442_",
        "test_UAT_AC2443_",
        "test_UAT_AC2444_",
        "test_UAT_AC2445_",
        "test_UAT_AC2446_",
        "test_UAT_AC2447_",
        "test_UAT_AC2448_",
        "test_UAT_AC2449_",
        "test_UAT_AC2450_",
        "test_UAT_AC2451_",
        "test_UAT_AC2452_",
        "test_UAT_AC2453_",
        "test_UAT_AC2454_",
        "test_UAT_AC2455_",
        "test_UAT_AC2456_",
        "test_UAT_AC2457_",
        "test_UAT_AC2458_",
        "test_UAT_AC2459_",
        "test_UAT_AC2460_",
        "test_UAT_AC2461_",
        "test_UAT_AC2462_",
        "test_UAT_AC2463_",
        "test_UAT_AC2464_",
        "test_UAT_AC2465_",
        "test_UAT_AC2466_",
        "test_UAT_AC2467_",
        "test_UAT_AC959_",
        "test_UAT_AC960_",
        "test_UAT_AC961_",
        "test_UAT_AC962_",
        "test_UAT_AC963_",
        "test_UAT_AC964_",
        "test_UAT_AC965_",
        "test_UAT_AC966_",
        "test_UAT_AC967_",
        "test_UAT_AC968_",
        "test_UAT_AC969_",
        "test_UAT_AC970_",
        "test_UAT_AC971_",
        "test_UAT_AC972_",
        "test_UAT_AC973_",
        "test_UAT_AC974_",
        "test_UAT_AC975_",
        "test_UAT_AC976_",
        "test_UAT_AC977_",
        "test_UAT_AC978_",
        "test_UAT_AC979_",
        "test_UAT_FC_BUG_67",
        "test_UAT_FC_BUG_69",
        "test_UAT_FC_BUG_70",
        "test_UAT_FC_BUG_71",
        "test_UAT_FC_BUG_72",
        "test_UAT_FC_REQ_210",
        "test_UAT_FC_REQ_211",
        "test_UAT_FC_REQ_212",
        "test_UAT_FC_REQ_213"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "cord_alone\",\"status\":\"passed\",\"title\":\"test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone\",\"duration\":10,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched\"],\"fullName\":\"AC-1721 \u2014 an empty description is refused, and the stored one is untouched test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"status\":\"passed\",\"title\":\"test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1720 \u2014 a description the client wrote is recorded as theirs\"],\"fullName\":\"AC-1720 \u2014 a description the client wrote is recorded as theirs test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"status\":\"passed\",\"title\":\"test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards\"],\"fullName\":\"AC-1719 \u2014 the corrected description is what retrieval answers with afterwards test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"status\":\"passed\",\"title\":\"test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones\",\"duration\":120,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158437921,\"endTime\":1794158438142,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-library-surface.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-1813 \u2014 every listed row carries what its bytes are\"],\"fullName\":\"AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"status\":\"passed\",\"title\":\"test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree\",\"duration\":1296,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158432274,\"endTime\":1794158433570,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-material-row-content-type.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 one host, and only for a caller it admitted\"],\"fullName\":\"story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"status\":\"passed\",\"title\":\"test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158441665,\"endTime\":1794158441680,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-admission.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed workspace, with nothing running locally\"],\"fullName\":\"story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself\",\"status\":\"passed\",\"title\":\"test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed workspace, with nothing running locally\"],\"fullName\":\"story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store\",\"duration\":79,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158438006,\"endTime\":1794158438121,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-edge-origin.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a deployment with only the schema serves\"],\"fullName\":\"story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-e674c60a \u2014 the two unserveable deployments are reported distinguishably\"],\"fullName\":\"story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably\",\"status\":\"passed\",\"title\":\"test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158441634,\"endTime\":1794158441661,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-tenant-bootstrap.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the deployed runtime answers the one route table\"],\"fullName\":\"story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158441665,\"endTime\":1794158441693,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-workspace-transport.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2467: model requests carry the backend document\u2019s model and max_tokens (deployed host)\"],\"fullName\":\"AC-2467: model requests carry the backend document\u2019s model and max_tokens (deployed host) test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens\",\"duration\":64,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158441606,\"endTime\":1794158441670,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_assistant_backend_settings.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report\"],\"fullName\":\"AC-2044 \u2014 capture_site returns name, address, counts, refusals and the reference report test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"status\":\"passed\",\"title\":\"test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report\",\"duration\":178,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket\"],\"fullName\":\"AC-2080 \u2014 capture_site on the deployed host writes one multi-member reference ticket test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"status\":\"passed\",\"title\":\"test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member\",\"duration\":327,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link\"],\"fullName\":\"AC-2081 \u2014 the reference is titled by the page and its body opens with a link test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts\",\"duration\":87,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2082 \u2014 rights come from provenance\"],\"fullName\":\"AC-2082 \u2014 rights come from provenance test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"status\":\"passed\",\"title\":\"test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable\",\"duration\":110,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash\"],\"fullName\":\"AC-2083 \u2014 recapture updates one ticket in place, deduplicated by content hash test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"status\":\"passed\",\"title\":\"test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members\",\"duration\":75,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture\"],\"fullName\":\"AC-2084 \u2014 no ticket store, or a failed adoption, never loses the capture test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"status\":\"passed\",\"title\":\"test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why\",\"duration\":30,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158432357,\"endTime\":1794158433165,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_reconciliation_capture_site_reference_material.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_preview_names_the_control_app_store_and_deletes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_yes_removes_only_the_control_app_store_and_never_storage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_include_public_also_removes_the_public_site_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_listening_port_is_refused_and_nothing_is_deleted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_an_absent_store_is_already_empty_and_a_success",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2228 \u2014 1c reset, through the command surface test_UAT_AC2228_paths_resolve_from_the_repo_root_whatever_the_working_directory",
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
          "name": "STORY-104 \u2014 the pane follows the business (AC-2462) test_UAT_AC2462_business_switch_swaps_conversation_on_shared_slug_and_draft_stays_with_its_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_one_control_chooses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a business switch moves everything test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the account surface explains a lapse test_UAT_AC2147_account_surface_states_each_lapse_reason_and_switcher_only_suffixes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the word a person reads is Business test_UAT_AC2148_no_user_facing_string_in_builder_or_public_site_says_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC970_strip_re_derives_when_a_business_switch_or_a_restore_changes_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 site, toolbar and memory follow the business test_UAT_AC974_business_selection_is_remembered_under_a_shell_wide_key_and_falls_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 replay waits for the engines test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 the engines belong to the workspace test_UAT_AC1816_the_engines_start_once_for_the_workspace_and_readiness_settles_either_way",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 the page follows the writes test_UAT_AC1819_the_displayed_page_is_refetched_per_write_and_a_failed_refetch_keeps_the_reply",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a settled conversation opens idle test_UAT_AC2368_a_settled_conversation_opens_idle_and_a_typed_message_is_sent_and_answered",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a request-time render test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC959_renders_one_panel_per_declared_tab_and_opens_the_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC976_every_option_of_every_declared_tab_reaches_the_chrome",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC967_the_chrome_lists_exactly_the_store_and_switches_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace mounted over its origin test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component consumption route test_UAT_AC962_absent_component_names_the_component_and_the_install_command",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a origin failure reporting test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the empty detail state is one styled box test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy",
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
          "name": "AC-2443 a plain-string text node validates and renders as before runs existed test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2444 a run-array node validates and each varying run carries its own axes test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2445 the run form is closed test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2446 one spelling of single-run copy test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2447 a run with no axes renders as bare text test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2448 run axes are bounded by the L1 envelope test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2449 capture records which text runs share an inline flow test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2450 a varying captured flow folds to one multi-run node test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2451 a flow that varies in nothing stays separate nodes test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2452 a rejoined node takes its axes from the longest run test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2453 the fidelity measure and round-trip agree with the fold test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2454 the editor opens a multi-run node as one plain-string field per run test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2455 editing one run changes only that run test_UAT_AC2455_editing_text2_replaces_only_run_two_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2456 a copy field addressing no run is refused with no partial write test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2457 text-height estimation over runs test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_plain_string_validates_and_renders_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_each_run_renders_carrying_its_own_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_the_plain_text_of_runs_is_the_same_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_run_rejects_nesting_and_unpermitted_axes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_a_single_run_array_is_not_a_spelling_of_a_string",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the substrate accepts inline variation test_UAT_FC_REQ_211_run_axes_are_bounded_by_the_envelope",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_a_multi_run_node_opens_as_one_field_per_run",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_editing_one_run_disturbs_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the editor exposes multi-run copy as plain strings test_UAT_FC_REQ_211_a_run_field_outside_the_derivation_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 measuring a multi-run node test_UAT_FC_REQ_211_runs_measure_as_the_same_copy_written_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 measuring a multi-run node test_UAT_FC_REQ_211_a_smaller_run_consumes_less_of_the_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the fold rejoins a varying inline flow test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2467: model requests carry the backend document\u2019s model and max_tokens (CLI host) test_UAT_AC2467_cli_host_requests_carry_the_documents_model_and_max_tokens_and_follow_an_edit",
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
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the envelope accepts and refuses test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the renderer emits test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 what the reader can do test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e214a00d \u2014 the reference test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules",
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
          "name": "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 which conversations the origin reports live test_UAT_AC2094_origin_reports_live_only_while_a_turn_is_open_never_when_settled_or_empty",
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
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_builder_changed_site_refuses_409_and_is_byte_identical_force_lands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_a_fresh_slug_and_an_import_only_slug_both_land",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2227 \u2014 the import guard test_UAT_AC2227_1c_push_omits_force_unless_asked_and_force_sends_true",
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
          "name": "AC-1813 \u2014 every listed row carries what its bytes are test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 one host, and only for a caller it admitted test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a deployment with only the schema serves test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the two unserveable deployments are reported distinguishably test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 the deployed runtime answers the one route table test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2467: model requests carry the backend document\u2019s model and max_tokens (deployed host) test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens",
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