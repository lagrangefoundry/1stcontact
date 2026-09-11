---
uid: report-44bb38f9
id: REPORT-4088
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:04:31.616518+00:00'
updated_at: '2026-09-11T23:04:31.616518+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: `type: bug`, user-authored content, not
  matrix state). Two conflict hunks, both inside the YAML frontmatter;
  the incoming commit `e74606d80d` touches no other file and no body
  content. Resolved per-fact, not by picking a whole side:

  - **Hunk 1 — `status` / `updated_at` / `completed_at`.** Same fact
    changed differently on each side, so the timeline rule applies to
    this fact. HEAD carries `status: free_and_reconciled` with
    `completed_at: 2026-08-31T19:19:38`; the incoming side carries the
    older `status: free_coded` / `completed_at: null` from
    2026-08-24T01:50:12. `free_and_reconciled` is strictly downstream of
    `free_coded` on the ticket lifecycle, and HEAD's timestamp is a week
    later, so HEAD is the later-positioned side. Kept HEAD. Taking the
    incoming side here would have regressed the ticket's lifecycle state.

  - **Hunk 2 — `fields.bundled_in: bundle-78f4e2fe`.** Present on HEAD
    only; the incoming side has nothing at this position. This is not a
    competing edit — the incoming commit predates bundling entirely, so
    the field's absence there is timeline drift rather than a deletion of
    intent. HEAD is the strict superset for this fact, so kept HEAD. No
    content was invented that is not on one side.

  No `fields.intent_uid` / `story_uid` / `capability_uid` were touched.

## Incoming changes preserved

The incoming commit `e74606d80d` made exactly four frontmatter changes.
Verified against the resolved file:

- `fields.commits` — `working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40`,
  `reconcile_sha: null`, `main_sha: null` — **present** (resolved file
  lines 20–23). Both sides agreed on this block, so it merged cleanly
  outside the conflict markers.
- `fields.version: 0.2.10` — **present** (line 24). Also merged cleanly.
- `status: free_coding` → `free_coded` — **superseded, not discarded.**
  HEAD already advanced the same field past this value to
  `free_and_reconciled`; the incoming transition landed earlier through
  the post-watermark sync route and was then carried forward.
- `updated_at` bump — superseded by HEAD's later `updated_at`, which is
  the correct value for the state the ticket actually holds.

No hunk was dropped under the BUG-1301 precedence exception; no test
functions were involved.

**Net result:** the staged tree is identical to HEAD — `git status
--porcelain` is empty and `git diff --cached HEAD` shows no change. This
is the redundant-commit case, not the discarded case (STEP 4 /
BUG-1109): the incoming commit's substantive payload is verifiably
*present* in HEAD, having already landed via the post-watermark sync,
rather than merely absent. Per STEP 4 this is staged and exited @done
without calling `--skip`; the finalize step will detect the clean staged
diff and skip the commit. `CHERRY_PICK_HEAD` (`e74606d80d`) is intact —
no sequencer-advancing command was run.
