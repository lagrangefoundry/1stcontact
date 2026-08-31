---
uid: report-f01562ec
id: REPORT-2752
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:25:03.720555+00:00'
updated_at: '2026-08-31T06:25:03.720555+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-83598de5.md` — AA (both added), intent/bookkeeping ticket (STEP 2e + 2b superset rule). Resolved by taking the incoming side in full.
  - Ours (HEAD): `sync_working_to_main` — "xgd: sync from xgd-working 715a993ebead (post-watermark)"
  - Theirs (incoming, free_coded): `fb101ad46b1a56f3084098cf0ad512f006c969f9` — "xgd(ticket): update request request-83598de5"
  - The two sides are identical apart from a single added frontmatter field on the incoming side: `fields.chat_comment: comment-5fbbf487`. Incoming is a strict superset — a field the ours side never touched — so per 2e ("keep the superset") and 2b, incoming wins outright. No same-field disagreement exists, so no `xgd working-timeline` per-fact adjudication was needed.
  - Path is outside the sparse-checkout cone (DOC-986 §2/§4.1): resolved with `git checkout --theirs` then `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-83598de5.md`: the staged blob is `fdf439d305ff4248ec8e5ef63d333952af3bf070`, byte-identical to stage 3 (theirs) of the index — i.e. all 231 lines the incoming commit authored are present verbatim, including the `chat_comment: comment-5fbbf487` field that is the commit's entire substantive delta. Verified present in the working tree at line 22. Nothing from the ours side was lost either, since ours was a strict subset.

No code/implementation files were involved in this conflict. No hunks were dropped; the BUG-1301 precedence exception was not invoked. No test functions were touched.
