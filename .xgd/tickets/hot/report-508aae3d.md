---
uid: report-508aae3d
id: REPORT-2712
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:40:49.291374+00:00'
updated_at: '2026-08-31T05:40:49.291374+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-dd68c68a.md` — class **AA** (both added), intent/bookkeeping ticket (rule **2e**, with **2b** superset case). Both sides created the file independently: HEAD via `sync_working_to_main` (sync from xgd-working b8606f0d68b7, post-watermark), incoming via free_coded `xgd(ticket): update request request-dd68c68a` (e474b9c505c2a2aec74bacd18731bdde4d2f5bbe). The two versions are byte-identical apart from a single added frontmatter field on the incoming side, so incoming is a strict superset — resolved by taking incoming whole (`git checkout --theirs`, then `git add --sparse`). No per-fact timeline arbitration was needed: no field is set differently on the two sides.

## Incoming changes preserved

- `.xgd/tickets/hot/request-dd68c68a.md` — the incoming commit's only unique content is `chat_comment: comment-5456ff77` in the frontmatter (after `bundled_in: bundle-adc60ee8`). The resolved file is byte-identical to the incoming blob, and `git diff --cached --stat HEAD` shows exactly `1 insertion(+)` — that line. All HEAD-side content is retained, since HEAD's version was a proper subset.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or config files were in conflict.
