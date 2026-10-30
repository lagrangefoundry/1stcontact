---
uid: report-383fc865
id: REPORT-4613
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:05:32.123619+00:00'
updated_at: '2026-09-21T04:05:32.123619+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — UU, intent/bookkeeping ticket
  (STEP 2e). Conflict is confined to a single hunk in the YAML
  frontmatter; the markdown body is byte-identical across base, ours
  and theirs.

  Per-fact resolution:
  - `status`, `updated_at`, `last_field_updated` — changed on BOTH
    sides to different values (ours: `free_and_reconciled` @
    `2026-09-01T00:00:07.956062+00:00`; theirs: `reconciling` @
    `2026-08-31T19:21:08.797753+00:00`). Genuine same-field intent
    conflict → later-positioned intent wins → OURS.
  - `completed_at`, `result: pass`, `merged_at_commit`,
    `fields.orphan_commits` (137 old_sha/new_sha pairs), and the
    collapsed `fields.commits` entry carrying `main_sha` — present
    only on ours, absent on theirs. Non-overlapping additions → kept.
  - Theirs contributes no field that ours lacks; ours is a strict
    superset. Net resolution == ours blob
    (`3f33389de1c8663f283ff2582cc9d8151d80bcac`).

  Staged with `git add --sparse` (non-cone sparse checkout; ticket
  files are skip-worktree in this resync worktree, DOC-986 §2/§4.1).
  Resulting staged tree is identical to HEAD, so `git status
  --porcelain` is empty — the no-net-change case; finalize will
  handle the empty commit.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's
`git show $CPHEAD -- <file>` verification applies to none of them.

For the single ticket file, the incoming transition
`ready_to_reconcile` → `reconciling` is intentionally NOT present in
the resolved version. This is not a discarded developer change: the
incoming commit `232a68212a` ("xgd(ticket): update bundle
bundle-8eef3846") records an intermediate lifecycle state that the
resync branch has already advanced past. HEAD carries the terminal
state `free_and_reconciled` with `result: pass`, `completed_at`, and
the full orphan-commit rewrite map — data that exists nowhere else.
Taking theirs would regress a completed, reconciled bundle back to
in-flight and destroy that map. Resolution follows STEP 2e's
per-fact later-intent rule, not a shortcut.

No UAT test functions were touched; the BUG-1301 precedence
exception was not invoked.
