---
uid: report-816a97a1
id: REPORT-4507
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:18:53.810209+00:00'
updated_at: '2026-09-20T19:18:53.810209+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — **AA** (both added; no merge base in the index — only
  stages 2 and 3 present). Intent/bookkeeping ticket (`request-*`), so **rule 2e** applies, not the
  2d ledger-replay path. Diffing the two stage blobs directly
  (`0d01e4a8` ours vs `9c802367` theirs) shows the sides differ in **7 frontmatter lines only** —
  the document body is byte-identical, so there is no content edit to compose:

  | field | ours (stage 2 / HEAD) | theirs (stage 3 / incoming) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:40.512711+00:00` | `null` |
  | `updated_at` | `2026-08-31T14:22:40.512711+00:00` | `2026-08-20T21:15:50.041110+00:00` |
  | `bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Ours is a **strict superset**: it carries every fact the incoming side has, at a strictly later
  point in the same lifecycle, plus the `bundled_in` back-reference. The incoming commit
  (`9ef799f9`, authored 2026-08-23) is an **older snapshot** of this ticket — taking it would
  regress `free_and_reconciled` → `ready_to_reconcile`, null out `completed_at`, and drop the
  `bundled_in: bundle-b3b7c399` link. Rule 2e's "one side a strict superset: keep the superset"
  governs; there is no per-fact conflict left over, because every differing fact is the same
  lifecycle fact advanced further on our side.

  Resolved with `git checkout --ours --` then `git add --sparse --` (the ticket store is outside
  the sparse-checkout cone on resync branches, DOC-986 §2/§4.1, though in this case the markers
  did materialise in the working tree).

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a bookkeeping
ticket, and the incoming side contributed **no body or field content that is absent from the
resolved version**. Verified by direct blob diff: the incoming stage is a proper subset of ours,
differing only by being an earlier state of the status/completion/bundling fields listed above.
Nothing developer-authored was discarded, and the BUG-1301 precedence exception was **not**
needed or invoked.

Because ours won in full, the staged tree is identical to HEAD and the staged diff for this
cherry-pick is empty. Left as-is per the workflow contract — `--skip` was **not** called; the
finalize step owns that decision. `CHERRY_PICK_HEAD` (`9ef799f9…`) is still present.
