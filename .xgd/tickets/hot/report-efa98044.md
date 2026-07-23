---
uid: report-efa98044
id: REPORT-863
type: report
title: 'Regression success: 1 caught (regression)'
created_by: xgd
created_at: '2026-07-23T12:20:58.557379+00:00'
updated_at: '2026-07-23T12:21:38.659481+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: 973fcaec
  cycle: regression
  intent_uid: ''
  regression_count: 1
---

This regression run caught 1 previously-passing acceptance criterion that had regressed, all now resolved by the fix loop. Each entry below is annotated with the user-facing behavior that was broken and a severity rating (critical/high/medium/low) reflecting its impact on reproduction fidelity.

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
      "story-d5de22a5 — values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"story-d5de22a5 \\u2014 values-diff fidelity closures test_UAT_AC631_surface_fill_is_composited_alpha_colour\"\n      ],\n      \"dependency_tests\": [],\n      \"instructions\": \"\",\n      \"test_scope\": \"test_UAT_AC631\"\n    }\n  ]\n}",
    "resolved": true,
    "description": "The values-diff fidelity check compared a surface's declared fill against the target using its raw colour instead of the effective alpha-composited colour, so any translucent surface was mis-judged — letting a visibly-wrong reproduction pass or a correct one fail.",
    "severity": "high"
  }
]
