---
uid: report-c34975c5
id: REPORT-6297
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:34:40.682344+00:00'
updated_at: '2026-10-05T03:34:40.682344+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` (BUG-40, intent/bookkeeping ticket, UU) — `--ours`, zero net change from HEAD.
  Pick `d2b87a3946` (09-01 12:27:33, body rewrite, still free_coding). Base `164ba43c42` (== previous pick
  cda495bd6e's theirs), ours `4b1ec9bd2a` (== HEAD blob), theirs `036c116920`.
  `git diff :3: :2:`: the body is identical apart from the EOF newline. Frontmatter on ours is the strict
  later state: newer title, commits, version 0.2.33, `bundled_in: bundle-8e1807f6`, `completed_at`, and
  `status: free_and_reconciled`. Ours vs xgd-working tip `3f23e96b90` differs only in `updated_at`,
  so incoming itself replaced this pick's free_coding state with ours.

## Incoming changes preserved

No code files. Theirs' body rewrite is present verbatim on ours. Forecast: later bug-3ade1af4 picks
(merge `8b484d5832`, `08bbde0676`, `d975830c32`, `cb4ece9296`, `d22ba37c40`, ...) are expected to resolve `--ours`.
The 09-19 tip (updated_at 15:15:46.300383) is the exception and wins `updated_at` alone.
