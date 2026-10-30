---
uid: report-d58b23f8
id: REPORT-6920
type: report
title: 'Report: mode_override for report-00553335'
created_by: xgd
created_at: '2026-10-30T20:59:44.548506+00:00'
updated_at: '2026-10-30T20:59:44.548506+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: report-00553335
  anchor_ticket: bundle-5607a08d
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-32f5ff75
  quality_mode: reconcile
  justification: REQ-157 (in scope) requires untrusted capture content never read
    as an instruction; AC-2067 requires recovered screenshot blocks keep the untrusted
    frame, and contentBlocksFrom is the sole point where the frame is dropped.
  files:
  - tools/generate/src/cli/ai/fidelity-core.ts
  rung: 1
  tip_evidence:
  - file: tools/generate/src/cli/ai/fidelity-core.ts
    lines: 185-198
  external_cause: null
  planner_trust_boundary: true
  granted_head: 4d32559c0b43fd711a14cf6dc33196f984bb4305
---

# Mode override granted: code_frozen

REQ-157 (in scope) requires untrusted capture content never read as an instruction; AC-2067 requires recovered screenshot blocks keep the untrusted frame, and contentBlocksFrom is the sole point where the frame is dropped.

Planner instructions for the batch:

The code_frozen block reported in report-1449ee72 is granted for tools/generate/src/cli/ai/fidelity-core.ts only. The AC-2067 tests are right and must not be changed back to assert the frame is absent. Change contentBlocksFrom so that, when the rendered payload has text before the JSON array and/or after it (the untrusted frame), that text is carried onto the recovered blocks, exactly as the second UAT specifies. Leading text is prepended to the first block when that block is text; otherwise it becomes its own leading text block. Trailing text is appended to the last block when that block is text; otherwise it becomes its own trailing text block. An unframed rendering comes back unchanged, a refusal still returns null, and the scan stays bracket-based rather than keyed to the marker spelling. Update the function doc comment, which currently says the frame is given up. host-core.ts:525 needs no change.
