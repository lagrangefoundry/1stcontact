---
uid: report-5decc0a6
id: REPORT-4131
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:34:58.837690+00:00'
updated_at: '2026-09-12T20:34:58.837690+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (rule **2e**, bundle-*). Single conflict region covering the lifecycle-state block: `updated_at` / `completed_at` / `last_field_updated` / `status`. Both sides changed the SAME facts differently, so 2e's per-fact timeline rule applies; resolved in favour of HEAD (`git checkout --ours` + `git add --sparse` — the path is outside the sparse-checkout cone per DOC-986 §2/§4.1).

Before taking `--ours` I confirmed it was lossless: `git diff HEAD` on the conflicted file showed a single marker-only hunk, so there was no auto-merged incoming content elsewhere in the file that `--ours` would silently drop.

### Why HEAD won this fact

- Incoming (`d13c42a577`, 2026-08-27 20:59 -0700): `ready_to_reconcile` → `status: reconciling`, `completed_at: null`, `last_field_updated: status`.
- HEAD (`8e07e6015d`, 2026-08-31 07:23 -0700, preceded by `a0b52c93a6`): `status: free_and_reconciled`, `completed_at: '2026-08-31T14:22:24'`, `last_field_updated: result`, plus `result: pass` and `merged_at_commit` in `fields`.
- HEAD's commit is 4 days later and strictly downstream in the bundle lifecycle. Applying the incoming value would regress an already-reconciled bundle back into the in-progress state and re-null `completed_at` while `result: pass` / `merged_at_commit` remained set — an internally inconsistent ticket.
- The auto-enriched conflict metadata ("Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review.") points to the same outcome; no `intent_uid` was available on either side, so `xgd working-timeline` was not usable and commit timestamp was the fallback ordering, as that rule directs.

**Flagged for post-merge review** per the enrichment rule: resolved by timestamp fallback rather than by intent ordering.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a bookkeeping ticket resolved under 2e, whose per-fact timeline rule necessarily means the losing side's value for the contested fact is not carried forward. STEP 3's discard guard is scoped to code/implementation files.

This commit is **redundant, not discarded** (STEP 4 / BUG-1109), and that was verified rather than assumed. The incoming commit's key change is `status: reconciling`. `git log -S'status: reconciling' -- <path>` over HEAD's lineage shows that state was already reached in HEAD by `4b7f40157d` ("xgd(ticket): seed_local_overlay bundle bundle-b3b7c399", 2026-08-30 22:06), confirmed an ancestor of HEAD via `git merge-base --is-ancestor`; `a0b52c93a6` then advanced it on to `free_and_reconciled`. So the incoming intent is present in HEAD via a different route (the local-overlay seed) and subsequently superseded — it is not absent.

No BUG-1301 precedence exception was invoked and no hunk was dropped on refactor grounds.

## Net effect

The resolution nets to **no diff vs HEAD** (`git status --porcelain` is empty; the staged tree equals HEAD). Per STEP 4 this is not a failure condition and `--skip` was NOT called — `cherry_pick_finalize_resolution` will detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD` (`d13c42a577`) is still present and untouched.
