---
uid: report-5fe264dc
id: REPORT-11545
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-11-08T18:40:19.391761+00:00'
updated_at: '2026-11-08T18:40:19.391761+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-11-08T18:35:04.151073Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012004096060991287,
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
      "duration_seconds": 14.682425334118307,
      "passed": 42,
      "failed": 0,
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