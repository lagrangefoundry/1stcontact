---
uid: report-94331a4c
id: REPORT-10958
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:48:08.482674+00:00'
updated_at: '2026-11-05T19:48:08.482674+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json`: UU, version-scalar conflict. Kept HEAD (`"version": "0.2.117"`) using `git checkout --ours` + `git add`. Enrichment rule: "take the more recent commit by timestamp". HEAD's 2de6a86da7 (`chore(version): 0.2.117 for REQ-198`, 2026-11-04) is newer than incoming 08e0d1ea7a (authored 2026-08-31, committed 2026-11-01). Flagged for post-merge review as the rule requires.

## Incoming changes preserved

The incoming commit 08e0d1ea7a changes exactly one line: `package.json` version 0.2.12 -> 0.2.22. That change is NOT present in the resolution, on purpose (see below). Its own rationale ("0.2.21 was claimed at the working tip") is stale on this branch, which is already at 0.2.117. Applying it would roll the version back about 95 patch releases. No other content in the incoming commit exists to preserve.

The resolution has no net diff against HEAD. The cherry-pick is now empty, so finalize should skip it (or commit it allow-empty). I did not run --skip/--continue myself.

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at tier 1 (most recent intent). A later free-coded version commit (2de6a86da7, REQ-198, 0.2.117) supersedes the incoming bump. The incoming commit's stated premise (bumping past 0.2.21) is moot here. Evidence: commit timestamps, plus HEAD's version (0.2.117) being far ahead of incoming's (0.2.22). Dropped side: incoming (theirs).
