---
uid: report-beb48283
id: REPORT-4741
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:39:58.951295+00:00'
updated_at: '2026-09-21T14:39:58.951295+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` (REQ-165) — **UU**, intent/bookkeeping
  ticket (STEP 2e). Outside the sparse-checkout cone, staged with
  `git add --sparse`.

  Incoming commit `cfe4aca5` ("xgd(ticket): update request request-26dafd83",
  2026-09-01T18:35:57Z) vs HEAD-side seed_local_overlay. The incoming commit's
  entire diff is three frontmatter lines:

  - `updated_at`: `…18:35:52` → `…18:35:57`
  - `last_field_updated`: `status` → `story_points`
  - (`status: free_coded` carried along in the same hunk, unchanged by this commit)

  All three collide with the same fields on the HEAD side, so this is a genuine
  same-fact conflict and 2e's later-positioned-intent rule applies per fact.
  HEAD wins on all three: `updated_at: 2026-09-09T21:32:49Z`,
  `last_field_updated: status`, `status: bundled`. The incoming side sits 8 days
  earlier at an earlier point on the same lifecycle
  (`free_coded` → … → `bundled`), so it is superseded, not competing.

  Nothing else in the file conflicted. `fields.story_points: 8` — the value whose
  update this commit was recording — is identical on both sides and already
  present outside the conflict hunk, so the incoming commit's semantic content is
  not lost by taking HEAD's bookkeeping fields. `fields.commits`,
  `fields.version: 0.2.31` and `fields.bundled_in: bundle-87be4669` merged
  cleanly and are untouched.

## Incoming changes preserved

Verified against `git show cfe4aca5 -- .xgd/tickets/hot/request-26dafd83.md`.
This is a bookkeeping-only commit — no code, no body/prose, no new fields; its
diff is confined to `updated_at` and `last_field_updated`, both of which are
metadata describing a `story_points` edit whose value (`8`) is already present
and identical on both sides. No substantive incoming change was discarded. The
BUG-1301 precedence exception was not invoked and no test content was involved.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged
entries. `git diff --cached --stat` is also empty: the resolution is a net no-op
against HEAD, because the HEAD-side seed_local_overlay already carried this
ticket past the incoming commit. Per the step instructions `--skip` was NOT
called; CHERRY_PICK_HEAD (`cfe4aca5`) remains in place for the finalize step to
detect the clean staged diff and skip the commit itself.
