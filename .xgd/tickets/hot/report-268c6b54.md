---
uid: report-268c6b54
id: REPORT-2852
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:30:30.159620+00:00'
updated_at: '2026-08-31T08:30:30.159620+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-7a6766b0.md` — **AA** (both added), intent/bookkeeping
  ticket (rule 2e + 2b). Index-only conflict: the path is outside the
  sparse-checkout cone (DOC-986 §2/§4.1), so there were no working-tree conflict
  markers. Resolved with `git checkout --theirs` + `git add --sparse`.

  Rule applied: **strict superset — keep the superset (incoming)**. The two sides
  are byte-identical apart from a single added frontmatter field on the incoming
  side:

  ```
  +  chat_comment: comment-fcc262b5
  ```

  No field is changed differently on the two sides, so there is no per-fact
  conflict and no `xgd working-timeline` tiebreak was needed. No content was
  invented; `fields.intent_uid` / `story_uid` / `capability_uid` were untouched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-7a6766b0.md` — confirmed. Incoming commit
  `811afd71622c016c83883fa69e7a751a72d7e518` ("xgd(ticket): update request
  request-7a6766b0") contributes exactly one net change relative to HEAD: the
  `chat_comment: comment-fcc262b5` field. The staged blob is
  `6693b95c30188daed522c367317098f667b853b2` — bit-for-bit the incoming stage-3
  blob — and `git diff --cached HEAD` on this path shows precisely that one added
  line and nothing else. Nothing from the HEAD side was dropped, since HEAD's
  version is a strict subset.

No code/implementation files were in conflict. No hunks were dropped, so the
BUG-1301 precedence exception was not invoked. No UAT test functions were touched.
CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`.
