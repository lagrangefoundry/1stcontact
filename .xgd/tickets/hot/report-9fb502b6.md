---
uid: report-9fb502b6
id: REPORT-4217
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:48:51.172903+00:00'
updated_at: '2026-09-14T03:48:51.172903+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU** (index-only; path is outside the
  sparse-checkout cone, so there was no working-tree file and no conflict
  markers on disk). Class **2e** (intent/bookkeeping ticket — a `bug-*` ticket,
  not a matrix-defining spec ticket). Rule applied: **strict superset — keep the
  superset (ours)**.

  - Incoming commit `ad63102c` (`xgd(ticket): update bug bug-360c5a44`) adds
    exactly one line to the YAML frontmatter: `chat_comment: comment-ab9333e3`.
    That is its entire diff (1 insertion, 0 deletions).
  - The HEAD side (stage 2, from `xgd(ticket): seed_local_overlay bug
    bug-360c5a44`) already carries `chat_comment: comment-ab9333e3`, and
    additionally carries the real title, `status: bundled`, `severity`,
    `commits`, `version`, `bundled_in`, and the full Symptom / Root cause / Fix /
    Test plan body. Stage 3 (incoming) is still the `title: Untitled`,
    `status: draft`, `(new ticket)` stub.
  - Ours is therefore a strict superset of theirs on every fact, including the
    one fact the incoming commit set. No field is changed differently on the two
    sides, so the timeline rule was not needed and nothing was discarded.
  - Resolved with `git checkout --ours --ignore-skip-worktree-bits` followed by
    `git add --sparse`. Verified byte-identical to stage 2 via `diff` against
    `git show :2:<path>`.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — **preserved**. The incoming commit's only
  change is the `chat_comment: comment-ab9333e3` field; `grep` confirms it is
  present at line 16 of the resolved file, and `git show HEAD:<path>` confirms
  it is present at line 16 of HEAD as well.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.

## Note on the empty staged diff

`git diff --cached HEAD --stat` is empty: the resolution equals HEAD. This is the
**redundant** case, not the discarded case, and STEP 3's check is what
distinguishes them — the incoming commit's key change (`chat_comment`) is
verifiably *present* in HEAD via the seeded local overlay, rather than absent.
Per STEP 4 this is staged and exited `@done` as normal; `--skip` was not called,
and the cherry-pick sequencer state (`CHERRY_PICK_HEAD`) is intact for
`cherry_pick_finalize_resolution`.
