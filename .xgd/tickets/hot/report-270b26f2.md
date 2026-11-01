---
uid: report-270b26f2
id: REPORT-7870
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-11-01T22:56:27.017003+00:00'
updated_at: '2026-11-01T22:56:27.017003+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-11-01T22:55:45.671666Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014287489466369152,
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
      "status": "error",
      "exit_code": -1,
      "duration_seconds": 40.791626930236816,
      "error": "Failed to run suite: 'TestResult' object has no attribute 'collection_errors'",
      "failures": [
        {
          "test_name": "javascript-vitest: suite_error",
          "error_type": "suite_error",
          "message": "Failed to run suite: 'TestResult' object has no attribute 'collection_errors'",
          "suggested_fix": "Suite raised an unhandled exception. Run the suite command directly to inspect the underlying failure.",
          "suite": "javascript-vitest",
          "kind": "suite_error"
        }
      ],
      "failed": 1,
      "total": 1
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 1,
      "total": 1,
      "failures": [
        {
          "test_name": "suite: javascript-vitest",
          "k_eligible": false,
          "error_type": "infrastructure_bug",
          "message": "INFRASTRUCTURE BUG: Suite 'javascript-vitest' executed 0 tests. Test suite failed to run.",
          "suggested_fix": "Test suite did not execute. Check: (1) Test command in quality.yaml, (2) Build errors, (3) Test target configuration, (4) For Swift: xcodebuild output. Claude cannot fix infrastructure bugs.",
          "field": "suite: javascript-vitest",
          "kind": "quality_config_violation"
        }
      ],
      "synthetic": true
    }
  },
  "overall": {
    "status": "error",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "infrastructure_bug",
        "field": "suite: javascript-vitest",
        "message": "INFRASTRUCTURE BUG: Suite 'javascript-vitest' executed 0 tests. Test suite failed to run.",
        "suggestion": "Test suite did not execute. Check: (1) Test command in quality.yaml, (2) Build errors, (3) Test target configuration, (4) For Swift: xcodebuild output. Claude cannot fix infrastructure bugs.",
        "context": {
          "actual": 0
        }
      }
    ]
  }
}