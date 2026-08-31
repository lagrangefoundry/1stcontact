---
uid: report-815c148c
id: REPORT-2977
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:46:47.664117+00:00'
updated_at: '2026-08-31T15:46:47.664117+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` (REQ-148) — class **UU**, intent/bookkeeping
  ticket → **rule 2e**, "one side is a strict superset of the other: keep the superset."
  HEAD (ours) kept.

  Three-way analysis (all three index stages compared; bodies byte-identical on every
  side, so the whole conflict is frontmatter):

  | | base (stage 1) | incoming (stage 3) | HEAD (stage 2) |
  |---|---|---|---|
  | `updated_at` | 2026-08-20T00:47:43 | 2026-08-24T01:14:11 | 2026-08-24T02:10:41 |
  | `last_field_updated` | status | commits | status |
  | `status` | ready_to_reconcile | ready_to_reconcile | bundled |
  | `fields.commits` | 2 entries | 1 entry (collapsed) | 1 entry (collapsed) |
  | `fields.bundled_in` | absent | absent | bundle-b3b7c399 |

  The incoming commit's only substantive edit is the `commits` collapse — folding the
  second entry (`055378794f49f1dc39b20fdcf54aa7fa0b1190e3`, empty
  `working_sha_history`) into the first entry's `working_sha_history`, between
  `ade64575a` and `a6e92ca26`. `git diff <theirs-blob> <ours-blob>` shows the
  `fields.commits` block as **context only** — HEAD already carries that exact
  collapse, verbatim.

  HEAD adds, on top of it, the bundling facts the incoming side never touched:
  `status: bundled` and `fields.bundled_in: bundle-b3b7c399`. No fact is set
  differently on the two sides — the residual `updated_at` / `last_field_updated`
  differences are write-derived bookkeeping, and HEAD is the later write
  (02:10 > 01:14), so its values are the correct ones. No per-fact timeline
  tiebreak was needed. Nothing was invented; no `intent_uid` / `story_uid` /
  `capability_uid` field was touched.

  The worktree copy already held the ours blob exactly
  (`7d5a83cab4d8492eccb829947df38e54e3dd40ba`) with no conflict markers written, so
  resolution was a stage-only operation: `git add --sparse -- <path>`.

## Incoming changes preserved

Confirmed. No code/implementation files were in conflict — the sole conflicted path
is a bookkeeping ticket — but the STEP 3 check was applied to it anyway:

- `.xgd/tickets/hot/request-7ae3c2cc.md` — the incoming commit
  (`7c91ff7863d18e670f6e27a9bfbfd993e556cd4a`, _xgd(ticket): update request
  request-7ae3c2cc_) changed exactly one thing, the `fields.commits` collapse
  described above, and that change **is present** in the resolved file. Verified
  directly: diffing the incoming blob against the resolved blob leaves the
  `fields.commits` block unchanged.

No hunk was dropped. The BUG-1301 precedence exception was not invoked, and no test
function on either side was deleted.

**Note for the finalize step (BUG-1109/BUG-1122, not a failure):** because HEAD had
already absorbed the incoming `commits` collapse through the bundling write, the
staged tree nets to **no diff vs HEAD** — `git status --porcelain` reports the path
clean after staging. This is the *redundant* case, not the *discarded* case, and
STEP 3 is what separates them: the incoming commit's key change is present in HEAD
rather than merely absent. Per STEP 4, `--skip` was not called; the cherry-pick
sequencer state (`CHERRY_PICK_HEAD`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
