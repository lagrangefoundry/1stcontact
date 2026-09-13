---
uid: report-929bb38a
id: REPORT-4141
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:33:21.445642+00:00'
updated_at: '2026-09-13T21:33:21.445642+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, sparse-excluded (staged with
  `git add --sparse` per DOC-986 §2/§4.1). Rule **2e** (intent/bookkeeping
  ticket, `bundle-*`), per-fact timeline resolution. Resolution: take **ours**.

  Single conflict region, 4 scalar facts, all one coherent lifecycle fact:

  | fact | ours (HEAD) | theirs (incoming `e126b1aa2b`) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:23:04Z` | `2026-08-31T05:05:42Z` |
  | `completed_at` | `2026-08-31T14:22:24Z` | `null` |
  | `last_field_updated` | `result` | `status` |
  | `status` | `free_and_reconciled` | `reconciling` |

  Ours is the strictly-later position on the same bundle state machine
  (`ready_to_reconcile` → `reconciling` → … → `free_and_reconciled`), and its
  intent commits are later in wall-clock time: HEAD's `a0b52c93a6`
  (2026-08-31T07:22:25-07:00) and `8e07e6015d` (07:23:04-07:00) vs incoming's
  2026-08-30T22:05:42-07:00. Everything else in the file — the whole `fields:`
  block (`commits`, `orphan_commits`, `merged_at_commit:
  eef7a8b48bfa15c54b64db9541a0e781a016ba9e`), `result: pass`, and the body —
  auto-merged from HEAD; incoming touched none of it.

  `checkout --ours` proven lossless before applying: `git diff HEAD -- <path>`
  showed marker-only hunks, and `git rev-parse HEAD:<path>` equals the stage-2
  blob `bb444506b8` byte-for-byte.

## Incoming changes preserved

Incoming's changes are present in HEAD's history via a different route — this
is the redundant-commit case (BUG-1109/BUG-1122), not a discard, so STEP 3's
guard is satisfied on the "present via a different route" branch.

Proof: incoming `e126b1aa2b`'s blob for this path is
`a9979c2f4ef416d792af6e0f6a1b0ec58c67a544`. The HEAD-side commit
`4b7f40157dfdfb2f5c2471c5e328a799f617464f` — *"xgd(ticket):
seed_local_overlay bundle bundle-b3b7c399"*, 2026-08-30T22:06:20-07:00, i.e.
38 seconds after the incoming commit — created this ticket on the reconcile
branch with blob `a9979c2f4e`, **byte-identical to incoming's stage-3 blob**.
So the entirety of incoming's content (`status: reconciling`, `updated_at:
2026-08-31T05:05:42Z`) landed on HEAD verbatim via the seed overlay, and HEAD
then legitimately advanced the same facts onward to `free_and_reconciled`.

The conflict exists only because the merge base (stage 1, `e19fcb1e7e`) is the
pre-incoming version while HEAD has moved past the incoming state.

No code/implementation files were in this conflict set; no BUG-1301 precedence
exception was invoked; no test function was deleted.

## Staging state

`git status --porcelain` is empty and `git diff --cached --stat HEAD` is empty:
the resolution nets to no diff vs HEAD, as expected for a redundant commit. Per
STEP 4 this is **not** a failure and `--skip` was **not** called — the finalize
step (`cherry_pick_finalize_resolution`) will detect the clean staged diff and
skip the commit. `CHERRY_PICK_HEAD` verified still present.

## Post-merge review flag

Flagged per the enrichment's "Intent unknown on one or both sides" rule: the
resolution was decided by commit timestamp plus bundle-lifecycle ordering
rather than by an `xgd working-timeline` intent lookup. The conclusion is
nonetheless strongly corroborated by the byte-identical seed-overlay blob
above.
