---
uid: report-1b5e0065
id: REPORT-7367
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:19:37.375581+00:00'
updated_at: '2026-11-01T06:19:37.375581+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-597b41d2.md` (BUG-46). Class: intent/bookkeeping ticket (2e). Rule applied: one side is a strict superset, so keep the superset (also the more recent side by timestamp, per the enrichment rule). The resolved file is byte-identical to HEAD and was staged with `git add --sparse`.
  - Frontmatter: HEAD has `updated_at 2026-11-01T05:03:20`, `completed_at 2026-11-01T05:03:17`, `last_field_updated: status`, `status: free_and_reconciled`. Incoming has `2026-09-02T23:54:31`, `completed_at: null`, `last_field_updated: body`, `status: draft`. HEAD's values are later, so HEAD was kept.
  - Body: incoming commit 67c8dd3c13 (2026-09-02) appends the sections "What was implemented, and the behaviour that came with it", "Two findings worth recording" and "Residual risk on closing". HEAD already contains all three verbatim, followed by later sections (REQ-114 deferral ticket, "The panel wiring landed after all", the `live` flag, the environment note) that the incoming side lacks.

## Incoming changes preserved

There are no code files. The incoming commit's content (its body sections) is already in HEAD, so the pick is redundant, not discarded. The staged diff against HEAD is empty, and finalize should detect the clean diff and skip the commit. The stale incoming frontmatter scalars (`status: draft`, `completed_at: null`) were deliberately not applied because HEAD's are later.

Flag for post-merge review, per the enrichment's resolution rule (intent unknown on both sides).
