---
uid: acceptance_criterion-f6177ff1
id: AC-1011
type: acceptance_criterion
title: A rung relaxed to a floor also releases its fixed width, so the ladder's cumulative
  overrides keep holding
created_by: xgd
created_at: '2026-08-07T02:57:37.488762+00:00'
updated_at: '2026-08-07T02:57:37.488762+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion

The rungs of a geometry ladder are **cumulative overrides of the same property**:
the rule fitted to the smallest segment stays in force at the largest and is
merely overridden by the rules above it. A rung that relaxes to a floor therefore
also **resets the fixed width on that same rung**, so the rungs keep overriding
one another.

The observable consequence is that a floored run is never sized by a rule fitted
for a different segment: at every width on the ladder its rendered box is its
content's own width bounded below by that rung's floor, and never the value the
lowest rung's interpolation extrapolates to at that width — which for a line
fitted between the two smallest widths runs to several times the viewport by the
top of the ladder.

## Verification

Render a folded document containing a run floored across part or all of the
ladder and inspect the width declarations **per rung** rather than in aggregate:
every rung carrying a floor also carries the fixed-width reset, which the property
names alone do not reveal. In a real browser, measure the run's box at each ladder
width and observe it tracks its content against that rung's floor rather than the
lower segment's extrapolated value.
