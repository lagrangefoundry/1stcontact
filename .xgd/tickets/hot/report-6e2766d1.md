---
uid: report-6e2766d1
id: REPORT-11046
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:46:02.699478+00:00'
updated_at: '2026-11-05T20:46:02.699478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- package.json — scalar version-field conflict (UU, both sides free_coded `chore(version)` commits). Rule: both-free_coded exception / enrichment rule "take the more recent commit by timestamp". HEAD side `0.2.117` (2de6a86da7, REQ-198, authored 2026-09-06 12:46:19 -0700) is later than incoming `0.2.111` (d22bd67812, REQ-192, authored 2026-09-06 12:20:27 -0700). Kept `"version": "0.2.117"`. Flagged for post-merge review per enrichment rule.

## Incoming changes preserved

The incoming commit's only change is the version line 0.2.110 -> 0.2.111. It is intentionally not applied: HEAD already carries later bumps (0.2.116, 0.2.117 for REQ-198), so applying it would move the version backwards. The resolution has no net diff against HEAD, so the cherry-pick is effectively empty. Finalize step should treat it as empty (skip / allow-empty).

## Arbitration of last resort (BUG-1460)

- package.json — Tier 1 (most recent intent): REQ-198's later version bumps (0.2.116, 0.2.117) supersede REQ-192's 0.2.111 bump. Incoming hunk dropped. Evidence: author timestamps above; a monotonic version must not regress.
