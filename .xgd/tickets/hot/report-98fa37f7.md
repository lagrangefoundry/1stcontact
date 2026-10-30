---
uid: report-98fa37f7
id: REPORT-6021
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:16:10.619996+00:00'
updated_at: '2026-10-04T22:16:10.619996+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — intent/bookkeeping ticket (§2e), UU. Pick `5a68fc8db7` (2026-08-26 16:21:08 -0700).
  Blobs: base ad25504e54 (= previous pick bffb6b34fa's theirs) / ours 385c6b124d (== HEAD, unchanged) / theirs df68f1cf47.
  Theirs rewrites the body into the unwrapped form; `git diff theirs ours` shows the body is byte-identical on ours
  (only ours' trailing newline differs). Remaining deltas are frontmatter where ours is later: `updated_at` 08-31 vs 08-26,
  `status: bundled` vs `ready_to_reconcile`, `last_field_updated: status`, plus ours-only `bundled_in: bundle-8eef3846`.
  → `git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

## Incoming changes preserved

No code files. This pick's body rewrite is already present verbatim on ours. `git status --porcelain` empty,
CHERRY_PICK_HEAD intact. Remaining forecast: 6426fe4fbf (08-30) likely `--ours`; the 08-31 23:59
`free_and_reconciled` tip (ad0224db44) is the one where incoming should win.
