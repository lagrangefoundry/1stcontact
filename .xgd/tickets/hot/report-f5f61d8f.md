---
uid: report-f5f61d8f
id: REPORT-5301
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:26:46.636149+00:00'
updated_at: '2026-09-28T06:26:46.636149+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — UU, intent/bookkeeping ticket (STEP 2e), sparse (out of cone; conflict existed in the index only, no working-tree markers). Resolved to the OURS side via `git checkout --ours` + `git add --sparse`.

  Both sides touch exactly the same three frontmatter facts, so this is a genuine per-fact conflict decided by the later-positioned intent:

  | fact | base | ours (HEAD) | incoming (6531a2d1) |
  |---|---|---|---|
  | `status` | `free_coded` | `bundled` | `ready_to_reconcile` |
  | `last_field_updated` | `story_points` | `status` | `status` |
  | `updated_at` | 2026-08-28T16:40:51Z | 2026-08-31T05:05:09Z | 2026-08-30T20:37:44Z |
  | `fields.bundled_in` | absent | `bundle-8eef3846` | absent |

  OURS is later on every contested fact (updated_at 2026-08-31 vs 2026-08-30) and is a strict superset: `bundled` is the downstream lifecycle state of `ready_to_reconcile`, and it carries `bundled_in: bundle-8eef3846`, which the incoming side does not have. Taking incoming would have regressed the status lifecycle backwards and dropped the bundle linkage. No disjoint edit on the incoming side was discarded — its only other change is stripping the file's trailing newline (see below).

  Result: the staged content equals HEAD, so `git status --porcelain` is empty (no `M` line). Per STEP 4 this is left as-is — no `--skip`, no `--continue`; the finalize step owns the empty-commit decision.

## Incoming changes preserved

No code/implementation files were in this conflict — the picked commit `6531a2d1` touches one file only, the bookkeeping ticket above (4 insertions / 4 deletions, all frontmatter plus the EOF newline).

Incoming hunks not carried into the resolution, and why:

- `status: free_coded → ready_to_reconcile`, `updated_at → 2026-08-30T20:37:44Z`: superseded, not discarded. HEAD already advanced this ticket past that state to `bundled` at 2026-08-31T05:05:09Z with `bundled_in: bundle-8eef3846`. The incoming transition is a strictly earlier point on the same lifecycle path, so replaying it would undo work already integrated into HEAD. This is the 2e timeline rule applied per fact, not a dropped developer change.
- `last_field_updated: story_points → status`: both sides make the identical change; ours already carries it.
- Trailing-newline strip on the final table row (`| 6 — session released on success, failure and timeout | ... |`): cosmetic EOF-only churn with no content delta. Ours keeps the terminating newline. No body prose differs between the two sides.

No UAT test function exists on either side of this conflict, so 2f is not engaged. The BUG-1301 precedence exception was not needed.
