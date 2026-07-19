---
uid: report-db35464c
id: REPORT-666
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-19T03:54:10.283614+00:00'
updated_at: '2026-07-19T03:54:10.283614+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-19T03:53:02.204228Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001016249880194664,
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
      "duration_seconds": 16.864014042075723,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 733,
      "test_filter": [
        "test_UAT_AC631"
      ],
      "coverage": 96.67,
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