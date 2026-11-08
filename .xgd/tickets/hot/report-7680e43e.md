---
uid: report-7680e43e
id: REPORT-11304
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-08T06:11:21.217214+00:00'
updated_at: '2026-11-08T06:11:21.217214+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_conformance
  subject_uid: story-4cabde9a
  findings:
  - item: 4
    reason: The planner's stated scope was a single production change in ai.ts with
      no test changes, but the diff also edits a REQ-146 UAT and a test support helper.
    added_lines:
    - const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])
    - const raw = [...router.matchAll(/error:\s*([A-Za-z_.$][\w.$]*)/g)]
    - '  .map((m) => m[1])'
    - '  .filter((name) => !typeKeywords.has(name))'
    - expect(raw.length, 'the router builds at least one scrubbed error value').toBeGreaterThan(0)
    - 'export function systemText(req: ModelRequest): string {'
    - '  return textOf(req.system)'
    - '}'
    absent_tip_lines:
    - No test or AC changes.
    - Keep those edits and do not touch the tests again.
    files:
    - tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts
    - tests/support/scripted-model-client.ts
  - item: 6
    reason: The code_frozen override names only apps/control-app/src/ai.ts, yet the
      diff edits two files it does not name, and the REQ-146 router error-scrub change
      is behaviour no AC or intent in scope (AC2097, AC2378, FC_REQ-207, FC_REQ-173)
      demands.
    added_lines:
    - const typeKeywords = new Set(['string', 'unknown', 'any', 'never'])
    - '  .filter((name) => !typeKeywords.has(name))'
    - expect(raw.length, 'the router builds at least one scrubbed error value').toBeGreaterThan(0)
    - 'export function systemText(req: ModelRequest): string {'
    absent_tip_lines:
    - '"files": ["apps/control-app/src/ai.ts"]'
    - <nothing>
    files:
    - tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts
    - tests/support/scripted-model-client.ts
  mode_override_uid: report-7519d965
  parent_report_uid: report-fe34a964
  batch_index: 0
  attempt: 1
---

# Override conformance

- Item 1: PASS. unnamed_files_touched is empty; the only production file changed is the named apps/control-app/src/ai.ts. The test-file edits are outside code_frozen's scope and do not fail this item.
- Item 3: PASS. Registering the describer backend with lib.ClaudeAPIBackend.capabilities lets image content through the vision gate, which AC2097 (image sent) and AC2378 (image described, not 'failed') require.
- Item 4: FAIL. The planner said 'No test or AC changes' / 'do not touch the tests again', but the diff edits tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts (type-keyword filter plus a new assertion) and tests/support/scripted-model-client.ts (a systemText helper that nothing in the diff uses).
- Item 5: PASS. trust_boundary_touched is false and trust_boundary_mismatch is false.
- Item 6: FAIL. Rung 2: the ai.ts change matches the reference state's behaviour at ai.ts lines 294-299 (the comment is reworded, not copied; the per-describer names are kept and both describers get the fix). But the diff edits two files the override's `files` does not name, and the REQ-146 router-scrub change is not demanded by any AC or intent in scope.

Remediation: revert both test-file edits and keep the ai.ts change. If the REQ-146 regex really does catch type annotations by mistake, raise that separately rather than inside this override.

1 override audited, 0 touched a trust boundary.