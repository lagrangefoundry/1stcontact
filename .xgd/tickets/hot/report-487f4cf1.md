---
uid: report-487f4cf1
id: REPORT-3370
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:29:52.529611+00:00'
updated_at: '2026-09-02T21:29:52.529611+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **UU**, rule **2e (intent/bookkeeping ticket)**, per-fact timeline resolution → **ours (HEAD) taken in full**.

  Incoming commit `44f12ddc803368ccc23b0e0f457cf48ef2d39f5e` (`xgd(ticket): update bundle bundle-b3b7c399`, 2026-08-25T23:30:45Z) changed exactly two facts off the merge base:
  - `status`: `reconciling` → `ready_to_reconcile`
  - `updated_at`: `2026-08-24T02:10:52Z` → `2026-08-25T23:30:45Z`

  HEAD-side commit `8e07e6015dead83333d9ae23d1116e97a118a490` (same subject, 2026-08-31T14:23:04Z) changed the same two facts to later values *and* added facts the incoming side never touched:
  - `status`: `reconciling` → `free_and_reconciled` (terminal lifecycle state)
  - `updated_at`: → `2026-08-31T14:23:04Z`
  - `completed_at`: `null` → `2026-08-31T14:22:24Z`
  - `last_field_updated`: `status` → `result`
  - `result`: (absent) → `pass`
  - `fields.commits`: 24 unreconciled entries collapsed to one entry with `main_sha: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`
  - `fields.orphan_commits`: (absent) → 148 old_sha/new_sha remap pairs
  - `fields.merged_at_commit`: (absent) → `eef7a8b48bfa15c54b64db9541a0e781a016ba9e`

  Neither side carries an `intent_uid`, so `xgd working-timeline` is not applicable — this matches the auto-enrichment's finding ("Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review."). Timestamp ordering is unambiguous: HEAD's 2026-08-31 write is six days later than the incoming 2026-08-25 write.

  Per-fact outcome:
  - `status`, `updated_at` — genuinely competing; later-positioned side (HEAD) wins. Taking incoming would regress this bundle's lifecycle from `free_and_reconciled` back to `ready_to_reconcile`, i.e. un-complete a bundle that HEAD records as already merged at `eef7a8b4`.
  - Every other field — HEAD is a strict superset; incoming left them at base. Kept from HEAD.

  Result: no fact present on the incoming side is absent from the resolution except the two superseded scalars above.

  Staged resolution nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty). Per STEP 4 this is expected and not a failure: HEAD already contains this bundle ticket's later state, so the commit is redundant rather than discarded. `cherry_pick_finalize_resolution` will detect the clean staged diff and skip the commit. No `--skip`/`--continue`/`--abort` was issued; `CHERRY_PICK_HEAD` is intact.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping bundle ticket, resolved under rule 2e, not 2c.

STEP 3's discard guard does not fire here. The incoming commit's two key changes are *superseded*, not discarded: HEAD advanced the same `status` field past `ready_to_reconcile` to the terminal `free_and_reconciled`, and advanced `updated_at` past the incoming timestamp. That is the outcome 2e's per-fact timeline rule prescribes when both sides changed the same field differently, and it is the only outcome consistent with HEAD's recorded `result: pass` / `merged_at_commit` / 148-entry `orphan_commits` remap — all of which the incoming (older) side predates and knows nothing about.

No BUG-1301 precedence exception was invoked; no hunk was dropped on refactor grounds; no test function was touched.

**Flagged for post-merge review** (as the enrichment rule directs): `.xgd/tickets/hot/bundle-b3b7c399.md` was resolved by commit timestamp because intent metadata was unavailable on both sides.
