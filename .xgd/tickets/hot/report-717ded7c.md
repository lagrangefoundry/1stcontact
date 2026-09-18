---
uid: report-717ded7c
id: REPORT-4334
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:56:13.912979+00:00'
updated_at: '2026-09-18T06:56:13.912979+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**). Resolved to the HEAD side via `git checkout --ours` + `git add --sparse`: ours already contains the field the incoming commit adds, and is the later-positioned side on the lifecycle facts that differ.

## Incoming changes preserved

Incoming commit `2c208ef37d63b2214dc1177872eb471d22d019ca` ("xgd(ticket): update bug bug-a98fb3b0", 2026-08-24 15:19:54) makes one substantive change (3 insertions, 2 deletions):

1. adds `fields.story_points: 2`
2. sets `last_field_updated: story_points` (the derived marker for change 1)
3. bumps `updated_at` to `2026-08-24T22:19:54.763848+00:00`

Verified with `git diff 602e5ae7 1ee55f54` (incoming blob vs HEAD blob) and by reading the resolved file: **`story_points: 2` is present at line 24 of the resolved ticket.** The incoming commit's actual payload is in HEAD.

The body is unchanged by this commit and byte-identical on both sides. No hunk was dropped; the BUG-1301 precedence exception was not invoked.

### The lifecycle facts that differ, and why ours wins each

HEAD's blob `1ee55f54` was last written by `01492336adee1fb7b4591d049f5a1edcfac978fa` on **2026-08-31**; the incoming commit is from **2026-08-24**. Ours is the later-positioned side, matching the enrichment's own "take the more recent commit by timestamp" rule.

| fact | theirs (Aug 24 15:19:54) | ours (Aug 31) |
|---|---|---|
| `updated_at` | `2026-08-24T22:19:54` | `2026-08-31T19:19:34` |
| `completed_at` | `null` | `2026-08-31T19:19:34` |
| `status` | `free_coded` | `free_and_reconciled` |
| `last_field_updated` | `story_points` | `status` |

`free_and_reconciled` is downstream of `free_coded`, so taking theirs would walk BUG-38 backwards and null its `completed_at`.

`last_field_updated` deserves a note because it is the one field where theirs is *not* a strict subset. It is a derived marker naming whichever field was written most recently, so it is bound to `updated_at`: ours reads `status` because the Aug-31 write was the status transition to `free_and_reconciled`. Carrying theirs (`story_points`) across while keeping ours' Aug-31 `updated_at` would assert that the Aug-31 write touched `story_points`, which is false. The two fields move together, and ours is the later pair.

Ours additionally carries `bundled_in: bundle-78f4e2fe`, a field the incoming side never touched and so is not competing over. Nothing was invented.

## Staging state

`git status --porcelain` is empty, `git ls-files -u` is empty, no conflict markers remain, and `git diff --cached HEAD` is empty: this commit's effect had already reached HEAD through the same developer's later Aug-31 write of the ticket. Per STEP 4 (BUG-1109/BUG-1122) this is *redundant*, not *discarded* — STEP 3's check passes because `story_points: 2` is demonstrably present in HEAD — so it is not a @fail and `--skip` was not called. `CHERRY_PICK_HEAD` (`2c208ef3`) is intact for `cherry_pick_finalize_resolution`.

Note: this is the fourth consecutive `bug-a98fb3b0` conflict in this bundle (`1c5985f8`, `82518d60`, `04957574`, `2c208ef3`), each an incremental snapshot along the same Aug-24 free-coding sequence, all superseded by the single Aug-31 blob already in HEAD.
