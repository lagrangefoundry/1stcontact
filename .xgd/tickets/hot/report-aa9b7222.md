---
uid: report-aa9b7222
id: REPORT-11544
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-11-08T18:34:18.639113+00:00'
updated_at: '2026-11-08T18:34:18.639113+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-11-08T18:29:04.177217Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014412496238946915,
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
      "duration_seconds": 13.813739957753569,
      "passed": 38,
      "failed": 4,
      "skipped": 0,
      "errors": 0,
      "total": 42,
      "deselected": 66,
      "test_filter": [
        "test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate",
        "test_UAT_AC1415_",
        "test_UAT_AC1416_",
        "test_UAT_AC1417_",
        "test_UAT_FC_REQ-145_",
        "test_UAT_AC1791_",
        "test_UAT_AC2421_",
        "test_UAT_FC_REQ-209_",
        "test_UAT_FC_BUG-71_",
        "test_UAT_AC1476_",
        "test_UAT_AC1477_",
        "test_UAT_AC1485_",
        "test_UAT_AC2464_",
        "test_UAT_AC960_",
        "test_UAT_AC961_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e15a19ef \u2014 1c assets bootstraps without loading the CLI barrel test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-e674c60a \u2014 a refused build leaves the served tree exactly as it was test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-ab1ecd62 \u2014 the shared component resolves, is reported, and its absence is named test_UAT_AC1485_the_build_emits_an_absolute_re_export_reports_it_and_names_a_stale_install",
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
        "message": "4 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 4
        }
      }
    ]
  }
}