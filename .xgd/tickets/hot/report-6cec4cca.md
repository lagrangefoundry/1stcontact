---
uid: report-6cec4cca
id: REPORT-1666
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-08-08T00:03:48.589540+00:00'
updated_at: '2026-08-08T00:03:48.589540+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-08-08T00:02:11.592183Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010795891284942627,
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
    "error_list": []
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
      "duration_seconds": 29.521816667169333,
      "passed": 23,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 23,
      "deselected": 1276,
      "test_filter": [
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