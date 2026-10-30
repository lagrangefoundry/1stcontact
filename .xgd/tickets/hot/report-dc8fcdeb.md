---
uid: report-dc8fcdeb
id: REPORT-4740
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:38:41.781950+00:00'
updated_at: '2026-09-21T14:38:41.781950+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` (REQ-165) — **UU**, intent/bookkeeping
  ticket (STEP 2e). Outside the sparse-checkout cone, so resolved and staged with
  `git add --sparse`.

  Incoming commit `e4ba0304` ("xgd(ticket): update request request-26dafd83",
  2026-09-01) vs HEAD-side seed_local_overlay of the same ticket. Applied the 2e
  rule per fact rather than picking a winning file:

  - `fields.commits` (three `working_sha` entries) and `fields.version: 0.2.31` —
    the incoming commit's entire substantive payload. Merged cleanly outside the
    conflict hunks; already present on the HEAD side.
  - `status` / `updated_at` / `last_field_updated` — same fact changed on both
    sides, so later-positioned intent wins: HEAD's `bundled` @
    `2026-09-09T21:32:49Z` over incoming's `free_coded` @ `2026-09-01T18:35:52Z`.
    The incoming side is an earlier point on the same lifecycle
    (`free_coding` → `free_coded` → `bundled`), not a competing decision.
  - `fields.bundled_in: bundle-87be4669` — present only on HEAD, and set by the
    same later transition that produced `status: bundled`. Taking the incoming
    side here would have silently unbundled the ticket.

## Incoming changes preserved

Verified against `git show e4ba0304 -- .xgd/tickets/hot/request-26dafd83.md`.
The commit's additions are the `fields.commits` list and `fields.version`; both
appear verbatim in the resolved file (confirmed via
`git show HEAD:.xgd/tickets/hot/request-26dafd83.md`). Its body/prose hunk was a
trailing-newline change only, already matching. No incoming hunk was dropped; the
BUG-1301 precedence exception was not invoked and no test content was touched.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged
entries — conflicts are resolved and staged. `git diff --cached --stat` is also
empty: the resolution is a net no-op against HEAD, because the HEAD-side
seed_local_overlay already carried this ticket's state forward past the incoming
commit. Per the step instructions, `--skip` was NOT called; CHERRY_PICK_HEAD
(`e4ba0304`) is left in place for the finalize step to detect the clean staged
diff and skip the commit itself.
