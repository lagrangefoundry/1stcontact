---
uid: report-ae134911
id: REPORT-6368
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T07:27:52.823229+00:00'
updated_at: '2026-10-05T07:27:52.823229+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — intent/bookkeeping ticket (2e), resolved `--ours`.
  Pick `b6b2cfc512` (09-01 15:03:01, title + severity + first body draft). Blobs: base `6bfb11db8a`, ours `0f983095aa` (== HEAD), theirs `afc0df91ed`.
  Ours is a strict superset in effect: `git diff :2: xgd-working:<path>` (tip `fca35b86a8`) is a single `updated_at` line, so every field/body line where ours differs from theirs is incoming's own later rewrite (`fd72594eb0` and successors). Same triple as REPORT-6206.

## Incoming changes preserved

Ticket file only, no code. Theirs' title/severity/body are superseded by incoming's later commits, which ours already carries. Zero net change from HEAD; CHERRY_PICK_HEAD intact.

## Forecast

Next bug-360c5a44 picks (`fd72594eb0`, `6862ea1402`, `eb9960199f`, ...) → `--ours`; only the xgd-working tip wins `updated_at` (+13.2 s).
