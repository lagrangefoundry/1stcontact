---
uid: report-4026bcea
id: REPORT-2743
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:15:08.297042+00:00'
updated_at: '2026-08-31T06:15:08.297042+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-7ff1bacd.md` — AA (both added), intent/bookkeeping ticket (2b + 2e). Both sides added a 827/828-line request ticket that is identical except that the incoming (free_coded) side adds one frontmatter field: `chat_comment: comment-024feeba`. Incoming is a strict superset, so the superset rule applies — took the incoming version via `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

No timeline lookup was needed: no field is changed differently on the two sides, so there is no competing fact to arbitrate. The metadata note ("intent unknown on one or both sides, take the more recent commit and flag for review") is moot here because the two sides do not disagree — the resolution is a pure superset take, and the only delta is the added `chat_comment` field flagged above for post-merge awareness.

## Incoming changes preserved

- `.xgd/tickets/hot/request-7ff1bacd.md`: confirmed. `git diff 892261004fabb194a9c873fa7a9d6da5b94946d2 -- .xgd/tickets/hot/request-7ff1bacd.md` against the staged index returns empty output — the staged blob (`bf08ca0860`) is byte-identical to the incoming commit's version. Nothing from the incoming commit was discarded.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or spec-ticket files were involved in this conflict.
