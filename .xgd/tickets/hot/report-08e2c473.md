---
uid: report-08e2c473
id: REPORT-2775
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:54:46.170929+00:00'
updated_at: '2026-08-31T06:54:46.170929+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-f243b6b9.md` — AA (both added), intent/bookkeeping ticket (rule 2e). Content-wise the two sides are identical except that the incoming (free_coded) side adds one field: `fields.chat_comment: comment-7591b3ca`. Incoming is a strict superset of HEAD, so the superset was kept (`git checkout --theirs` + `git add --sparse`). No field was changed differently on both sides, so no timeline lookup was needed. No content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/request-f243b6b9.md`: the incoming commit `f990a0fe48242a856220e330e9db3cb496d29bf3` ("xgd(ticket): update request request-f243b6b9") contributes exactly one line relative to HEAD — `  chat_comment: comment-7591b3ca` under `fields:`. Verified by diffing index stages 2 and 3 (single-line delta) and by `git diff --cached`, which shows that one added line and nothing else. All HEAD-side body/frontmatter content is retained unchanged.

No code/implementation files were conflicted, so no BUG-1301 precedence exceptions were applied and no hunks were dropped.
