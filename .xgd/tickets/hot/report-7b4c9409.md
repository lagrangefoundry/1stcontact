---
uid: report-7b4c9409
id: REPORT-4837
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:13:00.770050+00:00'
updated_at: '2026-09-23T18:13:00.770050+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — class **AA** (both added), intent/bookkeeping
  ticket (`bug-*`). Rules applied: §2b (both added) + §2e (intent/bookkeeping
  ticket, same fact changed on both sides → later-positioned intent wins, per
  fact). Resolved by taking the **ours/HEAD** side verbatim
  (`git show :2: > path`), staged with `git add --sparse` (path is outside the
  sparse-checkout cone on this resync branch, per DOC-986 §2/§4.1 — the conflict
  existed only in the index, with no working-tree markers).

  Sides:
  - ours (HEAD, `xgd(ticket): update bug bug-034bf955`): BUG-42 in its finished
    state — real title, `status: free_and_reconciled`, `updated_at`
    2026-09-19T15:15:29Z, `completed_at` 2026-09-14T10:29:07Z, plus the
    later-added fields (`chat_comment`, `severity`, `commits`, `version`,
    `story_points`, `bundled_in`) and the full Symptom / Root cause / Fix /
    Test plan body.
  - theirs (`c85e8a4a27`, `xgd(ticket): create bug bug-034bf955`): the ticket's
    own creation commit — `title: Untitled`, `status: draft`,
    `updated_at` == `created_at` 2026-09-01T21:00:12Z, `completed_at: null`,
    body `(new ticket)`.

  The incoming side is the *creation* commit for the very ticket HEAD already
  holds in completed form, so on every contested fact HEAD is strictly
  later-positioned. Merging theirs would have regressed BUG-42 to draft.

## Incoming changes preserved

Every field key present on the incoming side is present in the resolved file —
no incoming key was dropped:

- Byte-identical on both sides, carried through unchanged: `uid`, `id`, `type`,
  `created_by`, `created_at`, and `fields.auto_merge_back` /
  `fields.needs_review` / `fields.priority`.
- Present but superseded by the later HEAD-side value, per §2e's per-fact
  later-intent rule: `title`, `updated_at`, `completed_at`,
  `last_field_updated`, `status`, and the body. These are the same facts edited
  on both sides, with HEAD's edit strictly later in the ticket's own lifecycle
  (creation → … → `free_and_reconciled`), so HEAD wins each one.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the
grounds that its target had already been removed by an earlier refactor. No
test file was touched, and no test function was deleted.

Note for the finalize step: because the resolution is HEAD verbatim,
`git diff --cached HEAD` is empty for this pick — replaying a creation commit
onto a branch that already carries the completed ticket is a genuine no-op.
Expect the commit to be skipped. `CHERRY_PICK_HEAD` (`c85e8a4a27`) is left in
place; `git status --porcelain` reports zero unmerged paths (the nine untracked
`.xgd/tickets/cold/*.md` files predate this step and were left alone).
