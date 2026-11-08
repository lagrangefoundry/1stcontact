---
uid: report-340cd2c5
id: REPORT-11328
type: report
title: 'Report: batch_quality_check for story-39c992d3'
created_by: xgd
created_at: '2026-11-08T07:04:02.605635+00:00'
updated_at: '2026-11-08T07:04:02.605635+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: story-39c992d3
  parent_report_uid: report-a313553e
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "suites": {
    "Override conformance": {
      "suite_name": "Override conformance",
      "status": "failure",
      "passed": 26,
      "failed": 1,
      "total": 27,
      "failures": [
        {
          "test_name": "override_conformance::item_5",
          "error_type": "override_conformance",
          "k_eligible": false,
          "file_path": "apps/control-app/src/imagegen.ts",
          "message": "Override conformance, checklist item 5: planner misjudged trust boundary: the override was granted with planner_trust_boundary false, but the production diff matches the trust-boundary patterns (trust_boundary_mismatch is true).\nAdded by this batch:\n  +   const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|')\n  +   const backendPhrase = new RegExp(`Backend\\\\s+\"(?:${escaped})\"`, 'gi')\n  +   const bare = new RegExp(escaped, 'gi')\nNot in the tip:\n  - \"planner_trust_boundary\": false\n  - \"trust_boundary_mismatch\": true\nRemove or align the change so the diff does only what the named files and tip evidence allow (OVERRIDE-AUDIT.md)."
        }
      ]
    }
  },
  "overall": {
    "status": "failure"
  }
}