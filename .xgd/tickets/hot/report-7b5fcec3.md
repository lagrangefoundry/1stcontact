---
uid: report-7b5fcec3
id: REPORT-1144
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-08-03T04:15:52.366549+00:00'
updated_at: '2026-08-03T04:15:52.366549+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-08-03T04:13:13.982106Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 9.929202497005463e-05,
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
      "duration_seconds": 17.113378916867077,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 0,
      "deselected": 868,
      "test_filter": [
        "AC-742 (orphaned acceptance criterion)",
        "AC-748 (orphaned acceptance criterion)"
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
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "info",
        "category": "scope_empty",
        "field": "suite: javascript-vitest",
        "message": "Suite 'javascript-vitest' ran with an empty scope: 868 tests were collected and all were deselected by the -k filter. No tests to execute.",
        "suggestion": "This is a legitimate skip \u2014 the scope resolves to ACs whose tests don't exist yet (e.g. a refactor running before feature/upgrade work has produced UATs). The workflow should route past quality_check via @skipped.",
        "context": {
          "actual": 0,
          "deselected": 868,
          "test_filter_expression": null
        }
      }
    ]
  }
}