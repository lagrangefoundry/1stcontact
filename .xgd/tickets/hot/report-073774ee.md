---
uid: report-073774ee
id: REPORT-4195
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T01:06:49.307445+00:00'
updated_at: '2026-09-14T01:06:49.307445+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` (REQ-160) — **UU**, sparse-excluded
  (conflict existed only in the index; no working-tree markers, inspected via
  `git show :1:/:2:/:3:`). Class **2e** (intent/bookkeeping ticket — a
  `request-*` ticket, not a matrix-defining spec ticket; this store keeps
  requests under `hot/` rather than `open/`).
  Rule applied: **one side is a strict superset — keep the superset (ours)**.

  Both sides changed frontmatter only; the body prose is byte-identical across
  all three stages (`:1:`, `:2:`, `:3:`).

  | field | base `:1:` | ours `:2:` | incoming `:3:` |
  |---|---|---|---|
  | `status` | `draft` | `bundled` | `free_coded` |
  | `last_field_updated` | `body` | `status` | `status` |
  | `updated_at` | 2026-09-01T19:54 | 2026-09-11T18:53 | 2026-09-01T19:56 |
  | `commits` (2 entries) | absent | present | present (identical) |
  | `version` | absent | `0.2.34` | `0.2.34` |
  | `bundled_in` | absent | `bundle-8e1807f6` | absent |

  Ours is the `seed_local_overlay` commit `cdc7e23` (Fri Sep 11 14:08:31 2026);
  incoming is `580518e` `xgd(ticket): update request request-bbff35c7`
  (Tue Sep 1 12:56:43 2026). The enrichment's fallback rule for unknown intent
  ("take the more recent commit by timestamp") and the 2e superset rule both
  select ours, so no timeline tie-break was needed.

  Resolved with `git checkout --ignore-skip-worktree-bits --ours` +
  `git add --sparse`. `git ls-files -u` is now empty and CHERRY_PICK_HEAD
  (`580518e48a1a14cc8632b36af4b7c68d890a0dca`) is intact.

## Incoming changes preserved

Confirmed. `git diff 580518e HEAD -- .xgd/tickets/hot/request-bbff35c7.md`
shows HEAD as a strict superset of the incoming version — every field the
incoming commit added is present:

- `commits` (both `working_sha` entries, `e9bd703` and `751b070`) — present.
- `version: 0.2.34` — present.
- `last_field_updated: status` — present.
- `status` — incoming sets `free_coded`; HEAD carries `bundled`, which is the
  **downstream** lifecycle state of that same transition, written by the
  seeded local overlay when this ticket was bundled into `bundle-8e1807f6`
  (the very intent being reconciled here). Taking incoming would have
  *regressed* the ticket's status. This is the documented seed-overlay case:
  the overlay already carries the incoming commit's effect, reached through a
  different route, so this is a **redundant** commit, not a discarded one.

No BUG-1301 precedence exception was invoked; no hunk was dropped. No code,
test, or config files were involved.

This resolution nets to **no staged diff vs HEAD** — expected for a redundant
ticket-bookkeeping commit whose effect the overlay already encodes (STEP 4 /
BUG-1109). `cherry_pick_finalize_resolution` will detect the clean staged diff
and skip the commit; `--skip` was deliberately not called here.
