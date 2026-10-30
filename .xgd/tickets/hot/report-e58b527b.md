---
uid: report-e58b527b
id: REPORT-6342
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:02:12.420398+00:00'
updated_at: '2026-10-05T04:02:12.420398+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

- Pick: `d1d63bebd3` "xgd(ticket): create request request-8b33a146" (2026-09-01). It touches only `.xgd/tickets/hot/request-8b33a146.md`.
- Type: AA (added by both). This is a ticket path, not code.

## Evidence

- Theirs (`e3626c4dfa`) is the initial create stub: `title: Untitled`, `status: draft`, body `(new ticket)`.
- Ours (`d6fbb21c84`) is the full REQ-172 ticket ("Library detail: render documents inline, with an expand-to-modal reader"). It is `free_and_reconciled`, `updated_at` 2026-09-19, and carries the commits, version 0.2.37 and `bundled_in: bundle-8e1807f6`.
- HEAD's history for this path is 4e1f573fd5 (A, seed_local_overlay, 09-11), then 4f7e3ca510 (09-17), then 679bec6ef0 (update, 09-19). Ours is the later lifecycle state of the same ticket. Theirs adds nothing that ours lacks: every field in the stub is either kept unchanged in ours or replaced by a later value.

## Resolution

`git checkout --ours` + `git add --sparse`. **Zero net change**: the pick is empty against HEAD. Taking theirs would have reset a reconciled REQ-172 back to an untitled draft and deleted its whole body.

No post-merge review needed. The metadata's "take the more recent commit by timestamp" rule also selects ours (09-19 vs 09-01).
