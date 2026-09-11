---
uid: report-d2a9076b
id: REPORT-4089
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:07:25.759739+00:00'
updated_at: '2026-09-11T23:07:25.759739+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **AA** (both added), intent/bookkeeping
  ticket (`bundle-*`) → **rule 2e** with per-fact judgment; the enrichment's
  "take the more recent commit by timestamp" rule agrees. Resolved to the
  **OURS (HEAD)** content.

  Sides:
  - OURS (HEAD): `8e07e6015dead83333d9ae23d1116e97a118a490`, 2026-08-31 07:23:04 -0700,
    _xgd(ticket): update bundle bundle-b3b7c399_. The file first appears on this
    branch via `4b7f40157dfdfb2f5c2471c5e328a799f617464f` (2026-08-30,
    `seed_local_overlay`) — hence the add/add rather than a normal UU.
  - THEIRS (incoming, `830f0264ef71b7adf47997c74e7b02a3b2074b49`), 2026-08-23 19:10:41 -0700,
    _xgd(ticket): create bundle bundle-b3b7c399_ — the original creation snapshot.

  Per-fact comparison (the whole diff is confined to frontmatter; the markdown
  body is byte-identical apart from a trailing newline):

  | fact | OURS (2026-08-31) | THEIRS (2026-08-23) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | 2026-08-31T14:23:04Z | 2026-08-24T02:10:41Z (== `created_at`) |
  | `completed_at` | 2026-08-31T14:22:24Z | `null` |
  | `last_field_updated` | `result` | `created_at` |
  | `fields.commits` | 1 entry, `main_sha: eef7a8b4…` | 24 pre-reconcile `working_sha` entries, `main_sha: null` |
  | `fields.orphan_commits` | ~145 old→new sha remaps | absent |
  | `fields.merged_at_commit` | `eef7a8b4…` | absent |
  | `result` | `pass` | absent |

  Every fact that differs is the *same* fact at two points in one ticket's
  lifecycle, and OURS is the later position on all of them — so there is no
  disjoint incoming-side edit to graft in. Taking THEIRS would have reverted
  BUNDLE-20's operator-owned `status` from `free_and_reconciled` back to
  `ready_to_reconcile`, cleared `completed_at`/`result: pass`, dropped the
  `merged_at_commit` + `orphan_commits` remap table, and resurrected 24 stale
  working-branch shas that the reconcile/merge already superseded. No field was
  invented and no field present on only one side was dropped other than those
  superseded earlier values.

  `uid`, `id`, `type`, `title`, `created_by`, `created_at`, `fields.auto_merge_back`
  and `fields.priority` are identical on both sides; no `intent_uid` / `story_uid` /
  `capability_uid` field was touched.

## Incoming changes preserved

No code/implementation files were conflicted — the single conflict is a bundle
bookkeeping ticket. No hunk was dropped under the BUG-1301 precedence exception.

STEP 3 check on the incoming commit: its entire content is the creation of
`bundle-b3b7c399` (uid, id BUNDLE-20, title, and the full markdown body). That
content **is present in HEAD** — same `uid`/`id`/`title`/`created_at`, and the
body is byte-identical apart from a trailing newline. So the incoming commit's
key change is already in the tree by a different route (the 2026-08-30
`seed_local_overlay` that carried the ticket forward, plus 8 days of lifecycle
updates on top), i.e. this is the *redundant* case, not a discard.

Consequently the resolution nets to no staged diff vs HEAD
(`git diff --cached HEAD` is empty; the path is staged at stage 0 as blob
`bb444506b8dc2be46907b7105ce80916fd41ab72`, HEAD's content). Per STEP 4 that is
expected and is not a failure — `cherry_pick_finalize_resolution` will detect the
clean staged diff and skip the commit. `--skip`/`--continue` was not invoked and
`CHERRY_PICK_HEAD` (`830f0264ef71b7adf47997c74e7b02a3b2074b49`) is still present.
