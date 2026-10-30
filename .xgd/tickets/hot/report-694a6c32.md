---
uid: report-694a6c32
id: REPORT-5247
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:47:35.274429+00:00'
updated_at: '2026-09-28T01:47:35.274429+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Sparse-checkout path, so staged with
  `git checkout --ours` + `git add --sparse`.

  Both sides diverge from the merge base only in the frontmatter:

  | fact | base | ours (HEAD) | incoming (8aa14a9) |
  |---|---|---|---|
  | `status` | `ready_to_reconcile` | `free_and_reconciled` | `bundled` |
  | `updated_at` | `2026-08-24T01:14:03` | `2026-08-31T14:22:42` | `2026-08-24T02:10:41` |
  | `completed_at` | `null` | `2026-08-31T14:22:42` | `null` |
  | `last_field_updated` | `commits` | `status` | `status` |
  | `fields.bundled_in` | (absent) | `bundle-b3b7c399` | `bundle-b3b7c399` |

  Per-fact resolution:
  - `bundled_in`: **not** a conflict — both sides add the identical value
    `bundle-b3b7c399`. Kept.
  - `status` / `updated_at` / `completed_at` / `last_field_updated`: same
    facts changed differently, so the later-positioned intent wins.
    Ours (`2026-08-31T14:22:42`) is later than incoming
    (`2026-08-24T02:10:41`), and `free_and_reconciled` is downstream of
    `bundled` in the request lifecycle (`ready_to_reconcile` → `bundled`
    → `free_and_reconciled`). Taking incoming would have regressed a
    completed ticket back to `bundled` and cleared `completed_at`.

  Body below the frontmatter is byte-identical on all three stages; no
  prose was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path
is a bookkeeping ticket.

Incoming's entire delta for `request-18a48d63.md` is preserved or
superseded, nothing discarded:

- `fields.bundled_in: bundle-b3b7c399` — present verbatim in the resolved
  file (confirmed via `git show :.xgd/tickets/hot/request-18a48d63.md`).
- `status: bundled` / `last_field_updated: status` — incoming's intent was
  "this request has been bundled". Ours already records that bundling
  (same `bundled_in`) and has since advanced the same request through
  reconciliation to `free_and_reconciled`. The incoming status value is
  superseded by a strictly later state transition on the same fact, not
  dropped.

No BUG-1301 precedence exception was invoked; no hunk was dropped on the
grounds of a prior HEAD-side refactor.

The resulting staged tree is byte-identical to HEAD for this path, so the
staged diff is empty. Left as-is per STEP 4 — `git cherry-pick --skip`
was **not** called; `CHERRY_PICK_HEAD` is still present for the finalize
step.
