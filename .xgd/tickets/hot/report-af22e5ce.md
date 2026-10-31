---
uid: report-af22e5ce
id: REPORT-6995
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:49:13.336150+00:00'
updated_at: '2026-10-31T21:49:13.336150+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — intent/bookkeeping ticket (2e; bug ticket, out of sparse cone). Rule: enrichment "take the more recent commit by timestamp" + 2e per-fact later-intent. Resolved to OURS (HEAD) via `git checkout --ours` + `git add --sparse`.
  - Conflicting facts: `updated_at`, `completed_at`, `status`, `fields.commits[0].reconcile_sha`, `fields.bundled_in`.
  - HEAD: updated_at 2026-10-30T21:51:53Z, status `free_and_reconciled`, completed_at set, reconcile_sha 446aa52f…, bundled_in bundle-5607a08d.
  - Incoming 5ab31577c2 (authored 2026-09-01): updated_at 2026-09-02T02:07:31Z, status `free_coded`, completed_at null, reconcile_sha null, no bundled_in.
  - Incoming is a strictly older snapshot of the same lifecycle; HEAD is the later state (status advanced free_coded -> free_and_reconciled). No incoming-only facts exist that HEAD lacks.

## Incoming changes preserved

No code files involved. The incoming commit's only effect (setting status to free_coded on an earlier snapshot) is already superseded in HEAD by the later reconcile lifecycle; resolution nets to no diff vs HEAD (redundant/stale commit, BUG-1109/BUG-1122 shape). Left for finalize step to detect empty staged diff.

Flag for post-merge review (per enrichment rule): bug-5bc83942. Also note: branch history shows repeated "update bundle bundle-fd009b93" / "recover uncommitted .xgd/ state (BUG-603)" commit pairs (~6x), suggesting the cherry-pick loop may be re-applying stale ticket commits.
