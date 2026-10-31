---
uid: report-0decc6a9
id: REPORT-6951
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:20:26.076097+00:00'
updated_at: '2026-10-31T21:20:26.076097+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — intent/bookkeeping ticket (2e), UU (index-only, outside sparse cone). Resolved to HEAD's version and staged with `git add --sparse`.
  - Frontmatter conflict (updated_at / completed_at / last_field_updated / status): the same facts changed on both sides. HEAD has 2026-10-30, completed, `status: free_and_reconciled`. Incoming 2ef40f9d6f (authored 2026-09-01) would set it back to `status: draft`, `completed_at: null`. Kept HEAD's values because they are later by commit timestamp (this matches the enrichment rule "take the more recent commit by timestamp").
  - Body: the incoming commit's only body change (rewording the "Fault 4" bullet to "the promote/register asymmetry above...") is already in HEAD word for word, so HEAD is a superset.

## Incoming changes preserved

There are no code files in this conflict. The incoming body change is already in HEAD. The only incoming changes not kept are stale timestamp and status values from 2026-09-01, which HEAD's 2026-10-30 completion supersedes. The staged result has no diff from HEAD: the incoming commit is redundant (BUG-1109/BUG-1122 shape), so finalize can skip it. No hunks were dropped under the BUG-1301 exception.

## Flag for post-merge review

The enrichment marked the intent as unknown on one or both sides. Flagging bug-5bc83942 for post-merge review, as the rule requires.
