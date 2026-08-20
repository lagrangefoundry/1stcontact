---
uid: report-0898a9a0
id: REPORT-2274
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-08-20T00:32:52.146633+00:00'
updated_at: '2026-08-20T00:32:52.146633+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-08-20T00:24:26.000323Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013562524691224098,
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
      "duration_seconds": 205.59694899991155,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 1,
      "deselected": 1635,
      "test_filter": [
        "test_UAT_FC_REQ-135_a_type_edit_disturbs_no_other_axis_and_a_no_op_writes_nothing"
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