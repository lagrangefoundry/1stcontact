---
uid: report-070de555
id: REPORT-4136
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T16:53:49.896031+00:00'
updated_at: '2026-09-13T16:53:49.896031+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, class 2e (intent/bookkeeping ticket; a
  `request-*` ticket living in `hot/`). Sparse-excluded on this branch, so the conflict was
  index-only with no working-tree markers; inspected via `git show :1:/:2:/:3:` and resolved
  with `git checkout --ours` + `git add --sparse`.

  Per-fact resolution against merge base (`status: free_coded`, `updated_at:
  2026-08-28T16:40:51`, no `bundled_in`):

  | Fact | Ours (HEAD) | Incoming (6531a2d1) | Kept | Why |
  |---|---|---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` | ours | Same fact changed on both sides → 2e timeline rule. Ours' `updated_at` 2026-08-31T05:05:09 is later than incoming's 2026-08-30T20:37:44, and `bundled` is lifecycle-forward from `ready_to_reconcile` (free_coded → ready_to_reconcile → bundled). |
  | `updated_at` | `2026-08-31T05:05:09.416379+00:00` | `2026-08-30T20:37:44.674155+00:00` | ours | Follows the winning `status` fact. |
  | `last_field_updated` | `status` | `status` | — | Identical on both sides; not a conflict. |
  | `fields.bundled_in` | `bundle-8eef3846` (added) | untouched | ours | Non-overlapping HEAD-only addition. Dropping it would leave `status: bundled` with no bundle ref. |
  | trailing newline at EOF | present | stripped | ours | Whitespace churn, not a fact. Base had the newline. |

  No content was invented; nothing outside the frontmatter differed between the two sides
  (the ours↔theirs diff is exactly the frontmatter hunk plus the EOF newline), so
  `checkout --ours` discarded no auto-merged incoming hunk.

  Note for post-merge review (as the enrichment metadata requested — intent unknown on both
  sides): this request now carries `bundled_in: bundle-8eef3846`, while the reconcile bundle
  in flight is `bundle-8e1807f6`. That mismatch predates this conflict and was not touched
  by this resolution.

## Incoming changes preserved

The incoming commit `6531a2d1f4cc9417b55a492df0554428618ffd6a` changed exactly one file and
exactly one thing of substance: advancing the request out of `free_coded` to
`ready_to_reconcile` (plus the derived `updated_at` / `last_field_updated: status` and an EOF
newline strip).

That intent is **present in HEAD via a later route, not discarded** (STEP 4, BUG-1109/1122):
HEAD already moved the ticket past `ready_to_reconcile` to `bundled` and recorded
`bundled_in`, i.e. the ticket did leave `free_coded` and did get reconcile-bundled. Taking
`ready_to_reconcile` would have rolled the ticket *backwards* while leaving `bundled_in` set —
an incoherent state. This is 2e's per-fact timeline rule doing its job, not a discard, so
STEP 3's @fail condition does not apply.

No code/implementation files were in conflict. No test function was deleted; the BUG-1301
precedence exception was not invoked.

The staged diff against HEAD is therefore empty. Per STEP 4 this is expected and is not a
@fail reason — `--skip` was not called; the finalize step will detect the clean staged diff.
