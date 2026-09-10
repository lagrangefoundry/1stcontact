---
uid: acceptance_criterion-09288e82
id: AC-1615
type: acceptance_criterion
title: --clusters rolls collapsed defects into ranked causes carrying count, worst
  tier, width scope and a disposition
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:53:51.624399+00:00'
updated_at: '2026-09-10T00:40:19.706912+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
`--clusters` is the layer above `--collapse`: the collapsed defects are rolled up by
the **cause** each evidences rather than by the property it fired on, because several
properties are one cause — arrangement and containment are both *layout structure*;
shape, border and outline are all *control styling*.

Each cause carries:
- its **count** of counted defects,
- the **worst tier** any member reached,
- the **set of widths** it fires at (its width scope), shown always — so a cause
  firing only at the narrow rungs is not read as an all-width one, which is the exact
  misreading a ladder-merged view invites,
- a few **representative elements**, and
- a **disposition**: `fix` (a real, closeable gap), `review` (judge per case,
  typically structural), or `accept` (a capture artifact or sub-visual residual to
  sign off) — a reference webfont FOUT defaulting to `accept` for the reason
  STORY-75's fontLoad direction gives.

Causes are ranked **count-first, then worst-tier**, and the report leads with a
summary of how many counted defects rolled up to how many causes together with the
per-disposition totals (fix / review / accept). This is what turns a hundred-row diff
into a handful of decisions: the operator makes one call per cause instead of per row.

## Verification
Run `--clusters` over a multi-viewport diff carrying defects on arrangement and
containment, on shape and border, and on fontLoad. Assert the first two pairs each
roll into a single cause (layout structure; control styling) rather than four, and
that fontLoad lands under its own cause at `accept` while the control-styling cause is
`fix`. Assert each cause reports its count, worst tier, width scope and
representatives; assert a cause firing at only the narrow rungs shows just those
widths while an all-width one is marked as spanning them all. Assert the ranking is by
count with worst tier breaking ties, and that the summary line's counted-defect total
and its fix / review / accept totals agree with the listed causes.