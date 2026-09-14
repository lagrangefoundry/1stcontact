---
uid: report-a95f1aa5
id: REPORT-4201
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T02:58:51.731550+00:00'
updated_at: '2026-09-14T02:58:51.731550+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — class **AA** (both added), intent/bookkeeping
  ticket (STEP 2b superset rule, cross-checked against 2e). Sparse-excluded path,
  so resolved index-only via `git checkout --ours --ignore-skip-worktree-bits`
  followed by `git add --sparse`. Resolved blob verified byte-identical to index
  stage 2 (`91ed8faee2704741e910ca1763940861ec086d95`).

  - **Ours (HEAD, `79ad55aaf1` `xgd(ticket): seed_local_overlay bug bug-034bf955`)**:
    fully populated BUG-42 ticket — real title, `status: bundled`,
    `bundled_in: bundle-8e1807f6`, `commits[]` with
    `working_sha: bd7612f97…`, `severity`, `story_points`, `version`,
    `chat_comment`, plus the full Symptom / Root cause / Fix / Test plan body.
  - **Theirs (incoming `c85e8a4a27` `xgd(ticket): create bug bug-034bf955`)**:
    the 18-line creation stub — `title: Untitled`, `status: draft`,
    `last_field_updated: created_at`, body `(new ticket)`.

  Ours is a strict superset: every field the incoming stub introduces
  (`uid`, `id`, `type`, `created_by`, `created_at`, `auto_merge_back`,
  `needs_review`, `priority`) is present and identical in ours; the only
  differing values are the stub's initial placeholders, which ours' later
  overlay already superseded. No content was invented, and no field on either
  side was dropped.

## Incoming changes preserved

No code/implementation files were in this conflict — the incoming commit
`c85e8a4a27` touches exactly one file, the ticket above (18 insertions, 1 file).

STEP 3 check: the incoming commit's effect — the existence of ticket
bug-034bf955 / BUG-42 with its creation metadata — is **present in HEAD**, via
the seed_local_overlay route, not absent. This is the redundant-commit case
(BUG-1109/BUG-1122, and the known seeded-overlay pattern for `.xgd/tickets`
`create`/`update` cherry-picks), not a discard, so it is not a @fail condition.

Consequently `git diff --cached HEAD` is empty. Per STEP 4 this was left alone —
no `--skip`, no `--continue`; CHERRY_PICK_HEAD is still present
(`c85e8a4a271e02258160048179056e80b6c434a6`) for
`cherry_pick_finalize_resolution` to act on.

No hunks were dropped under the BUG-1301 precedence exception.

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain.
