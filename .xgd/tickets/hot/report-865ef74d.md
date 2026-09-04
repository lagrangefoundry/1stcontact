---
uid: report-865ef74d
id: REPORT-3307
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:27:49.430446+00:00'
updated_at: '2026-09-02T18:27:49.430446+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit a74ac03993024fbbffb13bf95ca29a0605894043 (2026-08-22 20:24:39 -0700,
  `xgd(ticket): update request request-554ac441`) makes two changes: a frontmatter
  bookkeeping bump and a ~50-line body addition. Two conflicted hunks, both resolved to
  HEAD, because on each one HEAD is a strict per-fact superset rather than a competing edit:
  - Hunk 1 (`updated_at` / `completed_at` / `last_field_updated` / `status`): incoming
    carries `status: free_coded`, `last_field_updated: body`, `updated_at`
    2026-08-23T03:24:38Z. HEAD carries `status: free_and_reconciled` with `updated_at` /
    `completed_at` 2026-08-31T14:22:34Z — the same lifecycle scalar at a strictly later
    position, from a later-positioned intent. `last_field_updated` is a derived marker of
    the most recent field write and follows its own side's `updated_at`. Kept HEAD.
  - Hunk 2 (end of body): the incoming side of this hunk is EMPTY — the marker pair sits
    at the old end-of-file, where the incoming commit had no trailing newline. HEAD adds a
    further section after that point, `## Follow-up: the deploy secret guard asked the
    wrong question` (ACs 13-16, test-changes narrative, version bookkeeping to 0.2.9), from
    a later increment the incoming commit predates. Keeping HEAD keeps that section and
    discards nothing from the incoming side.

  Staged with `git add --sparse` — `.xgd/tickets/` is outside the sparse-checkout cone on
  this reconcile branch (DOC-986 s2/s4.1).

No code, spec-ticket (2d), UAT, or config files were in conflict. No file was deleted, and
no BUG-1301 precedence drop was applied.

## Incoming changes preserved

The incoming commit touches exactly one file. Its substantive change is the body section
`## Follow-up: bin/build failed on a type-only reach into node`, and that section is
present in the resolved file VERBATIM, above the conflict region, at lines 405-451 —
including its code block of the five tsc errors, the `Cause` / `Why no test caught it`
sections, acceptance criterion 12 ("No module reachable from a Worker entrypoint imports a
node-only module, including through a type-only import."), and the version-bookkeeping
paragraph ending "Ticket version is now 0.2.7."

It is already in HEAD because commit b6ac2faae63d9bbfb4e29cb7b19ed6623f58a32c
(2026-08-30, `xgd(ticket): seed_local_overlay request request-554ac441`) landed it through
the overlay-seed route ahead of this cherry-pick. The frontmatter half of the incoming
change is likewise present-and-exceeded: `status` advanced past `free_coded` to
`free_and_reconciled`.

This is the BUG-1109/BUG-1122 redundant-commit shape, not a discard: the resolution nets to
no diff vs HEAD precisely because HEAD already records this commit's effect and more. Per
STEP 4 the tree is staged and left as-is; `--skip` was not called, and CHERRY_PICK_HEAD is
intact for cherry_pick_finalize_resolution.
