---
uid: report-34e33a51
id: REPORT-11558
type: report
title: 'Report: quality for standalone'
created_by: xgd
created_at: '2026-11-08T19:59:46.806395+00:00'
updated_at: '2026-11-08T19:59:46.806395+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: standalone
---

{
  "timestamp": "2026-11-08T19:55:35.234202Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00012745801359415054,
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
      "duration_seconds": 26.20664270920679,
      "passed": 33,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 33,
      "deselected": 17,
      "test_filter": [
        "test_UAT_AC2228_a_port_that_is_not_a_positive_number_is_a_usage_error",
        "test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it",
        "test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence",
        "test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow",
        "test_UAT_AC2228_",
        "test_UAT_AC2449_",
        "test_UAT_FC_REQ_211_",
        "test_UAT_AC2464_",
        "test_UAT_AC1400_",
        "test_UAT_FC_BUG-71_"
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