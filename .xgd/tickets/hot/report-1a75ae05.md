---
uid: report-1a75ae05
id: REPORT-3610
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T00:48:40.925020+00:00'
updated_at: '2026-09-10T00:48:40.925020+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e).
  Both sides changed the SAME facts (`updated_at`, `completed_at`, `status`) —
  a genuine per-fact conflict, so the timeline rule applies to that fact.
  Kept the HEAD side via `git checkout --ours` (no hand-editing of ticket
  frontmatter). No other field/section differed between the sides, so nothing
  had to be combined.

  Timeline evidence (auto-enrichment reported "intent unknown on one or both
  sides", so resolved by commit position/timestamp):
  - Incoming `486ef694e0` (2026-08-25 15:52 -0700): `free_coded` →
    `ready_to_reconcile`, `completed_at: null`.
  - HEAD `56ced613a4` (2026-08-31 12:19 -0700): `bundled` →
    `free_and_reconciled`, `completed_at: 2026-08-31T19:19:38Z`, plus
    `fields.bundled_in: bundle-78f4e2fe` (outside the conflict hunk).

  HEAD is six days later and strictly downstream in the ticket lifecycle;
  taking the incoming side would have regressed an operator-owned status
  backwards from `free_and_reconciled` to `ready_to_reconcile`.

## Incoming changes preserved

No code/implementation files were conflicted — the sole conflict is a
bookkeeping ticket, and the incoming commit `486ef694e0` touches only that
one file (`1 file changed, 2 insertions(+), 2 deletions(-)`).

The incoming commit's intent — advance BUG-36 out of `free_coded` — is
present in HEAD via a different route, not discarded: HEAD's own history for
this ticket shows it already passed through and beyond that transition
(`bundled` at 2026-08-26, then `free_and_reconciled` at 2026-08-31). The
incoming status value is therefore superseded, not lost. No developer code
was overwritten.

Because the effect of this commit had already landed on HEAD by another
route, the resolution nets to no staged diff vs HEAD (BUG-1109/BUG-1122).
Per STEP 4 no `--skip` was issued; the cherry-pick sequencer state is intact
for `cherry_pick_finalize_resolution` to detect the empty diff.

## Flagged for post-merge review

Per the auto-enrichment resolution rule ("Take the more recent commit by
timestamp and flag this file for post-merge review"), flagging
`.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — its status was resolved by
timestamp rather than by a known intent position.
