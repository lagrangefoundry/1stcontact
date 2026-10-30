---
uid: report-5daae465
id: REPORT-5971
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:47:44.111628+00:00'
updated_at: '2026-10-04T21:47:44.111628+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — request-554ac441 / c9f82a85cd

- Pick: `c9f82a85cd` (author 2026-08-23 15:01:14 -0700), `xgd(ticket): update request request-554ac441`
- HEAD: `d5678200bb`; apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`
- Path: `.xgd/tickets/hot/request-554ac441.md` (UU)
- Stages: base `de1dfccc70` / ours `85e97c817e` (== HEAD blob) / theirs `72613269c8`

### Analysis
- base→theirs: frontmatter only — `updated_at` → 2026-08-23T22:01, `last_field_updated` body→status,
  `status` **free_coded → free_coding** (a backward lifecycle move), plus a dropped trailing newline.
- base→ours: +99/-5. Ours is `free_and_reconciled` with `completed_at` 2026-08-31T14:22:34, and the
  body carries later increments (version 0.2.9).
- `git diff :2: xgd-working:<path>` is only a trailing-newline delta. Ours equals incoming's own end
  state, so the pick's `free_coding` was transient and xgd-working itself superseded it.

### Resolution
`git checkout --ours` + `git add --sparse`. **Zero net change from HEAD** (`git status --porcelain` empty;
CHERRY_PICK_HEAD intact). Taking theirs would regress `status` from free_and_reconciled to free_coding.
Enrichment's "more recent by timestamp" rule agrees: ours 08-31 vs theirs 08-23.

### Forecast
Any further picks on this ticket dated before 2026-08-31 should also resolve `--ours`. Before reusing
that, run `git diff :2: xgd-working:<path>`.
