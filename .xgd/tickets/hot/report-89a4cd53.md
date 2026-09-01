---
uid: report-89a4cd53
id: REPORT-3158
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:10:36.199502+00:00'
updated_at: '2026-09-01T01:10:36.199502+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-22aa8ea3.md` — **AA** (both added), intent/bookkeeping ticket (`request-*`).
  Rule applied: **2b — one side is a strict superset, keep the superset.**
  Both stages were diffed directly (ours `4cf2d206`, theirs `06789d62`): the two blobs are
  byte-identical across all 56 lines; the sole difference is that the incoming blob lacks a
  file-terminating newline (`\ No newline at end of file`). Ours is therefore a strict superset
  (same content + proper terminator). The working-tree conflict was marker-only, confined to the
  final line (markers at lines 56/58/60). Resolved with `git checkout --ours`, verified
  `git diff HEAD` empty and zero remaining conflict markers, staged with
  `git add --sparse` (path is outside the sparse-checkout cone — DOC-986 §2/§4.1).

  Note on the conflict-intent metadata: it flagged "intent unknown on one or both sides, take the
  more recent commit by timestamp and flag for post-merge review." That tiebreaker was not needed —
  the two sides carry no competing facts to arbitrate. Every frontmatter field
  (`status: abandoned`, `updated_at: 2026-08-20T21:38:34`, `last_field_updated: status`, all
  `fields:` entries) and every prose section (Scope, Dependencies, Acceptance criteria, Notes,
  and the "Abandoned (2026-08-20) — superseded" block) is identical on both sides. No per-fact
  timeline lookup was required and no post-merge review is warranted.

## Incoming changes preserved

Incoming commit `d1147fdc` ("xgd(ticket): update request request-22aa8ea3", Martin Westhead,
2026-08-23) is a pure file-add: `1 file changed, 56 insertions(+)`, no deletions, no other files.
All 56 added lines are present verbatim in the resolved file — confirmed by the blob-to-blob diff,
whose only hunk is the missing trailing newline. Nothing from the incoming side was discarded.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or spec
files were touched by this conflict.

**Staged diff vs HEAD is empty.** This is the redundant-commit case (BUG-1109/BUG-1122), not a
discard: the incoming commit's entire content is already present in HEAD via a different route,
which is exactly the distinction STEP 3 draws. `--skip` was NOT called; the cherry-pick sequencer
state is intact (`CHERRY_PICK_HEAD` = `d1147fdc`) for `cherry_pick_finalize_resolution` to detect
the clean staged diff and skip the commit itself.
