---
uid: report-22d7f79d
id: REPORT-11149
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-07T19:52:25.923811+00:00'
updated_at: '2026-11-07T19:52:25.923811+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-e0ca0a36
  findings: []
  mode_override_uid: report-de676490
  parent_report_uid: report-952055fa
  batch_index: 0
  attempt: 0
---

# Override conformance

- Item 1 (named files only): PASS — files_touched equals the two named migration files; unnamed_files_touched is empty.
- Item 3 (consistent with intent/AC): PASS — the diff brings `sessions` to the nine-column rotation schema the installed auth-passwordless component writes (issued_at, origin_id, superseded_by, retired_at), which AC2343–AC2355 and test_UAT_FC_REQ-202_* are run against.
- Item 4 (within stated scope): PASS — 0001: the four new columns are nullable after last_seen_at, idx_sessions_origin_id and idx_sessions_retired_at are added, and the subject_id/expires_at indexes are kept. 0002: renames to staging, re-creates from the component statement, copies the five shared columns, backfills origin_id/issued_at WHERE IS NULL, drops staging, re-creates all four indexes, no bare ADD COLUMN. The extra leading `DROP TABLE IF EXISTS sessions_pre_rotation` is in the reference and only makes a retry of an interrupted run finish.
- Item 5 (trust boundary): PASS — trust_boundary_touched=false, trust_boundary_mismatch=false.
- Item 6 (code_frozen, rung 2): PASS — no file outside `files` is edited. 0002 is byte-identical to the reference file. The 0001 sessions CREATE matches the reference statement: the reference excerpt is truncated before 951–988, but the reference 0002 says the two statements are identical. The added 0001 lines are comments only. No AC or intent rules out any behaviour, branch or API the diff adds.

Notes (not findings): the new 0002 copies the reference rather than being written from it; the planner's verbatim prescription asked for this, but the checklist says reference code is never copied. The SQL comments cite REQ-231 while the justification cites REQ-202; worth aligning the traceability.

1 override audited, 0 touched a trust boundary.