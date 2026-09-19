---
uid: report-c9a87cb6
id: REPORT-4419
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:18:57.441082+00:00'
updated_at: '2026-09-19T12:18:57.441082+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` (BUG-42) — class **AA** (both added),
  outside the sparse-checkout cone so the conflict existed only in the index
  with no working-tree markers. Rule **2b** (both added, one side strictly a
  superset) with **2e** (intent/bookkeeping ticket) judgment. Resolved
  **toward ours**, staged via `git checkout --ours` + `git add --sparse`.

  The two sides are not two developments of the same content — the incoming
  side is the ticket's *birth* commit being replayed onto a branch that
  already carries the ticket's full, later state:

  | side | commit | date | title | status | body |
  |---|---|---|---|---|---|
  | ours (HEAD) | `3be3f504` `xgd(ticket): seed_local_overlay bug bug-034bf955` | 2026-09-17 | `Builder: markdown shows as source on first load, and never renders in the Library` | `bundled` | full Symptom / Root cause writeup |
  | incoming | `c85e8a4a` `xgd(ticket): create bug bug-034bf955` | 2026-09-01 | `Untitled` | `draft` | `(new ticket)` |

  Ours additionally carries `version: 0.2.36`, `bundled_in: bundle-8e1807f6`,
  `story_points: 3`, `severity: medium`, `chat_comment: comment-77992e39`,
  `completed_at: 2026-09-14T10:29:07`, and the `commits` map
  (`working_sha: bd7612f9`) — none of which exist on the incoming side.

  Ours is a strict superset and is also the later commit by timestamp
  (2026-09-17 vs 2026-09-01), so 2b, 2e's superset clause, and the
  auto-enriched metadata's "take the more recent commit by timestamp" rule
  all agree. Taking or merging the incoming side would have reverted BUG-42
  to an untitled draft and dropped its bundle membership, version, commit
  map and completion timestamps.

  No fields were invented; no `intent_uid` / `story_uid` / `capability_uid`
  was touched.

## Incoming changes preserved

Confirmed present. The incoming commit's entire change is the creation of
`.xgd/tickets/hot/bug-034bf955.md` establishing the ticket's identity. Every
fact it introduces is present verbatim in HEAD's version of the same file:

- `uid: bug-034bf955`
- `id: BUG-42`
- `type: bug`
- `created_by: xgd`
- `created_at: '2026-09-01T21:00:12.132693+00:00'`
- `fields.auto_merge_back: true`
- `fields.needs_review: false`
- `fields.priority: medium`

The only incoming content absent from the resolution is the placeholder
scaffolding the create step emits before any content exists — `title:
Untitled`, `status: draft`, `last_field_updated: created_at`,
`updated_at` equal to `created_at`, and the body `(new ticket)`. Those were
superseded by the ticket's own subsequent lifecycle on this branch, not
discarded by this resolution.

This is the redundant case, not the discarded case (STEP 4 / BUG-1109,
BUG-1122): the incoming commit's key changes reached the branch by a
different route — the branch already holds the ticket this commit creates,
evolved through to `bundled`. No BUG-1301 precedence exception was invoked;
no test function was deleted.

## Net effect

The staged tree is identical to HEAD (`git diff --cached HEAD` is empty) —
this pick is a no-op, because the branch already holds a strictly newer
version of the only file it touches. Per STEP 4, `--skip` was NOT called;
staging is left for `cherry_pick_finalize_resolution`, and
`CHERRY_PICK_HEAD` (`c85e8a4a`) is intact.
