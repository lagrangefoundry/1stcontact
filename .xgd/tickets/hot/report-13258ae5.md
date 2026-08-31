---
uid: report-13258ae5
id: REPORT-2747
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:19:47.771390+00:00'
updated_at: '2026-08-31T06:19:47.771390+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-d67ea520.md` — **AA (both added)**, intent/bookkeeping
  ticket (`request-*`). Rules **2b** (AA: one side strictly a superset → keep the
  superset) and **2e** (intent ticket: incoming only added a field the other side
  never touched → keep the superset). Resolved via `git checkout --theirs` +
  `git add --sparse`.

  The two sides were byte-identical except for a single added frontmatter field
  on the incoming side:

  ```diff
     bundled_in: bundle-ee56a66e
  +  chat_comment: comment-92e47bff
  ```

  No competing edit existed on the HEAD side — no field, section, or paragraph
  was changed differently by the two sides — so no per-fact timeline
  adjudication (`xgd working-timeline`) was required. The conflict-intent
  metadata flagged "intent unknown on one or both sides"; that fallback rule
  (take the more recent commit, flag for review) is moot here because the
  incoming side is a strict superset and taking it discards nothing from HEAD.

## Incoming changes preserved

- `.xgd/tickets/hot/request-d67ea520.md` — fully preserved. The incoming commit
  `cc080b39c7d66ef7e73f889e43a9bf09fabc8274` ("xgd(ticket): update request
  request-d67ea520") adds this file in its entirety (110 insertions). The
  resolved worktree file hashes to `1f2f605d72d562f2730828734757a539997244f0`,
  which is exactly the incoming (stage-3) blob — the resolution is
  byte-identical to the developer's version, including the new
  `chat_comment: comment-92e47bff` field. Nothing from the incoming commit is
  absent.

No code/implementation files were in conflict. No hunks were dropped, so the
BUG-1301 precedence exception was not invoked. No UAT test functions were
touched. Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact for
`cherry_pick_finalize_resolution`.
