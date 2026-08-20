---
uid: report-8328fbf7
id: REPORT-2434
type: report
title: 'Scoped quality: fail (190 tests, 7 failed, 7 orphan AC(s))'
created_by: xgd
created_at: '2026-08-20T12:30:20.853773+00:00'
updated_at: '2026-08-20T12:30:20.853773+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: reconcile-BUNDLE-19
  commit: 1c564f984c96ce09288d0860bb294e11b7227435
---

{
  "timestamp": "2026-08-20T12:24:27.196138Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013741711154580116,
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
      "duration_seconds": 69.44509645784274,
      "passed": 183,
      "failed": 7,
      "skipped": 0,
      "errors": 0,
      "total": 190,
      "deselected": 1628,
      "test_filter": [
        "test_UAT_AC1000",
        "test_UAT_AC1001",
        "test_UAT_AC1002",
        "test_UAT_AC1003",
        "test_UAT_AC1004",
        "test_UAT_AC1005",
        "test_UAT_AC1006",
        "test_UAT_AC1024",
        "test_UAT_AC1025",
        "test_UAT_AC1026",
        "test_UAT_AC1027",
        "test_UAT_AC1028",
        "test_UAT_AC1037",
        "test_UAT_AC1038",
        "test_UAT_AC1039",
        "test_UAT_AC1040",
        "test_UAT_AC1041",
        "test_UAT_AC1042",
        "test_UAT_AC1043",
        "test_UAT_AC1044",
        "test_UAT_AC1045",
        "test_UAT_AC1046",
        "test_UAT_AC1047",
        "test_UAT_AC1048",
        "test_UAT_AC1049",
        "test_UAT_AC1050",
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
        "test_UAT_AC1111",
        "test_UAT_AC1112",
        "test_UAT_AC1113",
        "test_UAT_AC1114",
        "test_UAT_AC1115",
        "test_UAT_AC1116",
        "test_UAT_AC1117",
        "test_UAT_AC1118",
        "test_UAT_AC1119",
        "test_UAT_AC1120",
        "test_UAT_AC1121",
        "test_UAT_AC1122",
        "test_UAT_AC1123",
        "test_UAT_AC1129",
        "test_UAT_AC1130",
        "test_UAT_AC1131",
        "test_UAT_AC1132",
        "test_UAT_AC1138",
        "test_UAT_AC1139",
        "test_UAT_AC1140",
        "test_UAT_AC1143",
        "test_UAT_AC1229",
        "test_UAT_AC1230",
        "test_UAT_AC1231",
        "test_UAT_AC1232",
        "test_UAT_AC1233",
        "test_UAT_AC1234",
        "test_UAT_AC1235",
        "test_UAT_AC1236",
        "test_UAT_AC1237",
        "test_UAT_AC1238",
        "test_UAT_AC1239",
        "test_UAT_AC1241",
        "test_UAT_AC1242",
        "test_UAT_AC1243",
        "test_UAT_AC1244",
        "test_UAT_AC1245",
        "test_UAT_AC1246",
        "test_UAT_AC1247",
        "test_UAT_AC1248",
        "test_UAT_AC1249",
        "test_UAT_AC1250",
        "test_UAT_AC1251",
        "test_UAT_AC1252",
        "test_UAT_AC1253",
        "test_UAT_AC1254",
        "test_UAT_AC1255",
        "test_UAT_AC1256",
        "test_UAT_AC1257",
        "test_UAT_AC1258",
        "test_UAT_AC1259",
        "test_UAT_AC1260",
        "test_UAT_AC1261",
        "test_UAT_AC1262",
        "test_UAT_AC1263",
        "test_UAT_AC1264",
        "test_UAT_AC1265",
        "test_UAT_AC1266",
        "test_UAT_AC1267",
        "test_UAT_AC1268",
        "test_UAT_AC1269",
        "test_UAT_AC1270",
        "test_UAT_AC1271",
        "test_UAT_AC1272",
        "test_UAT_AC1273",
        "test_UAT_AC1274",
        "test_UAT_AC1275",
        "test_UAT_AC1276",
        "test_UAT_AC1277",
        "test_UAT_AC1278",
        "test_UAT_AC1279",
        "test_UAT_AC1280",
        "test_UAT_AC1281",
        "test_UAT_AC1282",
        "test_UAT_AC1283",
        "test_UAT_AC1284",
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
        "test_UAT_AC1321",
        "test_UAT_AC1322",
        "test_UAT_AC1323",
        "test_UAT_AC1324",
        "test_UAT_AC1325",
        "test_UAT_AC1326",
        "test_UAT_AC1327",
        "test_UAT_AC1328",
        "test_UAT_AC1329",
        "test_UAT_AC1330",
        "test_UAT_AC1331",
        "test_UAT_AC1332",
        "test_UAT_AC1333",
        "test_UAT_AC1334",
        "test_UAT_AC1335",
        "test_UAT_AC1336",
        "test_UAT_AC1337",
        "test_UAT_AC1338",
        "test_UAT_AC1339",
        "test_UAT_AC1340",
        "test_UAT_AC1341",
        "test_UAT_AC1342",
        "test_UAT_AC980",
        "test_UAT_AC981",
        "test_UAT_AC982",
        "test_UAT_AC983",
        "test_UAT_AC984",
        "test_UAT_AC985",
        "test_UAT_AC986",
        "test_UAT_AC987",
        "test_UAT_AC988",
        "test_UAT_AC989",
        "test_UAT_AC990",
        "test_UAT_AC991",
        "test_UAT_AC992",
        "test_UAT_AC993",
        "test_UAT_AC994",
        "test_UAT_AC995",
        "test_UAT_AC996",
        "test_UAT_AC997",
        "test_UAT_AC998",
        "test_UAT_AC999"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ullName\":\"REQ-142 \u2014 the SiteStore port over the 'memory' store UAT_FC_REQ-142 a preview asset comes back as bytes\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-142 a preview asset comes back as bytes\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-142 \u2014 the SiteStore port\"],\"fullName\":\"REQ-142 \u2014 the SiteStore port UAT_FC_REQ-142 a palette rename crosses the port as a single write\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-142 a palette rename crosses the port as a single write\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-142 \u2014 the SiteStore port\"],\"fullName\":\"REQ-142 \u2014 the SiteStore port UAT_FC_REQ-142 removing a page rewrites the nav in the same write\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-142 removing a page rewrites the nav in the same write\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-142 \u2014 the SiteStore port\"],\"fullName\":\"REQ-142 \u2014 the SiteStore port UAT_FC_REQ-142 a page write touches only the page it changed\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-142 a page write touches only the page it changed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-142 \u2014 the SiteStore port\"],\"fullName\":\"REQ-142 \u2014 the SiteStore port UAT_FC_REQ-142 both adapters answer identically for the same seed\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-142 both adapters answer identically for the same seed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-142 \u2014 the SiteStore port\"],\"fullName\":\"REQ-142 \u2014 the SiteStore port UAT_FC_REQ-142 the memory fixture holds no filesystem handle at all\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-142 the memory fixture holds no filesystem handle at all\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1787228669410,\"endTime\":1787228669410,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-19/tests/test_UAT_FC_REQ-142_site_store_port.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_inheritance_guard_catches_the_config_that_shipped\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_inheritance_guard_catches_the_config_that_shipped\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_control_app_production_carries_the_builder_origin\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_control_app_production_carries_the_builder_origin\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_build_deploy_and_smoke_are_executable_and_self_describing\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_build_deploy_and_smoke_are_executable_and_self_describing\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_a_failing_hook_aborts_the_deploy_before_upload\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_a_failing_hook_aborts_the_deploy_before_upload\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_hook_directories_ignore_non_executable_files\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_hook_directories_ignore_non_executable_files\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_no_secret_value_is_committed_or_echoed\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_no_secret_value_is_committed_or_echoed\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_content_types_agree_with_the_worker\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_content_types_agree_with_the_worker\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_asset_discovery_follows_document_relative_references\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_asset_discovery_follows_document_relative_references\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_passes_against_a_correct_origin\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_passes_against_a_correct_origin\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a referenced asset that 404s'\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a referenced asset that 404s'\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a font served as the wrong type'\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a font served as the wrong type'\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a preview that lost its noindex'\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a preview that lost its noindex'\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a lost trailing-slash redirect'\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a lost trailing-slash redirect'\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a 404 that reveals the site exists'\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'a 404 that reveals the site exists'\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'an apex that stopped resolving'\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion \u2014 'an apex that stopped resolving'\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_smoke_reports_untested_checks_as_skipped\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_smoke_reports_untested_checks_as_skipped\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-144 \u2014 build, deploy and smoke scripts\"],\"fullName\":\"REQ-144 \u2014 build, deploy and smoke scripts test_UAT_FC_REQ-144_preflight_refuses_a_missing_shared_component\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-144_preflight_refuses_a_missing_shared_component\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1787228669410,\"endTime\":1787228669410,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-19/tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-3f4a5f2b \u2014 the Workers runtime, with real bindings\"],\"fullName\":\"story-3f4a5f2b \u2014 the Workers runtime, with real bindings test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings\",\"status\":\"passed\",\"title\":\"test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1787228708044,\"endTime\":1787228708061,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-19/tests/reconciliation-site-storage-port.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-141 workers-runtime project\"],\"fullName\":\"REQ-141 workers-runtime project runs inside workerd, not node\",\"status\":\"skipped\",\"title\":\"runs inside workerd, not node\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-141 workers-runtime project\"],\"fullName\":\"REQ-141 workers-runtime project reaches a real D1 binding through cloudflare:test and applies a schema\",\"status\":\"skipped\",\"title\":\"reaches a real D1 binding through cloudflare:test and applies a schema\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-141 workers-runtime project\"],\"fullName\":\"REQ-141 workers-runtime project writes and reads back a real R2 binding\",\"status\":\"skipped\",\"title\":\"writes and reads back a real R2 binding\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1787228669410,\"endTime\":1787228669410,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-19/tests/test_UAT_FC_REQ-141_workers_runtime.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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
          "status": "failed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1053_naming_a_site_or_omitting_a_value_is_refused_as_malformed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a turn is addressed to a conversation, never to a site test_UAT_AC1055_an_identifier_the_origin_never_issued_is_refused_before_anything_is_streamed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "two sites are two conversations test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns",
          "file": "",
          "status": "failed"
        },
        {
          "name": "the conversation is stored with the workspace test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart",
          "file": "",
          "status": "failed"
        },
        {
          "name": "what the assistant is offered test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation",
          "file": "",
          "status": "failed"
        },
        {
          "name": "a failure is reported honestly test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a painted panel\u2019s background image, through the same write path test_UAT_AC1045_a_painted_panel_exposes_one_closed_picker_for_the_background_it_carries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a painted panel\u2019s background image, through the same write path test_UAT_AC1049_a_painted_panel_with_no_background_offers_no_picker",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a painted panel\u2019s background image, through the same write path test_UAT_AC1047_a_panels_current_background_handle_is_always_among_its_own_options",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a painted panel\u2019s background image, through the same write path test_UAT_AC1046_choosing_a_background_repaints_the_panel_and_disturbs_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a painted panel\u2019s background image, through the same write path test_UAT_AC1048_a_background_handle_the_site_never_offered_is_refused_at_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1269_a_run_exposes_its_colour_and_writes_only_a_palette_reference",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1270_every_painted_panel_exposes_its_fill_and_a_region_that_paints_nothing_does_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1278_a_run_also_answers_with_the_nearest_painted_panel_behind_it_and_its_fill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1274_a_gradient_painted_run_offers_its_colour_unavailable_while_its_neighbour_is_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1273_a_field_is_marked_unavailable_if_and_only_if_it_carries_a_reason_across_the_whole_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1275_a_sibling_parameter_is_not_occlusion_so_both_controls_stay_live",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1276_a_change_to_an_unavailable_colour_is_refused_while_reposting_it_saves_the_rest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1277_the_command_lines_field_listing_marks_an_unavailable_field_with_its_reason",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1271_a_colour_outside_the_sites_palette_or_malformed_is_refused_at_the_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 a region\u2019s colour, and the controls it cannot honour test_UAT_AC1272_an_unchanged_colour_is_not_a_change_is_not_converted_and_a_reference_is_stored_canonically",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 a region exposes its colour, and the panel behind it test_UAT_AC1279_a_colour_row_opens_the_palette_and_saves_in_the_same_change_as_the_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 a region exposes its colour, and the panel behind it test_UAT_AC1280_the_run_shows_the_panel_behind_it_read_only_and_saves_before_it_navigates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 a region exposes its colour, and the panel behind it test_UAT_AC1281_an_empty_palette_still_offers_the_row_and_opens_its_add_the_first_one_state",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 unavailable controls, and the ordinary ones beside them test_UAT_AC1282_a_locked_control_is_drawn_unavailable_and_its_reason_is_body_text_under_the_row",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 unavailable controls, and the ordinary ones beside them test_UAT_AC1283_an_unlocked_control_carries_no_explanation_and_is_not_marked_unavailable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 declaring what a closed list of images holds test_UAT_AC1111_an_image_fields_options_are_declared_as_images_without_narrowing_them",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1037_the_form_opens_inside_the_themed_root_and_follows_its_palette",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1038_one_application_typeface_set_through_the_shell_token_and_served_by_the_origin",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1039_the_fields_form_drops_heading_and_labels_while_dead_ends_keep_theirs",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1040_the_box_mirrors_the_pages_typography_and_the_paint_actually_under_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1041_only_the_sites_font_faces_cross_into_the_workspace_and_are_replaced_each_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1042_the_previewed_size_is_clamped_while_every_other_axis_is_exact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1043_the_form_is_sized_for_copy_and_save_stays_reachable_at_every_window_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 how the edit form presents itself test_UAT_AC1044_a_lone_field_opens_in_its_control_and_two_fields_open_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the form the gesture opens test_UAT_AC994_clicking_a_copy_region_opens_one_form_over_that_regions_fields",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the form the gesture opens test_UAT_AC1001_a_region_with_nothing_editable_says_so_and_names_its_kind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the form the gesture opens test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the form the gesture opens test_UAT_AC1000_closing_a_form_in_which_nothing_changed_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the form the gesture opens test_UAT_AC1003_a_rendering_without_the_page_coordinate_is_refused_before_anything_is_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the form the gesture opens test_UAT_AC1050_a_painted_panel_opens_its_background_picker_over_the_same_transport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC993_hovering_marks_only_the_hovered_region_and_never_moves_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC995_a_click_resolves_to_the_innermost_region_containing_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC996_a_click_inside_a_module_seam_names_that_instance_and_seam",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC998_after_a_save_the_page_shows_the_new_words_and_is_still_editable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC997_one_confirmed_form_is_one_change_however_many_fields_it_held",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC999_a_refused_edit_shows_its_own_reason_and_leaves_page_and_draft_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC1004_copy_longer_than_its_box_still_reads_back_in_full",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC1005_a_page_being_viewed_is_not_marked_intercepted_or_editable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the edit gesture test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1143 \u2014 the glyphs' own paint test_UAT_AC1143_a_runs_own_background_previews_as_glyph_paint_drawn_on_the_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a picture is seen, through the same write path test_UAT_AC1132_a_picture_declaring_no_framing_answers_with_what_a_browser_paints",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a picture is seen, through the same write path test_UAT_AC1131_the_shape_list_carries_the_shape_the_picture_already_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a picture is seen, through the same write path test_UAT_AC1130_colour_is_adjusted_in_percentages_over_the_fractions_the_definition_holds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a picture is seen, through the same write path test_UAT_AC1129_panning_writes_a_typed_percentage_pair_and_centre_removes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a picture is seen, through the same write path test_UAT_AC1121_a_pictures_bounds_bind_a_change_and_never_the_status_quo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a picture is seen, through the same write path test_UAT_AC1122_a_framing_edit_writes_among_the_parameters_the_picture_already_carries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1112_the_closed_list_is_a_grid_of_thumbnails_and_the_dropdown_is_gone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1113_a_tile_is_labelled_with_the_file_name_and_commits_the_full_handle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1114_a_tile_shows_the_bytes_the_origin_serves_over_the_pages_own_channel",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1115_a_handle_the_origin_cannot_serve_keeps_a_named_selectable_tile",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1116_the_grid_is_one_keyboard_reachable_single_selection_group",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1043_the_thumbnail_grid_is_bounded_and_scrolls_within_its_own_bounds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1028_the_handle_the_region_holds_is_the_tile_already_selected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC997_a_picked_image_and_new_alt_text_travel_in_one_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 choosing an image by looking at it test_UAT_AC1000_a_dialog_closed_with_neither_control_touched_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1024_an_image_region_exposes_a_closed_list_of_the_sites_images_and_its_alt_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1025_a_regions_current_image_is_always_among_the_choices_it_offers",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1026_choosing_an_image_updates_the_draft_and_the_rerendered_page_shows_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC988_an_unknown_field_a_non_text_value_or_a_choice_never_offered_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 image selection through the copy-edit write path test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the box follows the sheet test_UAT_AC1138_size_weight_and_italic_restyle_the_words_as_confirmed_and_write_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the box follows the sheet test_UAT_AC1139_a_changed_size_previews_at_the_scale_the_box_opened_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the box follows the sheet test_UAT_AC1140_only_a_parameter_the_operator_changed_overrides_the_box",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3bf94bd4 the words in a box, the parameters under it test_UAT_AC1123_words_open_in_the_box_and_parameters_in_a_bounded_sheet_staging_into_one_save",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-3bf94bd4 the editing box mirrors the page down to the glyphs test_UAT_AC1284_a_tracked_run_previews_its_tracking_on_the_words_and_the_sheet_stays_chrome",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC980_the_words_come_first_now_that_a_run_also_reports_how_it_is_set",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC1117_a_copy_region_reports_how_the_run_is_set_beside_its_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC1119_the_weights_offered_are_the_declared_faces_for_the_first_family_plus_the_runs_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC1120_italic_is_read_only_only_on_positive_evidence_of_absence",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC1118_resizing_a_run_scales_every_keyframe_of_its_responsive_rule",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC1121_the_size_bound_binds_a_change_and_never_the_status_quo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC1122_a_typography_edit_writes_into_the_runs_parameters_and_a_no_op_produces_no_diff",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC988_a_value_of_the_wrong_shape_for_its_own_field_or_one_for_a_read_only_field_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 how a run of copy is set, through the same write path test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC982_saving_new_words_updates_the_draft_and_re_renders_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC983_a_change_map_is_applied_whole_or_not_at_all",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC985_a_refusal_carries_a_code_a_path_and_a_hint_with_a_failing_exit_status",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC987_a_malformed_address_is_refused_outright_and_never_coerced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC988_an_unknown_field_or_a_non_text_value_is_refused_not_ignored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC989_copy_in_a_module_slot_reads_and_writes_through_the_same_operation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC990_copy_longer_than_its_box_reads_back_in_full",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path test_UAT_AC991_markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-37a3921b \u2014 the copy-edit write path over the builder origin test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the count is the whole mechanism test_UAT_AC1253_accepted_write_raises_the_count_and_a_refusal_advances_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the count is the whole mechanism test_UAT_AC1254_a_write_that_changes_nothing_returns_the_current_count_and_records_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the count is the whole mechanism test_UAT_AC1255_every_write_shape_hands_its_count_back_including_the_ones_answering_with_an_asset",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the count is the whole mechanism test_UAT_AC1258_a_caller_advancing_its_baseline_never_sees_its_own_edits",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 a record says what happened, in words that outlive the address test_UAT_AC1257_a_record_names_the_count_time_actor_operation_page_label_and_both_texts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 a record says what happened, in words that outlive the address test_UAT_AC1260_a_record_stays_readable_after_a_structural_change_invalidates_its_address",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 a record says what happened, in words that outlive the address test_UAT_AC1261_the_text_a_record_carries_is_bounded_and_visibly_cut",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 a record says what happened, in words that outlive the address test_UAT_AC1256_asking_since_the_current_count_is_the_cheap_nothing_happened_answer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 a record says what happened, in words that outlive the address test_UAT_AC1259_a_baseline_older_than_the_window_is_answered_truncated_with_what_remains",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the journal degrades, and is never a revision test_UAT_AC1262_a_missing_or_unreadable_history_reads_as_nothing_and_never_fails_an_edit",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the journal degrades, and is never a revision test_UAT_AC1263_the_journal_is_not_a_revision_is_never_published_and_does_not_perturb_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the change-reading operation is declared, granted and marked test_UAT_AC1264_the_operation_is_in_the_manual_of_a_session_granted_the_reading_group",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 the change-reading operation is declared, granted and marked test_UAT_AC1265_the_change_log_comes_back_marked_untrusted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 a session is TOLD when the site moved under it test_UAT_AC1266_the_reminder_carries_the_change_signal_only_when_somebody_else_moved_the_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 one implementation, two callers test_UAT_AC1267_the_operator_gets_a_readable_listing_from_the_command_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6cd17452 \u2014 one implementation, two callers test_UAT_AC1268_the_same_command_in_machine_readable_form_returns_the_whole_slice",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1229_read_answers_every_entry_with_its_count_across_the_definition_and_every_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1230_changing_an_entry_repaints_every_use_at_every_position_touching_no_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1231_adding_an_entry_makes_it_usable_and_refuses_a_duplicate_bad_name_or_transparency",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1232_removing_an_unreferenced_entry_succeeds_and_leaves_every_other_entry_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1234_rename_moves_the_key_in_place_and_rewrites_every_reference_in_one_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1236_the_count_read_before_a_rename_is_the_count_it_reports_and_the_references_rewritten",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management through the builder origin test_UAT_AC1233_removing_a_referenced_entry_is_refused_naming_the_count_and_cannot_be_overridden",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management through the builder origin test_UAT_AC1235_rename_onto_an_existing_or_malformed_name_is_refused_leaving_the_draft_byte_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management through the builder origin test_UAT_AC1237_the_origin_answers_alike_under_a_closed_vocabulary_and_returns_the_retaken_census",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management through the builder origin test_UAT_AC1238_a_write_needs_no_rebuild_because_both_draft_side_channels_render_on_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ee073693 palette management test_UAT_AC1239_the_assistant_is_offered_the_read_and_the_four_writes_in_one_grantable_group",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1242_every_entry_is_a_swatch_with_its_name_its_colour_and_its_usage_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1243_a_site_with_no_colours_opens_on_an_invitation_to_add_the_first_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1244_selecting_an_entry_reveals_a_continuous_position_control_previewing_what_the_page_paints",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1245_moving_the_position_control_while_managing_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1246_confirming_a_pick_resolves_to_a_palette_reference_with_a_position_only_when_it_is_not_the_colour_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1247_closing_without_confirming_answers_the_opener_with_nothing_exactly_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1248_opened_over_a_held_reference_the_surface_starts_on_that_entry_at_that_position",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1249_a_colour_is_typed_here_and_applying_repaints_the_displayed_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1250_after_every_accepted_edit_the_surface_redraws_from_the_returned_census",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1251_a_refused_edit_leaves_the_surface_open_and_shows_the_stores_own_message_and_hint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1252_the_surface_states_the_cost_of_removal_and_rename_from_the_counts_it_shows",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4300366a the palette popup test_UAT_AC1241_the_toolbars_colour_control_opens_the_surface_for_the_displayed_site_in_both_channels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the environment preflight test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the build discovers every Worker and bundles it for production test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a rehearsal is the same path as a real deploy test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 hooks are discovered by executability and run before the upload test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a hook that fails stops the code that assumes it ran test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 deploy targets come from what is discovered test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the smoke check against an origin that serves correctly test_UAT_AC1336_all_nine_checks_pass_with_nothing_skipped_and_the_command_exits_zero",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 each way a deploy is silently broken fails the smoke check test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 a check with nothing to test against is skipped test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 every same-origin asset a preview references resolves test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 an unpublished site is indistinguishable from an unknown one test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 every named environment repeats every var and binding test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 no secret value is committed, and the push is piped test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the SiteStore port test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly",
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
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1300_a_build_with_nothing_opted_in_is_refused_and_reaches_no_model",
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
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-118 \u2014 image selection test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-118 image selection over the builder origin test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-3f4a5f2b \u2014 the Workers runtime, with real bindings test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "naming a site opens that site\u2019s conversation test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a turn is addressed to a conversation, never to a site test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "two sites are two conversations test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "the conversation is stored with the workspace test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a failure is reported honestly test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "a failure is reported honestly test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-3bf94bd4 the words in a box, the parameters under it test_UAT_AC1123_words_open_in_the_box_and_parameters_in_a_bounded_sheet_staging_into_one_save",
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
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 168,
      "failed": 7,
      "total": 175,
      "failures": [
        {
          "test_name": "AC-1123 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1123 'A run's words open in the dressed box and its colour and typography in a sheet beneath it, split by the control a field declares, staging into one save' (uid=acceptance_criterion-35907074) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1123.",
          "ac_uid": "acceptance_criterion-35907074",
          "ac_id": "AC-1123",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1060 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1060 'An assistant that cannot run is explained without losing the operator's conversation' (uid=acceptance_criterion-99c540d7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1060.",
          "ac_uid": "acceptance_criterion-99c540d7",
          "ac_id": "AC-1060",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1059 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1059 'A refused operation comes back to the assistant within the same turn as a named refusal it can correct, with the site untouched' (uid=acceptance_criterion-b982a7e0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1059.",
          "ac_uid": "acceptance_criterion-b982a7e0",
          "ac_id": "AC-1059",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1057 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1057 'The conversation is stored with the workspace the site belongs to and replayed after the origin restarts' (uid=acceptance_criterion-aecd6a53) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1057.",
          "ac_uid": "acceptance_criterion-aecd6a53",
          "ac_id": "AC-1057",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1056 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1056 'Two sites are two conversations: a turn changes only its own site, and each transcript holds only its own turns' (uid=acceptance_criterion-f06d0451) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1056.",
          "ac_uid": "acceptance_criterion-f06d0451",
          "ac_id": "AC-1056",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1054 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1054 'A turn that changes the site streams what the assistant did and said, ends in exactly one completion, and the change is in the draft' (uid=acceptance_criterion-5df35b3c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1054.",
          "ac_uid": "acceptance_criterion-5df35b3c",
          "ac_id": "AC-1054",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1052 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1052 'Opening a conversation for a named site answers with its identifier, the turns already spoken, and whether a turn can be run' (uid=acceptance_criterion-15d1c12f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1052.",
          "ac_uid": "acceptance_criterion-15d1c12f",
          "ac_id": "AC-1052",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
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
        "message": "7 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 7
        }
      }
    ]
  }
}