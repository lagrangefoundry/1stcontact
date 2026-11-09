---
uid: report-f6e98fbb
id: REPORT-11997
type: report
title: 'Report: batch_quality_check for story-1500b111'
created_by: xgd
created_at: '2026-11-09T19:21:17.412165+00:00'
updated_at: '2026-11-09T19:21:17.412165+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: story-1500b111
  parent_report_uid: report-d1a7a69b
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "suites": {
    "Override conformance": {
      "suite_name": "Override conformance",
      "status": "failure",
      "passed": 110,
      "failed": 1,
      "total": 111,
      "failures": [
        {
          "test_name": "override_conformance::item_5",
          "error_type": "override_conformance",
          "k_eligible": false,
          "file_path": "apps/control-app/src/builder/app.js",
          "message": "Override conformance, checklist item 5: planner misjudged trust boundary: trust_boundary_mismatch is true (planner declared trust_boundary false while the production diff matches the trust-boundary patterns), and no test in the batch asserts that the escaping/marking of untrusted content on the affected paths is preserved.\nAdded by this batch:\n  +       // EVERY EXIT \u2014 Close, Escape, the backdrop \u2014 reports here through the shell's\n  +     // EVERY ROUTE OUT IS REPORTED \u2014 the Close button, Escape and the backdrop all\n  +         // exit \u2014 the Close button, Escape, the backdrop \u2014 through one `close`\n  +       if (shownImg) shownImg.alt = next || row.filename || ''\nNot in the tip:\n  - \"planner_trust_boundary\": false\n  - \"trust_boundary_mismatch\": true\nRemove or align the change so the diff does only what the named files and tip evidence allow (OVERRIDE-AUDIT.md)."
        }
      ]
    }
  },
  "overall": {
    "status": "failure"
  }
}