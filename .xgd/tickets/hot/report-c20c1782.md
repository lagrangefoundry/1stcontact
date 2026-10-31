---
uid: report-c20c1782
id: REPORT-7013
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:00:42.548631+00:00'
updated_at: '2026-10-31T22:00:42.548631+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md` (REQ-173) — AA (both added), intent/bookkeeping ticket (2b/2e). Rule: one side is a strict superset → keep the superset. HEAD (ours, blob 7477e62) contains the incoming version's entire body verbatim, plus later state: `status: bundled`, `bundled_in: bundle-fd009b93`, `commits`, `version: 0.2.56`, `updated_at: 2026-10-31`, and the "Resolved in session" sections. Incoming (theirs, 980317a83e "create request request-e53d068f", blob 9579380) is the original 2026-09-02 draft creation (`status: draft`). Taking theirs would have regressed the ticket to draft and lost resolution notes. Resolved by staging HEAD's blob at stage 0; entry is outside the sparse cone, so it was marked skip-worktree (no working-tree file).

## Incoming changes preserved

No code files involved. The incoming commit's only change (creating REQ-173 with its draft body) is already fully present in HEAD — the draft body text is contained verbatim in HEAD's version. The resolution nets to no diff vs HEAD (redundant commit, BUG-1109/BUG-1122 shape), not a discard; finalize step should detect the clean staged diff.

Note: the enrichment's generic rule ("take the more recent commit by timestamp") was superseded by 2b/2e's strict-superset rule; the superset side is also the more recent ticket state (updated_at 2026-10-31 vs 2026-09-02). Flag for post-merge review per enrichment, though no content risk is expected.

Unrelated working-tree state left untouched: unstaged `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `.xgd/tickets/hot/report-28a7faea.md`.
