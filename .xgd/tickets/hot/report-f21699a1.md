---
uid: report-f21699a1
id: REPORT-3163
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:24:13.723828+00:00'
updated_at: '2026-09-01T01:24:13.723828+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, bookkeeping ticket (STEP 2 rule 2e).
  Resolved by keeping the OURS/HEAD version (`git checkout --ours` +
  `git add --sparse`), because HEAD is a **strict superset** of the incoming
  version, per 2e's "one side is a strict superset — keep the superset".

  Evidence (`git diff <theirs a541a6d9> <ours 3e669318>`): the theirs→ours diff
  is purely additive apart from three facts, all of which HEAD carries at a
  LATER timeline position:

  | fact | incoming (1524d150, 2026-08-23) | HEAD (7a8d0abd, ticket stamp 2026-08-26) |
  |---|---|---|
  | `updated_at` | `2026-08-23T22:13:33` | `2026-08-26T17:36:27` |
  | `last_field_updated` | `severity` | `status` |
  | `status` | `draft` | `bundled` |
  | `## Status` body section | "Scope drafted, awaiting operator confirmation before coding." | "Both halves landed and verified (2026-08-23)…" |

  Everything else HEAD holds is content the incoming commit never had:
  `fields.story_points`, `fields.commits`, `fields.version`,
  `fields.bundled_in`, and ~270 lines of implementation/verification body
  (Production state, Second finding, Approved scope addition, Implementation —
  the tenant fix). No incoming field or section was dropped, and no content was
  invented; the per-fact timeline rule and the superset rule agree on the same
  answer here.

## Incoming changes preserved

Not a code file, but the STEP 3 check was applied to the ticket all the same.
The incoming commit `1524d1503f964ef4ed7adf60aa43dae3eefc08e7`
("xgd(ticket): update bug bug-db356ff8", 84 insertions) introduced exactly:

- `title:` — `'control-app: fresh deployment 503s until bin/publish runs, so the builder never boots'` → **present verbatim in HEAD**
- `fields.severity: high` → **present verbatim in HEAD**
- body sections `## Symptom`, `## Diagnosis`, `## Immediate unblock (no code change)`, `## Proposed fix`, `## Test plan` → **all present verbatim in HEAD**
- body section `## Status` → present, superseded by HEAD's later text describing
  the same ticket having since landed

So every key change from the incoming commit is present in the resolved file.
No BUG-1301 precedence exception was needed; no hunk was dropped.

## Net staged diff

`git diff --cached HEAD` is **empty**. This is the BUG-1109/BUG-1122 redundant
commit case, not a discard: the incoming commit's effect already reached this
branch by another route (the ticket store's own later `seed_local_overlay`
snapshot at HEAD), and STEP 3 above confirms its changes are present in HEAD
rather than absent. Per STEP 4, `--skip` was NOT called; the tree is staged and
`CHERRY_PICK_HEAD` (`1524d150`) is left intact for
`cherry_pick_finalize_resolution` to handle.
