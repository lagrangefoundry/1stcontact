---
uid: report-e548172d
id: REPORT-5754
type: report
title: 'Resync resolve conflicts: bundle-4ff83a8b (24841942be)'
created_by: xgd
created_at: '2026-09-30T15:35:05.000111+00:00'
updated_at: '2026-09-30T15:35:05.000111+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-4ff83a8b.md` — intent/bookkeeping ticket (bundle), **AA** (both added), rule **2b/2e**. Resolved to the **incoming** side (`git checkout --theirs` + `git add --sparse`).

  **Why AA and not UU:** the incoming commit's parent is `0d11a0146e`
  (`xgd(resync): strip .xgd/tickets, .xgd/config.yaml, … from main snapshot (BUG-904)`),
  which deletes the whole ticket tree. So the cherry-pick base has no version of
  this file at all, and git reports both sides as additions. The absent base is a
  strip artifact, not a real divergence.

  **The two sides are not divergent — they are consecutive.** Both histories share
  `0716b05e77 xgd(ticket): update bundle bundle-4ff83a8b`, and:

  | side | blob | relation |
  |---|---|---|
  | `0716b05e77:.xgd/tickets/hot/bundle-4ff83a8b.md` | `4d8a8f1feb` | shared ancestor |
  | ours / HEAD (`:2`) | `4d8a8f1feb` | **byte-identical to the shared ancestor** |
  | theirs / incoming (`:3`) | `e29c0658de` | ancestor + one later edit |

  HEAD contributed **nothing** after `0716b05e77` — `git rev-parse
  0716b05e77:<path>` returns exactly the `:2` blob. There is therefore no
  competing fact to weigh: incoming is a strict linear successor, and taking it
  discards no HEAD-side work.

  **Incoming's total delta** against that shared ancestor is 4 lines in the front
  matter, all lifecycle bookkeeping:

  | fact | ours = shared ancestor (`:2`) | theirs / incoming (`:3`) |
  |---|---|---|
  | `updated_at` | 2026-08-05T17:40:06.518990 | **2026-09-17T20:19:11.714112** |
  | `last_field_updated` | `result` | **`status`** |
  | `status` | `free_and_reconciled` | **`ready_to_reconcile`** |
  | `completed_at` | 2026-08-05T17:38:07.508525 | = ours (untouched) |

  Body (2160 lines of bundled BUG-12…BUG-16 + 11 more narrative), `fields.commits`,
  `merged_at_commit`, `auto_merge_back`, `priority`, `result: pass` — all
  byte-identical on both sides. `diff` between the two blobs is exactly the three
  changed lines above; nothing else in the file differs.

  **On the apparent status regression** (`free_and_reconciled` →
  `ready_to_reconcile`): this is not a resync-induced rollback. `free_and_reconciled`
  is the state recorded by `0716b05e77`, i.e. it is the *older* of the two facts, and
  the developer's own xgd-working commit `24841942be` (2026-09-17) deliberately moved
  the bundle back to `ready_to_reconcile` six weeks later. `completed_at` is left at
  its 2026-08-05 value on both sides as the historical record of the first
  reconciliation. Under 2e the later-positioned intent wins per fact, and here every
  contested fact is later on the incoming side — which is also the only side that
  edited anything. Keeping ours would have re-asserted a state the developer
  explicitly superseded.

  Contrast with the earlier `bundle-8e1807f6` series on this resync run (REPORT-5748
  and siblings), where HEAD *had* moved on independently (HEAD `updated_at`
  2026-09-19 > incoming 2026-09-17, plus HEAD-only `orphan_commits` /
  `regression_anchor_uid` / `session_assessor` fields) and `--ours` was correct. The
  lifecycle status alone is not the discriminator in either case; the blob-level
  ancestry is.

## Incoming changes preserved

Staged blob is `e29c0658def5d580997a684d6e6f16ff782566dd` — byte-identical to
`24841942be:.xgd/tickets/hot/bundle-4ff83a8b.md`. Every incoming change is present
verbatim; no hunk dropped, so the BUG-1301 precedence exception does not apply.

No code, test, or matrix files were in this conflict — the cherry-pick touches
exactly one path.

`git status --porcelain` after staging: `M  .xgd/tickets/hot/bundle-4ff83a8b.md`
(no UU/AA/DU/UD lines remain). `CHERRY_PICK_HEAD` left intact at `24841942be`
for `resync_cherry_pick_finalize_resolution`.
