---
uid: report-cdaa6740
id: REPORT-3545
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:30:19.763748+00:00'
updated_at: '2026-09-09T22:30:19.763748+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` (REQ-151, "Site locale identity, and rendered lang/dir")
  — class **AA** (both added), intent/bookkeeping ticket → **rule 2e**, superset branch.
  Path is outside the sparse-checkout cone family, so resolved with
  `git checkout --ours` + `git add --sparse`.

  **Why ours:** the two blobs (`ad08332` ours / `0ce1e64` theirs) are **byte-identical in
  the body** — all 140+ lines of narrative, ACs, tests and origin match exactly. The entire
  diff is four frontmatter bookkeeping scalars, and on every one of them HEAD is the strict
  superset / later state:

  | field | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:31.114008+00:00` | `null` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |
  | `updated_at` | `2026-08-31T14:22:31.114008+00:00` | `2026-08-22T21:55:22.806967+00:00` |

  Theirs carries no field, section, or paragraph that ours lacks, so 2e's per-fact timeline
  rule never engages — there is no fact the two sides set differently, only facts HEAD has
  advanced past. Taking theirs would have reverted an operator/workflow-owned `status` from
  `free_and_reconciled` back to `ready_to_reconcile`, cleared `completed_at`, and dropped
  the `bundled_in: bundle-b3b7c399` linkage.

## Incoming changes preserved

No code/implementation files were in conflict — the cherry-picked commit
`61d15c3f` ("xgd(ticket): update request request-4fcbd354", Martin Westhead,
2026-08-23) touches exactly one path, this bookkeeping ticket, as a 167-line file add.

`git show 61d15c3f -- .xgd/tickets/hot/request-4fcbd354.md` contains nothing absent from
the resolution: the body is present verbatim, and the incoming frontmatter values are
**older readings of the same three facts HEAD already holds in advanced form**. This is
demonstrable, not inferred — the incoming side's `updated_at` of
`2026-08-22T21:55:22.806967+00:00` is exactly the state written by the HEAD-side commit
`793d0ed6` ("xgd(ticket): update request request-4fcbd354", 2026-08-22 14:55:23 -0700).
HEAD passed through the incoming state and then advanced past it via `a546588a`
(seed_local_overlay) and `dffe9ecb` (2026-08-31). So the incoming commit's effect is
already in HEAD by a different route.

Consequently `git diff --cached --stat` is empty: the resolution nets to no diff vs HEAD.
Per STEP 4 (BUG-1109/BUG-1122) this is a genuinely **redundant** commit, not a discarded
one, and is distinguished as such by STEP 3's test — the incoming commit's key changes are
*present in HEAD*, not merely absent. No `--skip` was issued; the staged tree is left for
`cherry_pick_finalize_resolution` to handle, with `CHERRY_PICK_HEAD` intact.

No BUG-1301 precedence exception was invoked, and no test function was touched.

Verification: `git status --porcelain` shows no UU/AA/DU/UD lines (only pre-existing
untracked `.xgd/tickets/hot/comment-*.md` / `report-*.md` and `.xgd/_changes/`), and
`grep -c '<<<<<<<'` on the resolved file returns 0.
