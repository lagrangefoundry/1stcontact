---
uid: report-4bec9f8c
id: REPORT-7996
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:25:13.502475+00:00'
updated_at: '2026-11-02T00:25:13.502475+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51): intent/bookkeeping ticket (2e). Kept HEAD's version (`git checkout --ours` + `git add --sparse`). The file is outside the sparse cone.
  - Incoming `a8da3db5de` (2026-09-05T18:33) is an early draft edit: `status: draft`, `completed_at: null`, `last_field_updated: severity`, a "Scope — to be agreed before coding" section listing candidate fixes, and "Test plan: TBD".
  - HEAD (updated 2026-11-01T22:57) has the later state of the same ticket: `status: free_and_reconciled`, `completed_at` set, the `commits`/`version`/`bundled_in: bundle-39edf66d` fields, a refined Mechanism paragraph (opt-in `SiteWrite.expect` compare-and-set), and the final "Required behaviour" B1–B3 spec with the `test_UAT_FC_BUG-51_*` test plan. That spec replaces the incoming "candidate fixes, not yet chosen" text.
  - Each conflicting fact (status, timestamps, the Mechanism paragraph, the scope/test-plan section) was changed on both sides. In every case HEAD is the later revision and incoming is the earlier one. The enrichment rule (take the more recent commit by timestamp) gives the same answer. Keeping the incoming hunks would move a completed, bundled ticket back to draft.

## Incoming changes preserved

- No code files were involved.
- The incoming commit's non-conflicting additions (Symptom, store-state table, Mechanism, Two defects, Recovery sections) were already in HEAD, which is why they merged without conflict.
- Only the stale draft-era hunks were dropped. They are superseded by later edits to the same ticket, so this commit is redundant rather than discarded. The staged result has no diff vs HEAD; finalize should detect the clean diff and skip it.

## Arbitration of last resort (BUG-1460)

Not used. Rule 2e decided it directly (the later revision of each conflicting fact wins), consistent with the enrichment timestamp rule.

## Note

Recent branch history shows a repeating pair, "recover uncommitted .xgd/ state (BUG-603)" then "update bundle bundle-5052a63c". This suggests the cherry-pick window for BUNDLE-37 is retrying. `a8da3db5de` is redundant on this branch and could be added to the bundle's skipped commits.
