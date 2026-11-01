---
uid: report-5bb0e1b0
id: REPORT-7509
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:47:38.019243+00:00'
updated_at: '2026-11-01T07:47:38.019243+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178). File class: 2e, intent/bookkeeping ticket. Rule: per-fact merge, keeping the superset.
  - Frontmatter status block (`updated_at`, `completed_at`, `status`): kept HEAD (`free_and_reconciled`, 2026-11-01). Incoming (`free_coded`, 2026-09-05) is an older snapshot. HEAD's status is the later lifecycle state, so this follows the "take the more recent" rule from the enrichment.
  - `story_points` (4) and `reconcile_sha: da892c3` on commit `68db393`: kept HEAD. Both are later values that incoming never set.
  - `fields.commits`: took incoming's two new entries (`fa0b857`, `cd6002e`, `reconcile_sha: null`). HEAD never touched these entries.
  - `fields.version: 0.2.68`: taken from incoming, which adds it. HEAD has no value for this field.
  - Checks: no conflict markers remain, and the frontmatter parses as valid YAML.

## Incoming changes preserved

Every fact the incoming commit d909bce767 adds is present in the result: the two commit entries and the version field. The only incoming values not kept are its older status, timestamp and story_points values. HEAD had already moved past those (a later bookkeeping state), so dropping them is a per-fact "later wins" choice, not a discard of new content. The file is flagged for post-merge review, as the enrichment's "intent unknown" rule requires.
