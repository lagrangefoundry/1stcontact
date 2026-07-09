---
uid: report-b35cfcb8
id: REPORT-394
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-07-09T23:50:26.870411+00:00'
updated_at: '2026-07-09T23:50:26.870411+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-07-09T23:49:55.256133Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00010620802640914917,
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
      "duration_seconds": 10.6045274999924,
      "passed": 4,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 4,
      "deselected": 378,
      "test_filter": [
        "test_UAT_AC458",
        "test_UAT_AC448",
        "test_UAT_AC433",
        "test_UAT_AC434"
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