---
uid: report-19938be6
id: REPORT-11048
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:47:06.324704+00:00'
updated_at: '2026-11-05T20:47:06.324704+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — config/version scalar (UU). Both sides are free-coded `chore(version)` bumps of the single `"version"` field. Applied the enrichment rule ("take the more recent commit by timestamp"), which matches 2d/2e's later-position rule for two free-coded sides:
  - HEAD: 2de6a86da7 `chore(version): 0.2.117 for REQ-198`, authored 2026-09-06 12:46:19 -0700
  - Incoming: dde754efa3 `chore(version): 0.2.112 for REQ-192`, authored 2026-09-06 12:20:44 -0700
  - Result: `"version": "0.2.117"` (HEAD). Applying 0.2.112 would move the version backwards past 0.2.113–0.2.117.
  - **Flagged for post-merge review** (as the enrichment rule requires).

## Incoming changes preserved

The incoming commit's only change is `"version": "0.2.112"` in package.json. It is deliberately not kept: later version bumps (0.2.116 and 0.2.117 for REQ-198, already in HEAD) have superseded it. That makes the incoming hunk stale, not discarded by mistake. The resolution has no net change from HEAD, so the cherry-pick will be empty. cherry_pick_finalize_resolution should handle that (skip or allow-empty).

## Arbitration of last resort (BUG-1460)

- `package.json`: under the timestamp rule, this is a tier-1-style call (the most recent intent wins). The REQ-198 bump comes later in the timeline than the REQ-192 bump. Incoming side dropped.
