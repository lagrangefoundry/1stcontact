---
uid: report-0e2e0f11
id: REPORT-434
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-10T02:22:04.642304+00:00'
updated_at: '2026-07-10T02:22:04.642304+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-10T02:21:23.066267Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.012501686811447e-05,
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
      "duration_seconds": 11.256302499910817,
      "passed": 6,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 6,
      "deselected": 547,
      "test_filter": [
        "test_UAT_AC568",
        "test_UAT_AC458",
        "test_UAT_AC433",
        "test_UAT_AC434",
        "test_UAT_AC525",
        "test_UAT_AC535"
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