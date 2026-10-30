---
uid: report-76c0be15
id: REPORT-6290
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:30:19.083370+00:00'
updated_at: '2026-10-05T03:30:19.083370+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — request-01ea4eec (REQ-155) / 25fa2b6593

Picked commit: `25fa2b6593` (2026-09-01 12:02:00 -0700), "xgd(ticket): update request request-01ea4eec".
HEAD `1543af3c11`. Path `.xgd/tickets/hot/request-01ea4eec.md`, `UU`.

Blobs: base `8bbbe467ab` / ours `e5c0842463` (== HEAD blob) / theirs `1c9ea6ce67`.

### Evidence
- base→theirs is frontmatter only: `updated_at` → 09-01T19:02:00, `last_field_updated` → status,
  `status` `free_coded` → `ready_to_reconcile`.
- ours carries the later lifecycle: `status: free_and_reconciled`, `completed_at` 09-14T10:29:15,
  `updated_at` 09-19T15:15:32.
- `git diff :2: xgd-working:<path>` is a single `updated_at` line (tip 15:15:50.66 vs ours
  15:15:32.21); incoming's own tip already sits past this pick's `ready_to_reconcile` state.

### Resolution
`--ours` (`git checkout --ours` + `git add --sparse`). Zero net change from HEAD;
`git status --porcelain` empty, CHERRY_PICK_HEAD intact. No data lost: theirs' only facts are
superseded by incoming's own later commits, which ours already reflects.

### Forecast
Later REQ-155 picks before the tip are expected `--ours`; the xgd-working tip wins `updated_at`
only (18.4 s).
