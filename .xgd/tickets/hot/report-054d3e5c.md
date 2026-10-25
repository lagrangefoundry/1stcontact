---
uid: report-054d3e5c
id: REPORT-6676
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:36:36.196369+00:00'
updated_at: '2026-10-25T22:36:36.196369+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` (BUG-43): intent/bookkeeping ticket (2e). Resolved by keeping the strict superset (HEAD / ours), which also matches the enrichment rule "take the more recent commit by timestamp". HEAD's last commit touching the ticket is e8f9e7c85b (2026-09-19). The incoming commit is fd72594eb0 (2026-09-01), an earlier body edit made while the ticket was still a draft. Staged with `git checkout --ours` and `git add --sparse`.
  - Frontmatter: kept HEAD (status `free_and_reconciled`, completed_at 2026-09-14, updated_at 2026-09-19). Incoming had status `draft` and completed_at null, both older.
  - Fix section: kept HEAD's extra paragraph saying a throwing `onSiteChanged` callback is swallowed.
  - Test plan: kept HEAD's panel bullet (which extends incoming's wording) and its additional `app` bullet.

## Incoming changes preserved

Every hunk of fd72594eb0 is present in the resolved file: the symptom sentence about manual refresh, the "when the assistant writes" root cause, the "What is wanted" section, the per-write `site_changed` fix (including `meta: {at, changes}`), the "Only a counter that actually moved" paragraph, and the two-write-tools workerd test bullet. HEAD is a later superset of the incoming edit. The staged result has no diff against HEAD, so this commit is redundant rather than discarded (BUG-1109/BUG-1122 shape) and finalize can skip it.

Flagged for post-merge review per the enrichment rule ("intent unknown on one or both sides"), but no content from either side was lost.
