---
uid: report-b8f640a0
id: REPORT-11014
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:31:07.031755+00:00'
updated_at: '2026-11-05T20:31:07.031755+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json`: config/version scalar (UU). I applied the enrichment rule "take the more recent commit by timestamp" and kept HEAD: `"version": "0.2.117"`. I flagged it for post-merge review, as that rule requires.
  - Ours: 2de6a86da7, "chore(version): 0.2.117 for REQ-198 [FREE-CODED]", 2026-09-06 12:46:19 -0700
  - Theirs: 2e31686d2c, "chore(version): 0.2.89 for REQ-192 [FREE-CODED]", 2026-09-06 11:55:41 -0700

## Incoming changes preserved

The incoming commit changes one line: it sets `version` to 0.2.89. That change is deliberately left out. HEAD has already moved on through 0.2.116 and then 0.2.117 (REQ-198), and those bumps were made after this one. Applying 0.2.89 would downgrade the package version. No other incoming content exists, so nothing else was dropped.

**The resolution has no net change against HEAD.** The cherry-pick is now empty, so the finalize step will have to skip it or allow an empty commit. I did not run continue or skip.

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at tier 1 (most recent intent). Both sides are FREE-CODED version bumps. The REQ-198 bumps (0.2.116 and 0.2.117) come after the incoming REQ-192 bump to 0.2.89 and supersede it, and the commit timestamps agree. I dropped the incoming hunk (version 0.2.89) and kept HEAD.
