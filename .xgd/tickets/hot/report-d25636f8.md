---
uid: report-d25636f8
id: REPORT-7391
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:33:09.155064+00:00'
updated_at: '2026-11-01T06:33:09.155064+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md` (REQ-173) — intent/bookkeeping ticket (2e). Rule: one side is a strict superset → keep the superset. Resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming 6751ace55b (2026-09-03, status `draft`, last_field_updated `body`) appended the "Resolved in session — what was actually built" section.
  - HEAD (updated 2026-11-01, status `free_and_reconciled`, completed_at set) already contains that section verbatim, plus a later "What the implementation settled that the plan did not" / "Where the relocated claims went" section.
  - Frontmatter conflict (updated_at/completed_at/last_field_updated/status): HEAD is the later fact on every field (Nov 1 vs Sep 3), consistent with the enrichment's "take the more recent commit by timestamp" rule.

## Incoming changes preserved

The incoming body addition is fully present in HEAD, so the staged result nets to no diff vs HEAD — a redundant commit (BUG-1109/BUG-1122 shape), not a discard. Only the incoming commit's stale frontmatter (draft status, Sep 3 timestamps) was superseded by HEAD's later state. No code files involved.

Flagged for post-merge review per enrichment rule (intent unknown on both sides), though no content was lost.
