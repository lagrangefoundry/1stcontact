---
uid: report-caa42022
id: REPORT-674
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-19T04:31:43.944229+00:00'
updated_at: '2026-07-19T04:31:43.944229+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-19T04:30:39.437315Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010095792822539806,
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
      "duration_seconds": 16.1684945828747,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 733,
      "test_filter": [
        "AC-631 (orphaned acceptance criterion)",
        "test_UAT_AC631"
      ],
      "coverage": 96.68,
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