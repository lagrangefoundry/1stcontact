---
uid: report-55766afc
id: REPORT-4851
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:46:42.248307+00:00'
updated_at: '2026-09-23T18:46:42.248307+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **AA (both added)**, intent/bookkeeping
  ticket (`bug-*`), resolved under STEP 2b + STEP 2e.

  Incoming (`0d64e0f0a9 xgd(ticket): create bug bug-360c5a44`) is the ticket's
  *creation stub*: `title: Untitled`, `status: draft`,
  `last_field_updated: created_at`, body `(new ticket)`, fields limited to
  `auto_merge_back` / `needs_review` / `priority`.

  Ours (HEAD, `e8f9e7c85b xgd(ticket): update bug bug-360c5a44`, itself
  preceded by two `seed_local_overlay` commits) carries the same ticket
  advanced to `status: free_and_reconciled`, `updated_at: 2026-09-19`, with the
  real title, `completed_at`, `severity`, `chat_comment`, `commits`, `version`,
  `bundled_in`, and the full Symptom / What was verified / Root cause / What is
  wanted / Fix / Test plan body.

  Same `uid`, same `id: BUG-43`, same `created_at` — one ticket, two lifecycle
  points, not two competing facts. Ours is a **strict superset**: every field
  present on the incoming side is present in ours at an equal-or-later value.
  Per 2b ("incoming wins where one is a strict superset" — here ours is the
  superset) and 2e ("one side a strict superset: keep the superset"), took ours
  verbatim (blob `0f983095aa5655ab40d32e7933257a826231c1ca`). No per-field
  conflict arose, so 2e's later-intent tiebreak was not needed.

  Staged with `git add --sparse` (path is outside the sparse-checkout cone on
  this resync branch, DOC-986 §2/§4.1).

No code files (`xgd_source/**`, `tests/**`, `bin/**`), spec tickets, UAT tests,
or config files were in conflict. No DU/UD deletion conflicts. No test function
was deleted; the BUG-1301 precedence exception was not invoked.

## Incoming changes preserved

No incoming *code* changes were at stake — the sole conflicted path is a ticket
file, and the incoming commit is that ticket's own creation stub.

Verified against `git show 0d64e0f0a9 -- .xgd/tickets/hot/bug-360c5a44.md`
(18 insertions, whole file):

- Preserved in the resolved version: `uid: bug-360c5a44`, `id: BUG-43`,
  `type: bug`, `created_by: xgd`, `created_at: 2026-09-01T21:52:34.046521+00:00`,
  `fields.auto_merge_back: true`, `fields.needs_review: false`,
  `fields.priority: medium` — every field the incoming side asserts.
- Not present, by design: `title: Untitled`, `status: draft`,
  `last_field_updated: created_at`, `updated_at` pinned to creation time,
  `completed_at: null`, and the placeholder body `(new ticket)`. These are
  creation-time placeholders that the ticket's *own* later commits — already
  integrated into HEAD via `2ebb13af8e` / `ced435ab5a` (`seed_local_overlay`)
  and `e8f9e7c85b` (`update`) — superseded in the normal ticket lifecycle.
  Retaining them would roll a completed, reconciled ticket back to a draft stub.

Nothing from the developer side was discarded.

## Staging state

`git ls-files -u` → 0 unmerged paths. `git status --porcelain` shows no
conflict-class lines; the only remaining entries are nine pre-existing
untracked `.xgd/tickets/cold/*.md` files that predate this step and are
unrelated to the conflict — left untouched.

Note for the finalize step: the resolved index is byte-identical to HEAD
(`git diff --cached HEAD` is empty), because HEAD already holds this ticket at
a strictly later state than the replayed create. This pick is therefore a
no-op. Per the instructions I did **not** call `--skip`; `CHERRY_PICK_HEAD`
(`0d64e0f0a91c67711c8fbf5fea441e55b6dd6be7`) is intact and Python's finalize
step should detect the clean staged diff and skip the commit.
