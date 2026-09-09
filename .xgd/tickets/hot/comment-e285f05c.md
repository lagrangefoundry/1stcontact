---
uid: comment-e285f05c
id: COMMENT-2387
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-09T23:56:27.907633+00:00'
updated_at: '2026-09-09T23:56:27.907633+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6a30e8be
  kind: note
---

All findings in `report-6c3ed8d8` are now closed. This call finished STORY-77 and both warnings.

## This call — 7 mutations

**Findings 10–12 (STORY-77's reporting stack, which had zero ACs):**
- **AC-1613** — `--multi-viewport` projects across every persisted rung, orders worst-cell-first, and fails loud on a bundle with no ladder
- **AC-1614** — `--collapse` dedups to one row per defect; the per-cell view stays the default because rung attribution is itself diagnostic
- **AC-1615 / AC-1616** — `--clusters`, split in two: the roll-up (ranked causes with count, worst tier, width scope, disposition) and the two honesty rules, which pull in opposite directions — derived axes are never *counted*, untaxonomised properties are never *dropped*

I split finding 12 because the second AC is the rule that keeps STORY-77 honest as STORY-75's axis set grows — which is exactly what last call's five new axis ACs just did to it.

**Warnings:**
- **AC-1617** (warning 14, carried unrepaired across four prior reports) — deterministic per-width cell selection. The report offered "add an AC *or* drop the claim"; I took the AC, since the ladder genuinely can hold several projections per width (engines × states), so the claim is load-bearing rather than vestigial.
- **AC-647** (warning 13) — extended to assert the per-rung *value manifest* alongside the per-rung screenshots, and its UAT extended to match. **8/8 pass.**

Both affected suites re-run together: **12 tests, all passing.**

## Cumulative

23 ACs across the three stories carrying findings (STORY-75: 14→20, STORY-76: 5→7, STORY-77: 8→13), one story-body edit, two AC corrections, two UAT extensions. No production code touched — every finding was the matrix under-describing working code, and each cited file:line was verified live before I wrote against it. The four clean stories were left alone as report note 4 instructed.

Declared `needs_more_work: false, violations_remaining: 0` in `report-6a30e8be` — the assessor verifies next.

Two things I'm carrying forward rather than acting on:

- The new ACs all carry `uat_coverage: missing`, so the **uat level will have real work** — eleven newly-pinned behaviours need tests. That's the next phase's scope, not a gap I've papered over.
- The stale `validate.ts` comments (report note 3) are still there. Behaviour is correct so it isn't a `code-issue`, but it's the likely reason findings 6 and 7 survived five cycles, and it'll keep misleading anyone verifying AC-638 from nearby source instead of the call graph.
