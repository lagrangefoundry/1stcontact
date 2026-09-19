---
uid: report-c9e14fd3
id: REPORT-4471
type: report
title: 'Scoped quality: fail (183 tests, 1 failed)'
created_by: xgd
created_at: '2026-09-19T15:10:49.959811+00:00'
updated_at: '2026-09-19T15:10:49.959811+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: reconcile-BUNDLE-27
  commit: dfa6250ed4aa5c9bd94b5cd53ffabe3a29de84e2
---

{
  "timestamp": "2026-09-19T15:06:30.634224Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 8.837506175041199e-05,
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
      "duration_seconds": 60.76084058289416,
      "passed": 182,
      "failed": 1,
      "skipped": 0,
      "errors": 0,
      "total": 183,
      "deselected": 2395,
      "test_filter": [
        "test_UAT_AC1013",
        "test_UAT_AC1014",
        "test_UAT_AC1015",
        "test_UAT_AC1016",
        "test_UAT_AC1017",
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
        "test_UAT_AC1062",
        "test_UAT_AC1063",
        "test_UAT_AC1064",
        "test_UAT_AC1065",
        "test_UAT_AC1066",
        "test_UAT_AC1067",
        "test_UAT_AC1068",
        "test_UAT_AC1069",
        "test_UAT_AC1070",
        "test_UAT_AC1317",
        "test_UAT_AC1318",
        "test_UAT_AC1319",
        "test_UAT_AC1320",
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
        "test_UAT_AC1425",
        "test_UAT_AC1426",
        "test_UAT_AC1427",
        "test_UAT_AC1454",
        "test_UAT_AC1455",
        "test_UAT_AC1456",
        "test_UAT_AC1651",
        "test_UAT_AC1652",
        "test_UAT_AC1653",
        "test_UAT_AC1678",
        "test_UAT_AC1679",
        "test_UAT_AC1680",
        "test_UAT_AC1681",
        "test_UAT_AC1682",
        "test_UAT_AC1683",
        "test_UAT_AC1684",
        "test_UAT_AC1685",
        "test_UAT_AC1686",
        "test_UAT_AC1687",
        "test_UAT_AC1688",
        "test_UAT_AC1689",
        "test_UAT_AC1690",
        "test_UAT_AC1691",
        "test_UAT_AC1692",
        "test_UAT_AC1693",
        "test_UAT_AC1694",
        "test_UAT_AC1695",
        "test_UAT_AC1696",
        "test_UAT_AC1697",
        "test_UAT_AC1698",
        "test_UAT_AC1699",
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
        "test_UAT_AC1762",
        "test_UAT_AC1763",
        "test_UAT_AC1764",
        "test_UAT_AC1765",
        "test_UAT_AC1766",
        "test_UAT_AC1767",
        "test_UAT_AC1768",
        "test_UAT_AC1769",
        "test_UAT_AC1770",
        "test_UAT_AC1771",
        "test_UAT_AC1772",
        "test_UAT_AC1773",
        "test_UAT_AC1774",
        "test_UAT_AC1775",
        "test_UAT_AC1776",
        "test_UAT_AC1777",
        "test_UAT_AC1778",
        "test_UAT_AC1779",
        "test_UAT_AC1780",
        "test_UAT_AC1781",
        "test_UAT_AC1782",
        "test_UAT_AC1783",
        "test_UAT_AC1784",
        "test_UAT_AC1785",
        "test_UAT_AC1786",
        "test_UAT_AC1787",
        "test_UAT_AC1788",
        "test_UAT_AC1789",
        "test_UAT_AC1790",
        "test_UAT_AC1791",
        "test_UAT_AC1792",
        "test_UAT_AC1793",
        "test_UAT_AC1794",
        "test_UAT_AC1795",
        "test_UAT_AC1796",
        "test_UAT_AC1797",
        "test_UAT_AC1798",
        "test_UAT_AC1799",
        "test_UAT_AC1800",
        "test_UAT_AC1801",
        "test_UAT_AC1802",
        "test_UAT_AC1803",
        "test_UAT_AC1804",
        "test_UAT_AC1805",
        "test_UAT_AC1806",
        "test_UAT_AC1807",
        "test_UAT_AC1808",
        "test_UAT_AC1809",
        "test_UAT_AC1810",
        "test_UAT_AC1811",
        "test_UAT_AC1812",
        "test_UAT_AC1813",
        "test_UAT_AC1814",
        "test_UAT_AC1815",
        "test_UAT_AC1816",
        "test_UAT_AC1817",
        "test_UAT_AC1818",
        "test_UAT_AC1819",
        "test_UAT_AC1820",
        "test_UAT_AC1821",
        "test_UAT_AC1822",
        "test_UAT_AC1823",
        "test_UAT_AC1824",
        "test_UAT_AC1825",
        "test_UAT_AC1826",
        "test_UAT_AC1827",
        "test_UAT_AC1828",
        "test_UAT_AC1829",
        "test_UAT_AC1830",
        "test_UAT_AC1831",
        "test_UAT_AC1832",
        "test_UAT_AC1833",
        "test_UAT_AC656",
        "test_UAT_AC657",
        "test_UAT_AC658",
        "test_UAT_AC659",
        "test_UAT_AC720",
        "test_UAT_AC738",
        "test_UAT_AC739"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel\"],\"fullName\":\"REQ-160 \u2014 two-KB priming, the change cursor, and the delta channel test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"status\":\"skipped\",\"title\":\"test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1789830392221,\"endTime\":1789830392221,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-27/tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1789830392221,\"endTime\":1789830392221,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-27/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 material written before the field resolves its type from its own name\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot\"],\"fullName\":\"REQ-172 \u2014 the list carries what the bytes are, because `kind` cannot UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1789830392221,\"endTime\":1789830392221,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-27/tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts\"}]}",
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
          "status": "failed"
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
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses",
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
          "name": "AC-1776 \u2014 decoded pixels are byte-identical to the recorded witness test_UAT_AC1776_corpus_decodes_to_the_recorded_witness_in_both_runtimes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1777 \u2014 greyscale and indexed arrive expanded to sRGB test_UAT_AC1777_greyscale_and_indexed_expand_exactly_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1778 \u2014 the corpus exercises every decode path that could differ test_UAT_AC1778_corpus_covers_each_decode_path_and_decodes_to_its_pixels",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1779 \u2014 an unreadable image is refused by name, in three distinct classes test_UAT_AC1779_unsupported_malformed_and_not_an_image_stay_distinct",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1780 \u2014 a re-encoded raster decodes back to identical pixels test_UAT_AC1780_round_trip_is_lossless_at_every_channel_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1781 \u2014 a single-channel heatmap is stored as a true greyscale image test_UAT_AC1781_one_channel_rasters_are_written_greyscale_and_smaller",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1782 \u2014 the pixel verbs keep their verdicts, regions and band statistics test_UAT_AC1782_diff_and_aligned_crops_report_what_they_reported_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1783 \u2014 1c crop accepts PNG only, naming the format it was handed test_UAT_AC1783_crop_refuses_a_non_png_by_the_name_its_bytes_give",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1784 \u2014 1c crop clamps an over-reaching box and writes that window test_UAT_AC1784_an_over_reaching_box_is_clamped_not_failed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1785 \u2014 dimensions are readable from the opening bytes alone test_UAT_AC1785_dimensions_come_from_the_header_without_decoding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1788 \u2014 decode cost is measured, reported and held under a ceiling test_UAT_AC1788_full_page_decode_cost_is_reported_and_under_the_ceiling",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1789 \u2014 the toolchain declares and loads no native imaging module test_UAT_AC1789_no_native_imaging_module_is_declared_imported_or_needed",
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
          "name": "story-d5167ced \u2014 the generated asset tree is replaced whole, never refilled in place test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one",
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
          "name": "story-d5167ced \u2014 the smoke check against an origin that serves correctly test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_rather_than_forbidden",
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
          "name": "story-d5167ced \u2014 the smoke check asserts the operator surface is private test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the build refuses a Worker type program that reaches the filesystem test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the derived artifacts are generated before the typecheck test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the operator surface retains every invocation log test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-d5167ced \u2014 the retention declaration joins no binding set test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the filesystem backing test_UAT_AC1768_absent_members_are_answers_except_the_capture_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the filesystem backing test_UAT_AC1769_a_rewritten_member_replaces_rather_than_accumulating",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the filesystem backing test_UAT_AC1770_the_store_lists_only_the_bundles_that_hold_something",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the filesystem backing test_UAT_AC1771_members_enumerate_sorted_and_forward_slashed_and_narrow_by_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the filesystem backing test_UAT_AC1774_a_ladder_screenshot_is_retrievable_by_width_and_an_unshot_width_is_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the memory backing test_UAT_AC1768_absent_members_are_answers_except_the_capture_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the memory backing test_UAT_AC1769_a_rewritten_member_replaces_rather_than_accumulating",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the memory backing test_UAT_AC1770_the_store_lists_only_the_bundles_that_hold_something",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the memory backing test_UAT_AC1771_members_enumerate_sorted_and_forward_slashed_and_narrow_by_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the memory backing test_UAT_AC1774_a_ladder_screenshot_is_retrievable_by_width_and_an_unshot_width_is_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1763 a capture lands the whole bundle test_UAT_AC1763_capture_lands_every_member_each_readable_as_its_artifact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1764 a bundle is named from the captured URL test_UAT_AC1764_the_url_names_the_bundle_and_recapturing_replaces_it_in_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1766 `1c refold --ref` re-derives from the stored bundle test_UAT_AC1766_refold_rewrites_the_derived_members_on_either_backing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1767 the operator on-disk layout is unchanged test_UAT_AC1767_ref_dir_addresses_exactly_the_tree_it_always_did",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1775 offline re-extraction is fed by the bundle, and stays local test_UAT_AC1775_reextraction_reads_the_stored_bundle_and_still_really_navigates",
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
          "name": "AC-1776 \u2014 the recorded witness holds in the deployed runtime too test_UAT_AC1776_corpus_decodes_to_the_recorded_witness_in_the_deployed_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1786 \u2014 a perceptual diff runs end to end in the deployed runtime test_UAT_AC1786_diff_from_images_in_the_object_store_reproduces_the_cli_verdicts",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1787 \u2014 the remaining fidelity comparisons run in the deployed runtime test_UAT_AC1787_value_responsive_and_l1_probe_comparisons_all_produce_reports",
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
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1688_a_document_that_carries_text_yields_its_own_words_and_its_own_declared_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1689_a_text_shaped_file_becomes_material_whose_body_is_its_decoded_contents",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1699_a_description_body_is_bounded_and_says_so_and_a_title_is_one_collapsed_line",
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
          "name": "story-0cb7f25b \u2014 bundle storage contract on the cloud (R2) backing test_UAT_AC1768_absent_members_are_answers_except_the_capture_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the cloud (R2) backing test_UAT_AC1769_a_rewritten_member_replaces_rather_than_accumulating",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the cloud (R2) backing test_UAT_AC1770_the_store_lists_only_the_bundles_that_hold_something",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the cloud (R2) backing test_UAT_AC1771_members_enumerate_sorted_and_forward_slashed_and_narrow_by_prefix",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 bundle storage contract on the cloud (R2) backing test_UAT_AC1774_a_ladder_screenshot_is_retrievable_by_width_and_an_unshot_width_is_absent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1762 capture runs to completion in the serverless runtime test_UAT_AC1762_capture_page_completes_inside_workerd_and_names_its_bundle",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1765 a cloud bundle equals a locally written one test_UAT_AC1765_the_same_capture_yields_equivalent_bundles_on_either_backing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1772 binding the cloud store checks the tenant test_UAT_AC1772_an_unknown_or_inactive_tenant_is_refused_at_binding_time",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-0cb7f25b \u2014 AC-1773 captured material is private to the account test_UAT_AC1773_one_tenants_capture_is_unaddressable_from_another_tenants_store",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs",
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
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}