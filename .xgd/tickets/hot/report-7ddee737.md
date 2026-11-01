---
uid: report-7ddee737
id: REPORT-7405
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:42:25.701988+00:00'
updated_at: '2026-11-01T06:42:25.701988+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-597b41d2.md` (BUG-46): intent/bookkeeping ticket (2e). Rule: per-fact, keep the strict superset / later side.
  - Frontmatter (`updated_at`, `completed_at`, `last_field_updated`, `status`): same fields changed on both sides. HEAD has 2026-11-01 `status: free_and_reconciled`, completed. Incoming b804ffda3c (2026-09-03) has `status: draft`, `completed_at: null`. Kept HEAD, the later state by timestamp, as the enrichment's resolution rule says. Applying incoming would have set a completed, reconciled ticket back to draft.
  - Body: the incoming commit appends "The panel wiring landed after all — REQ-114 shipped" and "An environment note…". HEAD already has both, word for word, so HEAD's body is a superset. The second conflict hunk was the same final line on both sides and differed only by the newline at end of file. Kept one copy, with incoming's trailing newline.

## Incoming changes preserved

- Not a code file. Every body change from b804ffda3c is in the resolved file (HEAD already had them). Net diff vs HEAD is only the newline at end of file, so this commit is effectively redundant (BUG-1109/BUG-1122 shape). Left for finalize to detect and skip.
- Flagged for post-merge review per the enrichment rule ("intent unknown on one or both sides"). Low risk: HEAD's version is a strict superset in content.
