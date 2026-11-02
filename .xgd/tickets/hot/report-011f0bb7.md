---
uid: report-011f0bb7
id: REPORT-7923
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:01:39.912467+00:00'
updated_at: '2026-11-02T00:01:39.912467+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-93cc89ff.md` (REQ-185). Class: intent/bookkeeping ticket (2e; request-* stored under hot/). Cherry-picked commit 54d52d9174 ("xgd(ticket): update request request-93cc89ff").
  - Conflicting facts (status, updated_at, completed_at, commits[].reconcile_sha, working_sha_history): the HEAD side wins. Following the enrichment rule ("take the more recent commit by timestamp"), HEAD's update is 2026-11-01T22:57:25 (status free_and_reconciled, reconcile SHAs 24d5f74f / 7ecd8198 filled in). Incoming's is 2026-09-05T00:57:38 (status free_coded, reconcile_sha null). HEAD's lineage already contains the later lifecycle step that follows free_coded.
  - Non-overlapping addition: incoming added `fields.version: 0.2.70`, which HEAD never had and never removed (`git log -p HEAD -- <file>` shows no `version:` line). Kept per 2e superset/non-overlap rule.
  - The body did not conflict and is unchanged.
  - Flagged for post-merge review per the enrichment rule (intent unknown on both sides).

## Incoming changes preserved

- Not a code file. Of incoming's changes, `version: 0.2.70` is preserved. Its status change to free_coded and its null reconcile_sha values are superseded by HEAD's later reconciled state for the same facts. That is a per-fact timeline decision, not a discard.
- Net staged diff vs HEAD: +`  version: 0.2.70`.
