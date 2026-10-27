---
uid: report-1a517ad5
id: REPORT-6793
type: report
title: 'Report: blocked_by_handoff for story-58b2cec4'
created_by: xgd
created_at: '2026-10-27T20:36:38.062824+00:00'
updated_at: '2026-10-27T20:36:38.062824+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-58b2cec4
  rule: code_frozen
  evidence: 'Ran `npx vitest run --config vitest.node.config.mts tests/reconciliation-assistant-conversation.test.ts
    -t AC1405`; it fails with ''SessionManager: unknown option logDir — `logDir` is
    now `junctions`''. The AC1057 tests fail the same way: the transcript dir is never
    created, and the mid-turn test hangs on stalled.entered. The cause is tools/generate/src/cli/ai/host.ts:213
    passing `logDir`, which the unpinned shared @lagrangefoundry/ai (manager.js:352-375)
    now rejects. host.ts is not in this batch''s authorised exception list (host-core.ts,
    fidelity-core.ts, ai.ts, router.ts, shot.ts only). git diff 98171e32..HEAD shows
    no change to host.ts or session construction. xgd-working tip a2b1dafd2d (REQ-452)
    has the fix at host.ts:235-237.'
  proposed_change: 'In tools/generate/src/cli/ai/host.ts nodeDeps(), replace `logDir:
    path.join(dir, ''live''),` with `junctions: lib.fileJunctions(path.join(dir, ''live'')),`.
    This ports tip host.ts:237 exactly, and branch host-core.ts:636 already forwards
    deps.junctions. Grant code_frozen on host.ts with tip_evidence a2b1dafd2d host.ts:230-237.
    No test edits. Dependency tests: AC1057, AC1404-AC1411, plus AC2026/AC2027 (Node
    no-browser absence).'
  batch_index: 0
  parent_report_uid: report-9dd59176
  anchor_ticket: bundle-5607a08d
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run --config vitest.node.config.mts tests/reconciliation-assistant-conversation.test.ts -t AC1405`; it fails with 'SessionManager: unknown option logDir — `logDir` is now `junctions`'. The AC1057 tests fail the same way: the transcript dir is never created, and the mid-turn test hangs on stalled.entered. The cause is tools/generate/src/cli/ai/host.ts:213 passing `logDir`, which the unpinned shared @lagrangefoundry/ai (manager.js:352-375) now rejects. host.ts is not in this batch's authorised exception list (host-core.ts, fidelity-core.ts, ai.ts, router.ts, shot.ts only). git diff 98171e32..HEAD shows no change to host.ts or session construction. xgd-working tip a2b1dafd2d (REQ-452) has the fix at host.ts:235-237.

**Proposed change**: In tools/generate/src/cli/ai/host.ts nodeDeps(), replace `logDir: path.join(dir, 'live'),` with `junctions: lib.fileJunctions(path.join(dir, 'live')),`. This ports tip host.ts:237 exactly, and branch host-core.ts:636 already forwards deps.junctions. Grant code_frozen on host.ts with tip_evidence a2b1dafd2d host.ts:230-237. No test edits. Dependency tests: AC1057, AC1404-AC1411, plus AC2026/AC2027 (Node no-browser absence).
