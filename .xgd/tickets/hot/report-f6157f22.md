---
uid: report-f6157f22
id: REPORT-4119
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:55:54.876173+00:00'
updated_at: '2026-09-12T19:55:54.876173+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` (BUG-38) — **UU**, index-only conflict
  (path is outside the sparse-checkout cone, so there were no working-tree
  markers; resolved via `git checkout --ours --ignore-skip-worktree-bits`
  + `git add --sparse`).
  - File class: intent/bookkeeping ticket (`bug-*`), so **rule 2e** applies,
    not 2d — there is no matrix/ledger narrative to replay.
  - The conflict is **frontmatter-only**: the prose body (Symptom / Root cause /
    Fix / Test plan) is byte-identical across all three stages. Diffing `:2:`
    against `:3:` yields exactly four differing lines.
  - Per-fact resolution (2e), every fact resolved the same way — **take ours**,
    which is the later-positioned intent on all four:

    | fact | base (`:1:`) | incoming (`:3:`) | ours (`:2:`, kept) |
    |---|---|---|---|
    | `status` | `free_coded` | `ready_to_reconcile` | `free_and_reconciled` |
    | `updated_at` | 08-24 22:19 | 08-25 22:52 | **08-31 19:19** |
    | `completed_at` | null | null | 08-31 19:19 |
    | `bundled_in` | — | — | `bundle-78f4e2fe` |

  - No disjoint edits existed to combine: incoming touched no field that ours
    did not also touch and carry further, and incoming was a superset on
    nothing. `last_field_updated: status` is identical on both sides.
  - This matches the auto-enriched intent metadata's rule for this file
    ("intent unknown on one or both sides — take the more recent commit by
    timestamp"): ours `01492336ad` (08-31 12:19) is more recent than incoming
    `0431fed4c6` (08-25 15:52). **Flagged for post-merge review** per that rule.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket. The incoming commit `0431fed4c6` changed only three
frontmatter lines (`status`, `updated_at`, `completed_at`); it touches no
source, test, or config file (`git show --stat` confirms: 1 file, 3 insertions,
3 deletions, all in this ticket).

The incoming commit's key change — the `free_coded → ready_to_reconcile`
transition — **is present in HEAD via a different route**, so this is a
redundant commit (STEP 4), not a discard (STEP 3). Evidence from HEAD's history
of this file:

- `cbdfed2e2d` *seed_local_overlay* (08-31 07:24) created the file already at
  `status: bundled`, `updated_at: 2026-08-26T17:36`, with
  `bundled_in: bundle-78f4e2fe`. That seeded snapshot is taken from the working
  timeline at a point strictly **after** the incoming commit's
  `ready_to_reconcile` (08-25 22:52), so it subsumes that transition along with
  everything between.
- `01492336ad` (08-31 12:19) then advanced `bundled → free_and_reconciled`.

Taking incoming here would have regressed a completed, bundled ticket back to
`ready_to_reconcile`, cleared `completed_at`, and dropped `bundled_in` — i.e.
replaying a superseded state transition over its own successor.

No hunk was dropped under the BUG-1301 precedence exception; no test function
was deleted.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged
entries. The staged tree is identical to HEAD (`git diff --cached HEAD` is
empty) because ours was taken verbatim — expected for a superseded bookkeeping
commit, and left for the finalize step to skip. `CHERRY_PICK_HEAD`
(`0431fed4c6`) is intact; no cherry-pick state transition was performed.
