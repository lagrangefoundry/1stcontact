---
uid: report-1b1b6e55
id: REPORT-4781
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T19:14:11.913969+00:00'
updated_at: '2026-09-21T19:14:11.913969+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, class 2e (intent/bookkeeping
  ticket, `request-*`). Two conflicted frontmatter hunks. Resolved per 2e's
  per-fact later-intent rule, which agrees with the auto-enrichment directive
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp and flag for post-merge review").

  | fact | HEAD (kept) | incoming `580518e48a` (dropped) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `free_coded` |
  | `updated_at` | `2026-09-19T15:15:30.957486+00:00` | `2026-09-01T19:56:43.867901+00:00` |
  | `completed_at` | `2026-09-14T10:29:11.537297+00:00` | `null` |
  | `fields.bundled_in` | `bundle-8e1807f6` | *(absent)* |

  Every conflicted fact is a same-field competing edit, and HEAD is later on
  all of them (09-19 vs 09-01). HEAD additionally carries lifecycle state the
  incoming side never had — the ticket completed 2026-09-14, reconciled, and
  was bundled into `bundle-8e1807f6`. Replaying the incoming `draft → free_coded`
  transition would regress REQ-160 to a state it has long since passed through.

  This ticket is incidental to the run: the resync anchor is `report-7b4182de`,
  and `request-bbff35c7` is REQ-160 metadata swept into the replay window.

  Staged with `git add --sparse` (`.xgd/tickets/` is outside the sparse-checkout
  cone on resync branches — DOC-986 §2/§4.1).

## Incoming changes preserved

No code/implementation files were in conflict; the sole conflicted path is a
bookkeeping ticket.

Incoming commit `580518e48a` carries exactly two payloads:

1. **`fields.commits` (2 entries: `e9bd703b…`, `751b0706…`) and
   `fields.version: 0.2.34`** — PRESERVED. Both land outside the conflict
   region and are present verbatim in the resolved file; verified against
   `git show 580518e48a -- .xgd/tickets/hot/request-bbff35c7.md` and by
   re-parsing the resolved frontmatter (`commits` length 2, `version` 0.2.34,
   `bundled_in` intact, YAML valid, no residual conflict markers).

2. **The `draft → free_coded` status transition with its `updated_at` bump** —
   intentionally superseded, not discarded through inability to integrate.
   This is the ordinary 2e outcome for a same-field competing edit where the
   other side is later, not a BUG-1301 precedence drop: no refactor removed
   anything here, HEAD simply holds a strictly later point on the same
   lifecycle field.

The resolution is byte-identical to HEAD, so the staged diff is empty and this
cherry-pick is a no-op. Left staged as instructed; finalize will detect the
clean staged diff and skip the commit. `CHERRY_PICK_HEAD` (`580518e48a`) is
still present and untouched — no `--continue`/`--skip`/`--quit`/`--abort` was run.

## Post-merge review flag

Per the enrichment rule's "flag this file for post-merge review": REQ-160's
frontmatter now reflects HEAD's lifecycle exclusively. If the bundle or
reconcile bookkeeping for `bundle-8e1807f6` is later found to depend on the
`commits` list having been recorded at `free_coded` time rather than at
reconcile time, re-check this ticket — the list itself survived intact, only
the status/timestamp facts around it are HEAD's.
