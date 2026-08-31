---
uid: report-1aa61d43
id: REPORT-2734
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:05:58.315130+00:00'
updated_at: '2026-08-31T06:05:58.315130+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-5537a133.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e). Both sides added the same BUG-19 ticket; the only difference
  between the two stages is that the incoming (free_coded) side carries one extra
  frontmatter field, `fields.chat_comment: comment-d6f9d5be`. The incoming side is
  a strict superset of HEAD's — body text, all other fields, timestamps and status
  (`free_and_reconciled`) are byte-identical. Applied 2e's "keep the superset" rule:
  `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout
  cone, DOC-986 §2/§4.1). No content was invented and no field on either side was
  dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-5537a133.md` — verified: the staged blob is byte-identical
  to `7e6fd4ad6fe6e31b3135be32098d7b21afba787c:.xgd/tickets/hot/bug-5537a133.md`
  (diff against the incoming commit's version is empty). The incoming commit's only
  change to this file relative to HEAD (`+  chat_comment: comment-d6f9d5be`) is
  present in the resolution; staged diff vs HEAD is `1 file changed, 1 insertion(+)`.

No code/implementation files were conflicted in this cherry-pick, so no BUG-1301
precedence exception was invoked and no hunk was dropped.
