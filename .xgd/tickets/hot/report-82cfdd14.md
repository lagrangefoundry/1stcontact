---
uid: report-82cfdd14
id: REPORT-4872
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:31:54.527926+00:00'
updated_at: '2026-09-23T22:31:54.527926+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**: same facts changed differently on both sides →
  take the later-positioned intent, per fact. Resolved to the HEAD side.

  The three-way diff between stage 2 and stage 3 shows the sides differ in
  exactly three bookkeeping facts and nothing else:

  | fact | HEAD (ours) | incoming (`625e291b9e`) |
  |---|---|---|
  | `updated_at` | `2026-09-09T21:32:50` | `2026-09-02T01:52:32` |
  | `status` | `bundled` | `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-87be4669` | *(absent)* |

  Ledger replay confirms these are the same fact advancing, not competing
  edits:

  - Incoming `625e291b9e` is a pure status transition
    `free_coded` → `ready_to_reconcile` at `2026-09-02T01:52`, with no body,
    field, or narrative change.
  - HEAD's tip commit `c94654a3` advances `status` to `bundled` at
    `2026-09-09T21:32`, adding `fields.bundled_in: bundle-87be4669` and the
    `commits:` list.

  `bundled` is both later by timestamp (7 days) and downstream of
  `ready_to_reconcile` in the lifecycle. Taking incoming here would regress the
  status and drop `bundled_in`, orphaning the ticket from `bundle-87be4669`.

## Incoming changes preserved

No code or implementation files were in conflict — the sole conflict was a
ticket-frontmatter bookkeeping collision.

For `.xgd/tickets/hot/request-6893f6ea.md`, the incoming commit's *only*
content is the `free_coded` → `ready_to_reconcile` status transition. That
transition is not discarded — it is **superseded**: HEAD already passed through
`ready_to_reconcile` and moved on to `bundled`, which is the strictly later
state on the same lifecycle axis. Verified against
`git show 625e291b9e -- .xgd/tickets/hot/request-6893f6ea.md`: the incoming
commit touches no other line of the file, so nothing disjoint was lost.

No hunks were dropped under the BUG-1301 precedence exception; no test files
were involved.

## Staging state

`git status --porcelain` shows no conflict-class entries. The resolution
equals HEAD for this path, so the staged diff is empty — per the prompt, this
is left for Python's finalize step to detect and skip. `CHERRY_PICK_HEAD`
(`625e291b9e1f81e0f5e114d4c12aa9b5f1e82727`) is intact. The nine untracked
`.xgd/tickets/cold/` files are pre-existing and unrelated to this conflict.
