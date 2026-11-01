---
uid: report-abcbc610
id: REPORT-7637
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:36:59.985491+00:00'
updated_at: '2026-11-01T14:36:59.985491+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-72001560.md`: intent/bookkeeping ticket (2e; outside sparse cone, staged with `git add --sparse`). Resolved to HEAD (`git checkout --ours`). Three hunks:
  1. Frontmatter (updated_at / completed_at / last_field_updated / status): same fields changed on both sides. HEAD = 2026-11-01, `status: free_and_reconciled`, completed. Incoming = 2026-09-03, `status: draft`, `completed_at: null`. Took the later side (HEAD).
  2. "How the ledger is written" section: same paragraph changed on both sides. Incoming has the earlier "narrow host operation / follows the `extraOps` pattern" text. HEAD has the rewritten "purpose-built surface" text, which explicitly calls `extraOps` "the first instinct and is wrong" and adds the "What the record has to guarantee" and "The record is written for retrieval" paragraphs. HEAD is the later, superseding version.
  3. Final line of "Open questions": the two sides differ only in how the file ends.
- Enrichment rule ("take the more recent commit by timestamp; flag for post-merge review"): HEAD-side last commit a4f29a1a7c (2026-11-01 05:59 -0800) is later than incoming f42b3644fc (2026-09-02 19:38 -0700). Same result. Flagged for post-merge review per that rule.

## Incoming changes preserved

No code files were involved. The incoming commit is a stale earlier snapshot of the same ticket, and HEAD's later content supersedes it, so the staged result has no net diff against HEAD for this file. This is the redundant-commit case (STEP 4), not a discard: HEAD already contains the ticket's later evolution of the same text.
