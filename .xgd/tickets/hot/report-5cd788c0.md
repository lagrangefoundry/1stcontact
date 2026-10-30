---
uid: report-5cd788c0
id: REPORT-6352
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:10:33.583350+00:00'
updated_at: '2026-10-05T04:10:33.583350+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Pick `4305ac944e` (2026-09-01 14:33:14 -0700, "xgd(ticket): update request request-8b33a146", REQ-172) conflicted on
`.xgd/tickets/hot/request-8b33a146.md` (UU). HEAD `7ef32ed2d6`.

Blobs: base `a26f53ab34` / ours `d6fbb21c84` (== HEAD blob) / theirs `180dc007d3`.

## Analysis

- base→theirs: a large body rewrite (reader height cap, JSON/XML, BUG-42 repaint, HTML/SVG rules, teardown,
  missing-bytes, markdown re-export, an expanded test plan) plus `updated_at` / `last_field_updated: body`. The status
  stays `free_coding`.
- ours vs the xgd-working tip (`git diff d6fbb21c84 xgd-working:<path>`): the only difference is one line, `updated_at`
  (09-19T15:15:29.11 vs 15:15:37.35). Ours therefore already carries incoming's final body, which supersedes this
  intermediate revision. It also carries the terminal lifecycle (`free_and_reconciled`, `completed_at` 09-14).

## Resolution

`git checkout --ours` + `git add --sparse`. This leaves zero net change from HEAD, and `git status --porcelain` is
empty. CHERRY_PICK_HEAD is intact.

## Forecast

Later picks on request-8b33a146 should go `--ours` by the same one-diff test. The xgd-working tip wins `updated_at`
only (8.2 s).
