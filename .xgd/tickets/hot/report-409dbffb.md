---
uid: report-409dbffb
id: REPORT-5991
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:00:23.977817+00:00'
updated_at: '2026-10-04T22:00:23.977817+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` (UU, intent/bookkeeping ticket, §2e). Took `--ours`. The result has zero net change from HEAD.
  - Pick: `9099dbbd88` (2026-08-23 19:10:41 -0700). Base `3c988c82b1` is the previous pick's (`95ffc177ff`) theirs blob. Ours `2a61089c0d` is unchanged and equals `HEAD:<path>`.
  - Theirs `196bd2905a` changes three things relative to base: `updated_at` → 08-24T02:10:41, `status` `ready_to_reconcile` → `bundled`, and it adds `bundled_in: bundle-b3b7c399`.
  - Ours already has the same `bundled_in: bundle-b3b7c399` line. On every other field ours is ahead: `updated_at`/`completed_at` 08-31T14:22:44 and `status: free_and_reconciled`.
  - Ours is byte-identical to the xgd-working tip (`b25c481f5a`, 08-31), so this pick's write was superseded by the incoming branch itself.

## Incoming changes preserved

There are no code files. The only fact theirs adds (`bundled_in`) is already present on ours. Theirs' `status`/`updated_at` values are intermediate states that incoming's own later commit `b25c481f5a` replaced.

## Forecast

The remaining pick on this path is `b25c481f5a`. Its blob equals ours, so it should auto-merge or resolve `--ours` with no exception.
