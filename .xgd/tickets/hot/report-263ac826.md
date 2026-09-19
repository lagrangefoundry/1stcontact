---
uid: report-263ac826
id: REPORT-4423
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:28:19.443912+00:00'
updated_at: '2026-09-19T12:28:19.443912+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — UU (index-only; path is outside the
  sparse-checkout cone, so there were no working-tree markers). Intent/bookkeeping
  ticket → rule 2e, "one side is a strict superset of the other: keep the
  superset". Resolved with `git checkout --ours` + `git add --sparse`.

  Sides:
  - base (stage 1, `e3626c4`): the freshly-created stub — `title: Untitled`,
    `status: draft`, body `(new ticket)`.
  - incoming (stage 3, `df6c01f`, commit `a705404` "xgd(ticket): update request
    request-8b33a146"): base **plus one line**, `fields.chat_comment:
    comment-972387b5`. Nothing else.
  - ours (stage 2, `c66d9bf`, "xgd(ticket): seed_local_overlay request
    request-8b33a146"): the fully-developed REQ-172 ticket — real title
    ("Library detail: render documents inline, with an expand-to-modal reader"),
    `status: bundled`, `completed_at`, `fields.commits` (2 working shas),
    `version: 0.2.37`, `bundled_in: bundle-8e1807f6`, the full request body —
    **and `fields.chat_comment: comment-972387b5`** already present.

  Ours is a strict superset of incoming on every fact, including the single fact
  incoming contributes. No per-fact timeline comparison was needed: the two sides
  do not disagree about anything. Taking incoming would have reverted the ticket
  to the Untitled/draft stub.

## Incoming changes preserved

The incoming commit's only change to this file is the single added line
`  chat_comment: comment-972387b5` in `fields:`. It is present verbatim in the
resolved (ours) blob at line 14, immediately after `priority: medium` — the same
position the incoming diff places it. Nothing from the incoming commit was
discarded; no hunk was dropped, so the BUG-1301 precedence exception was not
invoked.

No code, test, or spec-ticket files were involved in this conflict.

## Note for the finalize step

The resolution nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty):
HEAD already carries the incoming commit's effect, so this pick is genuinely
redundant rather than discarded (STEP 3's distinction — the incoming change is
*present* in HEAD, not merely absent from the resolution). Staged and left for
`cherry_pick_finalize_resolution`; `CHERRY_PICK_HEAD` was not touched and no
`--continue`/`--skip`/`--abort` was run.
