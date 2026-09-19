---
uid: report-a1bb6a76
id: REPORT-4430
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:47:37.052199+00:00'
updated_at: '2026-09-19T12:47:37.052199+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, index-only (path is
  outside the sparse-checkout cone, so no working-tree markers existed).
  Class: intent/bookkeeping ticket, rule **2e**. Resolved by **keeping the OURS
  side** as a strict superset, then `git checkout --ours` + `git add --sparse`.

  Evidence for superset, not a timeline coin-toss:

  - The two sides' **bodies are byte-identical** (`diff` of stage :2 vs :3 shows
    zero body hunks; the only textual delta is a trailing newline the
    `seed_local_overlay` rewrite dropped). The incoming commit's entire content
    change is therefore already present on HEAD.
  - The **frontmatter** differs only by OURS advancing the ticket lifecycle:
    `status: free_coding → bundled`, `completed_at: null → 2026-09-14`,
    `last_field_updated: body → status`, plus three fields the incoming side
    never carried (`fields.commits` with two `working_sha` entries,
    `fields.version: 0.2.37`, `fields.bundled_in: bundle-8e1807f6`).
    Taking the incoming side would have reverted REQ-172 out of the bundle it
    is currently being reconciled under.
  - Commit timestamps agree with the superset reading: incoming
    `4305ac944eda` *xgd(ticket): update request* is 2026-09-01 14:33 -0700;
    the HEAD-side `ee0d0b9866e6` *xgd(ticket): seed_local_overlay request* is
    2026-09-17 13:23 -0700. The enrichment's fallback rule ("take the more
    recent commit by timestamp") selects the same side.

  Flagged for post-merge review per the enrichment rule (intent unknown on the
  `seed_local_overlay` side), though the byte-identical bodies leave nothing
  substantive in dispute.

## Incoming changes preserved

Incoming commit `4305ac944eda` touches exactly one file, this ticket
(83 insertions / 30 deletions vs its parent). Verified against
`git show 4305ac944eda -- .xgd/tickets/hot/request-8b33a146.md`: every hunk it
introduced is present verbatim in the resolved file — the JSON/XML row added to
the content-type table, the reader-window height cap paragraph, the reworded
expand-button paragraph ("existing modal shell … reused rather than rebuilt"),
the "bytes are read once" sentence on the PDF frame, the split of the
`MaterialRow` paragraph into the content-type-duplication and
`resolveContentType`-fallback paragraphs, and the rest of the expanded
Technical-consequences and Test-plan sections. Confirmed by direct diff: the
resolved body and the incoming body are identical.

No hunk was dropped; the BUG-1301 precedence exception was not invoked. No code
or UAT files were involved in this conflict.

**Staged result nets to no diff vs HEAD** — expected and benign here, and
distinguished from a discard per STEP 3/STEP 4: the incoming commit's changes
are absent from the staged diff *because they are already in HEAD*, not because
they were overwritten. `git cherry-pick --continue/--skip` was NOT called;
`CHERRY_PICK_HEAD` (`4305ac944eda`) is intact for
`cherry_pick_finalize_resolution`.
