---
uid: report-0705b8ba
id: REPORT-3357
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:39:10.762889+00:00'
updated_at: '2026-09-02T20:39:10.762889+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket (rule **2e**).
  Resolved to the HEAD-side blob via `git checkout --ours` (not a hand-edit, so no
  stale frontmatter is written back), then `git add --sparse`.

  Incoming commit: `2c208ef37d63b2214dc1177872eb471d22d019ca`
  (`xgd(ticket): update bug bug-a98fb3b0`, 2026-08-24 15:19:54) — the fourth
  consecutive commit against BUG-38 in this bundle, three seconds after the
  previous one. It adds `story_points: 2`, sets `last_field_updated: story_points`,
  and bumps `updated_at`.

  Git auto-merged the substantive addition: `story_points: 2` landed **outside**
  the markers (line 24) because HEAD already carries it identically. Two marker
  regions remained, resolved per-fact:

  1. **Lines 9–19 — lifecycle scalars** (`updated_at`, `completed_at`,
     `last_field_updated`, `status`). HEAD = `status: free_and_reconciled`,
     `last_field_updated: status`, `updated_at`/`completed_at` `2026-08-31T19:19:34`.
     Incoming = `status: free_coded`, `last_field_updated: story_points`,
     `updated_at 2026-08-24T22:19:54`, `completed_at: null`. HEAD is the
     later-positioned state by seven days, and `free_coded → free_and_reconciled`
     is forward lifecycle progress, so HEAD wins per 2e's per-fact timeline rule
     and the enrichment's "more recent commit by timestamp".

     Worth flagging as different from the previous three iterations:
     `last_field_updated` genuinely differs between the sides here (earlier
     iterations had it identical). It is a derived marker naming whichever field
     was most recently written, and HEAD's value `status` is correct for HEAD's own
     later `status` change on 08-31. Keeping HEAD's block whole is therefore
     self-consistent; importing incoming's `story_points` would assert that
     `story_points` was the last field written on a record whose `status` demonstrably
     changed afterwards. This is per-fact reasoning that happens to select the same
     side for every fact in the region, not a whole-file pick.
  2. **Lines 32–35 — HEAD-only `fields:` entry** (`bundled_in: bundle-78f4e2fe`)
     against an empty incoming side. Nothing to weigh; HEAD kept.

  No `xgd working-timeline` call was needed: both sides' own `updated_at` stamps
  and the monotonic lifecycle ordering settle region 1 unambiguously. No content
  was invented, and no `intent_uid`/`story_uid`/`capability_uid` field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: **preserved.** Verified against
  `git show 2c208ef37d -- <file>`. The commit's one substantive addition,
  `story_points: 2`, is present in the resolved file at line 24.

  The only incoming values NOT in the result are superseded bookkeeping scalars
  (`status: free_coded`, `last_field_updated: story_points`,
  `updated_at 2026-08-24T22:19:54`) — superseded by HEAD's strictly later state per
  2e's per-fact timeline rule, which is the prescribed resolution, not a discard of
  developer content.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT
files were involved in this conflict.

## Note: resolution nets to no diff vs HEAD

`git diff --cached HEAD` is empty. HEAD already holds `story_points: 2` at a more
advanced status, so replaying this commit adds nothing — the BUG-1109/BUG-1122
redundant-commit case, **not** a discard: STEP 3 distinguishes them by whether the
incoming commit's key change is *present* in HEAD, and here it is, verbatim.

This is the fourth consecutive iteration (57–60) in which a bookkeeping commit
against BUG-38 has been fully subsumed by HEAD. Each was evaluated against its own
diff rather than assumed redundant; noting the pattern for the post-merge review the
enrichment rule requested.

Per STEP 4, `--skip` was NOT called; the resolution is staged and the cherry-pick
sequencer state is untouched (`CHERRY_PICK_HEAD` still resolves to
`2c208ef37d63b2214dc1177872eb471d22d019ca`) for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
