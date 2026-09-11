---
uid: report-16961a9a
id: REPORT-3574
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:13:13.013956+00:00'
updated_at: '2026-09-09T23:13:13.013956+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — class **UU**, rule **2e**
  (intent/bookkeeping ticket). Resolved per-fact toward HEAD via
  `git checkout --ours`, staged with `git add --sparse` (path is outside
  the sparse-checkout cone, DOC-986 §2/§4.1).

  Two conflicted hunks, both in frontmatter; the body was untouched on
  both sides.

  1. `updated_at` / `completed_at` / `status`
     - HEAD: `2026-08-31T19:19:38`, `completed_at` set, `status: free_and_reconciled`
     - incoming: `2026-08-24T01:50:12`, `completed_at: null`, `status: free_coded`
  2. `fields.bundled_in: bundle-78f4e2fe` — present on HEAD only; the
     incoming commit predates bundling and never had this key.

  Same-fact conflict (ticket lifecycle state) at two timeline positions.
  Conflict-intent enrichment reported intent unknown on both sides, so the
  more-recent-commit rule applies: HEAD's last touch is `56ced613a4`
  (2026-08-31 12:19:38 -0700); incoming is `e74606d80d`
  (2026-08-23 18:50:12 -0700) — HEAD is 8 days later on every conflicted
  fact, so HEAD wins per-fact on both hunks. Taking the incoming side
  would have walked `status` backwards, nulled `completed_at`, and dropped
  `bundled_in`.

## Incoming changes preserved

The incoming commit `e74606d80d` made exactly two changes to this file.
Both are accounted for in the resolved version:

1. **Added `fields.commits` + `fields.version`** —
   `working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40`,
   `reconcile_sha: null`, `main_sha: null`, `version: 0.2.10`.
   PRESENT verbatim in the resolved file (frontmatter lines 20-24).
   These lines were unconflicted context in the merge, i.e. both sides
   already carried them.

2. **`status: free_coding` -> `free_coded`** — carried forward, not
   discarded. HEAD's history advances the same field along the same
   lifecycle axis past this point: `56ced613a4` moves it
   `bundled -> free_and_reconciled`. `free_and_reconciled` is downstream
   of `free_coded`, so the incoming transition is subsumed by HEAD's
   later state rather than lost.

No hunk was dropped under the BUG-1301 precedence exception; no test
functions were involved.

The resolution therefore nets to no diff versus HEAD — `git status
--porcelain` on the path returns empty after staging. This is the
redundant-commit case (BUG-1109/BUG-1122): a post-watermark sync already
landed this commit's effect through a different route. Per STEP 3 this is
"present via a different route," not "discarded" — the incoming commit's
key changes are demonstrably in HEAD. Per STEP 4, `--skip` was NOT called;
the tree is staged and left for `cherry_pick_finalize_resolution`, with
CHERRY_PICK_HEAD (`e74606d80d`) intact.
