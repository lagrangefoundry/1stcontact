---
uid: report-3b9acb1e
id: REPORT-4631
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:46:25.523810+00:00'
updated_at: '2026-09-21T04:46:25.523810+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e** (later-positioned intent, per fact).
  Sole conflict hunk was four frontmatter lifecycle fields; the entire body and
  all other frontmatter (including `fields.commits`, `orphan_commits`,
  `merged_at_commit`, `result: pass`) merged without conflict.

  | field | resolved (HEAD) | incoming (22c666b6fb) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-09-02T01:34:00Z` | `null` |
  | `updated_at` | `2026-09-02T01:34:36Z` | `2026-08-31T21:51:22Z` |
  | `last_field_updated` | `result` | `status` |

  Both sides changed the *same* fact (the lifecycle status and its stamp
  fields), so this is a genuine intent conflict rather than disjoint edits —
  2e's per-fact later-intent rule applies, and HEAD wins.

  Staged via `git add --sparse` (path is outside the sparse-checkout cone on
  this resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

No incoming change was discarded. Ledger replay on both sides
(`xgd ticket history request-13a5e206` vs `--rev $CHERRY_PICK_HEAD`) shows the
incoming commit `22c666b6fb` performs exactly one operation:

    free_coded -> ready_to_reconcile   (2026-08-31T21:51:22Z)

HEAD's ledger already contains that transition and continues past it —
`ready_to_reconcile` -> ... -> `reconciling` -> `free_and_reconciled`, adding
`completed_at` and `result: pass` on 2026-09-01/02. The incoming edit is
therefore a strictly earlier point on the same lifecycle path HEAD has already
traversed, not a competing or disjoint fact. Taking HEAD supersedes it rather
than dropping it; taking the incoming side would have regressed a completed,
reconciled ticket back to pending-reconcile.

The resolution is corroborated by the unconflicted portion of the same file,
which HEAD and incoming agree on: `result: pass`, `merged_at_commit`, and the
"What landed (free-coded, 2026-08-31)" body section are all present on both
sides and are consistent only with the `free_and_reconciled` state.

No code/implementation files were in conflict, so no BUG-1301 precedence
exception was invoked and no test function was deleted.

## Staging state

`git ls-files -u` is empty; no conflict markers remain in the file. The staged
tree is identical to HEAD (the resolution reproduces HEAD exactly), so
`git status --porcelain` is empty and the cherry-pick of `22c666b6fb` is now an
empty patch. `CHERRY_PICK_HEAD` is intact and untouched — no `--continue`,
`--skip`, `--quit`, or `--abort` was issued; the finalize step owns that.
