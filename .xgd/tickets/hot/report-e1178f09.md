---
uid: report-e1178f09
id: REPORT-12005
type: report
title: 'Report: batch_quality_check for story-1500b111'
created_by: xgd
created_at: '2026-11-09T19:37:51.014218+00:00'
updated_at: '2026-11-09T19:37:51.014218+00:00'
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
      "passed": 112,
      "failed": 1,
      "total": 113,
      "failures": [
        {
          "test_name": "override_conformance::item_5",
          "error_type": "override_conformance",
          "k_eligible": false,
          "file_path": "apps/control-app/src/builder/app.js",
          "message": "Override conformance, checklist item 5: planner misjudged trust boundary: trust_boundary_mismatch is true because the planner declared planner_trust_boundary false while the production diff matches the trust-boundary patterns (the removed library.js comment naming the Escape exit); the escaping itself is preserved and tested by test_UAT_AC2556_a_name_carrying_markup_stays_inert_text_through_the_feed_the_modal_and_the_chat_opener, but the checklist fails this item on the mismatch alone, and the planner must declare trust_boundary true for this batch.\nAdded by this batch:\n  +       // EVERY WAY OUT reports here through the shell's one `close`, so the\n  +     // EVERY ROUTE OUT IS REPORTED \u2014 each one ends in the shell's one `close`, so\n  +         // A DIALOG THAT CLOSES ITSELF STILL HAS TO SAY SO. `modal.js` routes every\n  +       adoptSaved({ title: title ?? '', filename: row.filename })\nNot in the tip:\n  - \"planner_trust_boundary\": false\n  - \"trust_boundary_mismatch\": true\n  - apps/control-app/src/builder/library.js: -      // exit \u2014 the button, Escape, the backdrop \u2014 through one `close`, and this\nRemove or align the change so the diff does only what the named files and tip evidence allow (OVERRIDE-AUDIT.md)."
        }
      ]
    }
  },
  "overall": {
    "status": "failure"
  }
}