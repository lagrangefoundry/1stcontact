---
uid: report-091864ad
id: REPORT-4750
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:56:58.435822+00:00'
updated_at: '2026-09-21T14:56:58.435822+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, intent/bookkeeping ticket (STEP 2e, plus the enrichment's "intent unknown → take the more recent commit by timestamp" rule). Conflict was confined to the YAML lifecycle fields; body text identical on both sides. Resolved as **ours** (blob `e2c2f78b`).

  | field | base | ours (HEAD) | theirs (25fa2b65) |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | 2026-09-01T18:57 | **2026-09-19T15:15** | 2026-09-01T19:02 |
  | `completed_at` | null | 2026-09-14T10:29 | null |
  | `bundled_in` | — | `bundle-8e1807f6` | — |

  Rationale: the two sides are not competing on disjoint facts — they set the *same* fields along the *same* lifecycle path. Theirs is a 3-week-old intermediate step (`free_coded → ready_to_reconcile`) that HEAD has already passed through and moved beyond (`free_and_reconciled`, completed, bundled). Ours is a strict superset of theirs on every contested fact and is later by `updated_at` on both the per-fact and whole-file reading, so both the 2e superset rule and the enrichment's timestamp rule select the same side. Taking theirs would have regressed `status` and dropped `completed_at` and `bundled_in`.

  Staging: file is outside the sparse-checkout cone (`.xgd/tickets/` is excluded on this resync branch, DOC-986 §2/§4.1), so the ours blob was materialized from the index and staged with `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's "confirm incoming hunks appear in the resolved file" check does not apply, and no hunk was dropped under the BUG-1301 precedence exception.

For completeness on the ticket itself: the incoming commit `25fa2b6593` contained exactly one semantic change — advancing `status` to `ready_to_reconcile` with the matching `last_field_updated`/`updated_at` stamps. That transition is *already represented* in the resolved file, not discarded: HEAD reached `free_and_reconciled` by passing through `ready_to_reconcile`, so the incoming intent is subsumed rather than lost. There is no incoming content absent from the result that a reader would expect to find.

## Staging state

`git status --porcelain` is empty — the resolution is byte-identical to HEAD, so the staged diff for this cherry-pick is clean. Per STEP 4 this is expected and left as-is; `--skip` was **not** invoked. `CHERRY_PICK_HEAD` (`25fa2b6593b2dff25be52e6f546c559460176b96`) is still present for the finalize step, which will detect the empty staged diff and skip the commit.
