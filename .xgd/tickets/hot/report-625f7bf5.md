---
uid: report-625f7bf5
id: REPORT-11308
type: report
title: 'Report: blocked_by_handoff for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T06:16:49.041496+00:00'
updated_at: '2026-11-08T06:29:34.830051+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-4cabde9a
  rule: code_frozen
  evidence: |-
    Batch 0: override_test_contradiction. The override conformance check and the batch tests fail on alternate attempts; each fix undoes the other.
    Conformance findings: [{"test_name": "override_conformance::item_4", "error_type": "override_conformance", "k_eligible": false, "file_path": "tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts", "message": "Override conformance, checklist item 4: The planner's stated scope was a single production change in ai.ts with no test changes, but the diff also edits a REQ-146 UAT and a test support helper.\nAdded by this batch:\n  + const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])\n  + const raw = [...router.matchAll(/error:\\s*([A-Za-z_.$][\\w.$]*)/g)]\n  +   .map((m) => m[1])\n  +   .filter((name) => !typeKeywords.has(name))\n  + expect(raw.length, 'the router builds at least one scrubbed error\u2026"}, {"test_name": "override_conformance::item_6", "error_type": "override_conformance", "k_eligible": false, "file_path": "tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts", "message": "Override conformance, checklist item 6: The code_frozen override names only apps/control-app/src/ai.ts, yet the diff edits two files it does not name, and the REQ-146 router error-scrub change is behaviour no AC or intent in scope (AC2097, AC2378, FC_REQ-207, FC_REQ-173) demands.\nAdded by this batch:\n  + const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])\n  +   .filter((name) => !typeKeywords.has(name))\n  + expect(raw.length, 'the router builds at least one scrubbed error value')\u2026"}]
    Test failures: [{"test_name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed", "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)", "file_path": "", "line_number": null, "error_type": "assertion", "action_required": null, "traceback": null, "synthesised": true}]
  proposed_change: Widen the `code_frozen` grant's `files` (['apps/control-app/src/ai.ts'])
    to also name the test file(s) the failing tests live in, so the batch may edit
    them without failing the conformance check.
  batch_index: 0
  parent_report_uid: report-fe34a964
  anchor_ticket: bundle-c0301347
  ruling: declined
  ruling_reason: 'Rung 1: the only test needing a wider grant (test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed)
    is owned by REQ-146, which is out of scope, and its failure is a pre-existing
    regex false positive already on main, not caused by this story. It is dropped
    from the validation set; code_frozen stands and the batch touches no production
    file, only (if a story test regresses) the story''s own test files.'
---

# Override/test contradiction blocked by `code_frozen`

**Evidence**: Batch 0: override_test_contradiction. The override conformance check and the batch tests fail on alternate attempts; each fix undoes the other.
Conformance findings: [{"test_name": "override_conformance::item_4", "error_type": "override_conformance", "k_eligible": false, "file_path": "tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts", "message": "Override conformance, checklist item 4: The planner's stated scope was a single production change in ai.ts with no test changes, but the diff also edits a REQ-146 UAT and a test support helper.\nAdded by this batch:\n  + const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])\n  + const raw = [...router.matchAll(/error:\\s*([A-Za-z_.$][\\w.$]*)/g)]\n  +   .map((m) => m[1])\n  +   .filter((name) => !typeKeywords.has(name))\n  + expect(raw.length, 'the router builds at least one scrubbed error\u2026"}, {"test_name": "override_conformance::item_6", "error_type": "override_conformance", "k_eligible": false, "file_path": "tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts", "message": "Override conformance, checklist item 6: The code_frozen override names only apps/control-app/src/ai.ts, yet the diff edits two files it does not name, and the REQ-146 router error-scrub change is behaviour no AC or intent in scope (AC2097, AC2378, FC_REQ-207, FC_REQ-173) demands.\nAdded by this batch:\n  + const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])\n  +   .filter((name) => !typeKeywords.has(name))\n  + expect(raw.length, 'the router builds at least one scrubbed error value')\u2026"}]
Test failures: [{"test_name": "REQ-146 \u2014 what the Worker may import, and what it may say test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed", "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)", "file_path": "", "line_number": null, "error_type": "assertion", "action_required": null, "traceback": null, "synthesised": true}]

**Proposed change**: Widen the `code_frozen` grant's `files` (['apps/control-app/src/ai.ts']) to also name the test file(s) the failing tests live in, so the batch may edit them without failing the conformance check.

## Ruling: declined

Rung 1: the only test needing a wider grant (test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed) is owned by REQ-146, which is out of scope, and its failure is a pre-existing regex false positive already on main, not caused by this story. It is dropped from the validation set; code_frozen stands and the batch touches no production file, only (if a story test regresses) the story's own test files.
