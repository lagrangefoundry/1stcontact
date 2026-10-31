---
uid: report-ec22e9c7
id: REPORT-6961
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:26:03.060774+00:00'
updated_at: '2026-10-31T21:26:03.060774+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` (BUG-44): intent/bookkeeping ticket (2e). HEAD is a strict superset, so I kept HEAD (`git checkout --ours`, `git add --sparse`). The file is outside the sparse cone.
  - Frontmatter: HEAD has `updated_at` 2026-10-30, `status: free_and_reconciled` and `completed_at` set. Incoming `a24623a2be` (2026-09-02) has `status: draft` and `completed_at: null`. HEAD is the later state; taking incoming would have reverted a reconciled ticket to draft.
  - Body: everything incoming adds (the "What registration is actually worth" analysis, ending "rather than repair. Not decided here.") is already in HEAD verbatim. HEAD then extends that paragraph and adds the "do not back site-asset metadata with material tickets" reasoning, the operator decision to remove the registry, the required behaviour, and the test plan.

## Incoming changes preserved

There are no code files in this conflict. Every content addition from `a24623a2be` is already in HEAD, so the commit is redundant and the staged diff against HEAD is empty (BUG-1109/BUG-1122 shape). The finalize step should detect the empty diff and skip the commit. The only incoming values left out are the stale frontmatter (`updated_at`, `status`, `completed_at`, `last_field_updated`), which HEAD's later state supersedes.

## Post-merge review flag

Enrichment marked the intent as unknown on both sides. I resolved it by keeping the later ticket state, as the enrichment rule says, and I'm flagging it for post-merge review.
