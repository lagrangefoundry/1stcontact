---
uid: report-bfb8e4a1
id: REPORT-2710
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:38:14.293866+00:00'
updated_at: '2026-08-31T05:38:14.293866+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-bec9d101.md` — **AA (both added)**, intent/bookkeeping
  ticket (`request-*`). Rules applied: **2b** (both added, one side strictly a
  superset → keep the superset) reinforced by **2e** (incoming only added a field
  the other side never touched → keep the superset). Resolved with
  `git checkout --theirs`, staged with `git add --sparse` (path is under
  `.xgd/tickets/`, outside the sparse-checkout cone — DOC-986 §2/§4.1).

  **Why theirs, unambiguously.** The two blobs are byte-identical except for a
  single added line in `fields:`:

  ```
  +  chat_comment: comment-c17c03e1
  ```

  Ours (stage 2) `f2e76e3a` vs theirs (stage 3) `44d633f0` — no other hunk, no
  competing edit to any shared field. There is no per-fact conflict to arbitrate:
  incoming is a strict superset, so taking it discards nothing from the HEAD side.

  Three independent signals converge on the same resolution:
  1. **Superset** — every byte of ours is contained in theirs.
  2. **Timestamp** (the enrichment block's stated rule for unknown-intent sides):
     incoming `c2c0e007` `2026-08-23 12:40:40 -0700` is later than the HEAD-side
     commit `c8de6708` `2026-07-28 20:38:31 -0700`
     (`xgd: sync from xgd-working d3562e3b8285 (post-watermark)`).
  3. **Reconcile hard rule** — incoming is the `free_coded` developer side and is
     authoritative.

## Incoming changes preserved

- `.xgd/tickets/hot/request-bec9d101.md` — **confirmed by hash, not by eye.**
  The resolved working-tree file hashes to `44d633f0574f51cf06d55d372f339c8d22ff9fc4`,
  exactly equal to the incoming (stage 3) blob. The incoming commit `c2c0e007`
  touches only this one file, so its entire diff is present in the resolution.
  Field-level spot check confirms `chat_comment: comment-c17c03e1` at line 28,
  alongside the pre-existing `version: 0.0.96` / `bundled_in: bundle-d9c2e655` /
  `status: free_and_reconciled` carried over from the HEAD side.

- No hunks were dropped. The BUG-1301 PRECEDENCE exception was **not** invoked —
  nothing was deleted, and no UAT or test function was touched by this conflict.

- No code/implementation files were involved (`xgd_source/**`, `tests/**`,
  `bin/**`, `*.py`, packages source): the cherry-picked commit is a single-file
  ticket-bookkeeping update.

## Post-merge review flag

The enrichment block classified intent as unknown on one or both sides and asked
that the file be flagged for post-merge review. Flagging it here for completeness,
though the risk is negligible: the resolution is a pure single-field addition with
zero divergence on any other line, so there is no discarded content for a reviewer
to recover.

## State on exit

- `git ls-files -u` → empty (no unmerged paths remain).
- `git status --porcelain` → `M  .xgd/tickets/hot/request-bec9d101.md` (staged).
  Remaining `??` entries are pre-existing untracked hot tickets, unrelated to this
  conflict and deliberately left alone.
- `CHERRY_PICK_HEAD` still present at `c2c0e007cbe01c0a23177e89da04392248b7b6b5` —
  the sequencer state is intact for `cherry_pick_finalize_resolution`. No
  `--continue` / `--skip` / `--quit` / `--abort` / `reset` / `checkout <branch>`
  was issued.
