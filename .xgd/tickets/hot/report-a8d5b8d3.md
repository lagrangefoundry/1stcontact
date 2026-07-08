---
uid: report-a8d5b8d3
id: REPORT-304
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-08T19:58:05.355748+00:00'
updated_at: '2026-07-08T19:58:05.355748+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-08T19:57:54.277602Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010066601680591702,
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
      "duration_seconds": 8.808407582982909,
      "passed": 91,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 91,
      "deselected": 0,
      "test_filter": null,
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