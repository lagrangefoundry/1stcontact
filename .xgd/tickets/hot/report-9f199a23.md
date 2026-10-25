---
uid: report-9f199a23
id: REPORT-6707
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:16:53.595439+00:00'
updated_at: '2026-10-25T23:16:53.595439+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — intent/bookkeeping ticket (2e); index-only conflict outside sparse cone. Conflicting facts: `updated_at` (HEAD 2026-09-09 vs incoming 2026-09-02) and `fields.bundled_in` (HEAD `bundle-87be4669` vs incoming `bundle-203b1dc2`). Neither bundle is the current reconcile bundle (bundle-5607a08d). Enrichment rule "intent unknown → take more recent commit by timestamp": HEAD commit 58ee785188 (seed_local_overlay, 2026-09-11) is newer than incoming bc1af120f1 (update, 2026-09-02). Resolved with `git checkout --ours` + `git add --sparse`. FLAGGED for post-merge review per enrichment rule.

## Incoming changes preserved

No code files involved. The incoming commit is a stale ticket-metadata update superseded by a later HEAD-side write to the same fields; resolution nets to no diff vs HEAD (finalize step will detect the empty staged diff).
