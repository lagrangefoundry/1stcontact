---
uid: report-f929035a
id: REPORT-6943
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:15:47.106401+00:00'
updated_at: '2026-10-31T21:15:47.106401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — intent/bookkeeping ticket (2e), UU, conflict in the index only (outside the sparse cone). Rule: keep the superset; per fact, the later side wins. Took ours (`git checkout --ours`, then `git add --sparse`).
  - Incoming 6862ea1402 (2026-09-01 15:34) changes only `updated_at` (to 2026-09-01T22:34:57) and adds body text: the "host's business / callback that throws is swallowed" paragraph, the extended panel bullet, and the new app bullet.
  - HEAD (e8f9e7c85b, 2026-09-19) already contains every added body line verbatim, and its `updated_at`, `completed_at` and `status` (free_and_reconciled) are later. HEAD is a strict superset.

## Incoming changes preserved

All body additions from 6862ea1402 are already in HEAD, word for word: they arrived through a later commit. The only incoming value not kept is the outdated `updated_at` timestamp. The staged result has no diff against HEAD (a redundant commit, BUG-1109/BUG-1122), so finalize should skip it. No BUG-1301 drops.
