---
uid: report-0b599ba5
id: REPORT-4335
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:58:18.873913+00:00'
updated_at: '2026-09-18T06:58:18.873913+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — class **AA** (both added), intent/bookkeeping
  ticket → rule **2e**. Outside the sparse-checkout cone handling was not needed
  (the file was materialised), but staging used `git add --sparse` per DOC-986.
  - Ours (HEAD, `6e8b3d5` 2026-09-11, `xgd(ticket): update bug bug-23d1ec27`):
    BUG-39 at `status: bundled`, `updated_at 2026-08-31`, frontmatter carrying
    `chat_comment`, `commits`, `version: 0.2.15`, `story_points`,
    `bundled_in: bundle-8eef3846`; body rewritten post-implementation
    ("Fix — as landed", "Watch for — resolved", ticked acceptance criteria, the
    out-of-scope REQ-127/AC1055 note).
  - Theirs (incoming, `0d545fd` 2026-08-24, `xgd(ticket): create bug bug-23d1ec27`):
    the original creation of the SAME ticket at `status: draft`, `last_field_updated:
    created_at`, fields limited to `priority`, `severity`, `auto_merge_back`,
    `needs_review`; body is the pre-implementation plan of the same sections.
  - Per-fact analysis: the two sides are not disjoint edits to different
    fields — they are the same ticket at two lifecycle positions. Ours'
    frontmatter is a strict superset of theirs (every incoming field present,
    same values, plus five more). Every body section on the incoming side
    (Symptom, Root cause, Fix, Watch for, Acceptance criteria, Reproduce) has a
    corresponding, later-authored section on ours. Where the same section reads
    differently, that is the later intent restating it after the work landed, so
    the timeline rule applies per fact and selects ours (2026-09-11 ≫
    2026-08-24). Resolution: **ours**, via `git checkout --ours` + `git add --sparse`.
  - Flagged for post-merge review as the enrichment rule requests (intent kind
    unknown on the ours side), though the superset relationship above makes the
    outcome unambiguous.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket.

The incoming commit `0d545fd` creates BUG-39. Its entire content is already
present in HEAD by a different route: HEAD holds the same `uid: bug-23d1ec27` /
`id: BUG-39` ticket with the same title, `created_by`, `created_at`, and the same
symptom/root-cause/AC narrative, advanced through the later `xgd(ticket): update
bug` commits on this branch. Nothing the incoming commit asserts is absent from
the resolved tree — this is the redundant case described in STEP 4, not the
discarded case in STEP 3.

Consequently the staged tree nets to no diff vs HEAD (`git diff --cached --stat`
is empty, `git status --porcelain` is empty, no conflict markers remain). Per
STEP 4 this is staged and exited `@done` as normal; `--skip`/`--continue` were
NOT invoked and `CHERRY_PICK_HEAD` is still present for
`cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was used; no test function was deleted.
