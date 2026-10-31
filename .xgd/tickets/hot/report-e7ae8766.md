---
uid: report-e7ae8766
id: REPORT-7101
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:56:12.095388+00:00'
updated_at: '2026-10-31T22:56:12.095388+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` — intent/bookkeeping ticket (2e; bug ticket, lives in hot/). Rule: superset / later-intent per fact → kept HEAD (ours). Staged with `git add --sparse` (outside sparse cone).
  - Incoming 50646ff35f (2026-09-02, "scope BUG-49") sets status=draft, completed_at=null, last_field_updated=title, and an earlier, narrower wording of criterion 5.
  - HEAD (updated 2026-10-30) has status=free_and_reconciled, completed_at set, commits/version/bundled_in fields, and an expanded criterion 5 that extends the incoming wording (adds discovery-request failure, Cloudflare reason, success:false-under-200 handling).
  - Same facts on both sides; HEAD is later and a superset of the incoming wording. Matches the enrichment rule as well (take the more recent commit by timestamp). Flagged for post-merge review per enrichment rule.

## Incoming changes preserved

No code files involved. Checked `git diff 50646ff35f HEAD -- <ticket>`: every part of the incoming commit's body expansion (67+ lines of scope/criteria) is already in HEAD. The only differences are HEAD's later status/bookkeeping fields, the expanded criterion 5, and a missing trailing newline at EOF in HEAD. The resolution nets to no diff vs HEAD, so the commit is redundant (its effect already landed), not discarded. Finalize should detect the empty staged diff and skip it.
