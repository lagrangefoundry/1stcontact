---
uid: report-9466b62a
id: REPORT-11030
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:37:24.617944+00:00'
updated_at: '2026-11-05T20:37:24.617944+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- package.json (UU, version scalar): single hunk on "version". HEAD (2de6a86da7, "chore(version): 0.2.117 for REQ-198", authored 2026-09-06T12:46) vs incoming (f36d318526, "chore: bump version for REQ-197", authored 2026-09-06T12:04:50, sets 0.2.100). Applied enrichment rule "take the more recent commit by timestamp": HEAD's 0.2.117 kept. Staged. Flagged for post-merge review per enrichment rule.

## Incoming changes preserved

The incoming commit's only change (version bump to 0.2.100) is NOT present: it is stale on this branch, superseded by the later REQ-198 bump to 0.2.117; applying it would regress the version. Resolution nets to no diff vs HEAD; finalize step should treat this commit as empty (skip / allow-empty). Eighth consecutive REQ-197 interim version-bump commit with this shape (prior: REPORT-11016, -11018, -11020, -11022, -11024, -11026, -11028).

## Arbitration of last resort (BUG-1460)

- package.json: resolved at tier 1 (most recent intent). Evidence: REQ-198 version commit is later by author timestamp and sets a strictly higher version (0.2.117 > 0.2.100); REQ-197's interim bump is moot. Incoming side dropped.
