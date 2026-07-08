---
uid: report-7c9b7727
id: REPORT-303
type: report
title: 'Report: batch_quality_check for report-2ed897ed'
created_by: xgd
created_at: '2026-07-08T19:54:31.177442+00:00'
updated_at: '2026-07-08T19:54:31.177442+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: report-2ed897ed
  parent_report_uid: report-509d5b1b
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-07-08T19:54:20.944839Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "error",
      "exit_code": -1,
      "duration_seconds": 7.988515138626099,
      "error": "Failed to run suite: '<' not supported between instances of 'NoneType' and 'float'",
      "failures": [
        {
          "test_name": "javascript-vitest: suite_error",
          "error_type": "suite_error",
          "message": "Failed to run suite: '<' not supported between instances of 'NoneType' and 'float'",
          "suggested_fix": "Suite raised an unhandled exception. Run the suite command directly to inspect the underlying failure.",
          "suite": "javascript-vitest",
          "kind": "suite_error"
        }
      ],
      "failed": 1,
      "total": 1
    }
  },
  "overall": {
    "status": "error",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}