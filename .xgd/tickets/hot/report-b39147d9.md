---
uid: report-b39147d9
id: REPORT-4185
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:28:56.148296+00:00'
updated_at: '2026-09-14T00:28:56.148296+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, index-only (sparse-excluded on the
  reconcile branch, no working-tree markers). Class 2e (intent/bookkeeping
  ticket). Rule applied: per-fact comparison; HEAD side is a strict superset of
  the incoming side, so HEAD's blob is the resolution
  (`git checkout --ours` + `git add --sparse`). Ours stage blob
  (963294b5) is identical to HEAD, so taking ours discarded no auto-merged
  content.

Per-fact breakdown (base 036c1169 → ours 963294b5 / theirs 2a59e08e):

| fact | base | theirs (incoming 08bbde06) | ours (HEAD) | resolution |
|---|---|---|---|---|
| `fields.commits` | absent | added (working_sha e5d76233) | added, identical | same on both — kept |
| `fields.version` | absent | `0.2.33` | `0.2.33` | same on both — kept |
| `status` | `free_coding` | `free_coded` | `bundled` | same field, both changed: later intent wins (ours, updated_at 2026-09-11 vs incoming 2026-09-01; `bundled` is downstream of `free_coded`) |
| `last_field_updated` | `body` | `status` | `status` | same on both |
| `updated_at` | 19:27:33Z 09-01 | 19:28:24Z 09-01 | 18:53:54Z 09-11 | later wins (ours) |
| `title` | "23 failures…ten UATs" | unchanged from base | "27 failures + 30 collection errors…eleven UATs" | ours-only edit, incoming never touched it — kept ours |
| `fields.bundled_in` | absent | absent | `bundle-8e1807f6` | ours-only addition — kept |
| trailing newline at EOF | present | removed | removed | same on both |

No content was invented; every field in the result is present on at least one
side.

## Incoming changes preserved

The incoming commit 08bbde06 (`xgd(ticket): update bug bug-3ade1af4`) made
exactly four changes: add `fields.commits`, add `fields.version: 0.2.33`,
advance `status` to `free_coded` (with `last_field_updated: status`), and drop
the EOF newline. All four are present in HEAD via the seeded local overlay
(`xgd(ticket): seed_local_overlay bug bug-3ade1af4`) plus subsequent bundling:
`commits`, `version`, `last_field_updated` and the EOF change are byte-identical,
and `status` has advanced past `free_coded` to `bundled` on a later timeline
position. Nothing from the incoming diff is absent — it is present via a
different (later) route, so this is a redundant commit, not a discard
(STEP 3 / BUG-1109 distinction).

Consequence: the staged diff vs HEAD is empty. Per STEP 4 this is not a failure
and `--skip` was NOT called; the finalize step will detect the clean staged diff
and skip the commit.

No code/implementation files, no UAT test files, and no spec tickets were
involved. No hunks were dropped under the BUG-1301 precedence exception.
