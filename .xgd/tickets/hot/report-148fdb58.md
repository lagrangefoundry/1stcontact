---
uid: report-148fdb58
id: REPORT-2771
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:50:37.958692+00:00'
updated_at: '2026-08-31T06:50:37.958692+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-b68d501b.md` — AA (both added), intent/bookkeeping ticket (2e). Sparse-checkout path, so resolved with `git checkout --theirs` + `git add --sparse`.
  - Ours (HEAD): `sync_working_to_main` — "xgd: sync from xgd-working b8606f0d68b7 (post-watermark)".
  - Theirs (incoming, a9f8cbf9c7d4): `xgd(ticket): update request request-b68d501b`.
  - The two sides are byte-identical except that the incoming side adds one frontmatter field: `fields.chat_comment: comment-ab756572`. Incoming is therefore a strict superset — 2e's superset rule applies directly, and no per-fact timeline arbitration was needed (no field is changed differently on the two sides).

## Incoming changes preserved

- `.xgd/tickets/hot/request-b68d501b.md`: the incoming commit's only change relative to the HEAD side is the added `chat_comment: comment-ab756572` field. Verified present in the staged blob (`git show :<path>` line 21). The rest of the file is unchanged and identical on both sides. Nothing was dropped; no BUG-1301 precedence exception was invoked.
