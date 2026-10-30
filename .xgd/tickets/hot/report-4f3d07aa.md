---
uid: report-4f3d07aa
id: REPORT-4571
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:25:11.787012+00:00'
updated_at: '2026-09-20T23:25:11.787012+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **AA (both added)**, intent/bookkeeping
  ticket (§2b + §2e). Ours (HEAD, `xgd(ticket): update bug bug-a98fb3b0`) holds
  BUG-38 carried through its full lifecycle: real title, `status:
  free_and_reconciled`, `updated_at`/`completed_at` 2026-08-31T19:19:34, and the
  complete Symptom / Root cause / Fix / Test plan body. Theirs
  (`4e5a8b2b72 xgd(ticket): create bug bug-a98fb3b0`) is the ticket's original
  creation stub: `title: Untitled`, `status: draft`, `last_field_updated:
  created_at`, body `(new ticket)`.

  Same `uid`, same `id`, same `created_at` — these are not two competing tickets
  but two points on one ticket's own timeline. HEAD is a strict superset, so per
  §2e ("One side a strict superset: keep the superset") the resolution is
  `git checkout --ours` + `git add --sparse` (the path is outside the
  sparse-checkout cone on this resync branch, DOC-986 §2/§4.1, so the conflict
  existed only in the index with no working-tree markers).

  No per-fact conflict remained to arbitrate: every field on the incoming side is
  present in the resolution, either byte-identical or holding a later value
  written by this same ticket's subsequent updates.

## Incoming changes preserved

Not a code file — no implementation hunks to verify. Field-by-field against
`git show 4e5a8b2b72:.xgd/tickets/hot/bug-a98fb3b0.md`:

| incoming field | in resolution |
|---|---|
| `uid: bug-a98fb3b0` | identical |
| `id: BUG-38` | identical |
| `type: bug` | identical |
| `created_by: xgd` | identical |
| `created_at: 2026-08-24T22:12:54.350656+00:00` | identical |
| `fields.auto_merge_back: true` | identical |
| `fields.needs_review: false` | identical |
| `fields.priority: medium` | identical |
| `title: Untitled` | superseded by the real title |
| `status: draft` | superseded by `free_and_reconciled` |
| `updated_at` / `completed_at` / `last_field_updated` | superseded by 2026-08-31 values |
| body `(new ticket)` | superseded by the full bug write-up |

Nothing was discarded. The only incoming values absent from the resolution are
placeholder values that this same ticket overwrote in its own later commits —
superseding a draft stub with its finished form is the intended outcome, not a
lost edit. The BUG-1301 precedence exception was not invoked; no test function
was deleted.

## Post-resolution state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain and the staged
tree matches HEAD, because HEAD already contained a superset of the incoming
commit's effect. CHERRY_PICK_HEAD (`4e5a8b2b72`) is left intact — no
`--continue` / `--skip` / `--quit` / `--abort` was issued. Per STEP 4, the empty
staged diff is left for the finalize step to detect and skip.
