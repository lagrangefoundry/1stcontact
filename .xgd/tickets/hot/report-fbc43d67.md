---
uid: report-fbc43d67
id: REPORT-3221
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T19:33:32.206629+00:00'
updated_at: '2026-09-01T19:33:32.206629+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket (rule **2e**;
  a `request-*` ticket, not a matrix-defining spec ticket, so 2d's ledger-replay does not
  apply). Resolved **per fact**, which landed on ours for both hunks. Staged with
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Sides:
  - **Ours** — `afd199743a` `xgd(ticket): seed_local_overlay` (Mon 2026-08-31 12:21:41 -0700)
  - **Theirs** — `6531a2d1f4` `xgd(ticket): update` (Sun 2026-08-30 13:37:44 -0700), the
    incoming free_coded commit. Base (stage 1) `ce69fd1a5d` is exactly theirs' pre-image.

  Hunk 1 — frontmatter, **same fact changed on both sides** (genuine conflict → timeline rule
  per 2e):
  - `status`: base `free_coded`; ours `bundled`; theirs `ready_to_reconcile`.
    Ours wins — later intent, and `bundled` is the **downstream** state of
    `ready_to_reconcile` in this very reconcile run. Taking theirs would have regressed the
    bundle state the surrounding reconcile depends on.
  - `updated_at`: ours `2026-08-31T05:05:09Z` > theirs `2026-08-30T20:37:44Z`. Ours (later).
  - `last_field_updated`: both sides set `status` — no conflict of fact.
  - `fields.bundled_in: bundle-8eef3846`: **ours-only addition**, kept (nothing on theirs to
    combine it with).

  Hunk 2 — the `## AC status` table at EOF, **not a genuine conflict of fact**: theirs is
  byte-identical to base apart from the dropped trailing newline, i.e. the incoming commit
  made **no** body edit. Ours is a whole-body reflow from the overlay seed (same six AC rows,
  same text, markdown table flattened to lines). One side edited, the other did not, so ours
  applies. Reverting the reflow to theirs' table would have been undoing an
  already-integrated HEAD change with no incoming intent behind it, and would have left the
  body internally inconsistent (the earlier `## Files` table is flat in ours too).

  Nothing was invented that is not on one side; no `intent_uid` / `story_uid` /
  `capability_uid` field was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit `6531a2d1f4` touches
exactly one file, this ticket, `4 insertions(+), 4 deletions(-)`.

Verified `checkout --ours` was lossless **before** taking it: `git diff HEAD -- <path>` on the
merge-conflicted working tree showed every added line to be either a conflict marker or inside
the `=======`/`>>>>>>>` theirs region. No auto-merged incoming content sat outside the markers,
so none was silently dropped.

The staged diff vs HEAD is **empty**. Per STEP 4 this is expected and is *not* a discard:
STEP 3's distinguishing test comes back **redundant, not discarded** — the incoming commit's
key change (advance `status` off `free_coded`) is present in HEAD **via a different route**,
namely `status: bundled` plus `fields.bundled_in: bundle-8eef3846` with a strictly later
`updated_at`. HEAD is ahead of the incoming state on the same axis, not missing it. No
`--skip` was called; the finalize step will detect the clean staged diff.

No hunks were dropped under the BUG-1301 precedence exception, and no UAT test functions were
involved.
