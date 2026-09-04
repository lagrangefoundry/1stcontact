---
uid: report-067ccd5a
id: REPORT-3302
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:17:12.312802+00:00'
updated_at: '2026-09-02T18:17:12.312802+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `package.json` — UU, config/bookkeeping scalar conflict (STEP 2g / version-scalar
  precedent). Sole conflict hunk was the `version` field: HEAD `0.2.20` vs incoming
  `0.2.3`. Kept HEAD's `0.2.20`.

  Both sides carry xgd-authored intent, so the enrichment's "take the more recent
  commit by timestamp" rule applies:
  - HEAD side: `510d4082382c7cba29890523b815537de666e259` — *[FREE-CODED] REQ-162 —
    version 0.2.20*, 2026-08-31.
  - Incoming: `27e08d3891c93dee6fd32ec8915718077fba4ce7` — *Merge branch
    'free-REQ-151' into xgd-working*, 2026-08-21.

  HEAD's commit is 10 days later and monotonically ahead (0.2.20 > 0.2.3), so taking
  incoming would have been a version downgrade. Resolved in place with an edit to the
  conflict hunk only (not `git checkout --ours`), so any cleanly-merged incoming
  content elsewhere in the file was preserved. Resulting file re-parsed as valid JSON;
  no conflict markers remain.

## Incoming changes preserved

The incoming commit `27e08d3891` is a merge whose entire footprint is `package.json`
(1 file, 1 insertion, 1 deletion). Its two deltas:

1. **vs first parent `0952a9b71f` (xgd-working mainline):** `"version": "0.2.2"` →
   `"0.2.3"`. This is bookkeeping, not code. It is present in HEAD via a different
   route rather than discarded: HEAD's later free-coded commit `510d4082` advanced the
   same scalar past it to `0.2.20`. Re-applying `0.2.3` would revert that.
2. **vs second parent `38e4a3cf22` (free-REQ-151):** removal of the `astro: ^7.0.4`
   devDependency. Already reflected in HEAD — HEAD's `devDependencies` contains no
   `astro` entry.

Both deltas are therefore already realised in the resolved tree, so the staged diff
against HEAD is empty. Per STEP 4 this is a genuinely redundant commit
(BUG-1109/BUG-1122), not a discarded one — STEP 3's distinguishing check passes: the
incoming commit's key change is *present in HEAD*, not merely absent. `git
cherry-pick --skip` was NOT called; the finalize step will detect the clean staged
diff and skip the commit.

No code/implementation files, spec tickets, or UAT test files were in conflict. No
hunks were dropped under the BUG-1301 precedence exception.
