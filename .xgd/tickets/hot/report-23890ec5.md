---
uid: report-23890ec5
id: REPORT-3363
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:17:07.732499+00:00'
updated_at: '2026-09-02T21:17:07.732499+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Incoming commit `e2ef5e98` ("xgd(ticket): update bug bug-23d1ec27",
  2026-08-25) made exactly two changes to this file: it added the frontmatter
  field `chat_comment: comment-72dd436d`, and it stripped the file's trailing
  newline.

  The HEAD side (via `Merge branch 'free-BUG-39' into xgd-working`) is a strict
  superset. It already carries `chat_comment: comment-72dd436d` — that line
  merged cleanly and sits OUTSIDE both conflict regions — plus additional fields
  the incoming side never touched (`commits`, `version: 0.2.15`,
  `story_points: 3`, `bundled_in: bundle-8eef3846`, `status: bundled`,
  `last_field_updated: status`, `updated_at: 2026-08-31`) and a substantially
  rewritten body ("Fix — as landed", the BUG-38/REQ-127 out-of-scope section,
  the fresh-worktree `./bin/1c assets` note).

  Two conflict hunks, both resolved by keeping the superset (`git checkout
  --ours`, then `git add --sparse`):
  1. frontmatter `fields:` — HEAD adds six keys, incoming adds none in the
     conflicted region. Superset = HEAD.
  2. tail of "## Reproduce" — HEAD appends the build-artefact note; incoming's
     only delta is the missing trailing newline. Superset = HEAD.

  No field was invented, and no content is present in the resolution that was
  not on one of the two sides.

## Incoming changes preserved

Confirmed. The incoming commit's sole substantive change,
`chat_comment: comment-72dd436d`, is present in the resolved file (verified by
grep against the resolved working-tree copy, and against index stage 2 before
resolving). The only incoming delta not carried through is the removal of the
file's trailing newline, which is formatting noise, not developer intent.

No hunk was dropped under the BUG-1301 precedence exception; that exception was
not needed here.

Note for the finalize step: because HEAD already contains this commit's effect
(the merge of `free-BUG-39` into `xgd-working` landed the same field along a
different route), the staged tree nets to **no diff vs HEAD**
(`git diff --cached HEAD --stat` is empty). Per STEP 4 this is the
BUG-1109/BUG-1122 redundant-commit case, not a discard: STEP 3's test
distinguishes them, and the incoming change is *present* in HEAD rather than
absent. `--skip` was NOT called; CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution`.
