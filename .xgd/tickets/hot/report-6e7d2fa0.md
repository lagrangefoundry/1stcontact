---
uid: report-6e7d2fa0
id: REPORT-4218
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:54:31.599283+00:00'
updated_at: '2026-09-14T03:54:31.599283+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU** (index-only; the path is outside
  the sparse-checkout cone, so there was no working-tree file and no conflict
  markers on disk). Class **2e** (intent/bookkeeping ticket — a `bug-*` ticket,
  not a matrix-defining spec ticket). Rule applied: **same facts changed on both
  sides → take the later-positioned intent**, which here is ours.

  - Incoming commit `b6b2cfc5` (`xgd(ticket): update bug bug-360c5a44`,
    2026-09-01 15:03) fills the stub in: sets the real `title`, adds
    `severity: high`, and writes the first full body (Symptom / What was verified
    / Root cause / Fix / Test plan). 63 insertions, 4 deletions.
  - The HEAD side (stage 2, from `f69c12c1 xgd(ticket): seed_local_overlay`) is
    the *same document, later revised*, not a divergent one. It carries the
    identical `title`, `severity: high` and `chat_comment`, every section the
    incoming body has, plus a new `## What is wanted` section, `status: bundled`,
    `commits[].working_sha 84cc117a`, `version: 0.2.40`, and
    `bundled_in: bundle-8e1807f6`.
  - Ordering was established from history rather than assumed (BUG-1030 /
    `git log -S`): the ours-only phrase "emitted per write" was introduced by
    `fd72594eb0 xgd(ticket): update bug bug-360c5a44` (2026-09-01 15:29), and
    `git merge-base --is-ancestor b6b2cfc5 fd72594eb0` confirms the incoming
    commit is a **direct ancestor** of it on the developer's own working
    timeline. The seeded overlay pulled that later state into HEAD.
  - Where the two sides state the same fact differently, ours is the developer's
    own later answer, e.g. the emission point of the change signal: incoming says
    "when the turn ends ... yield one final event after the model's own stream",
    ours says the counter is re-read after every `tool_activity` and a
    `site_changed` event is emitted *per write*. Same author, 26 minutes later,
    superseding — not a competing edit from an automated workflow.
  - There is no content on the incoming side that is absent from ours, so nothing
    had to be composed in from stage 3.
  - Resolved with `git checkout --ours --ignore-skip-worktree-bits` followed by
    `git add --sparse`. Verified byte-identical to stage 2 via `diff` against
    `git show :2:<path>`, and grepped for zero conflict markers.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — **preserved**. Each fact the incoming
  commit introduces is present in the resolved file: `title` (line 5, identical
  string), `severity: high` (line 17), `chat_comment: comment-ab9333e3`
  (line 16), and the `## Symptom` / `## Root cause` / `## Fix` / `## Test plan`
  sections (lines 26, 43, 75, 99) including the `site_changed` design the ticket
  is about. The prose differs only where the developer's own later commit
  rewrote it.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.

## Note on the empty staged diff

`git diff --cached HEAD --stat` is empty: the resolution equals HEAD. This is the
**redundant** case, not the discarded case, and STEP 3's check is what
distinguishes them — the incoming commit's key changes are verifiably *present*
in HEAD (reached by a different route: the seeded local overlay, which already
carries the developer's later revision of this same ticket), rather than absent.
Per STEP 4 this is staged and exited `@done` as normal; `--skip` was not called,
and the cherry-pick sequencer state (`CHERRY_PICK_HEAD`) is intact for
`cherry_pick_finalize_resolution`.
