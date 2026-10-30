---
uid: report-8fba90fb
id: REPORT-4542
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:39:36.170518+00:00'
updated_at: '2026-09-20T20:39:36.170518+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` (REQ-147) — **UU**, class **2e**
  (intent/bookkeeping ticket, `request-*`). Resolved with
  `git checkout --ours` + `git add --sparse`.

  Incoming commit: `95ffc177ff` ("xgd(ticket): update request
  request-23fd6e61", Aug 23 18:15 -0700). Its **entire** diff is two
  frontmatter lines — `updated_at` and `status` — and both fall inside the
  conflict region, so this is a pure same-fact collision with no
  non-overlapping incoming content to merge.

  Resolved **per fact**, not by picking a winning side wholesale:

  | Fact | Ours (HEAD) | Theirs (`95ffc177ff`) | Rule applied |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | Same fact, both changed → later-positioned intent wins → **ours** |
  | `updated_at` | `2026-08-31T14:22:44` | `2026-08-24T01:15:24` | same-fact → **ours** (later) |
  | `completed_at` | `2026-08-31T14:22:44` | `null` | same-fact → **ours** |
  | `last_field_updated` | `status` | `status` | *identical* — no conflict |
  | everything else (`fields.*`, body) | — | *unchanged by the incoming commit* | No conflict; merged cleanly |

  Timeline evidence for "ours is later-positioned" (`xgd ticket history
  request-23fd6e61`), HEAD-side lineage past the incoming commit's
  starting point:

  - `80cdf17160` (Aug 20 05:51) `ready_to_reconcile` → `reconciling`
    — this is the state the incoming commit reverts.
  - `e0ffd3bfb4` (seed_local_overlay) `reconciling` → `bundled`,
    `updated_at` `2026-08-24T02:10:41` — already **later** than the
    incoming commit's own `2026-08-24T01:15:24`.
  - `02c0d39001` (Aug 31 07:22) `bundled` → `free_and_reconciled`,
    `completed_at` set.

  So the incoming `reconciling → ready_to_reconcile` transition is a
  strictly earlier point on this ticket's own status lineage than HEAD's,
  and HEAD carries two further transitions past it. Taking theirs would
  regress a terminal, reconciled ticket back into a **re-dispatchable**
  status (`cherry_pick.py` §"A ticket can end up in a re-dispatchable
  status (`ready_to_reconcile`, `error`, `reconciling`) while its commits
  already reached main"), i.e. it would re-queue work that is already on
  main.

  Consistent with the sibling resolution earlier in this same resync run
  (REPORT-4541, `request-7ae3c2cc`), which faced the identical
  `free_and_reconciled` vs `ready_to_reconcile` collision.

## Incoming changes preserved

No code or implementation files were in conflict — the sole conflicted
path is a bookkeeping intent ticket, resolved under rule 2e's per-fact
timeline rule, not under the "incoming is authoritative" rule for code
(2c), which does not govern ticket status fields.

The incoming commit `95ffc177ff` carries **no** substantive payload beyond
the two status-lineage fields above: `git show 95ffc177ff` is `1 file
changed, 2 insertions(+), 2 deletions(-)`, both lines being `updated_at`
and `status`. There is therefore no developer-authored content that this
resolution discards — only a superseded position on the ticket's own
status timeline.

Because the incoming diff is entirely superseded, the staged tree has no
net change from HEAD. Per STEP 4, `--skip` was **not** called here; the
resolution is staged and left for `resync_cherry_pick_finalize_resolution`
to detect and skip.

## Verification

- `git status --porcelain` → empty (no `UU`/`AA`/`DU`/`UD` lines, nothing unstaged).
- No conflict markers remain in `.xgd/tickets/hot/request-23fd6e61.md`.
- `git rev-parse CHERRY_PICK_HEAD` → `95ffc177ff2251089cb173a560162260633b4a9d`
  (sequencer state intact; no `--continue`/`--skip`/`--quit`/`--abort` issued).
