---
uid: report-ce6447c7
id: REPORT-11018
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:33:02.362005+00:00'
updated_at: '2026-11-05T20:33:02.362005+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- package.json (UU, version scalar): single hunk on "version". HEAD (2de6a86da7, "chore(version): 0.2.117 for REQ-198", authored 2026-09-06T12:46) vs incoming (aee848abc3, "chore: bump version for REQ-197", authored 2026-09-06T12:00, 0.2.91 -> 0.2.92). Applied enrichment rule "take the more recent commit by timestamp": HEAD's 0.2.117 kept. Staged. Flagged for post-merge review per enrichment rule.

## Incoming changes preserved

The incoming commit's only change (version 0.2.91 -> 0.2.92) is NOT present: it is stale on this branch, superseded by the later REQ-198 bump to 0.2.117; applying it would regress the version. Resolution nets to no diff vs HEAD; finalize step should treat this commit as empty (skip / allow-empty). Note: this is the second consecutive REQ-197 interim version-bump commit with this shape (previous: cce82e32c8, REPORT-11016); further REQ-197 bump commits in this bundle will likely conflict identically.

## Arbitration of last resort (BUG-1460)

- package.json: resolved at tier 1 (most recent intent). Evidence: REQ-198 version commit is later by author timestamp and sets a strictly higher version (0.2.117 > 0.2.92); REQ-197's interim bump is moot. Incoming side dropped.
