---
uid: report-d24aa77a
id: REPORT-6747
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:19:02.379674+00:00'
updated_at: '2026-10-26T00:19:02.379674+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` — intent/bookkeeping ticket (2e), index-only conflict (outside the sparse cone). The two sides set the same fields to different values: `status`, `updated_at`, `last_field_updated`.
  - Ours (HEAD): `status: bundled`, `bundled_in: bundle-5607a08d`, `updated_at: 2026-10-25T22:19:54Z`.
  - Theirs (2560e64cbe, "update bug bug-364445f8"): `status: ready_to_reconcile`, `updated_at: 2026-09-02T23:15:11Z`. No other changes.
  - Rule: for a genuine same-field conflict, take the more recent side (per the enrichment's resolution rule). Ours is newer by about 7 weeks and is the later lifecycle state (bundled comes after ready_to_reconcile). It is also a superset: it adds `bundled_in`, which theirs never touched. Kept ours with `git checkout --ours` and `git add --sparse`.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only effect was to move status to `ready_to_reconcile`, and HEAD's later `bundled` status supersedes that. The resolved file is identical to HEAD (blob b0ba8eb879), so the staged diff is empty. The incoming commit is redundant, not discarded: the transition it recorded already happened and HEAD has moved past it.

Flagged for post-merge review per the enrichment rule (intent was unknown on one side).
