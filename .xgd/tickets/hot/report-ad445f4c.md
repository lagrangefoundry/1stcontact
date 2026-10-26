---
uid: report-ad445f4c
id: REPORT-6757
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:33:08.467637+00:00'
updated_at: '2026-10-26T00:33:08.467637+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` (BUG-49): intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: one side is a strict superset, so I kept the superset (ours / HEAD). This also matches the enrichment rule ("take the more recent by timestamp"): ours is updated_at 2026-10-25T22:19:55, theirs is 2026-09-02T23:37:00.
  - Theirs (1b32dc67, "update bug bug-46140599") moved status from `draft` to `free_coded`, added `commits: [working_sha b8e0b7f8…]` and `version: 0.2.47`, and dropped the trailing newline.
  - Ours already has the identical `commits` entry, `version`, body and EOF, and is one lifecycle step further on: status `bundled` with `bundled_in: bundle-5607a08d`. `bundled` follows `free_coded`, so keeping ours loses nothing.
  - Resolved with `git checkout --ours` and `git add --sparse`. The staged blob is d1bad356, the same as HEAD.

## Incoming changes preserved

No code files were involved. Every incoming change is already present in HEAD (commits, version, EOF) or superseded by a later lifecycle state (free_coded -> bundled). The commit is redundant on this branch, not discarded. The staged diff vs HEAD is empty, so the finalize step should skip it.
