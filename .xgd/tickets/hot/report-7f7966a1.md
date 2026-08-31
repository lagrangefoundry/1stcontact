---
uid: report-7f7966a1
id: REPORT-2779
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:59:03.424087+00:00'
updated_at: '2026-08-31T06:59:03.424087+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-f983e8eb.md` — class **AA** (both added), intent/bookkeeping
  ticket → rule **2e** (strict-superset case). Both sides added the same BUG-9
  ticket file; the two blobs are byte-identical except that the incoming
  (free_coded) side carries one extra frontmatter field under `fields:`:
  `chat_comment: comment-f76c6986`. Incoming is a strict superset of HEAD, so the
  incoming version was taken whole (`git checkout --theirs`, then
  `git add --sparse`). No timeline lookup was needed — there is no fact that the
  two sides set differently, so no genuine intent conflict exists.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-f983e8eb.md`: confirmed. The incoming commit
  `56198ba19c9e9802169fa4459681537a35e197ce` adds this file (99 insertions). The
  resolved working-tree file matches the incoming blob
  `aa927c28d164f837ce69ad7137a8dc8534705f5d` exactly — body prose, `fields.commits`,
  `version`, `story_points`, `bundled_in`, and the incoming-only
  `fields.chat_comment: comment-f76c6986` are all present. The staged diff vs HEAD
  is `1 file changed, 1 insertion(+)` — precisely the one field HEAD lacked; the
  remaining 98 lines were already identical on the HEAD side.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here.
No code, test, or spec-ticket files were involved in this conflict.

Post-resolution `git status --porcelain` shows no conflict-class entries; the file
is staged as `M`. The in-progress cherry-pick was left untouched (CHERRY_PICK_HEAD
still present) for `cherry_pick_finalize_resolution`.
