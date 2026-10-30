---
uid: report-0f019e01
id: REPORT-6228
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:58:34.866484+00:00'
updated_at: '2026-10-05T02:58:34.866484+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — request-6893f6ea (REQ-158) / f20ff760fc

Picked commit: `f20ff760fc` (2026-08-31 18:22:19 -0700), `free_coding` → `free_coded`, adds
`fields.commits` (working_sha `2745001058…`) and `fields.version: 0.2.27`. Frontmatter only.

Conflict: `UU .xgd/tickets/hot/request-6893f6ea.md`
- base `72476a9ac8`, ours `7cd88f9ec4` (== HEAD blob), theirs `51f1dbc365`

Resolution: `--ours`, zero net change from HEAD.

Evidence:
- Ours already has the pick's `commits` entry and `version: 0.2.27`, byte-identical.
- Ours is the 09-09 re-bundle state: `status: bundled`, `bundled_in: bundle-87be4669`,
  `updated_at` 2026-09-09. That comes after the pick's 08-31 `free_coded`.
- `git diff :2: xgd-working:<path>` shows only the 09-11 `free_and_reconciled` flip, which
  belongs to a later pick, the tip `f74da06627`. So ours is xgd-working's own later state
  without that flip.

Forecast: picks on this ticket before the tip are `--ours`. The tip `f74da06627` (09-11
`free_and_reconciled`) is NOT `--ours`.
