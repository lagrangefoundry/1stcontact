---
uid: report-51b97b27
id: REPORT-5456
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:36:32.782651+00:00'
updated_at: '2026-09-29T04:36:32.782651+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2e — lives in `hot/` but is not one of the matrix-defining
  `story|acceptance_criterion|capability` kinds, so 2d ledger-replay does not
  apply). Outside the sparse-checkout cone (11% checkout, `!/.xgd/tickets/**`),
  so the conflict existed only in the index with no working-tree markers;
  resolved in-index via `git update-index --cacheinfo` against the stage-2
  (ours) blob `e2c2f78b`, then `git sparse-checkout reapply` to restore the
  skip-worktree bit. Index entry now reads stage 0 = `e2c2f78b`.

  Per-fact resolution (2e: non-overlapping → both; same fact differing →
  later-positioned intent wins, per fact). The Markdown body is byte-identical
  on all three stages; the conflict is entirely in the YAML frontmatter:

  | fact | base | ours (HEAD) | theirs (CPHEAD) | resolution |
  |---|---|---|---|---|
  | `last_field_updated` | `story_points` | `status` | `status` | identical — no conflict |
  | `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` | **ours** (later intent) |
  | `updated_at` | 2026-09-01T18:57:59 | **2026-09-19T15:15:32** | 2026-09-01T19:02:00 | **ours** (later intent) |
  | `completed_at` | null | `2026-09-14T10:29:15` | *(untouched)* | **ours** (ours-only fact) |
  | `bundled_in` | *(absent)* | `bundle-8e1807f6` | *(untouched)* | **ours** (ours-only fact) |

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` check is about
intent facts rather than code hunks. Verified against
`git show 25fa2b6593 -- .xgd/tickets/hot/request-01ea4eec.md`: the incoming
commit touches exactly three frontmatter facts — `updated_at`,
`last_field_updated`, `status`.

- `last_field_updated` → `status`: present in the resolved file (both sides
  agree).
- `status` → `ready_to_reconcile` and `updated_at` → 2026-09-01T19:02: these
  are the *same facts* that HEAD carries at a strictly later intent position
  (2026-09-19T15:15, `free_and_reconciled`). REQ-155's lifecycle ran
  `free_coded → ready_to_reconcile → … → free_and_reconciled`; HEAD is two-plus
  weeks and several transitions past the incoming state, and additionally
  carries `completed_at` (2026-09-14) and `bundled_in: bundle-8e1807f6`, which
  the incoming side lacks. Taking the incoming value would *regress* the
  ticket's lifecycle.

No hunk was dropped under the BUG-1301 precedence exception — nothing here is a
deleted-target refactor. Every incoming fact is either preserved verbatim or
superseded on that same fact by a later-positioned intent, which is precisely
2e's stated rule for a genuine same-fact conflict. Nothing on the incoming side
is disjoint from HEAD and therefore nothing was silently discarded.

## State on exit

`git status --porcelain` is empty (no UU/AA/DU/UD lines, no unstaged changes).
`CHERRY_PICK_HEAD` remains present at `25fa2b6593`; no `--continue`, `--skip`,
`--quit`, or `--abort` was issued.

Note for the finalize step: because the resolution equals HEAD exactly
(`git diff HEAD` is empty — the incoming patch is fully superseded), this
cherry-pick has no net staged change and is expected to be skipped
automatically.
