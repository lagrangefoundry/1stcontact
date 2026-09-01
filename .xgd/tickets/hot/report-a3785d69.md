---
uid: report-a3785d69
id: REPORT-3164
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:26:06.713770+00:00'
updated_at: '2026-09-01T01:26:06.713770+00:00'
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

  Incoming commit `bcedebfb50ecf4208ef7ac0834cdee3af79236c9`
  ("xgd(ticket): update bug bug-db356ff8", 2026-08-23 15:21, 52 insertions);
  ours `3e669318` from HEAD `7a8d0abd` (seed_local_overlay, ticket stamp
  2026-08-26). This is the second consecutive commit on this same ticket in
  this bundle (the previous one was `1524d150`), and it resolves the same way.

  Proof of superset — `git diff <theirs 2ffe0bc5> <ours 3e669318>` contains
  exactly FOUR removed lines, and every one is a fact HEAD advanced to a LATER
  timeline position:

  | fact | incoming (2026-08-23T22:21) | HEAD (ticket stamp 2026-08-26T17:36) |
  |---|---|---|
  | `updated_at` | `2026-08-23T22:21:09.946754+00:00` | `2026-08-26T17:36:27.054996+00:00` |
  | `last_field_updated` | `body` | `status` |
  | `status` | `draft` | `bundled` |
  | `## Status` body text | "Scope drafted, awaiting operator confirmation before coding." | "Both halves landed and verified (2026-08-23)…" |

  Nothing else in the incoming version is absent from ours. No content was
  invented; no incoming field or section was dropped. The superset rule and the
  per-fact timeline rule give the same answer.

## Incoming changes preserved

Not a code file, but the STEP 3 check was applied to the ticket all the same.
The incoming commit added exactly two body sections plus the two front-matter
bumps listed above:

- `## Production state — confirmed empirically (2026-08-23)` (including the
  `### Interim production patch applied` subsection and its `INSERT OR IGNORE
  INTO tenants` SQL) → **present verbatim in HEAD**
- `## Second finding — bin/publish --production cannot authenticate as written`
  (through "Needs its own ticket.") → **present verbatim in HEAD**

Both survive in the resolved file byte-for-byte. HEAD additionally carries
content this commit never had (`story_points`, `commits`, `version`,
`bundled_in`, and the later "Approved scope addition" / "Implementation — the
tenant fix" sections). No BUG-1301 precedence exception was needed; no hunk was
dropped.

## Net staged diff

`git diff --cached HEAD` is **empty**. This is the BUG-1109/BUG-1122 redundant
commit case, not a discard: the incoming commit's effect already reached this
branch via the ticket store's later `seed_local_overlay` snapshot at HEAD, and
the STEP 3 check above confirms its added sections are PRESENT in HEAD rather
than absent. Per STEP 4, `--skip` was NOT called; the tree is staged and
`CHERRY_PICK_HEAD` (`bcedebfb`) is left intact for
`cherry_pick_finalize_resolution`.
