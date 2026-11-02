---
uid: report-52c23bc4
id: REPORT-8108
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:06:32.075934+00:00'
updated_at: '2026-11-02T01:06:32.075934+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-b6268a25.md` — intent/bookkeeping ticket (2e), outside sparse cone (index-only conflict). Resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming 8c5182177e ("update bug bug-b6268a25", updated_at 2026-09-06T00:35) is an earlier draft of the body rewrite. Ours (updated_at 2026-11-01T23:18, status `bundled`, `bundled_in: bundle-5052a63c`) is the later revision of the same sections.
  - Most incoming hunks are already present verbatim in ours: `kb.ts:928`, "Only the read seam moved", the seven-call-site Where table, the `session-knowledge.ts:128` note, "The second failure, which is silent", the four-day-window paragraph, and the first four new acceptance bullets.
  - Same-fact conflicts where the two sides differ: the "coverage exists and is red" paragraph (incoming: 11 tests / 4 files; ours: 30 tests / 7 files), the acceptance bullet on failing tests, and the final acceptance bullet (incoming: check in `bin/install`; ours: `bin/install` is unreachable from this repo, so the check goes beside the shared-store preflight). Ours also adds "What this ticket does NOT fix". Rule 2e per-fact, later intent wins: ours is later by timestamp (2026-11-01 vs 2026-09-06) and supersedes these as refined text. Incoming's metadata (status `draft`, last_field_updated `body`) is also older than ours (`bundled`).

## Incoming changes preserved

Every incoming hunk is either already present verbatim in HEAD or superseded by a later revision of the same paragraph in HEAD. The resolution nets to no diff vs HEAD, which means the commit is redundant, not discarded. Left for cherry_pick_finalize_resolution to skip.
