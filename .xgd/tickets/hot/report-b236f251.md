---
uid: report-b236f251
id: REPORT-6977
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:37:23.752906+00:00'
updated_at: '2026-10-31T21:37:23.752906+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e). Rule: strict superset → keep HEAD (`git checkout --ours`). Incoming 3f7963de37 (2026-09-02 00:43:49) changes: updated_at/last_field_updated bump, `story_points: 3` added, and the body rewritten from "Behaviour required / Test plan" to "Behaviour delivered / Evidence / Existing tests changed / Regression", plus a new "role/republishable on a search hit" not-in-scope bullet. HEAD already contains all of it (same text with different line wrapping), plus later facts the incoming side lacks: status `free_and_reconciled`, completed_at 2026-10-30, `bundled_in: bundle-5607a08d`, and a "Superseded in part by BUG-44 (operator decision)" section. Taking incoming for any conflicted hunk would have reverted the status and dropped the BUG-44 section.

## Incoming changes preserved

- `story_points: 3` is in HEAD. The whole rewritten body (Behaviour delivered 1–6, What is mechanical, Evidence UAT list, Existing tests changed, Regression, Not in scope incl. role/republishable bullet) is in HEAD. The resolved file is identical to HEAD, so the commit is redundant (its effect already landed) and finalize should skip it as a clean staged diff. Flagged for post-merge review per the enrichment rule; risk is low (bookkeeping ticket only).

Note: this is the second consecutive BUG-45 ticket-update commit from 2026-09-02 (after 2f771ca6e2, REPORT-6975). The branch log shows a repeating "recover uncommitted .xgd/ state (BUG-603)" / "update bundle bundle-fd009b93" pattern between attempts.
