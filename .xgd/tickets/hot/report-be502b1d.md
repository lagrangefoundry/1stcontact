---
uid: report-be502b1d
id: REPORT-11305
type: report
title: 'Report: batch_quality_check for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T06:11:24.039034+00:00'
updated_at: '2026-11-08T06:11:24.039034+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: batch_quality_check
  subject_uid: story-4cabde9a
  parent_report_uid: report-fe34a964
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "suites": {
    "Override conformance": {
      "suite_name": "Override conformance",
      "status": "failure",
      "passed": 105,
      "failed": 2,
      "total": 107,
      "failures": [
        {
          "test_name": "override_conformance::item_4",
          "error_type": "override_conformance",
          "k_eligible": false,
          "file_path": "tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts",
          "message": "Override conformance, checklist item 4: The planner's stated scope was a single production change in ai.ts with no test changes, but the diff also edits a REQ-146 UAT and a test support helper.\nAdded by this batch:\n  + const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])\n  + const raw = [...router.matchAll(/error:\\s*([A-Za-z_.$][\\w.$]*)/g)]\n  +   .map((m) => m[1])\n  +   .filter((name) => !typeKeywords.has(name))\n  + expect(raw.length, 'the router builds at least one scrubbed error value').toBeGreaterThan(0)\n  + export function systemText(req: ModelRequest): string {\n  +   return textOf(req.system)\n  + }\nNot in the tip:\n  - No test or AC changes.\n  - Keep those edits and do not touch the tests again.\nRemove or align the change so the diff does only what the named files and tip evidence allow (OVERRIDE-AUDIT.md)."
        },
        {
          "test_name": "override_conformance::item_6",
          "error_type": "override_conformance",
          "k_eligible": false,
          "file_path": "tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts",
          "message": "Override conformance, checklist item 6: The code_frozen override names only apps/control-app/src/ai.ts, yet the diff edits two files it does not name, and the REQ-146 router error-scrub change is behaviour no AC or intent in scope (AC2097, AC2378, FC_REQ-207, FC_REQ-173) demands.\nAdded by this batch:\n  + const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])\n  +   .filter((name) => !typeKeywords.has(name))\n  + expect(raw.length, 'the router builds at least one scrubbed error value').toBeGreaterThan(0)\n  + export function systemText(req: ModelRequest): string {\nNot in the tip:\n  - \"files\": [\"apps/control-app/src/ai.ts\"]\n  - <nothing>\nRemove or align the change so the diff does only what the named files and tip evidence allow (OVERRIDE-AUDIT.md)."
        }
      ]
    }
  },
  "overall": {
    "status": "failure"
  }
}