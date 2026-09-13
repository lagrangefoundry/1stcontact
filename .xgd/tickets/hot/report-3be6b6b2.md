---
uid: report-3be6b6b2
id: REPORT-4145
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:45:31.252977+00:00'
updated_at: '2026-09-13T21:45:31.252977+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — UU, intent/bookkeeping ticket (rule 2e, bundle-*).
  Single conflict region: the ticket's lifecycle-status block (`updated_at`,
  `completed_at`, `last_field_updated`, `status`). Both sides changed the SAME
  fact differently, so the per-fact timeline rule applies:
    - OURS (HEAD, commit 2ca3de8c49 @ 2026-09-01T00:00:08Z):
      `status: free_and_reconciled`, `completed_at: 2026-08-31T23:59:50Z`
    - THEIRS (incoming 232a68212a @ 2026-08-31T19:21:08Z):
      `status: reconciling`, `completed_at: null`
  OURS is the later-positioned intent by ~4h39m, and matches the enrichment's
  fallback rule ("intent unknown on one or both sides — take the more recent
  commit by timestamp"). Resolved to OURS.

## Incoming changes preserved

Not a discard — HEAD already contains the incoming commit's effect, reached via
a different route:

- Hunk 1 (status transition to `reconciling`): HEAD's own lineage passed through
  exactly this state. `git log -S"status: reconciling"` on this file shows it
  introduced by the seed-overlay commit `42cb3bab68` (2026-08-31 16:52:27 -0700)
  and then superseded by `e9c19666d8` (16:59:50 -0700), which advanced the bundle
  to `free_and_reconciled` and stamped `completed_at`. Taking the incoming side
  would REWIND a completed bundle back to `reconciling`, regressing state rather
  than preserving developer intent.
- Hunk 2 (drop trailing newline after "Done, three UATs"): already present in
  HEAD. Verified byte-for-byte — stage :2: and stage :3: tails are identical
  (`... t h r e e   U A T s` with no terminating `\n`).

Losslessness of `checkout --ours` verified before staging: `diff` of stage :2:
against the marker-bearing merged working file showed ONLY the conflict-marker
lines and the incoming side's four status lines — no auto-merged incoming content
was silently dropped.

Result: staged diff vs HEAD is empty. This is the genuinely-redundant-commit case
(BUG-1109/BUG-1122), not a STEP 3 discard; `--skip` deliberately NOT called, per
STEP 4 the finalize step handles it.
