---
uid: acceptance_criterion-3dfc51df
id: AC-1289
type: acceptance_criterion
title: --clusters rolls defects into ranked, dispositioned causes without merging
  a phantom across widths
created_by: xgd
created_at: '2026-08-20T03:40:59.513113+00:00'
updated_at: '2026-08-20T07:00:15.058652+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-aaddb221
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

`--clusters` rolls the counted (non-derived) defects up into a small set of
ranked **causes**. Each cause carries a count, its worst severity tier,
representative elements, the widths its members fire at, and a **disposition** of
`fix`, `review` or `accept`; the report opens with a one-line summary of the
cause count and the defect totals per disposition. Mapping is a fixed
property→cause table in which several properties may share one cause because they
evidence one decision (layout structure; control styling), and a property with no
entry falls through to a cause of its own with a `review` disposition, so a newly
added axis surfaces rather than being absorbed into a neighbour. A capture-side
artifact such as a webfont fallback is dispositioned `accept`; a directly
repairable axis such as vertical spacing is dispositioned `fix`.

Clustering is **viewport-aware**, and must not manufacture a cause the render
does not show: a cause records the union of the widths its members fire at and
says so when that is narrower than the run, so a mobile-only defect and a
desktop-only defect are not merged into one apparently-large cause that exists at
no single width.

The clustered view is **scriptable, not screen-only**: under `--json` the ranked
causes are emitted as a machine-readable document — each cause carrying its
count, severity tier, representative elements, width set and disposition —
rather than the text report, and it takes precedence over `--collapse` when both
are given. The two views carry the same causes; only the serialisation differs.

## Verification

Cluster a collapsed defect set containing two properties that share a cause, a
property with no table entry, a capture-artifact property, and two defects of one
cause firing at disjoint widths. Assert the shared-cause properties produce a
single cause with the summed count; the unmapped property produces its own cause
dispositioned `review`; the capture artifact is dispositioned `accept`; causes
are ranked and the summary line reports the per-disposition totals; and the cause
covering the disjoint-width defects reports both widths rather than presenting
itself as firing across the whole run. Re-run the same set with `--clusters
--json` and assert the emitted document parses and carries the same ranked causes
— same count, ordering, width sets and dispositions — as the text view; and that
`--clusters --collapse --json` emits the clustered causes, not the collapsed
rows.