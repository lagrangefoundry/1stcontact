---
uid: report-b1e1a807
id: REPORT-3114
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:37:22.742294+00:00'
updated_at: '2026-08-31T22:37:22.742294+00:00'
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

  Incoming commit `d13c42a5` (2026-08-27 20:59:15 -0700), 2 insertions / 2 deletions, this
  file only. Single conflict hunk (one `<<<<<<<`, at frontmatter line 8), four coupled facts:

  | fact | HEAD (2026-08-31 07:23 -0700, `8e07e601`) | incoming (`d13c42a5`) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:23:04.453705+00:00` | `2026-08-28T03:59:15.785100+00:00` |
  | `completed_at` | `2026-08-31T14:22:24.820529+00:00` | `null` |
  | `last_field_updated` | `result` | `status` |
  | `status` | `free_and_reconciled` | `reconciling` |

  Both sides rewrote the identical four lines, so there is no disjoint fact to combine and
  no superset to keep — the "apply BOTH" and "keep the superset" branches of 2e do not
  apply. The conflict enrichment reported intent unknown on both sides, whose rule is "take
  the more recent commit by timestamp": HEAD is 3 days later.

  Corroborating, as in scope 302/0: this ticket is **BUNDLE-20**, a different bundle from
  the one being reconciled (BUNDLE-22 / `bundle-8eef3846`). HEAD records BUNDLE-20 in its
  terminal reconcile state — `status: free_and_reconciled`, `completed_at` set, commits list
  collapsed to a single entry carrying `main_sha: eef7a8b4`. Incoming sets an earlier
  lifecycle stage. Taking incoming would roll a bundle that has already landed on main back
  to `reconciling`, a bookkeeping regression rather than a developer intent to preserve.

  Mechanism: `git checkout --ours` was exact rather than approximate — this hunk is the
  file's only conflict (verified: exactly one `<<<<<<<` marker in the 146 KB file), so
  stage 2 is precisely the intended resolution. Staged with `git add --sparse`.

  Note this is the **second consecutive** commit in this bundle's cherry-pick sequence to
  conflict on this same file with the same shape — scope 302/0 resolved `726b77db`
  (`reconciling` → `ready_to_reconcile`) identically. The two are adjacent working-timeline
  commits 2 minutes apart, each stepping BUNDLE-20's status field, and HEAD's state
  post-dates and supersedes both.

## Incoming changes preserved

No code/implementation files were in this conflict, so STEP 3's code-file guard does not
apply. For completeness on the one bookkeeping file:

The incoming commit's entire diff is the four-fact frontmatter update above — a step of
BUNDLE-20's lifecycle to `reconciling` as of 2026-08-27. That intent is present in HEAD in a
strictly further-advanced form: BUNDLE-20 subsequently progressed past `reconciling` to
`free_and_reconciled` and completed, with its `main_sha` recorded. This is STEP 4's "already
landed through a different route" case (superseded), not STEP 3's discard case — the
incoming commit's effect is subsumed by HEAD rather than absent from it.

No hunks were dropped under the BUG-1301 precedence exception; no UAT or test files were
involved.

## Staging state

- `git ls-files -u` → empty (index fully merged).
- `git status --porcelain` → no conflict-class (UU/AA/DU/UD) lines; only pre-existing
  untracked `.xgd/tickets/hot/comment-*.md` files, untouched by this resolution.
- `git diff --cached HEAD` → empty. The resolution nets to no diff vs HEAD, the expected
  outcome when HEAD already holds the later state of every conflicting fact. Per STEP 4 this
  is not a failure and `--skip` was NOT called; the finalize step will detect the clean
  staged diff. `CHERRY_PICK_HEAD` (`d13c42a5`) is intact.
