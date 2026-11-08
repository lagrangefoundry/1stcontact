---
uid: report-238f729d
id: REPORT-11344
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-11-08T07:44:21.193255+00:00'
updated_at: '2026-11-08T07:44:21.193255+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-11-08T07:40:53.823660Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012237485498189926,
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
      "duration_seconds": 6.418309374712408,
      "passed": 57,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 57,
      "deselected": 0,
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
        "test_UAT_AC1456_",
        "test_UAT_AC1651_",
        "test_UAT_AC1652_",
        "test_UAT_AC1653_",
        "test_UAT_AC1792_",
        "test_UAT_AC1793_",
        "test_UAT_AC1794_",
        "test_UAT_AC1817_",
        "test_UAT_AC1818_",
        "test_UAT_AC2054_",
        "test_UAT_AC2055_",
        "test_UAT_AC2056_",
        "test_UAT_AC2057_",
        "test_UAT_AC2066_",
        "test_UAT_AC2088_",
        "test_UAT_AC2089_",
        "test_UAT_AC2090_",
        "test_UAT_AC2091_",
        "test_UAT_AC2107_",
        "test_UAT_AC2108_",
        "test_UAT_AC2109_",
        "test_UAT_AC2110_",
        "test_UAT_AC2111_",
        "test_UAT_AC2374_",
        "test_UAT_AC2375_"
      ],
      "scope_ac_backed": true,
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