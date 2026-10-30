---
uid: report-b8a915c5
id: REPORT-6288
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:29:24.776224+00:00'
updated_at: '2026-10-05T03:29:24.776224+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — bug-3ade1af4 / 3fc6491817

**Pick:** `3fc6491817` xgd(ticket): create bug bug-3ade1af4 (2026-09-01 12:01:30 -0700)
**Path:** `.xgd/tickets/hot/bug-3ade1af4.md` — AA (base absent: BUG-904 ticket-tree strip artifact)
**Resolution:** `--ours`, zero net change from HEAD `1543af3c11`.

### Evidence
- `:2:` ours `4b1ec9bd2a` == `HEAD:<path>` (09-19 `free_and_reconciled`, `completed_at` 09-14).
- `:3:` theirs `a92ed3206a` is the creation-time stub: `title: Untitled`, `status: draft`,
  `completed_at: null`, body `(new ticket)`. `git diff :3: :2: | grep '^-'` shows only those
  stub values — every one superseded by later incoming commits that ours already carries.
- `git diff :2: xgd-working:<path>` (tip blob `3f23e96b90`) is a single line: `updated_at`
  09-19T15:15:46.300383 vs ours' 15:15:31.624433 (14.7 s). Incoming's own tip has the same
  title, body, lifecycle and `completed_at` as ours.

### Forecast
Later picks on this path are `--ours` except the tip (09-19 08:15:46 -0700), which wins
`updated_at` alone. Same blobs and outcome as REPORT-5873 / REPORT-6118.
