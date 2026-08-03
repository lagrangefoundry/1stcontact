---
uid: acceptance_criterion-ea4dcf26
id: AC-767
type: acceptance_criterion
title: A numeric type axis or padding side that varies across the ladder folds to
  a per-width track; an invariant one stays a scalar
created_by: xgd
created_at: '2026-08-03T02:08:22.908986+00:00'
updated_at: '2026-08-03T02:08:22.908986+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
Folding a captured width ladder produces, for each font size, line height, letter
spacing and padding side, either a **single value** or a **per-width track** — and
which one is decided by the evidence, not by the axis:

- an axis whose captured value differs between any two sampled widths folds to a
  track carrying one keyframe per sampled width that reported it, so the page shows
  the mobile value at mobile and the desktop value at desktop;
- an axis whose captured value is identical at every sampled width folds to a plain
  single value and gains no track, so a page that does not scale its type or its
  insets is not inflated into a responsive one;
- an axis reported at fewer than two sampled widths cannot be shown to vary and
  stays a single value.

Before this, every such axis was taken from the widest sample alone and replayed at
every width: a page whose reference type scales down at narrow widths rendered at
desktop size on mobile, and a desktop inset replayed at 320px ate content width
from inside a border box.

## Verification
Fold a capture of a page whose heading is 72px at the widest sampled width and 36px
at the narrowest; assert the folded heading carries a track whose keyframes match
the captured size at each sampled width, and that rendering the reproduction at the
narrowest width shows the mobile size rather than the desktop one. Assert an axis
captured at one identical value across the whole ladder carries no track. Do the
same for a padding side that varies and one that does not.