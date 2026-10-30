---
uid: report-05bd7c58
id: REPORT-4648
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:26:33.695774+00:00'
updated_at: '2026-09-21T05:26:33.695774+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**.
  Two conflicted hunks, both in frontmatter; ticket body was unconflicted and untouched.

  | fact | OURS (HEAD, `seed_local_overlay`) | THEIRS (incoming `f7493a90cd`, `update`) | resolution |
  |---|---|---|---|
  | `status` | `bundled` | `free_coded` | **OURS** — later-positioned intent |
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-08-31T22:09:06Z` | **OURS** |
  | `bundled_in` | `bundle-87be4669` | absent | **OURS** (addition present on one side only) |
  | `fields.commits` (2 entries) | present | added by incoming | present on both — no conflict |
  | `fields.version: 0.2.22` | present | added by incoming | present on both — no conflict |

  Per-fact composition, not whole-file winner-takes-all. The only genuinely competing fact is
  `status`; the enrichment metadata flagged intent as unknown on one side, whose stated rule is
  "take the more recent commit by timestamp" — HEAD by ~9 days. This also agrees with the ticket
  lifecycle: incoming moves `free_coding → free_coded`, HEAD is already one stage further at
  `bundled`, so taking incoming would regress the lifecycle. `bundled_in` is retained because it
  exists on only one side (2e: "non-overlapping fields/sections: apply BOTH").

## Incoming changes preserved

`git show f7493a90cd -- .xgd/tickets/hot/request-909e42f8.md` shows the incoming commit
contributing exactly three things:

1. `fields.commits` — two entries (`858d63202f…`, `c056002a52…`) — **present** in the resolved file (lines 21–27).
2. `fields.version: 0.2.22` — **present** (line 28).
3. `status: free_coding → free_coded` — **superseded**, not discarded: HEAD already advanced the
   same field past that value to `bundled`. This is the one competing fact, resolved by 2e's
   later-positioned-intent rule.

No BUG-1301 precedence exception was invoked; no hunk was dropped on refactor grounds, and no
code or UAT files were involved in this conflict.

## Staging state

Resolution is byte-identical to HEAD (incoming's additive facts were already integrated there),
so `git status --porcelain` and `git ls-files -u` are both empty and `git diff --cached` carries
no net change. CHERRY_PICK_HEAD is intact at `f7493a90cd`. Per STEP 4, `--skip` was **not**
called — the finalize step owns that decision.
