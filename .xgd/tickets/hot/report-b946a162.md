---
uid: report-b946a162
id: REPORT-7623
type: report
title: 'Scoped quality: pass (283 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T14:04:04.270492+00:00'
updated_at: '2026-11-01T14:04:04.270492+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: report-71b1019e
  commit: f362f12b54185b6945a0e949dd7920997ba1f642
---

{
  "timestamp": "2026-11-01T14:00:38.433629Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.287521243095398e-05,
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
      "duration_seconds": 36.1574362909887,
      "passed": 283,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 283,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1013",
        "test_UAT_AC1014",
        "test_UAT_AC1015",
        "test_UAT_AC1016",
        "test_UAT_AC1017",
        "test_UAT_AC1029",
        "test_UAT_AC1030",
        "test_UAT_AC1031",
        "test_UAT_AC1032",
        "test_UAT_AC1033",
        "test_UAT_AC1034",
        "test_UAT_AC1035",
        "test_UAT_AC1036",
        "test_UAT_AC1051",
        "test_UAT_AC1052",
        "test_UAT_AC1053",
        "test_UAT_AC1054",
        "test_UAT_AC1055",
        "test_UAT_AC1056",
        "test_UAT_AC1057",
        "test_UAT_AC1058",
        "test_UAT_AC1059",
        "test_UAT_AC1060",
        "test_UAT_AC1061",
        "test_UAT_AC1110",
        "test_UAT_AC1291",
        "test_UAT_AC1292",
        "test_UAT_AC1293",
        "test_UAT_AC1294",
        "test_UAT_AC1295",
        "test_UAT_AC1296",
        "test_UAT_AC1297",
        "test_UAT_AC1298",
        "test_UAT_AC1299",
        "test_UAT_AC1300",
        "test_UAT_AC1301",
        "test_UAT_AC1302",
        "test_UAT_AC1303",
        "test_UAT_AC1304",
        "test_UAT_AC1305",
        "test_UAT_AC1306",
        "test_UAT_AC1317",
        "test_UAT_AC1318",
        "test_UAT_AC1319",
        "test_UAT_AC1320",
        "test_UAT_AC1399",
        "test_UAT_AC1400",
        "test_UAT_AC1401",
        "test_UAT_AC1402",
        "test_UAT_AC1403",
        "test_UAT_AC1404",
        "test_UAT_AC1405",
        "test_UAT_AC1406",
        "test_UAT_AC1407",
        "test_UAT_AC1408",
        "test_UAT_AC1409",
        "test_UAT_AC1410",
        "test_UAT_AC1415",
        "test_UAT_AC1416",
        "test_UAT_AC1417",
        "test_UAT_AC1449",
        "test_UAT_AC1456",
        "test_UAT_AC1632",
        "test_UAT_AC1633",
        "test_UAT_AC1634",
        "test_UAT_AC1635",
        "test_UAT_AC1636",
        "test_UAT_AC1637",
        "test_UAT_AC1638",
        "test_UAT_AC1639",
        "test_UAT_AC1640",
        "test_UAT_AC1641",
        "test_UAT_AC1642",
        "test_UAT_AC1643",
        "test_UAT_AC1644",
        "test_UAT_AC1645",
        "test_UAT_AC1646",
        "test_UAT_AC1647",
        "test_UAT_AC1648",
        "test_UAT_AC1649",
        "test_UAT_AC1651",
        "test_UAT_AC1652",
        "test_UAT_AC1653",
        "test_UAT_AC1714",
        "test_UAT_AC1715",
        "test_UAT_AC1716",
        "test_UAT_AC1717",
        "test_UAT_AC1718",
        "test_UAT_AC1719",
        "test_UAT_AC1720",
        "test_UAT_AC1721",
        "test_UAT_AC1722",
        "test_UAT_AC1723",
        "test_UAT_AC1724",
        "test_UAT_AC1740",
        "test_UAT_AC1741",
        "test_UAT_AC1742",
        "test_UAT_AC1743",
        "test_UAT_AC1744",
        "test_UAT_AC1745",
        "test_UAT_AC1746",
        "test_UAT_AC1747",
        "test_UAT_AC1748",
        "test_UAT_AC1749",
        "test_UAT_AC1750",
        "test_UAT_AC1751",
        "test_UAT_AC1752",
        "test_UAT_AC1753",
        "test_UAT_AC1754",
        "test_UAT_AC1755",
        "test_UAT_AC1756",
        "test_UAT_AC1757",
        "test_UAT_AC1758",
        "test_UAT_AC1759",
        "test_UAT_AC1760",
        "test_UAT_AC1790",
        "test_UAT_AC1792",
        "test_UAT_AC1793",
        "test_UAT_AC1794",
        "test_UAT_AC1811",
        "test_UAT_AC1812",
        "test_UAT_AC1813",
        "test_UAT_AC1814",
        "test_UAT_AC1815",
        "test_UAT_AC1817",
        "test_UAT_AC1818",
        "test_UAT_AC2018",
        "test_UAT_AC2019",
        "test_UAT_AC2020",
        "test_UAT_AC2054",
        "test_UAT_AC2055",
        "test_UAT_AC2056",
        "test_UAT_AC2057",
        "test_UAT_AC2058",
        "test_UAT_AC2059",
        "test_UAT_AC2064",
        "test_UAT_AC2065",
        "test_UAT_AC2066",
        "test_UAT_AC2075",
        "test_UAT_AC2076",
        "test_UAT_AC2077",
        "test_UAT_AC2078",
        "test_UAT_AC2079",
        "test_UAT_AC2085",
        "test_UAT_AC2086",
        "test_UAT_AC2087",
        "test_UAT_AC2088",
        "test_UAT_AC2089",
        "test_UAT_AC2090",
        "test_UAT_AC2091",
        "test_UAT_AC2099",
        "test_UAT_AC2100",
        "test_UAT_AC2101",
        "test_UAT_AC2102",
        "test_UAT_AC2103",
        "test_UAT_AC2104",
        "test_UAT_AC2105",
        "test_UAT_AC2106",
        "test_UAT_AC2107",
        "test_UAT_AC2108",
        "test_UAT_AC2109",
        "test_UAT_AC2110",
        "test_UAT_AC2111",
        "test_UAT_AC2112",
        "test_UAT_AC2113",
        "test_UAT_AC2114",
        "test_UAT_AC2115",
        "test_UAT_AC2116",
        "test_UAT_AC2117",
        "test_UAT_AC2118",
        "test_UAT_AC2119",
        "test_UAT_AC2120",
        "test_UAT_AC2121",
        "test_UAT_AC2122",
        "test_UAT_AC2123",
        "test_UAT_AC2124",
        "test_UAT_AC2125",
        "test_UAT_AC2126",
        "test_UAT_AC2127",
        "test_UAT_AC2128",
        "test_UAT_AC2129",
        "test_UAT_AC2130",
        "test_UAT_AC2131",
        "test_UAT_AC2132",
        "test_UAT_AC2133",
        "test_UAT_AC2134",
        "test_UAT_AC2135",
        "test_UAT_AC2136",
        "test_UAT_AC2137",
        "test_UAT_AC2138",
        "test_UAT_AC2139",
        "test_UAT_AC2140",
        "test_UAT_AC2141",
        "test_UAT_AC2142",
        "test_UAT_AC2143",
        "test_UAT_AC2144",
        "test_UAT_AC2145",
        "test_UAT_AC2146",
        "test_UAT_AC2147",
        "test_UAT_AC2148",
        "test_UAT_AC2149",
        "test_UAT_AC2150",
        "test_UAT_AC2151",
        "test_UAT_AC2152",
        "test_UAT_AC2153",
        "test_UAT_AC2154",
        "test_UAT_AC2155",
        "test_UAT_AC2156",
        "test_UAT_AC2157",
        "test_UAT_AC2158",
        "test_UAT_AC2159",
        "test_UAT_AC2160",
        "test_UAT_AC2161",
        "test_UAT_AC2162",
        "test_UAT_AC2163",
        "test_UAT_AC2164",
        "test_UAT_AC656",
        "test_UAT_AC657",
        "test_UAT_AC658",
        "test_UAT_AC659",
        "test_UAT_AC720",
        "test_UAT_AC738",
        "test_UAT_AC739",
        "test_UAT_AC959",
        "test_UAT_AC960",
        "test_UAT_AC961",
        "test_UAT_AC962",
        "test_UAT_AC963",
        "test_UAT_AC964",
        "test_UAT_AC965",
        "test_UAT_AC966",
        "test_UAT_AC967",
        "test_UAT_AC968",
        "test_UAT_AC969",
        "test_UAT_AC970",
        "test_UAT_AC971",
        "test_UAT_AC972",
        "test_UAT_AC973",
        "test_UAT_AC974",
        "test_UAT_AC975",
        "test_UAT_AC976",
        "test_UAT_AC977",
        "test_UAT_AC978",
        "test_UAT_AC979"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded\",\"status\":\"passed\",\"title\":\"test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded\",\"duration\":1079.9570829999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model\",\"duration\":267.76595799999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name\",\"duration\":261.27608300000065,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none\",\"duration\":602.8856670000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the command answers before it acts\"],\"fullName\":\"story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact\",\"status\":\"passed\",\"title\":\"test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact\",\"duration\":2781.1648750000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the command answers before it acts\"],\"fullName\":\"story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing\",\"duration\":0.6237079999991693,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read\"],\"fullName\":\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in\",\"status\":\"passed\",\"title\":\"test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in\",\"duration\":11693.286792,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read\"],\"fullName\":\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves\",\"duration\":2.4664580000026035,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read\"],\"fullName\":\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused\",\"duration\":1807.3142090000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the real document store, exported and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document\",\"duration\":725.5667500000054,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541646835,\"endTime\":1793541675066.5667,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-system-knowledge-base.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 a workspace that cannot start\"],\"fullName\":\"story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"status\":\"passed\",\"title\":\"test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page\",\"duration\":88.15975000000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541656418,\"endTime\":1793541656506.1597,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-workspace-boot-guard.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the workspace serves what the build wrote\"],\"fullName\":\"story-e674c60a \u2014 the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate\",\"duration\":576.8658749999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541653920,\"endTime\":1793541654496.866,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-workspace-build-artifacts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-e674c60a \u2014 the builder command is a transport over the one route table\"],\"fullName\":\"story-e674c60a \u2014 the builder command is a transport over the one route table test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"status\":\"passed\",\"title\":\"test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store\",\"duration\":356.06375,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541654948,\"endTime\":1793541655304.0637,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/reconciliation-workspace-transport.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-177 \u2014 1c serve is discontinued\"],\"fullName\":\"REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_serve_is_refused_as_an_unknown_command\",\"status\":\"passed\",\"title\":\"test_UAT_AC2064_serve_is_refused_as_an_unknown_command\",\"duration\":8.31408300000021,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-177 \u2014 1c serve is discontinued\"],\"fullName\":\"REQ-177 \u2014 1c serve is discontinued test_UAT_AC2064_help_offers_only_the_worker_based_builder\",\"status\":\"passed\",\"title\":\"test_UAT_AC2064_help_offers_only_the_worker_based_builder\",\"duration\":0.684208000000126,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-177 \u2014 1c serve is discontinued\"],\"fullName\":\"REQ-177 \u2014 1c serve is discontinued test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin\",\"status\":\"passed\",\"title\":\"test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin\",\"duration\":24.585665999999947,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541658912,\"endTime\":1793541658945.5857,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/req177-discontinue-raw-server.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate\",\"status\":\"passed\",\"title\":\"test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate\",\"duration\":6.553083000000015,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2159_no_generic_administrator_predicate_exists\",\"status\":\"passed\",\"title\":\"test_UAT_AC2159_no_generic_administrator_predicate_exists\",\"duration\":4.255208000000039,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"Business Fulfilment \u2014 the gate is not a generic admin surface\"],\"fullName\":\"Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant\",\"status\":\"passed\",\"title\":\"test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant\",\"duration\":18.851333000000068,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541657774,\"endTime\":1793541657803.8513,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_reconciliation_business_fulfilment_guards.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"the platform-tenant setting is consulted only by scope resolution and identity\"],\"fullName\":\"the platform-tenant setting is consulted only by scope resolution and identity test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity\",\"status\":\"passed\",\"title\":\"test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity\",\"duration\":37.60149999999976,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793541658450,\"endTime\":1793541658487.6016,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-35/tests/test_reconciliation_business_scope_single_reader.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "name": "membership admits; entitlement does not test_UAT_AC2112_every_business_lapsed_is_admitted_with_none_selectable_and_expiry_evaluated_both_sides",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership admits; entitlement does not test_UAT_AC2076_lapsed_not_started_or_revoked_business_stays_listed_with_its_lapse_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2113_each_unselectable_business_says_why_and_a_selectable_one_says_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a lapse explains itself test_UAT_AC2114_a_lapse_reason_is_reported_only_for_a_business_the_person_holds_a_live_membership_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an entitlement has a subject and an object test_UAT_AC2115_grant_names_its_business_as_object_and_optionally_an_account_as_subject",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an entitlement has a subject and an object test_UAT_AC2116_only_capacity_grants_decide_selectability_and_an_account_grant_reads_never_granted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1760_an_invited_entitled_person_who_accepted_the_current_terms_reaches_the_builder",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1740_an_invite_creates_person_account_membership_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1741_the_account_identifier_is_opaque_and_the_label_is_separate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1742_a_new_account_owns_one_starter_site_that_cannot_collide",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1743_re_inviting_a_known_address_reports_rather_than_duplicates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1744_case_and_padding_do_not_make_a_second_person",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1745_an_unconfigured_platform_tenant_refuses_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1746_the_grant_model_admits_several_grants_and_unknown_values",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1749_first_arrival_never_moves_latest_always_does_refusals_included",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1751_a_grant_whose_start_is_in_the_future_does_not_admit_its_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1752_a_revoked_grant_makes_its_business_unselectable_whatever_its_dates_say",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1753_an_inactive_membership_refuses_and_leaves_the_grant_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1755_an_identity_carrying_no_address_is_refused_not_failed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "login binds, and provisions nothing test_UAT_AC1756_an_inactive_person_is_refused_without_disturbing_their_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1757_admission_is_decided_before_any_route_is_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1758_every_refusal_is_byte_identical_forbidden_and_uncacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the request path test_UAT_AC1759_the_failed_check_is_recorded_for_the_operator_per_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC1740_invite_creates_person_then_owner_membership_and_grant_readable_back",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC2078_invite_and_additional_business_share_one_provisioning_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the invite provisions test_UAT_AC2079_person_with_no_business_is_refused_and_reinvite_provisions_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC1748_invited_person_is_admitted_with_a_deterministic_set_and_no_top_level_account",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2075_several_businesses_each_carry_their_own_name_and_grant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2076_unentitled_business_stays_listed_unselectable_while_person_is_admitted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "admission returns the set of businesses test_UAT_AC2077_withdrawn_or_expired_membership_is_absent_from_the_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1751_future_start_makes_business_unselectable_not_the_person_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "grant state is evaluated per business test_UAT_AC1752_revoked_grant_makes_business_unselectable_whatever_its_dates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "membership state excludes, grants untouched test_UAT_AC1753_inactive_membership_excludes_business_and_refuses_only_when_none_remain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1723 \u2014 a capture\u2019s named member comes back as itself, and naming one is never required of a single file test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name",
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
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 before acceptance test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 acceptance test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 versions and configuration test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Terms of service gate \u2014 versions and configuration test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check",
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
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target",
          "file": "",
          "status": "passed"
        },
        {
          "name": "store openers given an empty scope test_UAT_AC2125_openers_refuse_empty_scope_with_programming_error_not_configuration_error",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host",
          "file": "",
          "status": "passed"
        },
        {
          "name": "an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing",
          "file": "",
          "status": "passed"
        },
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
          "name": "story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2162_builder_and_dev_control_share_one_env_file_layering",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2163_missing_env_files_are_named_with_resolved_path_and_consequence_and_server_still_starts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e15a19ef guarantee 8 \u2014 one environment for the builder dev server test_UAT_AC2164_builder_argv_is_cwd_independent_and_port_remote_keep_meaning",
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
          "name": "the per-turn reminder points to the method and carries only the per-turn signals test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present",
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
          "name": "AC-2104 \u2014 the reference projects the page document test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2105 \u2014 the limits section states the structural rules beside the bounds test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-2106 \u2014 the coverage check holds the projection to its declared source test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none",
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
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the reference reaches the shipped corpus test_UAT_AC1634_a_reference_is_written_for_every_source_on_export_and_on_build",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the reference reaches the shipped corpus test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_documents",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1636_a_reference_asserts_membership_derived_from_the_declaration",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1637_each_producer_removes_only_its_own_stale_output_in_either_order",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a generated document lives in the corpus on its own terms test_UAT_AC1638_an_unchanged_reference_keeps_its_timestamp_and_a_changed_source_advances_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the component reference says what the catalogue says test_UAT_AC1639_every_component_is_described_with_its_settings_values_slots_and_obligations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the component reference says what the catalogue says test_UAT_AC1640_the_component_reference_describes_no_component_the_catalogue_does_not_carry",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the layout reference is read off the schemas test_UAT_AC1641_every_element_kind_its_closed_value_sets_and_the_page_limits_are_named",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the layout reference is read off the schemas test_UAT_AC1642_a_harvested_definition_appears_only_against_the_shape_it_was_written_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the control-surface reference covers the whole declared surface test_UAT_AC1643_every_operation_group_refusal_and_declared_absence_is_named",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a reference stands on its own for the reader it was written for test_UAT_AC1644_no_definition_sends_the_assistant_to_an_internal_ticket",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 a reference stands on its own for the reader it was written for test_UAT_AC1645_a_reference_names_its_source_in_its_body_and_says_it_is_rebuilt",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5836022a \u2014 the reference is reachable through ordinary retrieval test_UAT_AC1646_asking_what_a_component_supports_returns_a_passage_from_the_reference",
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
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 one release command test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 stamp precision test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision",
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
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2159_no_generic_administrator_predicate_exists",
          "file": "",
          "status": "passed"
        },
        {
          "name": "Business Fulfilment \u2014 the gate is not a generic admin surface test_UAT_AC2160_nothing_outside_the_two_identity_readers_asks_for_the_platform_tenant",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the platform-tenant setting is consulted only by scope resolution and identity test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity",
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