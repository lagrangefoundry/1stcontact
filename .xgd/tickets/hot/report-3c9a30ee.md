---
uid: report-3c9a30ee
id: REPORT-4655
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:43:20.077342+00:00'
updated_at: '2026-09-21T05:43:20.077342+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — UU, intent/bookkeeping ticket
  (§2e: `request-*`, user-authored, per-fact resolution). One conflict
  hunk, entirely in frontmatter; ticket body identical on both sides.
  Staged with `git add --sparse` (path is outside the sparse-checkout
  cone on this resync branch, DOC-986 §2/§4.1).

  Sides:
  - OURS (HEAD, resync branch): `xgd(ticket): seed_local_overlay`,
    `updated_at 2026-09-09T21:32:49`, `last_field_updated: status`,
    `status: bundled`.
  - THEIRS (CHERRY_PICK_HEAD `3013025820`): `xgd(ticket): update`,
    `updated_at 2026-08-31T22:17:10`, `last_field_updated: story_points`,
    `status: free_coded`.

  The incoming commit's full diff is two lines: `updated_at` and
  `last_field_updated: status -> story_points`. It carries no content
  change — `fields.story_points: 13` is byte-identical on both sides and
  sits outside the conflict hunk, so the field it nominally records a
  touch of was not actually altered.

  Per-fact outcome:
  - `status`: the one substantive competing fact. HEAD's `bundled` is
    both later-positioned (Sep 9 vs Aug 31) and downstream of incoming's
    `free_coded` in the ticket lifecycle, so incoming's transition is
    already subsumed. HEAD wins.
  - `last_field_updated`: derived bookkeeping — it names whichever field
    the winning update touched. Since HEAD's `status` change is the
    surviving one, `status` is the consistent value. Taking incoming's
    `story_points` would assert the ticket's most recent edit was to
    story_points while the file's actual latest change was the status
    transition to `bundled`.
  - `updated_at`: follows the winning fact — HEAD.
  - Everything outside the hunk (`fields.commits`, `version: 0.2.23`,
    `bundled_in: bundle-87be4669`, `story_points: 13`, body): identical
    or non-overlapping, merged cleanly, untouched by this resolution.

  Consistent with the enrichment rule supplied for this file ("take the
  more recent commit by timestamp and flag for post-merge review"),
  applied per-fact rather than wholesale.

## Incoming changes preserved

- `.xgd/tickets/hot/request-119dd4af.md`: verified against
  `git show 3013025820 -- <path>`. No code files were in conflict. The
  commit contributes only the two bookkeeping lines above, both of which
  are metadata derived from a state (`free_coded`) that HEAD has already
  advanced past. No substantive developer content exists in this commit
  to discard, and no hunks were dropped under the BUG-1301 precedence
  exception.

## Note on net effect

The resolution is byte-identical to HEAD (`git status --porcelain` is
empty, no staged diff), because HEAD already reflects a later state of
this same ticket. The cherry-pick is therefore a no-op. Per STEP 4 this
was staged and left for the finalize step rather than skipped here;
CHERRY_PICK_HEAD is still present at `3013025820`.
