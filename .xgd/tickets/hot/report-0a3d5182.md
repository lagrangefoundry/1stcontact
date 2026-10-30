---
uid: report-0a3d5182
id: REPORT-4649
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:27:54.408120+00:00'
updated_at: '2026-09-21T05:27:54.408120+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Incoming commit `7e2eac8d00` (`xgd(ticket): update request
  request-909e42f8`, 2026-08-31T22:09:14Z). One conflicted hunk, frontmatter only; `fields:`
  block and ticket body were unconflicted and untouched.

  The incoming commit's full diff is two lines — `updated_at` 22:09:06 → 22:09:14 and
  `last_field_updated` `status` → `story_points`. It carries no new substantive content:
  `fields.story_points: 3`, the fact that breadcrumb refers to, is already present and identical
  on both sides.

  | fact | OURS (HEAD, `seed_local_overlay`) | THEIRS (`7e2eac8d00`) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-08-31T22:09:14Z` | **OURS** — later by ~9 days |
  | `status` | `bundled` | `free_coded` | **OURS** — later, and lifecycle-forward |
  | `last_field_updated` | `status` | `story_points` | **OURS** — see coherence note |
  | `completed_at` | `null` | `null` | identical |
  | `fields.story_points` | `3` | `3` | identical, unconflicted |

  Composed per fact, not whole-file winner-takes-all. Both competing facts resolve to OURS under
  2e's later-positioned-intent rule; the enrichment flagged intent as unknown on one side, whose
  stated rule is likewise take-the-later-timestamp. This also agrees with the ticket lifecycle:
  incoming sits at `free_coded`, HEAD has already advanced one stage to `bundled`, so taking
  incoming would regress it.

  **Coherence note on `last_field_updated`.** This field is a derived breadcrumb naming whichever
  field the `updated_at` edit touched — the two are a matched pair, not independent facts. Having
  taken HEAD's `updated_at` (2026-09-09, an edit to `status`), the breadcrumb must read `status`.
  Splitting the pair — HEAD's timestamp with incoming's `story_points` — would assert that the
  09-09 update modified story_points, which is false on both sides' evidence.

## Incoming changes preserved

Verified against `git show 7e2eac8d0081e117656d4b6ebf2f591c98b472df --
.xgd/tickets/hot/request-909e42f8.md`. The commit contributes exactly two frontmatter lines, both
bookkeeping metadata rather than ticket content:

1. `updated_at` bump — **superseded**, not discarded: HEAD carries a strictly later value for the
   same field.
2. `last_field_updated: story_points` — **superseded** for the coherence reason above. The
   substantive fact it points at, `fields.story_points: 3`, is present in the resolved file and
   was never in conflict.

No ticket body, `fields:` entry, or other content from the incoming side was dropped. No BUG-1301
precedence exception was invoked; no hunk was dropped on refactor grounds. No code or UAT files
were involved in this conflict.

## Staging state

`git status --porcelain` and `git ls-files -u` are both empty; no conflict markers remain. The
resolution is byte-identical to HEAD (incoming contributed only superseded bookkeeping), so
`git diff --cached` carries no net change. `CHERRY_PICK_HEAD` re-read after staging and confirmed
intact at `7e2eac8d0081e117656d4b6ebf2f591c98b472df`. Per STEP 4, `--skip` was **not** called —
the finalize step owns that decision.
