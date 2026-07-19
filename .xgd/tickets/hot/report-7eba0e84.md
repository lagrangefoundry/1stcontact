---
uid: report-7eba0e84
id: REPORT-678
type: report
title: 'Regression success: 1 caught (reconciliation)'
created_by: xgd
created_at: '2026-07-19T04:40:52.123925+00:00'
updated_at: '2026-07-19T04:40:52.123925+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: regression_success
  subject_uid: bundle-ab9e0cb6
  cycle: reconciliation
  intent_uid: bundle-ab9e0cb6
  regression_count: 1
---

[
  {
    "id": "reg-001",
    "capability_uid": "capability-aa030c83",
    "capability_name": "1c Values-Diff Fidelity",
    "story_uid": "story-d5de22a5",
    "ac_uid": "acceptance_criterion-65b5ddd3",
    "ac_human_id": "AC-631",
    "ac_summary": "Surface fill is compared as the effective alpha-composited colour",
    "failing_uats": [
      "story-d5de22a5 \u2014 values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-631 (orphaned acceptance criterion)\",\n        \"story-d5de22a5 \\u2014 values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour\"\n      ],\n      \"dependency_tests\": [],\n      \"instructions\": \"\",\n      \"test_scope\": \"AC-631 (orphaned acceptance criterion) or test_UAT_AC631\"\n    }\n  ]\n}",
    "resolved": true,
    "description": null,
    "severity": null
  }
]