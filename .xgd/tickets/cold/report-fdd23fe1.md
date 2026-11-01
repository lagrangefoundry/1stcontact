---
uid: report-fdd23fe1
id: REPORT-867
type: report
title: 'Report: structural_health for report-b1a287b0'
created_by: xgd
created_at: '2026-07-24T06:00:55.798086+00:00'
updated_at: '2026-07-24T06:00:55.798086+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: structural_health
  subject_uid: report-b1a287b0
---

{
  "status": "fail",
  "issues": [
    {
      "type": "under_min",
      "capability_uid": "capability-aa030c83",
      "capability_name": "values_diff_fidelity",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-36dd68c5",
      "capability_name": "gradient_fidelity",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-18a822ac",
      "capability_name": "size_aware_diffing",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-ac7ca849",
      "capability_name": "1c CLI Argument Parsing & Output Hygiene",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-6e088083",
      "capability_name": "framework_value_system",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-bd0b722e",
      "capability_name": "framework_responsive_dials",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-938f26ec",
      "capability_name": "reproduction-module-treatments",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-ae9d65d6",
      "capability_name": "l1-layout-substrate",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-2049c9ec",
      "capability_name": "capture-to-l1-fold",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-ce902be4",
      "capability_name": "capability-modules",
      "actual_count": 0,
      "threshold": 20
    },
    {
      "type": "under_min",
      "capability_uid": "capability-8108afab",
      "capability_name": "reproduction-gate-3probe",
      "actual_count": 0,
      "threshold": 20
    }
  ]
}