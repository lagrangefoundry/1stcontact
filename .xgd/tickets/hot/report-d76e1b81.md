---
uid: report-d76e1b81
id: REPORT-535
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-13T21:45:43.669366+00:00'
updated_at: '2026-07-13T21:45:43.669366+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-13T21:44:50.932247Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.300000965595245e-05,
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
      "duration_seconds": 12.215924208983779,
      "passed": 54,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 54,
      "deselected": 591,
      "test_filter": [
        "test_UAT_AC575",
        "test_UAT_AC576",
        "test_UAT_AC577",
        "test_UAT_AC578",
        "test_UAT_AC579",
        "test_UAT_AC580",
        "test_UAT_AC581",
        "test_UAT_AC582",
        "test_UAT_AC583",
        "test_UAT_AC584",
        "test_UAT_AC585",
        "test_UAT_AC586",
        "test_UAT_AC587",
        "test_UAT_AC588",
        "test_UAT_AC589",
        "test_UAT_AC590",
        "test_UAT_AC591",
        "test_UAT_AC592",
        "test_UAT_AC593",
        "test_UAT_AC594",
        "test_UAT_AC595",
        "test_UAT_AC596",
        "test_UAT_AC597",
        "test_UAT_AC598",
        "test_UAT_AC599",
        "test_UAT_AC600",
        "test_UAT_AC601",
        "test_UAT_AC602",
        "test_UAT_AC603",
        "test_UAT_AC604",
        "test_UAT_AC605",
        "test_UAT_AC606",
        "test_UAT_AC607",
        "test_UAT_AC608",
        "test_UAT_AC609",
        "test_UAT_AC610",
        "test_UAT_AC611",
        "test_UAT_AC612",
        "test_UAT_AC613",
        "test_UAT_AC614",
        "test_UAT_AC615",
        "test_UAT_AC616",
        "test_UAT_AC617",
        "test_UAT_AC618",
        "test_UAT_AC619",
        "test_UAT_AC620",
        "test_UAT_AC621",
        "test_UAT_AC622",
        "test_UAT_AC623",
        "test_UAT_AC624",
        "test_UAT_AC625",
        "test_UAT_AC626",
        "test_UAT_AC627",
        "test_UAT_AC628"
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