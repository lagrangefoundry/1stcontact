---
uid: report-03f568d6
id: REPORT-4475
type: report
title: 'Regression success: 1 caught (reconciliation)'
created_by: xgd
created_at: '2026-09-19T15:16:21.660034+00:00'
updated_at: '2026-09-19T15:18:28.476568+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-8e1807f6
  cycle: reconciliation
  intent_uid: bundle-8e1807f6
  regression_count: 1
---

The reconciliation cycle for bundle-8e1807f6 caught 1 regression: AC-720's end-to-end sandbox crop-pair UAT failed, and the entry below now carries a plain statement of what a user would have seen broken plus a severity. Severity is judged on blast radius and whether the failure is silent — this one breaks a developer-facing `1c` fidelity verb rather than any client-visible surface, and it is already marked resolved.

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
      "story-e15a19ef — aligned-crops --sandbox emits crop pairs from the sandbox build (real Chromium) test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs"
    ],
    "fix_plan_summary": "",
    "resolved": true,
    "description": "Running `1c aligned-crops <slug> --sandbox` against a rendered sandbox reproduction silently emitted no drift-aligned ref/ours crop pairs, because the `--sandbox` selection was not forwarded to the render and serve steps and the comparison was taken against the `sites/` tree instead, leaving the operator's perceptual-judge loop with nothing to compare.",
    "severity": "medium"
  }
]
