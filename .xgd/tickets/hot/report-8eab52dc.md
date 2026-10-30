---
uid: report-8eab52dc
id: REPORT-4592
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:23:12.166061+00:00'
updated_at: '2026-09-21T00:23:12.166061+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **UU**, intent/bookkeeping ticket
  (`bundle-*`), rule **2e**. Staged via `git add --sparse` (path is outside the
  sparse-checkout cone on this resync branch, DOC-986 §2/§4.1 — the conflict
  existed only in the index).

  The conflict region was the four lifecycle header facts (`updated_at`,
  `completed_at`, `last_field_updated`, `status`). Both sides changed all four,
  so this is a genuine same-fact conflict, and 2e's later-positioned-intent rule
  applies per fact.

  Intent ledger on both sides:

  - **Incoming** (`eb58654345`, Aug 26 10:36:45 -0700): `ready_to_reconcile` →
    `reconciling`. Its own history shows this is one step in a single ongoing
    lifecycle (`reconciling` → `ready_to_reconcile` → `reconciling`).
  - **HEAD**: the same lifecycle carried further — `a0b52c93` (Aug 31 07:22:25)
    `reconciling` → `free_and_reconciled` with `completed_at` set, then
    `8e07e601` (Aug 31 07:23:04) `last_field_updated: status` → `result`.

  Every conflicting fact is later-positioned on the HEAD side, so HEAD wins on
  all four. Applying the incoming side would have regressed a completed bundle
  back to `reconciling` and nulled `completed_at`.

  No disjoint facts were dropped: the incoming commit is `1 file changed,
  2 insertions(+), 2 deletions(-)`, and both changed lines fall inside the
  conflict region. `fields.commits` differs between the two sides but was
  untouched by the incoming commit, so git merged that region cleanly from HEAD
  — nothing from the incoming side was discarded there.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's "incoming changes
must appear in the resolved version" check does not apply to any file here, and
the BUG-1301 precedence exception was not invoked.

For the one bookkeeping ticket, the incoming side's two facts
(`status: reconciling`, `updated_at: 2026-08-26T17:36:45`) are intentionally
absent from the resolved version. That is the prescribed outcome of rule 2e,
not a discard: they are earlier-positioned states of the same lifecycle that
HEAD has already superseded, and the auto-enriched conflict metadata for this
file directs the same resolution ("take the more recent commit by timestamp").

Flagged for post-merge review, as the enrichment metadata requests: the intent
on each side was classified from the ticket ledger rather than from an explicit
`--commit-message` narrative, since both sides carry the same generic
`xgd(ticket): update bundle bundle-b3b7c399` subject.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged
stages. The resolved content is byte-identical to HEAD, so this cherry-pick
carries no net change — left for the finalize step to detect and skip, per
instructions. `CHERRY_PICK_HEAD` is still present at `eb58654345`; no
`--continue`/`--skip`/`--quit`/`--abort` was issued.
