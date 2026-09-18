---
uid: report-40d6aff2
id: REPORT-4333
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:55:07.057832+00:00'
updated_at: '2026-09-18T06:55:07.057832+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**). Resolved to the HEAD side via `git checkout --ours` + `git add --sparse`: ours is a strict superset on every field the incoming commit adds, and the later-positioned side on the three lifecycle facts that differ.

## Incoming changes preserved

Incoming commit `04957574a547c7ac4869d772bce7c42a5807c40a` ("xgd(ticket): update bug bug-a98fb3b0", 2026-08-24 15:19) makes three changes (8 insertions, 3 deletions):

1. `updated_at` → `2026-08-24T22:19:50.974264+00:00`
2. `status` → `free_coded` (from `free_coding`)
3. adds `fields.commits` and `fields.version`

Verified against the resolved file with `git diff 1e195c59 1ee55f54` (incoming blob vs HEAD blob) and by reading the resolved frontmatter. The two substantive additions are present in HEAD **verbatim**:

```yaml
  commits:
  - working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411
    reconcile_sha: null
    main_sha: null
  version: 0.2.14
```

The body is unchanged by this commit and is byte-identical on both sides. No hunk was dropped; the BUG-1301 precedence exception was not invoked.

### The three lifecycle facts that differ, and why ours wins each

HEAD's blob `1ee55f54` was last written by `01492336adee1fb7b4591d049f5a1edcfac978fa` on **2026-08-31**; the incoming commit is from **2026-08-24**. Ours is the later-positioned side, matching the enrichment's own "take the more recent commit by timestamp" rule.

| fact | theirs (Aug 24 15:19) | ours (Aug 31) |
|---|---|---|
| `updated_at` | `2026-08-24T22:19:50` | `2026-08-31T19:19:34` |
| `completed_at` | `null` | `2026-08-31T19:19:34` |
| `status` | `free_coded` | `free_and_reconciled` |

`free_and_reconciled` is the state *after* `free_coded` in the ticket lifecycle, so taking theirs would walk BUG-38 backwards from reconciled to merely coded and null out its `completed_at`.

Ours additionally carries `story_points: 2` and `bundled_in: bundle-78f4e2fe`, fields the incoming side never touched and so is not competing over. Nothing was invented.

## Staging state

`git status --porcelain` is empty, `git ls-files -u` is empty, no conflict markers remain, and `git diff --cached HEAD` is empty: this commit's effect had already reached HEAD through the same developer's later Aug-31 write of the ticket. Per STEP 4 (BUG-1109/BUG-1122) this is *redundant*, not *discarded* — STEP 3's check passes because the incoming commit's additions are demonstrably present in HEAD — so it is not a @fail and `--skip` was not called. `CHERRY_PICK_HEAD` (`04957574`) is intact for `cherry_pick_finalize_resolution`.

Note: this is the third consecutive `bug-a98fb3b0` conflict in this bundle (after `1c5985f8` and `82518d60`), each an earlier snapshot of the same ticket along the Aug-24 free-coding sequence, all superseded by the single Aug-31 blob already in HEAD.
