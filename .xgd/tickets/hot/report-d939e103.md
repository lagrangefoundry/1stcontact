---
uid: report-d939e103
id: REPORT-5253
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:11:59.682531+00:00'
updated_at: '2026-09-28T02:11:59.682531+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (later-positioned intent, **per fact**).
  Path is outside the sparse-checkout cone (DOC-986 §2), but the conflict
  did materialize on disk with real markers, so it was resolved in the
  working tree and staged with `git add --sparse`.

  The two sides differed in exactly one frontmatter hunk — the status
  lifecycle triple plus its timestamps:

  | fact | base (stage 1) | incoming `b636b4aa0c` | HEAD (ours) |
  |---|---|---|---|
  | `status` | `ready_to_reconcile` | `bundled` | `free_and_reconciled` |
  | `updated_at` | 2026-08-22T21:55 | 2026-08-24T02:10 | 2026-08-31T14:22 |
  | `completed_at` | `null` | `null` | 2026-08-31T14:22 |

  HEAD wins this one fact on both tests rule 2e applies: it is later by
  `updated_at` (2026-08-31 vs 2026-08-24) **and** strictly downstream in
  the lifecycle (`ready_to_reconcile` → `bundled` → `free_and_reconciled`).
  HEAD's state was produced by `a546588a7d` (`seed_local_overlay`,
  2026-08-30) followed by `dffe9ecb6d` (2026-09-01). Taking the incoming
  side here would have regressed a completed, reconciled request back to
  `bundled` and nulled its `completed_at`.

  No other fact in the file competed: a full stage-2 vs stage-3 diff shows
  this hunk and nothing else.

## Incoming changes preserved

- The incoming commit's only **additive** contribution relative to the
  merge base is `fields.bundled_in: bundle-b3b7c399` (base→theirs diff).
  That field is **already present in HEAD** at line 26 of the resolved
  file — it merged cleanly and never entered the conflict hunk. Verified
  by the stage-2 vs stage-3 diff, which shows no `bundled_in` line on
  either side of the difference.
- No hunk was dropped under the BUG-1301 precedence exception; no code or
  test files were involved in this conflict, and no test function was
  deleted.
- Net effect: the resolved tree is byte-identical to HEAD for this path,
  so the staged diff against HEAD is empty. This is the correct outcome,
  not a discarded change — the incoming commit's substantive edit
  (`bundled_in`) was already integrated into HEAD by the overlay seed, and
  its remaining edit was a status regression. Per this step's brief,
  `--skip` was **not** invoked; the finalize step owns that decision.
