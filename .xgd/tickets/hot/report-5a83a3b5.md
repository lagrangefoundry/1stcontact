---
uid: report-5a83a3b5
id: REPORT-440
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-10T18:50:18.243228+00:00'
updated_at: '2026-07-10T18:50:18.243228+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-10T18:49:05.209199Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.533390402793884e-05,
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
      "duration_seconds": 34.6570930830203,
      "passed": 523,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 523,
      "deselected": 0,
      "test_filter": null,
      "coverage": 96.26,
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