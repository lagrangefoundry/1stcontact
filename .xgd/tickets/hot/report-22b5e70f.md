---
uid: report-22b5e70f
id: REPORT-10972
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:58:13.351986+00:00'
updated_at: '2026-11-05T19:58:13.351986+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, config/version scalar. Resolved to HEAD (`"version": "0.2.117"`) via `git checkout --ours`. Rule: enrichment "take the more recent commit by timestamp" (HEAD's 2de6a86da7 `chore(version): 0.2.117 for REQ-198`, authored 2026-09-06; incoming 30f57c1fbe, authored 2026-09-01), backed by STEP 3h. **Flagged for post-merge review**, as the enrichment rule asks.

## Incoming changes preserved

The incoming commit 30f57c1fbe (a re-pick of e5d762332d) changes only one line of the tree: `package.json` version `0.2.30` -> `0.2.33`. The rest of that commit's described work (dist-assets staging swap, the eleven superseded UATs) is not in this commit's diff. It was already applied on this branch, or is outside it. That one-line hunk was deliberately dropped (see below), so this resolution makes no change relative to HEAD. The cherry-pick will be empty, and the finalize step should treat it as such.

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at tier 1 / enrichment timestamp rule. The incoming hunk is stale on this branch. Applying it would move the version backwards from 0.2.117 to 0.2.33, which undoes a later, separately authored version commit (REQ-198). The incoming side was dropped. The branch history also shows this commit being re-picked repeatedly (alternating "update bundle bundle-7988e925" / "recover ... interrupted cherry-pick (BUG-603)" commits). The loop may need a look.
