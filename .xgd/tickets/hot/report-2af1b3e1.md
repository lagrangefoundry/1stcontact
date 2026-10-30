---
uid: report-2af1b3e1
id: REPORT-6004
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:07:43.468315+00:00'
updated_at: '2026-10-04T22:07:43.468315+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — request-34dd9049 / 2886fb4f72

- Picked commit: `2886fb4f72` (2026-08-23 19:10:41 -0700, `xgd(ticket): update request request-34dd9049`)
- HEAD: `d5678200bb`; apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`
- Conflicted path: `.xgd/tickets/hot/request-34dd9049.md` (UU, frontmatter only)
- Blobs: base `83ccab3f8f` / ours `b8dbec480f` / theirs `e9a54586b7`

### Analysis
- base→theirs: `updated_at`→08-24, `status` `ready_to_reconcile`→`bundled`, adds `bundled_in: bundle-b3b7c399`.
- base→ours: `updated_at`/`completed_at`→08-31, `status`→`free_and_reconciled`, adds the same `bundled_in: bundle-b3b7c399` (byte-identical).
- `git diff :2: xgd-working:<path>` is EMPTY. Ours is exactly incoming's own end state, so this pick is an intermediate step that incoming itself later moved past.

### Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain` empty), CHERRY_PICK_HEAD intact. No data loss: theirs' only non-timestamp fact (`bundled_in`) is already in ours, and its `status: bundled` was later replaced on xgd-working by `free_and_reconciled`.
