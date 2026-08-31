---
uid: report-7bd7e574
id: REPORT-2776
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:56:11.793682+00:00'
updated_at: '2026-08-31T06:56:11.793682+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-096194df.md` — class **AA** (both added), intent/bookkeeping ticket (rule **2e**). Incoming is a **strict superset** of HEAD: the two versions are byte-identical except that the incoming side adds one new frontmatter field, `fields.chat_comment: comment-c02bb648`. No shared field or section differs, so there is no per-fact conflict and no timeline lookup was needed. Kept the superset: `git checkout --theirs` then `git add --sparse`.

## Incoming changes preserved

- Incoming commit: `a34ae94bfd7e3545bbcbd32f1f2caaf914c4f6a6` — *xgd(ticket): update request request-096194df* (Martin Westhead, 2026-08-23).
- The staged blob is exactly the incoming (stage-3) blob `708bf0bfcfb46bd8d88f4dda0335b52d52a81ad0`. Verified via `git diff --cached`, whose sole hunk is the added `chat_comment: comment-c02bb648` line — i.e. 100% of the incoming delta is present in the resolution, and nothing from the HEAD side was dropped.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, config, or UAT test files were involved in this conflict.

Tree state after resolution: no conflict-class entries remain; the file shows as `M ` (staged). The in-progress cherry-pick (`CHERRY_PICK_HEAD`) was left untouched for `cherry_pick_finalize_resolution`.
