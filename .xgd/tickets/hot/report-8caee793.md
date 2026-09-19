---
uid: report-8caee793
id: REPORT-4382
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:29:20.962955+00:00'
updated_at: '2026-09-19T10:29:20.962955+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket (rule **2e**, per-fact).
  Single conflict hunk, three frontmatter facts. Enrichment said "intent unknown
  on one or both sides — take the more recent commit by timestamp"; HEAD's last
  touch is `c14f78d6` (2026-09-09 14:35 -0700, `seed_local_overlay`), incoming is
  `db39fce0` (2026-08-31 14:56 -0700), so HEAD is the more recent side. Each fact
  was still resolved individually rather than by taking a whole side:
  - `last_field_updated` — **identical on both sides** (`status`). Not a real
    conflict; the incoming value survives verbatim.
  - `status` — ours `bundled`, incoming `free_coding`. Same fact, differs → timeline
    rule. Ours is both later *and* strictly downstream of incoming on the same
    lifecycle (`ticket_types.yaml:65` orders the request free-coding path
    draft → free_coding → free_coded → ready_to_reconcile → **bundled**). Kept ours.
  - `updated_at` — ours 2026-09-09T21:32:49Z, incoming 2026-08-31T21:56:04Z. Kept ours.
  - `fields.commits` / `fields.version` / `fields.bundled_in` and the entire
    "What landed" body record — **ours only**; the incoming blob is byte-identical
    to the merge base outside the hunk above. Non-overlapping, so kept in full.

  Every fact resolved to the ours blob, so the resolution is the stage-2 blob
  verbatim (`git checkout --ours`, then `git add --sparse`). Nothing was invented
  and no field outside the conflict hunk was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket.

The incoming commit's only substantive change is the status advance
`draft → free_coding` (plus its `updated_at` stamp and `last_field_updated: status`).
This is **present in HEAD via a different route, not discarded** — the STEP 4 /
BUG-1109 redundant case, distinguished per STEP 3:

- `last_field_updated: status` is present in the resolved file, identical to the
  incoming value.
- The `free_coding` transition was superseded on the HEAD side by a later state on
  the *same* lifecycle. HEAD carries `fields.version: 0.2.23`, which
  `ticket_types.yaml:78` documents as "set at time of `free_coded` transition"
  (`xgd ticket move-to-free-coded`, REQ-648), plus
  `fields.commits[0].working_sha: 115f0d39ec…` and
  `fields.bundled_in: bundle-87be4669`. Those artifacts can only exist if the
  ticket passed *through* `free_coding`/`free_coded` and on to `bundled`.
  Re-applying incoming's `status: free_coding` would regress an
  operator/pipeline-owned field backwards over work HEAD already records as done.

No hunk was dropped under the BUG-1301 precedence exception; none applied here.

Staged result nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty), as
expected for a commit whose effect already reached the branch by another route.
Per STEP 4 this was staged and exited @done rather than skipped here;
`cherry_pick_finalize_resolution` will detect the clean staged diff.
`CHERRY_PICK_HEAD` (`db39fce0f8…`) is intact — no sequencer-advancing command was run.

## Post-merge review flag

The enrichment asked for this file to be flagged for post-merge review (intent
unknown on one or both sides). Flagging it here: `request-119dd4af` status was
resolved to `bundled` and the incoming `free_coding` transition dropped as
superseded.
