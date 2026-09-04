---
uid: report-4eb9dc41
id: REPORT-3309
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:31:43.352338+00:00'
updated_at: '2026-09-02T18:31:43.352338+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — **AA** (both added), intent/bookkeeping
  ticket → rule **2e** (with 2b superset check). Resolved to the HEAD side via
  `git checkout --ours` + `git add --sparse`.

  Both sides are full-file adds of REQ-153 ("Reserve locale-shaped page slugs").
  The complete diff between the two blobs is **frontmatter only** — the 127-line
  markdown body is byte-identical on both sides. Per-fact comparison:

  | fact | incoming (`83973a5e`, 2026-08-23) | HEAD | resolution |
  |---|---|---|---|
  | `status` | `ready_to_reconcile` | `free_and_reconciled` | HEAD — later lifecycle state |
  | `updated_at` | `2026-08-23T03:29:52` | `2026-08-31T14:22:27` | HEAD — later timestamp |
  | `completed_at` | `null` | `2026-08-31T14:22:27` | HEAD — supersedes |
  | `fields.chat_comment` | absent | `comment-18e5a285` | HEAD — superset |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | HEAD — superset |
  | `fields.commits`, `version`, `priority`, `story_points`, `auto_merge_back`, `needs_review` | identical | identical | unchanged |

  The three contested facts (`status`/`updated_at`/`completed_at`) are the same
  facts changed differently on each side, so the timeline rule applies per-fact:
  HEAD is later on all three, and `free_and_reconciled` is strictly downstream of
  `ready_to_reconcile` in the request lifecycle. On every other fact HEAD is a
  strict superset — it carries two fields (`chat_comment`, `bundled_in`) the
  incoming side never had. Taking HEAD therefore loses no fact from either side.
  This also matches the auto-enriched resolution rule supplied for this file
  ("take the more recent commit by timestamp"). Flagged there for post-merge
  review; nothing about the resolution looks ambiguous in practice, since the
  two sides differ only in bookkeeping state that HEAD has already advanced past.

  No content was invented, and no `intent_uid`/`story_uid`/`capability_uid`
  field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-94e93caa.md` — the incoming commit `83973a5e` is a
  127-line whole-file add. Its entire body (Why / What changed / Design decisions
  / Acceptance criteria / Test plan / Why free-coded / Origin) and all of its
  frontmatter facts except the three superseded lifecycle scalars are present
  verbatim in the resolved file. Verified by diffing the two stage blobs
  (`ee4b7578` theirs vs `ca45d92f` ours): the diff is confined to two frontmatter
  hunks, with no body hunk at all. The resolved working-tree file hashes to
  `ca45d92f6c5d7f180fe893b315e7b1400db9edb6`, i.e. the ours blob exactly, with no
  conflict markers.

  The only incoming facts not carried forward are `status: ready_to_reconcile`,
  `completed_at: null` and the older `updated_at` — these are earlier positions
  of the same ticket's own lifecycle, already advanced past on HEAD, not
  developer code. No code file was involved in this conflict, so STEP 3's
  discard guard has nothing else to check and the BUG-1301 precedence exception
  was not needed.

  Note: because the resolution equals HEAD, this cherry-pick stages to no net
  diff. Per STEP 4 (BUG-1109/BUG-1122) that is not a failure and `--skip` was
  not called — the incoming commit's substance is present in HEAD via the
  earlier route, which is the "redundant", not "discarded", case.
