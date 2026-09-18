---
uid: report-c66badda
id: REPORT-4314
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:52:06.234193+00:00'
updated_at: '2026-09-18T05:52:06.234193+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket (rule **2e**;
  a `bug-*` ticket, so not a matrix-defining spec ticket under 2d).
  Resolved to the **HEAD side**, which is a strict superset of the incoming side.

  Incoming commit: `e74606d80d` `xgd(ticket): update bug bug-db356ff8` (2026-08-23T18:50:12-07:00, free_coded).
  HEAD-side commit: `56ced613a4` `xgd(ticket): update bug bug-db356ff8` (2026-08-31T12:19:38-07:00).

  Only two hunks conflicted; the ticket body was byte-identical across base/ours/theirs.

  1. Lifecycle block (`updated_at` / `completed_at` / `status`).
     - base: `status: free_coding`, `completed_at: null`
     - theirs: `status: free_coded`, `completed_at: null`, `updated_at` 2026-08-24T01:50:12
     - ours: `status: free_and_reconciled`, `completed_at` 2026-08-31T19:19:38, `updated_at` 2026-08-31T19:19:38

     Same field changed on both sides, so the per-fact timeline rule applies. Both sides'
     intent is this same bug ticket's own lifecycle, so the timeline comparison is
     degenerate; the enrichment rule for this file ("intent unknown on one or both sides —
     take the more recent commit by timestamp") and the lifecycle ordering agree: HEAD is
     8 days later and `free_and_reconciled` is the successor state of `free_coded`. Kept HEAD.

  2. `fields.bundled_in: bundle-78f4e2fe` — present only on the HEAD side, absent on the
     incoming side. Non-overlapping addition, so keeping it loses nothing from either side.

  No field was invented and no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

The incoming commit `e74606d80d` made three changes to this file. All three are accounted
for in the resolved version:

- `fields.commits: [{working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40, reconcile_sha: null, main_sha: null}]`
  — **present verbatim** (line 20-23). This hunk merged cleanly because HEAD had already
  added the identical entry; it never appeared between conflict markers.
- `fields.version: 0.2.10` — **present verbatim** (line 24), same reason.
- `status: free_coding` → `free_coded` — **present via its successor state.** HEAD carries
  `status: free_and_reconciled`, which this same ticket reached on 2026-08-31 (commit
  `56ced613a4`) by advancing *through* `free_coded`. Writing `free_coded` back would move the
  ticket backwards through its own lifecycle and drop `completed_at` and `bundled_in`.

No hunk was dropped under the BUG-1301 precedence exception; nothing was deleted.

## Note for the orchestrator

The staged tree nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is empty) —
this commit's effect is already fully present in HEAD through the later route described
above (BUG-1109/BUG-1122 shape). Per STEP 4 this is not a failure and `--skip` was not
called; `CHERRY_PICK_HEAD` (`e74606d80d`) is left intact for
`cherry_pick_finalize_resolution` to detect the empty staged diff and skip the commit itself.

Per-enrichment instruction, this file is **flagged for post-merge review**: HEAD records
`bundled_in: bundle-78f4e2fe`, while the bundle being reconciled here is `bundle-8e1807f6`
(reconcile-BUNDLE-27). That pre-existing HEAD-side value was left untouched — correcting it
would be inventing content present on neither side of this conflict.
