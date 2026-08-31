---
uid: report-3335bb57
id: REPORT-2788
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:10:10.282312+00:00'
updated_at: '2026-08-31T07:10:10.282312+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-7e28b435.md` — class **AA** (both added), intent/bookkeeping
  ticket (STEP 2 rule **2e**, "one side is a strict superset").
  Both sides of the cherry-pick added BUG-16's ticket file. A byte diff of the two
  index stages showed exactly one difference: the incoming side (stage 3, the
  `free_coded` commit `da664467`) carries an extra frontmatter field
  `chat_comment: comment-e1bba4aa` at line 25; every other byte — frontmatter,
  fields block (severity/priority/auto_merge_back/needs_review/commits/version/
  story_points/bundled_in), and the full narrative body — is identical.
  Incoming is therefore a strict superset of HEAD, so no per-fact timeline
  comparison was needed: no field or section was changed differently on the two
  sides, so there is no competing fact to adjudicate. Resolved with
  `git checkout --theirs`, staged with `git add --sparse` (path is outside the
  sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-7e28b435.md` — verified: the staged blob
  (`git show :<path>`) is **byte-identical** to
  `git show da664467d7fb9c181af58753d22efcfb24e78b8d:<path>` (`diff` exit 0).
  The incoming commit's sole substantive change relative to HEAD — the
  `chat_comment: comment-e1bba4aa` field linking BUG-16 to its chat comment — is
  present in the resolved file. Nothing from the HEAD side was lost, since HEAD's
  content is a subset of the staged result.

No code/implementation files were in conflict — this cherry-pick's only conflict was
the single ticket file above, and the incoming commit (`da664467`, 92 insertions,
1 file) touches nothing else. No hunks were dropped; the BUG-1301 precedence
exception did not apply and no test function was deleted.

Staging verified clean: `git status --porcelain` reports no UU/AA/DU/UD/AU/UA lines;
the file shows as `M ` (staged modification). Staged diff vs HEAD is 1 insertion, so
this is not a no-op resolution. The in-progress cherry-pick was left untouched —
CHERRY_PICK_HEAD is still present for `cherry_pick_finalize_resolution`.
