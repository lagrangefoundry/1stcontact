---
uid: report-8ad43fd3
id: REPORT-7248
type: report
title: 'Report: mode_override for STORY-141'
created_by: xgd
created_at: '2026-11-01T03:33:15.332881+00:00'
updated_at: '2026-11-01T03:33:15.332881+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: STORY-141
  anchor_ticket: bundle-fd009b93
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-fddeb967
  quality_mode: reconcile
  justification: AC-2097 requires DOCUMENT_DIGEST_SYSTEM to be the only system content.
    The reference state delivers it as the single priming Entry, while the frozen
    working-tree code passes `system`/`source` keys that the AI library's Role constructor
    drops, so production sends an empty system prompt. The test is right and the code
    is wrong.
  files:
  - apps/control-app/src/ai.ts
  rung: 2
  tip_evidence:
  - file: apps/control-app/src/ai.ts
    lines: 297-304
  external_cause: null
  planner_trust_boundary: false
  granted_head: 6b9fcfbd16adba2fd8d20a6425fdba3d81246086
---

# Mode override granted: code_frozen

AC-2097 requires DOCUMENT_DIGEST_SYSTEM to be the only system content. The reference state delivers it as the single priming Entry, while the frozen working-tree code passes `system`/`source` keys that the AI library's Role constructor drops, so production sends an empty system prompt. The test is right and the code is wrong.

Planner instructions for the batch:

AC1688/AC1689/AC1699 are already resolved: the iteration-1 builder deleted their stale pre-REQ-173 copies from tests/reconciliation-material-description.workers.test.ts, and the digest-era versions pass. Keep that edit, and keep those tests green. The remaining failure, AC2097, is a production defect in apps/control-app/src/ai.ts sessionTextDescriber. The Role is constructed with `system: DOCUMENT_DIGEST_SYSTEM` and `source: {...}`, which Role ignores. Replace them with a single priming entry, `priming: [new lib.Entry({ name: 'digest-system', text: DOCUMENT_DIGEST_SYSTEM })]`, matching the reference state (reconcile-src-BUNDLE-34 ai.ts:297-304, BUG-63). Then the assembled system content equals DOCUMENT_DIGEST_SYSTEM exactly. Also fix the doc comment at ai.ts:123 ('No corpus and no priming') so it says the one instruction is the only priming. Do NOT port the later describerSession/image-describer consolidation (REQ-207) or change backend registration. That work is outside this story. Do not touch the AC2097 test: it is correct as written.
