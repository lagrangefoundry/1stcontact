---
uid: report-7714dd01
id: REPORT-2797
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:22:09.889976+00:00'
updated_at: '2026-08-31T07:22:09.889976+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-f1afe355.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2b + 2e strict-superset). Ours = `xgd(ticket): create chat chat-f1afe355`; incoming = `xgd(ticket): update chat chat-f1afe355` (2f479a91c16164e2c24c8011b923d77c1d4afdc0). The two versions are identical except that the incoming side carries one additional field, `fields.chat_comment: comment-378f989f`. Incoming is therefore a strict superset of ours, so the superset rule applies directly and no per-fact timeline lookup was needed — the "flag for post-merge review" enrichment note is recorded here for completeness, but there is no competing fact between the sides. Resolved with `git checkout --theirs` + `git add --sparse` (path is under `.xgd/tickets/`, outside the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/chat-f1afe355.md`: verified with `git diff --cached 2f479a91 -- <path>` — empty output, i.e. the staged blob is byte-identical to the incoming commit's version. The incoming commit's only content contribution over ours, `fields.chat_comment: comment-378f989f`, is present in the resolved file (line 15). Nothing from the ours side was dropped: every field ours contained is also present in the incoming version.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or spec-ticket files were involved in this conflict.
