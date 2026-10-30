---
uid: report-281daf84
id: REPORT-5410
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T23:30:33.304177+00:00'
updated_at: '2026-09-28T23:30:33.304177+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** applied. Incoming commit
  `60e4959eb7e13e84e8856502e5e2a59ed079d07c`
  (`xgd(ticket): update request request-78370159`, 2026-08-31 17:54:01 -0700).

  Merge base for this attempt is `c6f18583` (the `free_coded` state that the
  immediately preceding cherry-pick in this queue resolved against). Sole
  incoming change, base → theirs (`f8e0364f`):

  | field | base | theirs | ours (HEAD, `9c6d321c`) |
  |---|---|---|---|
  | `story_points` | 8 | **13** | **13** |
  | `last_field_updated` | `status` | `story_points` | `status` |
  | `status` | `free_coded` | `free_coded` | `bundled` |
  | `bundled_in` | absent | absent | `bundle-87be4669` |
  | `updated_at` | 00:53:57 | 00:54:01 | 2026-09-09T21:32:50 |
  | trailing newline | stripped | stripped | present |

  The one substantive fact theirs changes — the 8→13 story-point re-estimate —
  is already present verbatim in ours. Ours additionally carries the later
  `free_coded → bundled` transition, `bundled_in`, and a restored trailing
  newline. No field is changed differently-but-concurrently, so no per-fact
  merge is required: under 2e's "one side a strict superset: keep the
  superset", the resolution is ours byte for byte (index blob
  `9c6d321c8b13840940fd0f2800f0edab053050f4`).

  Staged via `git checkout-index --stage=2` + `git add --sparse` — the path is
  outside the sparse-checkout cone, so the conflict existed only in the index
  with no working-tree markers.

## Incoming changes preserved

No code/implementation files were in conflict; the sole conflicted path is a
bookkeeping ticket.

The incoming commit's only payload is `story_points: 8 → 13`, and that value is
present in the resolved file. Its accompanying `last_field_updated:
story_points` / `updated_at: 00:54:01` bookkeeping is superseded by ours'
later `last_field_updated: status` / `2026-09-09T21:32:50`, which record the
subsequent `bundled` transition — a strictly forward move through the same
lifecycle, not a competing edit. Taking theirs would have regressed the ticket
from `bundled` back to `free_coded` and dropped `bundled_in:
bundle-87be4669`.

No hunk was dropped under the BUG-1301 precedence exception; the exception was
not invoked. Nothing from the incoming side was discarded.

The resolved index content is identical to HEAD, so the staged diff is empty —
this cherry-pick is a no-op whose effect already landed on the resync branch.
Per STEP 4, staging was left as-is and `--skip` was **not** called;
`CHERRY_PICK_HEAD` (`60e4959eb7e13e84e8856502e5e2a59ed079d07c`) remains present
for the finalize step.
