---
uid: report-40acfd96
id: REPORT-3849
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:30:00.293709+00:00'
updated_at: '2026-09-11T01:30:00.293709+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — class **UU**, intent/bookkeeping ticket (rule **2e**), same-fact conflict resolved by later-positioned intent.

  Both sides changed the *same* frontmatter facts (`updated_at`, `completed_at`,
  `last_field_updated`, `status`) — a genuine per-fact conflict, not disjoint edits,
  so the timeline rule applies:

  - **Incoming** (`22c666b6fb`, 2026-08-31 14:51:23 -0700, free_coded): advanced
    `status: free_coded` → `ready_to_reconcile`, bumped `updated_at` to
    `2026-08-31T21:51:22Z`. That 2-line change is the commit's entire contribution
    (diffstat: 1 file, 2 insertions, 2 deletions).
  - **HEAD** (`d86637121a`, 2026-09-01 18:34:36 -0700): the ticket has already been
    carried through the full reconcile lifecycle — `status: free_and_reconciled`,
    `completed_at: 2026-09-02T01:34:00Z`, `last_field_updated: result`, plus
    `fields.result: pass` and `fields.merged_at_commit: 4b43dd9a5c`.

  HEAD is the later-positioned intent by ~1.5 days, which matches the auto-enriched
  resolution rule for this file ("take the more recent commit by timestamp"). Kept
  HEAD's four frontmatter lines; removed the conflict markers and the incoming block.
  Taking incoming would have regressed an operator-owned status *backwards* through
  the lifecycle and dropped `completed_at` / `result: pass`.

  The rest of the file (body + `fields`) merged cleanly on both sides — only the one
  hunk conflicted.

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted file is a
bookkeeping request ticket (2e), not matrix state and not source.

The incoming commit's sole intent — move `request-13a5e206` out of `free_coded`
toward reconciliation — is **present in HEAD via a different route**, not discarded:
`ready_to_reconcile` is an intermediate state that HEAD has already passed through
and beyond to the terminal `free_and_reconciled`, with the reconcile outcome
recorded (`result: pass`, `merged_at_commit: 4b43dd9a5c`). Superseded, not lost —
so STEP 3's discard guard does not trip.

No hunks were dropped under the BUG-1301 precedence exception. No test functions
were touched.

## Note for finalize

The resolved file is byte-identical to HEAD (`git diff --no-index` against the HEAD
blob is empty), so the staged diff is clean and this cherry-pick has no net effect —
the expected outcome when HEAD already carries the commit's effect through a later
route (BUG-1109/BUG-1122). Per STEP 4 this is not a failure and `--skip` was not
called; the finalize step should detect the empty staged diff and skip the commit.
`CHERRY_PICK_HEAD` is intact and no cherry-pick state transition was performed.
