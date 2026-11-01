---
uid: report-2ae8e057
id: REPORT-7721
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:33:27.952180+00:00'
updated_at: '2026-11-01T15:33:27.952180+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184) — intent/bookkeeping ticket (2e). Two hunks conflicted: frontmatter (`updated_at`/`completed_at`/`status`) and the Acceptance tail. Resolved to HEAD (ours), staged with `git add --sparse`.
  - Per the enrichment rule (take the more recent commit by timestamp): HEAD side last touched by 036a647003 at 2026-11-01T13:58Z (`status: free_and_reconciled`, `completed_at` set); incoming 94d4edc048 dated 2026-09-04T23:58Z (`status: free_coding`, `completed_at: null`).
  - Per 2e superset rule: HEAD's Acceptance section is the finalized form of incoming's conditional wording ("If the subject column lands…" / "Whatever is decided…") — the subject column did land, and HEAD additionally carries the Test plan section. HEAD is a strict superset in intent.

## Incoming changes preserved

No code files in conflict. The incoming commit touches only this ticket; its changes (status regress to free_coding, nulling completed_at, pre-decision acceptance wording) are older states already superseded on HEAD by later updates to the same request. Resolution nets to no diff vs HEAD — redundant/stale commit, not a discard of developer code. Left for finalize to detect the empty staged diff. File flagged for post-merge review per enrichment rule (intent unknown on both sides).
