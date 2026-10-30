---
uid: report-8ef7a2cb
id: REPORT-4866
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T19:21:08.791226+00:00'
updated_at: '2026-09-23T19:21:08.791226+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`), rule **2e** applied per-fact. Conflict was frontmatter-only;
  the body was byte-identical on both sides.

  Both sides edit the **same facts** (`status`, `updated_at`) on the **same
  lifecycle chain**, so this is a genuine per-fact conflict rather than
  disjoint edits — 2e's later-positioned-intent rule governs, and every
  conflicting fact resolves to HEAD:

  | fact | merge base | incoming (4394018c, 2026-09-01) | HEAD (e8f9e7c8, 2026-09-19) | kept |
  |---|---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `free_and_reconciled` | HEAD |
  | `updated_at` | 2026-09-01T22:36 | 2026-09-02T00:39 | 2026-09-19T15:15 | HEAD |
  | `completed_at` | `null` | `null` | 2026-09-14T10:29 | HEAD |
  | `fields.bundled_in` | absent | absent | `bundle-8e1807f6` | HEAD (additive, HEAD-only) |

  Ledger replay (`xgd ticket history bug-360c5a44`, both revs) shows the
  incoming commit performs a single step — `free_coded` → `ready_to_reconcile`
  — that HEAD has already traversed **past** on the same path:
  `free_coded` → `ready_to_reconcile` → `bundled` → completed (2026-09-14)
  → `free_and_reconciled` (2026-09-19). HEAD is therefore a strict superset
  in lifecycle terms, and no fact is later on the incoming side.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's `git show $CPHEAD`
verification has no code target.

Stated plainly for the one ticket file: the incoming side's literal value
(`status: ready_to_reconcile`) is **deliberately not** present in the
resolved file. This is not a discarded developer change — it is a
superseded lifecycle step. Taking it would roll a reconciled, completed,
bundled ticket **backwards** and additionally drop `completed_at` and
`fields.bundled_in`, which exist only on HEAD. The incoming commit
contributes no field that HEAD's later state lacks.

## Staging state

`git diff --name-only --diff-filter=U` is empty; no conflict-class entries
remain in `git status --porcelain`. Because the resolution equals HEAD
exactly, the staged diff is clean and this cherry-pick is expected to be a
no-op — left for the finalize step to skip, per STEP 4. `CHERRY_PICK_HEAD`
(4394018c5061aaeafebacd16761f37fdd8da7bdd) is intact; no
`--continue`/`--skip`/`--quit`/`--abort` was issued.

## Flagged for post-merge review

Conflict enrichment classed this file "intent unknown on one or both sides."
The ledger replay above resolved that ambiguity — both sides are ordinary
`update bug` status transitions on one chain — so the resolution does not
rest on the enrichment's fallback timestamp heuristic. Flagging per the
enrichment rule regardless; expected reviewer finding is "no action."

The nine untracked `.xgd/tickets/cold/*.md` files predate this step and are
outside the conflict; left untouched.
