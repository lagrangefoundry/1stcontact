---
uid: comment-b9709450
id: COMMENT-800
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T20:16:23.543052+00:00'
updated_at: '2026-08-07T20:16:23.543052+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b7fbc162
  kind: note
---

Attempt 2 complete — all four actionable findings resolved. Report: **REPORT-1620** (`report-b7fbc162`).

## What was done

**Finding #1 (violation, code-issue)** — took the assessor's preferred one-line-shaped fix rather than narrowing the story. `json()` in `tools/generate/src/cli/builder.ts` now emits `cache-control: no-store, must-revalidate` (via a new `NO_STORE` constant), so all five JSON routes and the `CommandError` envelope inherit it; the four bare plain-text refusals (`Unknown channel`, `Unknown component`, top-level 404, `serveTree` 403/404) got the same. Also corrected the `/` route comment that asserted the false universal.

**Finding #2 (uat-edit)** — widened `test_UAT_AC977_…` from 7 probes to 17: the served bridge, the three operations, and structurally, **refusals** — the header is now asserted independently of status, so 400/404 responses are probed rather than skipped by a 200-only helper.

**Findings #3 and #4 (story-body-edit)** — STORY-99's origin enumeration now includes the served editing-gesture client code (with the CAP-87 ownership split stated, per the assessor's warning not to widen CAP-85 into the gesture), and the tab bullet carries the declaration-integrity guarantee. Same addition to CAP-85's scope and "Edit semantics" bullets. Paired an `ac-edit` on AC-977, whose own Verification enumeration was why the UAT probed a subset.

## Verification

The widened UAT was confirmed **RED against the pre-fix code** (stashed `builder.ts` alone → fails on `/api/sites`) and green after. 11/11 in the origin suite; 33/33 across the three suites touching these responses; `tsc` clean. Empirically re-checked the assessor's own method — `bin/1c builder --port 4297`, and the two routes named as failing now return `no-store`.

## Two things needing attention

- **The code and test changes are uncommitted.** The three ticket edits auto-committed; the two modified files are in the working tree. Nothing in this workflow state asked for a commit and the prior workflow-completion commit is an empty marker — but if the state machine doesn't commit on exit, finding #1 will read as unrepaired to the assessor.
- **`xgd ticket get` returned a stale CAP-85 body.** `.xgd/tickets/` is sparse-excluded in this worktree, so the CLI served a version predating attempt 1's repair while `HEAD`'s blob carried the repaired one. I based the CAP-85 edit on the committed blob, so both repairs are preserved — but any session editing a non-materialised ticket via `--body-file` here could silently revert prior work. Flagged in the report as worth raising outside this capability.
