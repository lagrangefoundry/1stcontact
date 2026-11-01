---
uid: report-f231a29e
id: REPORT-991
type: report
title: 'Resolve conflicts: reconcile-BUG-5'
created_by: xgd
created_at: '2026-07-27T21:03:45.584310+00:00'
updated_at: '2026-07-27T21:03:45.584310+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUG-5
---

## Files resolved

- **`.xgd/tickets/hot/bug-5b7153d2.md`** — bug ticket (bookkeeping/intent type, but under
  `.xgd/tickets/hot/`, not the `.xgd/tickets/open/` path that STEP 3c matches on — see
  "Flagged for post-merge review" below).
  **Rule applied**: the conflict-intent enrichment supplied for this exact file —
  _"Intent unknown on one or both sides. Take the more recent commit by timestamp and flag
  this file for post-merge review."_ Both sides carried the identical subject
  `xgd(ticket): update bug bug-5b7153d2`, so neither side's intent was determinable from
  the trailer.

  **What the two sides actually contained** (diffed against the merge base, stage 1):
  - Ours (rebase target `19f93f451`): added `fields.orphan_commits`
    (`old_sha: f0f35da9…` → `new_sha: ae35f660…`). No other change.
  - Theirs (replayed `357a7f01f`): bumped `updated_at`
    `2026-07-27T20:32:36.092280+00:00` → `2026-07-27T20:32:45.517151+00:00`. No other
    change — `git show --stat` confirms 1 file, 1 insertion, 1 deletion.

  The two hunks were disjoint (line 9 vs. line 24) and semantically independent, so this
  was a false conflict on a machine-generated YAML file rather than a real disagreement.
  **Resolution**: kept `orphan_commits` from ours AND the more-recent `updated_at` from
  theirs — satisfying the timestamp rule without discarding the non-overlapping addition.
  Frontmatter re-parsed with `yaml.safe_load` post-resolution to confirm validity.

No implementation files, UAT files, spec tickets, or config files were in conflict.

## Rebase status

**Completed.** An interactive rebase onto `19f93f451` was paused at commit 1/40
(`357a7f01f`) with the above file at three index stages. After resolution and
`git add`, `git rebase --continue` replayed the remaining 39 commits with no further
conflicts. Final `HEAD` = `3eb82c790`.

Verification at the end of this state:
- `rebase-merge` / `rebase-apply`: both absent
- `git ls-files -u`: 0 unmerged stages
- `git status --porcelain`: empty
- `git grep` for `^<<<<<<<|^=======|^>>>>>>>` across tracked files: no hits

**Note on committing**: the instruction not to commit could not apply to this resolution.
`git rebase --continue` necessarily commits the resolved conflict to proceed — the
resolution is therefore already captured inside the rebased commit `b328148f9`
(later rewritten as the rebase advanced), not left staged. Nothing remains in the
working tree or index, so this state's auto-commit step will find nothing to commit.
That is expected, not a failure.

## Timeline lookups

None fired. `xgd working-timeline` was not consulted: the STEP 3 timeline rules apply
when two sides modify the same content and one must be discarded. Here the sides'
changes were disjoint and both were preserved, so there was no side to choose between.
The timestamp ordering needed for the enrichment rule was read directly from the
conflicting `updated_at` values themselves (20:32:36 vs 20:32:45).

## Flagged for post-merge review

1. **`.xgd/tickets/hot/bug-5b7153d2.md`** — flagged as the enrichment rule directs
   (intent was unknown on both sides).

2. **Path-pattern near-miss worth checking.** STEP 3c says bug-type tickets under
   `.xgd/tickets/open/` use the `merge_ticket_recent` driver and that surviving conflict
   markers there mean the driver did not apply → exit `@fail`. This file is a `bug-*`
   ticket but lives under `.xgd/tickets/hot/`, so 3c's path pattern does not match it and
   that `@fail` route was not triggered. Given the conflict was disjoint, machine-generated
   and trivially resolvable, I resolved it under the file-specific enrichment rule rather
   than failing the state on a technicality. If `hot/` tickets are *intended* to be covered
   by the `merge_ticket_recent` driver, the `.gitattributes` path pattern likely needs
   `hot/` added — this conflict would otherwise not have surfaced at all.

3. **`fields.orphan_commits` is now stale.** Its `new_sha` (`ae35f66052e6…`) was commit
   2/40 in the rebase todo, so this very rebase rewrote it.
   `git merge-base --is-ancestor ae35f660… HEAD` reports NOT REACHABLE. The field exists to
   track a commit across a rewrite, and the rewrite invalidated it. I did not re-point it:
   that is a reconcile-workflow bookkeeping decision, not a conflict resolution, and
   guessing the new SHA would be outside this state's authority. Flagging it so a later
   phase can refresh the mapping if anything downstream consumes it.
