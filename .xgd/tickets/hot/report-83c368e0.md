---
uid: report-83c368e0
id: REPORT-3547
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:35:44.388990+00:00'
updated_at: '2026-09-09T22:35:44.388990+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-22aa8ea3.md` — class **AA** (both added), intent/bookkeeping
  ticket (REQ-19). Rules applied: **2b** (one side strictly a superset → keep the superset)
  reinforced by the enrichment rule for this file ("take the more recent commit by
  timestamp"). Resolved to the **ours/HEAD** side via `git checkout --ours` + `git add --sparse`.

  Detail: the two stages differ by exactly one byte-level fact. `git diff <stage2> <stage3>`
  shows a single hunk whose only change is `\ No newline at end of file` on the incoming
  side — all 56 lines of content are character-for-character identical. HEAD's blob
  (`4cf2d20`) is the incoming blob (`06789d6`) plus a terminal newline, i.e. a strict
  superset. HEAD's commit `4f9f9e2` (2026-08-31 02:04:49 -0700) is also later than the
  incoming commit `d1147fd` (2026-08-23 13:36:57 -0700), so both the superset rule and
  the timestamp rule select the same side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-22aa8ea3.md`: the incoming commit `d1147fd` is a pure
  56-line file addition (`1 file changed, 56 insertions(+)`). Every one of those 56 lines
  — the full frontmatter block (uid/id/status: abandoned/fields) and the entire body
  ("Scope — milestone / acceptance goal", "Dependencies", "Acceptance criteria", "Notes",
  and the "## Abandoned (2026-08-20) — superseded" section) — is present verbatim in the
  resolved file. Nothing from the incoming side was discarded; the only incoming byte not
  reproduced is the *absence* of a trailing newline, which is not content.

- No hunks were dropped; the BUG-1301 precedence exception was not invoked, and no test
  files were involved in this conflict.

Note for the finalize step: because HEAD already contains this commit's entire content,
`git diff --cached HEAD` is empty — this commit is genuinely redundant (its changes are
present in HEAD via a different route), not discarded. Per STEP 4 this was staged and
left for `cherry_pick_finalize_resolution` to skip; no `--skip`/`--continue`/`--abort`
was issued here, and CHERRY_PICK_HEAD (`d1147fd`) is intact.
