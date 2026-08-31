---
uid: report-6af79413
id: REPORT-2716
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:44:23.449703+00:00'
updated_at: '2026-08-31T05:44:23.449703+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-807a7b1d.md` — AA (both added), intent/bookkeeping ticket (STEP 2 rule 2b + 2e). Ours = `sync_working_to_main` (sync from xgd-working d3562e3b8285, post-watermark); theirs = incoming free_coded `xgd(ticket): update request request-807a7b1d` (810d10de4763). The two sides are byte-identical except that the incoming side adds one frontmatter field, `fields.chat_comment: comment-8102244d`. Incoming is therefore a strict superset with no competing fact, so the superset rule applies and no timeline lookup was needed. Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-807a7b1d.md` — verified: `git diff --cached 810d10de4763 -- <path>` is empty, i.e. the staged content is byte-identical to the incoming commit's version. The incoming commit's only change relative to HEAD (`+  chat_comment: comment-8102244d`) is present in the resolution. Nothing from the ours side was lost — every other line is common to both sides.

No code/implementation files were conflicted in this cherry-pick; no hunks were dropped, so the BUG-1301 precedence exception did not apply. No UAT test functions were touched.

Final tree state: `git status --porcelain` shows no UU/AA/DU/UD lines; the file stages as `M `. The in-progress cherry-pick was left intact (CHERRY_PICK_HEAD untouched) for `cherry_pick_finalize_resolution`.
