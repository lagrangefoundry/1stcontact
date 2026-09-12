---
uid: report-b018146b
id: REPORT-4118
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:53:12.057680+00:00'
updated_at: '2026-09-12T19:53:12.057680+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket, per-fact timeline resolution). Resolved to the
  HEAD side via `git checkout --ours` + `git add --sparse`.

### Why HEAD wins, per fact

Both sides edited exactly the same two facts, `status` and `updated_at`:

| fact | base | incoming (66ebe3503a, 2026-08-25) | HEAD (5a37f67dcd, 2026-08-31) |
|---|---|---|---|
| `status` | `free_coded` | `ready_to_reconcile` | `free_and_reconciled` |
| `updated_at` | 2026-08-24T21:57 | 2026-08-25T22:52 | 2026-08-31T19:19 |

HEAD additionally sets `completed_at` and `fields.bundled_in: bundle-78f4e2fe`;
the incoming commit never touched either, so those are HEAD-only additions with
no competing value and are preserved untouched (the `bundled_in` hunk had
already auto-merged cleanly outside the conflict region).

For the two genuinely conflicting facts, the later-positioned intent is HEAD:
its commit is 2026-08-31, six days after the incoming commit's 2026-08-25, and
its `status` is the strictly downstream lifecycle state
(`free_coded` -> `ready_to_reconcile` -> `free_and_reconciled`).

No content was invented; no field outside what one side's own edit declared was
modified.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted file
is a bookkeeping ticket governed by 2e, whose timeline rule dictates the outcome
above.

The incoming commit's status value (`ready_to_reconcile`) does not appear
verbatim in the resolution. This is the **redundant**, not the discarded, case
(STEP 3 / BUG-1109 / BUG-1122): the incoming commit's intent was to advance
BUG-37 from `free_coded` to `ready_to_reconcile`, and HEAD has already carried
the ticket through that state and past it — it is `free_and_reconciled`, with
`completed_at` set and `bundled_in: bundle-78f4e2fe` recording the bundle that
consumed it. The effect landed by a different route rather than being dropped,
so the STEP 3 discard guard does not fire.

## Verification performed

- All three index stages (`:1:`, `:2:`, `:3:`) read and diffed before resolving.
- Losslessness of `--ours` proven first: `git diff HEAD -- <path>` before the
  checkout showed **only** the marker hunk, confirming no auto-merged incoming
  content existed outside the conflict region that `--ours` could silently drop.
- After resolution, `git diff HEAD -- <path>` is empty and `git status
  --porcelain` is empty — no UU/AA/DU/UD lines remain.
- Staged diff nets to no change vs HEAD. Per STEP 4 this is expected and is NOT
  a failure; `--skip` was deliberately NOT called. The finalize step will detect
  the clean staged diff and skip the commit.
- `CHERRY_PICK_HEAD` verified still present (66ebe3503a) for
  `cherry_pick_finalize_resolution`.
