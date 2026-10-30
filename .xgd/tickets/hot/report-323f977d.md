---
uid: report-323f977d
id: REPORT-6294
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:33:06.512380+00:00'
updated_at: '2026-10-05T03:33:06.512380+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — bug-3ade1af4 (BUG-40) / cda495bd6e

Pick: `cda495bd6e` (09-01 12:15:17, draft→free_coding + first body draft).
HEAD `1543af3c11`. Conflicted path: `.xgd/tickets/hot/bug-3ade1af4.md` (UU, ticket path).

Blobs: base `c0df113819` (== previous pick 0170f868e2's theirs), ours `4b1ec9bd2a`
(== HEAD blob), theirs `164ba43c42`.

Evidence:
- `git diff :2: xgd-working:<path>` (tip `3f23e96b90`) is ONE line: `updated_at`.
  So xgd-working's own tip carries ours' title, body, commits, version,
  `bundled_in: bundle-8e1807f6`, `completed_at` and `status: free_and_reconciled`.
  Incoming itself replaced this pick's first body draft and its free_coding status.
- Theirs' values are earlier lifecycle and draft states of facts ours already holds.

Resolution: `--ours`, zero net change from HEAD. CHERRY_PICK_HEAD intact.

Forecast: the later bug-3ade1af4 picks up to the 09-19 tip are `--ours`. The tip
(updated_at 09-19T15:15:46.300383) is the exception and wins `updated_at` alone.
