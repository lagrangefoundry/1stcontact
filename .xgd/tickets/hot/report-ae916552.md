---
uid: report-ae916552
id: REPORT-5307
type: report
title: 'Report: code_review for bundle-b3b7c399'
created_by: xgd
created_at: '2026-09-28T06:54:26.938414+00:00'
updated_at: '2026-09-28T06:54:26.938414+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-b3b7c399
---

# Resolver report — bundle-b3b7c399 ticket conflict

## Conflict

Cherry-pick of `e126b1aa2b` (`xgd(ticket): update bundle bundle-b3b7c399`, author
date 2026-08-30) onto HEAD `c88aed46b0` on branch `resync-377b581e`.

Single unmerged path:

    UU .xgd/tickets/hot/bundle-b3b7c399.md

Unlike the two preceding ticket conflicts in this run, this file *was* materialised
on disk with real conflict markers (lines 8–18), even though `.xgd/tickets` is
outside the sparse-checkout cone.

## Analysis

The incoming commit is tiny — its entire diff is two frontmatter lines:

    -updated_at: '2026-08-31T05:04:25.053677+00:00'
    +updated_at: '2026-08-31T05:05:42.342274+00:00'
    -status: ready_to_reconcile
    +status: reconciling

Git widened that into a four-line conflict hunk because ours changed the two
adjacent lines (`completed_at`, `last_field_updated`) as well:

| field                | base (1)              | ours (2)                     | incoming (3)          |
|----------------------|-----------------------|------------------------------|-----------------------|
| `updated_at`         | 2026-08-31T05:04:25   | **2026-08-31T14:23:04**      | 2026-08-31T05:05:42   |
| `completed_at`       | `null`                | **2026-08-31T14:22:24**      | `null`                |
| `last_field_updated` | `status`              | **`result`**                 | `status`              |
| `status`             | `ready_to_reconcile`  | **`free_and_reconciled`**    | `reconciling`         |

Both sides advanced the same base along the same lifecycle path:

    ready_to_reconcile  →  reconciling  →  free_and_reconciled
    (base)                 (incoming)       (ours)

Ours is strictly further along, has the newer `updated_at` (14:23 vs 05:05), and
additionally carries a non-null `completed_at`. The incoming side contributes **no
developer intent** — its entire delta is an intermediate status the bundle has
since passed through.

The rest of the file is decisive corroboration, and it merged cleanly (so it never
surfaced as a conflict). Incoming still carries the bundle's ~100 open per-commit
entries:

      - working_sha: de2e299302…
        reconcile_sha: null
        main_sha: null
        working_sha_history: []
      … ×100

Ours has collapsed all of them into the single reconciled end state:

      - working_sha: null
        reconcile_sha: null
        main_sha: eef7a8b48bfa15c54b64db9541a0e781a016ba9e

That collapse is precisely what `free_and_reconciled` means. Taking incoming for
the frontmatter hunk would have left a ticket whose `status` said `reconciling`
while its `commits` list said the reconcile had already finished — an internally
inconsistent ticket, with `completed_at` nulled out.

## Resolution

Took **ours** in full.

    git checkout --ours --ignore-skip-worktree-bits -- .xgd/tickets/hot/bundle-b3b7c399.md
    git add --sparse -- .xgd/tickets/hot/bundle-b3b7c399.md

Two sparse-cone notes, both of which cost a failed attempt here:

- `git checkout --ours` **without** `--ignore-skip-worktree-bits` prints a
  `paths … outside of your sparse-checkout definition` hint and does not update
  the index. (`git checkout` has no `--sparse` flag — that spelling is `git add`'s.)
- `git add` without `--sparse` then silently refuses the same path and leaves all
  three stages in place.

Verified: no unmerged stages remain, zero conflict markers in the staged blob, and
`git diff --cached HEAD` is empty for this path — stage 0 is ours exactly, not a
hand-merged hybrid.

## Note for the sequencer

`git diff --cached HEAD` is now **empty**, so the pick has become a no-op: HEAD
already contains a strictly later state of this ticket. This is the expected
empty-cherry-pick shape, not a lost change. Disposition (`--skip` vs
`--continue --allow-empty`) is the sequencer's call; the resolver did not advance
it, and `CHERRY_PICK_HEAD` is still live at `e126b1aa2b`.
