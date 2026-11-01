---
uid: report-58d86d51
id: REPORT-7227
type: report
title: 'Report: blocked_by_handoff for STORY-103'
created_by: xgd
created_at: '2026-11-01T02:51:33.698364+00:00'
updated_at: '2026-11-01T02:51:33.698364+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: STORY-103
  rule: code_frozen
  evidence: 'Instrumented test_UAT_AC2088 (reverted): after the turn drained and ctx.waitUntil
    work settled, POST /api/ai/session returned turns [user, ''Working on the heading.
    Done with the heading.''] with live:true, cursor 147001; /api/ai/reattach from
    cursor 0 streamed both text parts then done{status:complete}; /api/ai/reattach
    from the reported cursor 147001 produced no frames (hangs). live is computed at
    tools/generate/src/cli/ai/host-core.ts:788 as closedPrefix(records).length !==
    records.length on manager.logFor(sessionId).readFrom(0). AC-2088 explicitly requires
    live false once the turn ends, and a client acting on live:true hangs, so changing
    the test to expect true would lock in a defect.'
  proposed_change: 'tools/generate/src/cli/ai/host-core.ts storedTranscript: compute
    `live` from whether the junction log has an open turn (a turn_start with no matching
    turn_end/done after it), not from closedPrefix length, which also cuts at trailing
    non-turn records written after the turn''s end. Equivalently, use the library''s
    narrower open-turn predicate referenced in @lagrangefoundry/ai src/control.js:738
    if it is exported. No test changes needed: test_UAT_AC2088 as written then passes.'
  batch_index: 0
  parent_report_uid: report-81630d74
  anchor_ticket: bundle-fd009b93
---

# Builder blocked by `code_frozen`

**Evidence**: Instrumented test_UAT_AC2088 (reverted): after the turn drained and ctx.waitUntil work settled, POST /api/ai/session returned turns [user, 'Working on the heading. Done with the heading.'] with live:true, cursor 147001; /api/ai/reattach from cursor 0 streamed both text parts then done{status:complete}; /api/ai/reattach from the reported cursor 147001 produced no frames (hangs). live is computed at tools/generate/src/cli/ai/host-core.ts:788 as closedPrefix(records).length !== records.length on manager.logFor(sessionId).readFrom(0). AC-2088 explicitly requires live false once the turn ends, and a client acting on live:true hangs, so changing the test to expect true would lock in a defect.

**Proposed change**: tools/generate/src/cli/ai/host-core.ts storedTranscript: compute `live` from whether the junction log has an open turn (a turn_start with no matching turn_end/done after it), not from closedPrefix length, which also cuts at trailing non-turn records written after the turn's end. Equivalently, use the library's narrower open-turn predicate referenced in @lagrangefoundry/ai src/control.js:738 if it is exported. No test changes needed: test_UAT_AC2088 as written then passes.
