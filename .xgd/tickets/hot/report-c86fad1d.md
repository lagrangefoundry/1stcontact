---
uid: report-c86fad1d
id: REPORT-4130
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:33:09.482928+00:00'
updated_at: '2026-09-12T20:33:09.482928+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (rule **2e**, bundle-*). Single conflict region covering the lifecycle-state block: `updated_at` / `completed_at` / `last_field_updated` / `status`. Both sides changed the SAME facts differently, so 2e's per-fact timeline rule applies; resolved in favour of HEAD (`checkout --ours` + `git add --sparse`, the path is outside the sparse-checkout cone per DOC-986 §2/§4.1).

### Why HEAD won this fact

- Incoming (`726b77db28`, 2026-08-27 20:57 -0700): `reconciling` → `status: ready_to_reconcile`, `completed_at: null`, `last_field_updated: status`.
- HEAD (`8e07e6015d`, 2026-08-31 07:23 -0700, preceded by `a0b52c93a6`): `reconciling` → `status: free_and_reconciled`, `completed_at: '2026-08-31T14:22:24'`, `last_field_updated: result`, plus `result: pass` and `merged_at_commit` in `fields`.
- HEAD's commit is 4 days later and represents a strictly downstream lifecycle state: the bundle has already been reconciled and passed. Applying the incoming value would regress a completed bundle back into the pre-reconcile queue and re-null `completed_at` while `result: pass` / `merged_at_commit` remained set — an internally inconsistent ticket.
- The auto-enriched conflict metadata for this file ("Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review.") points to the same outcome; no intent_uid was available on either side, so `xgd working-timeline` was not usable and commit timestamp was the fallback ordering, as that rule directs.

**Flagged for post-merge review** per the enrichment rule: this file was resolved by timestamp fallback rather than by intent ordering.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a bookkeeping ticket resolved under 2e, whose per-fact timeline rule necessarily means the losing side's value for the contested fact is not carried forward. That is the rule operating as designed, not a discard of developer code, and STEP 3's discard guard is scoped to code/implementation files.

Recorded for transparency: the incoming commit's only substantive change was `status: reconciling` → `ready_to_reconcile` (plus the accompanying `updated_at` / `completed_at` / `last_field_updated` bookkeeping). `git log -S'status: ready_to_reconcile' -- <path>` over HEAD's lineage returns nothing, so HEAD never passed through that intermediate state via another route; it advanced `reconciling` → `free_and_reconciled` directly. The incoming value is therefore superseded rather than duplicated. No BUG-1301 precedence exception was invoked and no hunk was dropped on refactor grounds.

## Net effect

The resolution nets to **no diff vs HEAD** (`git status --porcelain` is empty; the staged tree equals HEAD). Per STEP 4 this is not a failure condition and `--skip` was NOT called — the finalize step (`cherry_pick_finalize_resolution`) will detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD` (`726b77db28`) is still present and untouched.
