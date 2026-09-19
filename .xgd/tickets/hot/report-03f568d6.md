---
uid: report-03f568d6
id: REPORT-4475
type: report
title: 'Regression success: 1 caught (reconciliation)'
created_by: xgd
created_at: '2026-09-19T15:16:21.660034+00:00'
updated_at: '2026-09-19T15:16:21.660034+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: regression_success
  subject_uid: bundle-8e1807f6
  cycle: reconciliation
  intent_uid: bundle-8e1807f6
  regression_count: 1
---

[
  {
    "id": "reg-001",
    "capability_uid": "capability-aa030c83",
    "capability_name": "1c Capture & Diff Fidelity",
    "story_uid": "story-e15a19ef",
    "ac_uid": "acceptance_criterion-72db61ca",
    "ac_human_id": "AC-720",
    "ac_summary": "aligned-crops --sandbox renders, serves, and crops the sandbox reproduction, not the sites/ build",
    "failing_uats": [
      "story-e15a19ef \u2014 aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs"
    ],
    "fix_plan_summary": "",
    "resolved": true,
    "description": null,
    "severity": null
  }
]