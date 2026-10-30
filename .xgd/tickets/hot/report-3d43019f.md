---
uid: report-3d43019f
id: REPORT-5290
type: report
title: 'Resolver: bug-23d1ec27 ticket conflict (ours-wins, pick now empty)'
created_by: xgd
created_at: '2026-09-28T04:13:43.875581+00:00'
updated_at: '2026-09-28T04:13:43.875581+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: review
  subject_uid: bug-23d1ec27
---

# Resolver report — bug-23d1ec27 ticket conflict

## Conflict

Cherry-pick of `bffb6b34fa` (`xgd(ticket): update bug bug-23d1ec27`, author date
2026-08-26) onto HEAD `520209422f`, which carries the *same commit subject*.

Single unmerged path, index-only (`.xgd/tickets` is outside the sparse-checkout
cone, so no file was materialised and there were no on-disk conflict markers):

    UU .xgd/tickets/hot/bug-23d1ec27.md

## Analysis

Three-way stage comparison. The **body is byte-identical on both sides** — every
difference is in the frontmatter, and all of it is lifecycle timeline drift:

| field        | base (1)                       | ours (2)                       | incoming (3)                   |
|--------------|--------------------------------|--------------------------------|--------------------------------|
| `updated_at` | 2026-08-25T23:28:10            | **2026-08-31T05:05:09**        | 2026-08-26T18:31:09            |
| `status`     | `free_coded`                   | **`bundled`**                  | `ready_to_reconcile`           |
| `bundled_in` | (absent)                       | **`bundle-8eef3846`**          | (absent)                       |
| EOF newline  | missing                        | **present**                    | missing                        |

Both sides advanced the same base independently along the same lifecycle path:

    free_coded  →  ready_to_reconcile  →  bundled
    (base)         (incoming)              (ours)

Ours is strictly further along that path, has the newer `updated_at` (08-31 vs
08-26), and additionally carries `bundled_in: bundle-8eef3846`, which the
incoming side does not have. The incoming side contributes **no developer
intent** — its entire delta is an intermediate status the ticket has since
passed through.

Taking incoming would have regressed `bundled` → `ready_to_reconcile` and
dropped `bundled_in`, orphaning the ticket from its bundle.

## Resolution

Took **ours** in full.

    git checkout --ours -- .xgd/tickets/hot/bug-23d1ec27.md
    git add --sparse .xgd/tickets/hot/bug-23d1ec27.md

(`git add` without `--sparse` silently refuses a path outside the sparse cone and
leaves all three stages in place; `--sparse` was required to actually collapse
them to stage 0.)

Verified: no unmerged stages remain, and stage 0 is blob `52bab41f` — ours
exactly, no hand-merged hybrid.

## Note for the sequencer

`git diff --cached HEAD` is now **empty** — HEAD already contains this content, so
the pick has become a no-op. The incoming commit is an older duplicate of work
that a post-watermark sync already landed. This is the expected
empty-cherry-pick shape, not a lost change. Disposition (`--skip` vs
`--continue --allow-empty`) is the sequencer's call; the resolver did not advance
it.
