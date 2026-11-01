---
uid: report-cc99eb80
id: REPORT-7651
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:48:42.901324+00:00'
updated_at: '2026-11-01T14:48:42.901324+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` — UU, intent/bookkeeping ticket (2e), resolved per fact (index-only, outside sparse cone; written to worktree and staged with `git add --sparse`).
  - Frontmatter status/timestamps/commits: same facts changed on both sides. Took HEAD (status `free_and_reconciled`, `completed_at`/`updated_at` 2026-11-01, three commit entries with reconcile SHAs and `working_sha_history`). HEAD's values are ~2 months later than incoming's (2026-09-03, status `free_coded`, null reconcile SHAs); taking incoming would regress the ticket's reconcile state.
  - `fields.version: 0.2.60`: added only by incoming — kept (non-overlapping).
  - Body: took incoming. Incoming's body includes the "Behaviour added as a consequence" section (C1–C4) added by source commit b34b832932, which was never cherry-picked onto this branch; HEAD lacked it only because of that gap, not through a deliberate deletion. Incoming also drops the trailing newline — kept.

## Incoming changes preserved

- No code files in conflict.
- For the ticket: incoming `version: 0.2.60`, body (incl. C1–C4), and trailing-newline change are present. Incoming status `free_coded`, `updated_at` and null `reconcile_sha` values were superseded by HEAD's later (2026-11-01) reconciled state per 2e's later-intent rule.

## Notes

- Unrelated unstaged `.xgd/_changes/{log.ndjson,meta.json}` and untracked `report-5defef3c.md` left untouched.
- Flagged for post-merge review per enrichment rule (intent unknown on both sides).
