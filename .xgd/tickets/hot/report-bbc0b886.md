---
uid: report-bbc0b886
id: REPORT-11016
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:32:15.521101+00:00'
updated_at: '2026-11-05T20:32:15.521101+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- package.json (UU, config/version scalar): single hunk on "version". HEAD (2de6a86da7, "chore(version): 0.2.117 for REQ-198", authored 2026-09-06T12:46) vs incoming (cce82e32c8, "chore: bump version for REQ-197", authored 2026-09-06T11:58, 0.2.90 -> 0.2.91). Applied enrichment rule "take the more recent commit by timestamp": HEAD's 0.2.117 kept. Staged with git add. Flagged for post-merge review per enrichment rule.

## Incoming changes preserved

The incoming commit's only change is the version bump 0.2.90 -> 0.2.91. It is NOT present in the resolution: it is stale on this branch (a later REQ-198 bump to 0.2.117 already supersedes it; applying it would regress the version). Resolution nets to no diff vs HEAD for this commit; finalize step should treat it as empty (skip / allow-empty).

## Arbitration of last resort (BUG-1460)

- package.json: resolved at tier 1 (most recent intent). Evidence: REQ-198 version commit is later by author timestamp and sets a strictly higher version (0.2.117 > 0.2.91); REQ-197's bump is moot. Incoming side dropped.
