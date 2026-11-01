---
uid: report-2b2e5e10
id: REPORT-7229
type: report
title: 'Report: mode_override for STORY-103'
created_by: xgd
created_at: '2026-11-01T02:55:25.591970+00:00'
updated_at: '2026-11-01T02:55:25.591970+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: STORY-103
  anchor_ticket: bundle-fd009b93
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-7597fd1f
  quality_mode: reconcile
  justification: The reference state takes live from upstream manager.transcript()
    (host-core.ts:4794-4832) and documents the closedPrefix .length derivation as
    the BUG-64 defect (host-core.ts:4742-4760); AC-2088 requires live:false after
    the turn ends, and the frozen code always reports true, hanging the client.
  files:
  - tools/generate/src/cli/ai/host-core.ts
  rung: 2
  tip_evidence:
  - file: tools/generate/src/cli/ai/host-core.ts
    lines: 4742-4760
  - file: tools/generate/src/cli/ai/host-core.ts
    lines: 4794-4832
  external_cause: null
  planner_trust_boundary: false
  granted_head: 10e21d791c419d98f8e744b5f672c5bf5b388d3f
---

# Mode override granted: code_frozen

The reference state takes live from upstream manager.transcript() (host-core.ts:4794-4832) and documents the closedPrefix .length derivation as the BUG-64 defect (host-core.ts:4742-4760); AC-2088 requires live:false after the turn ends, and the frozen code always reports true, hanging the client.

Planner instructions for the batch:

test_UAT_AC2088 is correct and the code is wrong. In tools/generate/src/cli/ai/host-core.ts, storedTranscript (lines 766-790) derives live from a second read of the junction log: deps.lib.closedPrefix(records).length !== records.length. closedPrefix returns a COUNT, not an array; see the library's components/ai/js/src/manager.js:963-983, where transcript() itself returns live: closedPrefix(records) < records.length. So .length is undefined, and live is true for every session with records. This is why the reopen after a completed turn reports live:true and the reattach from that cursor hangs. Fix it the way the reference state does: take live from the result of manager.transcript(sessionId) (widen the local read type to include live and return live: read.live === true), and drop the second logFor/readFrom read and the closedPrefix comparison. Do not reinterpret the trailing-record theory from iteration 1; it was wrong. Do not change test_UAT_AC2088 or AC-2088. Keep test_UAT_AC1057 (fixed last iteration) and the dependency tests green, especially the mid-turn half of AC2088 and BUG-46's reload-mid-turn case, which need live:true while a turn is genuinely open.
