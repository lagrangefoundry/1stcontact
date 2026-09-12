---
uid: report-3d3d048a
id: REPORT-4123
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:08:41.350332+00:00'
updated_at: '2026-09-12T20:08:41.350332+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Incoming commit: `148b2c2071` "Merge branch 'free-BUG-39' into xgd-working".
  Three conflict hunks, all in the YAML frontmatter or the trailing paragraph;
  the entire body auto-merged. Resolved per-fact:
  - **hunk 1 — `updated_at` / `last_field_updated` / `status`**: same facts changed
    on both sides. Ours `2026-08-31T05:05:09` / `status` / `bundled`; incoming
    `2026-08-25T23:28:10` / `story_points` / `free_coded`. Took OURS: later by
    timestamp, and `bundled` is the forward lifecycle state applied on top of
    `free_coded` (not a competing value).
  - **hunk 2 — `fields.bundled_in: bundle-8eef3846`**: ours-only addition, incoming
    never touched the field. Kept (non-overlapping → apply both).
  - **hunk 3 — trailing "Note: in a fresh worktree…" paragraph**: identical prose,
    differing only in line wrapping. Incoming is byte-identical to the merge base
    here (its only change at this position was the missing trailing newline), so
    the reflow is a HEAD-side-only edit. Took OURS — no incoming content involved.
  - `fields.commits` / `version` / `story_points` were identical on both sides and
    auto-merged; no resolution needed.

Verified the merge base → incoming diff contains no incoming-only content outside
those three hunks, so `git checkout --ours` was lossless here: `git diff HEAD`
after resolution is empty and no auto-merged incoming text was dropped.

## Incoming changes preserved

The incoming commit touched one file and changed only frontmatter. Every
substantive incoming fact is present in the resolved file:

- `fields.commits[0].working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd` — present (line 20)
- `fields.version: 0.2.15` — present (line 23)
- `fields.story_points: 3` — present (line 24)
- `status: free_coding` → `free_coded` — present via a later route: HEAD already
  carries `status: bundled`, i.e. the ticket passed through `free_coded` and was
  advanced further by the bundling step (`bundled_in: bundle-8eef3846`). The
  incoming transition is subsumed, not discarded.

No code/implementation files were involved, and no hunks were dropped under the
BUG-1301 precedence exception.

Note for the finalize step: this resolution nets to no diff vs HEAD, because HEAD
already contains the incoming commit's effect (frontmatter facts landed, status
advanced past `free_coded`). Per STEP 4 this is a redundant commit, not a
discarded one — STEP 3's check confirms the incoming key changes are present in
HEAD rather than absent. `CHERRY_PICK_HEAD` (148b2c2071) is intact; no
`--continue`/`--skip`/`--abort` was issued.
