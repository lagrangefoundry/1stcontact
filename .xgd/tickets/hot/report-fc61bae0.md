---
uid: report-fc61bae0
id: REPORT-6181
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:33:06.470705+00:00'
updated_at: '2026-10-05T02:33:06.470705+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: `.xgd/tickets/hot/request-78370159.md` (REQ-161) — pick `8420f4d3f4`

Picked commit: `8420f4d3f4` (2026-08-31 17:22:31 -0700), `draft` → `free_coding`.

Blobs: base `15b0507d7c` / ours `c5565fa271` (== HEAD) / theirs `e12e7b1625`.

- base→theirs is frontmatter only (`updated_at` 09-01T00:22, `last_field_updated: status`,
  `status: free_coding`) plus dropping the EOF newline.
- Ours is the 09-09 `bundled` state (`updated_at` 09-09T21:32, `bundled_in` bundle-87be4669),
  which comes later in the same lifecycle.
- `git diff :2: xgd-working:<path>` shows only the later 09-11 `free_and_reconciled` flip. The
  bodies are identical, so ours is a superset of this pick.

Outcome: `--ours`, zero net change from HEAD. CHERRY_PICK_HEAD is intact.

Forecast: later REQ-161 picks before the 09-11 tip should also go `--ours`. The tip
(`free_and_reconciled` + `completed_at`) should not.
