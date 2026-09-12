---
uid: report-c0a2d88d
id: REPORT-4120
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:59:36.602376+00:00'
updated_at: '2026-09-12T19:59:36.602376+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e).
  Two conflict regions, both purely additive on one side:
  - **Frontmatter `fields:`** — HEAD added bundling bookkeeping
    (`commits`, `version: 0.2.15`, `story_points: 3`,
    `bundled_in: bundle-8eef3846`); incoming (e2ef5e9851) added
    `chat_comment: comment-72dd436d`. Disjoint fields → applied BOTH.
    No same-field conflict, so no timeline tiebreak was needed.
    `status`/`updated_at`/`last_field_updated` auto-merged to HEAD's
    later values (2026-08-31 bundled vs incoming's 2026-08-24 draft).
  - **`## Reproduce` tail** — HEAD appended a "Note: in a fresh
    worktree…" paragraph after the fence; incoming's only change in
    this region was stripping the final newline. HEAD is a strict
    content superset → kept HEAD's paragraph. Final newline normalized
    away so the result matches both sides (neither side ends with one).

  Resolved by hand-editing out the markers, NOT `git checkout --ours`
  — `--ours` (stage :2:) would have dropped the incoming `chat_comment`
  field. Staged with `git add --sparse` (`.xgd/tickets/**` is outside
  the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).

## Incoming changes preserved

Incoming commit e2ef5e9851 made exactly two changes to this file:

1. `+  chat_comment: comment-72dd436d` — present in the resolved file
   (line 18). It is also already present in HEAD:
   `git show HEAD:.xgd/tickets/hot/bug-23d1ec27.md` line 18 carries the
   same field, so this commit's content intent had already landed on
   the bundle branch by another route.
2. Removal of the trailing newline at EOF — the resolved file also ends
   without a trailing newline.

Both incoming changes are therefore present. No hunks were dropped;
the BUG-1301 precedence exception was not invoked.

Net result: the staged tree is byte-identical to HEAD
(`git status --porcelain` is empty, `git diff --cached` is empty).
This is the redundant-commit case of STEP 4 / BUG-1109-BUG-1122, not a
discard — STEP 3's discriminator confirms the incoming commit's key
change IS in HEAD rather than merely absent. `--skip` was NOT called;
CHERRY_PICK_HEAD is still present (e2ef5e9851) for
cherry_pick_finalize_resolution to handle.
