---
uid: report-572d8c90
id: REPORT-3113
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:35:54.132423+00:00'
updated_at: '2026-08-31T22:35:54.132423+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, class 2e (intent/bookkeeping ticket:
  `bundle-*`). Rule applied: same-field conflict → later-positioned side wins, per fact.
  Resolved to the **HEAD** side.

  Single conflict hunk (frontmatter lines 8–18), four coupled facts:

  | fact | HEAD (2026-08-31 07:23 -0700, `8e07e601`) | incoming (2026-08-27 20:57 -0700, `726b77db`) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:23:04.453705+00:00` | `2026-08-28T03:57:06.227175+00:00` |
  | `completed_at` | `2026-08-31T14:22:24.820529+00:00` | `null` |
  | `last_field_updated` | `result` | `status` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |

  Both sides modified the identical four lines, so there was no disjoint fact to combine —
  the "apply BOTH" and "keep the superset" branches of 2e do not apply. The conflict
  enrichment reported intent unknown on both sides, whose rule is "take the more recent
  commit by timestamp": HEAD is 3 days later.

  Corroborating: this ticket is **BUNDLE-20**, a different bundle from the one being
  reconciled (BUNDLE-22 / `bundle-8eef3846`). HEAD records BUNDLE-20 in its terminal
  reconcile state — `status: free_and_reconciled`, `completed_at` set, and its commits list
  collapsed to a single entry carrying `main_sha: eef7a8b4`. The incoming commit predates
  that and sets an earlier lifecycle stage. Taking incoming would roll a bundle that has
  already landed on main back to `ready_to_reconcile`, making it eligible for
  re-reconciliation. That is a bookkeeping regression, not a developer intent to preserve.

  Mechanism: `git checkout --ours` was exact rather than approximate here — this hunk is the
  file's only conflict (verified: 3 marker lines total), so stage 2 is precisely the
  intended resolution. Staged with `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in this conflict, so STEP 3's code-file guard does not
apply. For completeness on the one bookkeeping file:

The incoming commit's entire diff is the four-fact frontmatter update above — an advance of
BUNDLE-20's lifecycle to `ready_to_reconcile` as of 2026-08-27. That intent is present in
HEAD in a strictly further-advanced form: BUNDLE-20 subsequently progressed past
`ready_to_reconcile` to `free_and_reconciled` and completed, with its `main_sha` recorded.
This is STEP 4's "already landed through a different route" case (superseded), not STEP 3's
discard case — the incoming commit's effect is subsumed by HEAD rather than absent from it.

No hunks were dropped under the BUG-1301 precedence exception; no UAT or test files were
involved.

## Staging state

- `git ls-files -u` → empty (index fully merged).
- `git status --porcelain` → no conflict-class (UU/AA/DU/UD) lines; only pre-existing
  untracked `.xgd/tickets/hot/comment-*.md` files, untouched by this resolution.
- `git diff --cached HEAD` → empty. The resolution nets to no diff vs HEAD, which is the
  expected outcome when HEAD already holds the later state of every conflicting fact.
  Per STEP 4 this is not a failure and `--skip` was NOT called; the finalize step will
  detect the clean staged diff. `CHERRY_PICK_HEAD` (`726b77db`) is intact.
